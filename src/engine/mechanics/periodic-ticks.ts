import type { Magnitude, Modifier } from "../../domain/catalog/modifier";
import type { PeriodicTickEvent } from "../loop/combat-event";
import type { CombatState } from "../loop/combat-state";
import { combatantById } from "../loop/combat-state";
import type { EventQueue } from "../loop/event-queue";
import type { StopSignal } from "../loop/stop-signal";
import {
  NEVER_EXPIRES,
  addTicks,
  secondsToTicks,
  type Ticks,
} from "../loop/time";
import { deliverDamage, starCollapsed } from "../spell/deliver";
import { applyHeal, type Combatant } from "../stats/combatant";
import {
  resolveSpellMagnitude,
  type EffectiveStats,
} from "../stats/effective-stats";
import { ensureManaRegenScheduled } from "./casting";
import { applyShield } from "./shield";
import { applyTimedModifier } from "./timed-modifiers";

/**
 * The periodic side of a cast: a `periodic` temporality repeats a modifier as
 * tick events until its window closes (#72). Scheduling and resolution live
 * together here, the same pairing as the other event-owning mechanics
 * (timed-modifiers.ts, shield.ts). Part of the runtime-only module cycle
 * deliver.ts documents — a damage tick can push the victim's response cast —
 * safe by construction: every cross-module call happens at run time, never
 * while modules load.
 */

/**
 * Expand one periodic spell effect into its tick events, wholesale at cast:
 * ticks at `now + k·interval` for k = 1..⌊seconds/interval⌋. The first tick
 * lands one interval in — the same convention as steady mana generation — and
 * the last may land exactly on the window's close: a tick is a point
 * occurrence, not a state window, so the half-open rule prunes no closing
 * payment and the tooltip arithmetic (ticks × amount) stays whole. Nothing
 * re-arms: unlike the open-ended attack and regen chains, the window is
 * closed and known at cast, so the queue holds every occurrence up front and
 * termination is free — past the window, the events simply don't exist.
 * Stacking needs no machinery either: a second cast expands into its own
 * independent series.
 *
 * Three loud author-bug guards: a crowd-control payload (no per-tick duration
 * exists to apply — modifier.ts), a non-positive interval, and a window too
 * short to ever tick.
 */
export function schedulePeriodicTicks(
  modifier: Modifier,
  source: Combatant,
  target: Combatant,
  now: Ticks,
  queue: EventQueue,
): void {
  if (modifier.temporality.kind !== "periodic") {
    throw new Error("only a periodic temporality expands into ticks");
  }
  if (modifier.kind === "crowd-control") {
    throw new Error(
      "a periodic crowd-control is inexpressible: no per-tick duration exists (modifier.ts); a real recurring-cc kit extends the taxonomy (#73)",
    );
  }
  const windowTicks = secondsToTicks(
    starCollapsed(modifier.temporality.seconds),
  );
  const intervalTicks = secondsToTicks(modifier.temporality.interval);
  if (intervalTicks <= 0) {
    throw new Error("a periodic interval must be a positive length of time");
  }
  const count = Math.floor(windowTicks / intervalTicks);
  if (count === 0) {
    throw new Error(
      "a periodic window shorter than its interval never ticks; the effect would be a silent no-op",
    );
  }
  let tickAt = now;
  for (let k = 0; k < count; k++) {
    tickAt = addTicks(tickAt, intervalTicks);
    queue.push({
      kind: "periodic-tick",
      time: tickAt,
      source: source.id,
      target: target.id,
      modifier,
    });
  }
}

/**
 * A tick's concrete amount, re-resolved against the source's live sheet at
 * this instant — never a cast-time snapshot (#72's one deliberate divergence
 * from the snapshot rule spell delivery applies to its other amounts): a buff
 * landing mid-window moves every later tick. A flat magnitude has no sources
 * and passes through unchanged, so the re-read costs nothing where it cannot
 * matter.
 */
function tickAmount(amount: Magnitude, sourceStats: EffectiveStats): number {
  return resolveSpellMagnitude(
    starCollapsed(amount.base),
    amount.sources,
    sourceStats,
  );
}

/**
 * Resolve one due tick through the normal pipeline of its kind. Damage and
 * heal have no residue — the tick is consumed on the spot, exactly as a
 * cast's instant effect. Every other kind leaves a residue, and the mode
 * picks its window: an `instance` residue lives one interval, pruned at the
 * next tick's boundary by the machinery that already owns expiry (a pulsing
 * effect refreshes seamlessly — prune-by-time makes the boundary order
 * irrelevant); an `accrual` residue rides `NEVER_EXPIRES` and stacks for the
 * run. What happens to a residue between two ticks is its lane's own
 * behavior, not modeled here: a shield pool erodes as it absorbs, a folded
 * stat entry sits untouched. The re-read amount is banked flat into the
 * residue, so later folds never re-scale it (the tick is the snapshot
 * instant). Liveness needs no check: a run ends the instant a combatant
 * dies, so a pending tick whose source or target died never pops. The
 * crowd-control arm is unreachable by construction —
 * `schedulePeriodicTicks` rejects the payload — and throws rather than
 * skips if the invariant ever breaks.
 */
export function processPeriodicTick(
  event: PeriodicTickEvent,
  state: CombatState,
  queue: EventQueue,
): StopSignal | undefined {
  const source = combatantById(state, event.source);
  const target = combatantById(state, event.target);
  const modifier = event.modifier;
  const temporality = modifier.temporality;
  if (temporality.kind !== "periodic") {
    throw new Error(
      "a periodic tick carries a periodic modifier by construction (schedulePeriodicTicks)",
    );
  }
  const residueTicks =
    temporality.mode === "accrual"
      ? NEVER_EXPIRES
      : secondsToTicks(temporality.interval);
  switch (modifier.kind) {
    case "damage":
      return deliverDamage(
        {
          amount: tickAmount(modifier.amount, source.stats),
          damageType: modifier.damageType,
        },
        source,
        target,
        state,
        queue,
        event.time,
      );
    case "heal":
      applyHeal(target, tickAmount(modifier.amount, source.stats));
      return undefined;
    case "stat-mod":
    case "damage-reduction":
      applyTimedModifier(
        target,
        {
          ...modifier,
          amount: { base: tickAmount(modifier.amount, source.stats) },
        },
        event.time,
        residueTicks,
        queue,
      );
      return undefined;
    case "mana-generation":
      applyTimedModifier(
        target,
        {
          ...modifier,
          amount: { base: tickAmount(modifier.amount, source.stats) },
        },
        event.time,
        residueTicks,
        queue,
      );
      // A per-second gain arriving by tick has to start the recipient's regen
      // chain if it wasn't ticking — the fold alone pays nothing without the
      // recurring event, exactly as at cast delivery.
      ensureManaRegenScheduled(target, event.time, queue);
      return undefined;
    case "shield":
      applyShield(
        target,
        tickAmount(modifier.amount, source.stats),
        event.time,
        residueTicks,
        queue,
      );
      return undefined;
    case "crowd-control":
      throw new Error(
        "a periodic crowd-control never schedules (schedulePeriodicTicks rejects it)",
      );
    default: {
      const _exhaustive: never = modifier;
      return _exhaustive;
    }
  }
}
