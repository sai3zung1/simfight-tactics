import type { DamageType } from "../../domain/catalog/modifier";
import type { StarValue } from "../../domain/primitives";
import type { CombatState } from "../loop/combat-state";
import type { EventQueue } from "../loop/event-queue";
import type { StopSignal } from "../loop/stop-signal";
import type { Ticks } from "../loop/time";
import { pushCastIfReady } from "../mechanics/casting";
import { neverCrit } from "../mechanics/crit-policy";
import { damageTakenManaGain, gainMana } from "../mechanics/mana";
import { resolveDamage } from "../mechanics/resolve-damage";
import { applyDamage, type Combatant } from "../stats/combatant";

export function starCollapsed(value: StarValue): number {
  if (typeof value !== "number") {
    throw new Error(
      "a spell emits star-collapsed numbers; per-star tables live in its parameters",
    );
  }
  return value;
}

export function deliverDamage(
  hit: { readonly amount: number; readonly damageType: DamageType },
  source: Combatant,
  target: Combatant,
  state: CombatState,
  queue: EventQueue,
  time: Ticks,
): StopSignal | undefined {
  const resolved = resolveDamage(
    { amount: hit.amount, damageType: hit.damageType },
    { damageAmp: source.stats.damageAmp },
    {
      armor: target.stats.armor,
      magicResist: target.stats.magicResist,
      durability: target.stats.durability,
      damageReductions: target.damageReductions,
    },
    neverCrit(source.stats.critChance, source.stats.critDamage),
  );
  const killed = applyDamage(target, resolved.dealt);
  state.damageDealtBy[source.id] += resolved.dealt;
  if (killed) {
    return { time };
  }
  gainMana(
    target,
    damageTakenManaGain(target, resolved.preMitigated, resolved.dealt),
  );
  pushCastIfReady(target, time, queue);
  return undefined;
}
