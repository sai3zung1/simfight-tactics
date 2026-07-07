import type { Combatant } from "../stats/combatant";
import type { Ticks } from "../loop/time";

/**
 * The mana pipeline's arithmetic: what an attack, a hit taken or a second
 * of combat is worth in mana for one combatant, and when gains are
 * blocked. Event processors call in; nothing here touches the queue or
 * decides when a cast happens.
 */

/**
 * Conversion of damage taken into mana, for units whose role grants it.
 * Each point of the raw hit (before mitigation) converts at the first
 * rate, each point actually suffered (after mitigation) adds the second,
 * and one single hit never grants more than the cap. Community-sourced
 * figures (docs/data/combat-resolution.md), provisional until calibration
 * (#51).
 */
const PRE_MITIGATION_MANA_GAIN = 0.01;
const POST_MITIGATION_MANA_GAIN = 0.03;
const MAX_MANA_PER_HIT = 42.5;

/**
 * How long mana generation stays blocked after a cast. The game locks for
 * about one second with per-champion exceptions
 * (docs/data/combat-resolution.md); one uniform value for every unit,
 * blocking every gain origin, is a deliberate simplification. Both refine
 * at calibration (#51).
 */
export const MANA_LOCK_SECONDS = 1;

/** A unit with no mana bar (`mana.max` at or below zero) never casts. */
export function shouldCast(combatant: Combatant): boolean {
  return combatant.stats.mana.max > 0;
}

/** True while the post-cast lock still blocks this combatant's gains. */
export function isManaLocked(combatant: Combatant, now: Ticks): boolean {
  return now < combatant.manaLockedUntil;
}

/**
 * Land a gain on the gauge — unless the unit has no mana bar or the
 * post-cast lock is running. Every origin funnels through here, so the
 * lock cannot be bypassed by any of them.
 */
export function gainMana(
  combatant: Combatant,
  amount: number,
  now: Ticks,
): void {
  if (!shouldCast(combatant) || isManaLocked(combatant, now)) {
    return;
  }
  combatant.currentMana += amount;
}

/** One attack's worth: the role's per-attack value plus on-attack bonuses. */
export function attackManaGain(attacker: Combatant): number {
  return (
    attacker.stats.manaGeneration.perAttack + attacker.manaGains["on-attack"]
  );
}

/**
 * One hit's worth for the defender. The role formula applies only to
 * units that generate from damage taken; on-damage-taken bonuses apply to
 * any holder.
 */
export function damageTakenManaGain(
  target: Combatant,
  preMitigation: number,
  postMitigation: number,
): number {
  const fromRole = target.stats.manaGeneration.gainsFromDamageTaken
    ? Math.min(
        MAX_MANA_PER_HIT,
        preMitigation * PRE_MITIGATION_MANA_GAIN +
          postMitigation * POST_MITIGATION_MANA_GAIN,
      )
    : 0;
  return fromRole + target.manaGains["on-damage-taken"];
}

/** One second's worth: the role's steady flow plus per-second bonuses. */
export function regenManaGain(combatant: Combatant): number {
  return (
    combatant.stats.manaGeneration.perSecond + combatant.manaGains["per-second"]
  );
}

/** The gauge reached the threshold — the caller emits the cast event. */
export function readyToCast(combatant: Combatant): boolean {
  return (
    shouldCast(combatant) && combatant.currentMana >= combatant.stats.mana.max
  );
}
