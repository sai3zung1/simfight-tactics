import type { StarValue } from "../../domain/primitives";
import type { CombatState } from "../loop/combat-state";
import type { EventQueue } from "../loop/event-queue";
import type { StopSignal } from "../loop/stop-signal";
import { secondsToTicks, type Ticks } from "../loop/time";
import { pushCastIfReady } from "../mechanics/casting";
import { applyCrowdControl } from "../mechanics/crowd-control";
import { neverCrit } from "../mechanics/crit-policy";
import { damageTakenManaGain, gainMana } from "../mechanics/mana";
import { resolveDamage } from "../mechanics/resolve-damage";
import { applyDamage, type Combatant } from "../stats/combatant";
import { resolveSpellMagnitude } from "../stats/effective-stats";
import type { SpellEffect } from "./contract";

/**
 * A spell-produced value is star-collapsed to a plain number before it is
 * ever emitted: per-star tables are dissolved into the caster's parameters
 * at combat setup (stats/combatant.ts). A table reaching delivery is a
 * spell-author bug — surfaced loudly rather than resolved against a wrong
 * star.
 */
function starCollapsed(value: StarValue): number {
  if (typeof value !== "number") {
    throw new Error(
      "a spell emits star-collapsed numbers; per-star tables live in its parameters",
    );
  }
  return value;
}

/**
 * Deliver a cast's produced effects to combat state, in the order the spell
 * returned them. Damage rides the same pipeline as an auto-attack — resolve,
 * land on HP, tally, then the exchange's mana — with one difference held
 * here: a spell never crits by default (the capability is item-granted,
 * #13), so the crit factor is pinned at `neverCrit`. A killing effect
 * returns its stop signal immediately: nothing after a run's end is
 * observable, later effects included. The exhaustive switch makes a new
 * `Modifier` kind a compile break here, never a silent skip.
 */
export function applyEffects(
  effects: readonly SpellEffect[],
  caster: Combatant,
  opponent: Combatant,
  state: CombatState,
  queue: EventQueue,
  time: Ticks,
): StopSignal | undefined {
  for (const { recipient, modifier } of effects) {
    const target = recipient === "self" ? caster : opponent;
    switch (modifier.kind) {
      case "damage": {
        // Damage resolves now or not at all: duration and periodic damage
        // arrive with the timed machinery (#70/#72) — reaching here with
        // either is a spell-author bug, never a silent skip.
        if (modifier.temporality.kind !== "instant") {
          throw new Error(
            "spell damage is instant until timed modifiers land (#70/#72)",
          );
        }
        const hit = resolveDamage(
          {
            amount: resolveSpellMagnitude(
              starCollapsed(modifier.amount.base),
              modifier.amount.sources,
              caster.stats,
            ),
            damageType: modifier.damageType,
          },
          { damageAmp: caster.stats.damageAmp },
          {
            armor: target.stats.armor,
            magicResist: target.stats.magicResist,
            durability: target.stats.durability,
            damageReductions: target.damageReductions,
          },
          neverCrit(caster.stats.critChance, caster.stats.critDamage),
        );
        const killed = applyDamage(target, hit.dealt);
        state.damageDealtBy[caster.id] += hit.dealt;
        if (killed) {
          return { time };
        }
        gainMana(
          target,
          damageTakenManaGain(target, hit.preMitigated, hit.dealt),
        );
        pushCastIfReady(target, time, queue);
        break;
      }
      case "crowd-control": {
        // Only a duration is meaningful for crowd control (modifier.ts) —
        // instant or periodic reaching delivery is a spell-author bug.
        if (modifier.temporality.kind !== "duration") {
          throw new Error(
            "a crowd-control effect carries a duration; instant and periodic have no meaning (modifier.ts)",
          );
        }
        applyCrowdControl(
          target,
          modifier.cc,
          time,
          secondsToTicks(starCollapsed(modifier.temporality.seconds)),
          queue,
        );
        break;
      }
      case "heal":
      case "shield":
      case "stat-mod":
      case "damage-reduction":
      case "mana-generation":
        // Not deliverable yet: spell-emitted stat kits (buffs, debuffs,
        // shields, heals) are #71's work, their timing #70's. Deliberate
        // no-op, never a bug.
        break;
      default: {
        const _exhaustive: never = modifier;
        return _exhaustive;
      }
    }
  }
  return undefined;
}
