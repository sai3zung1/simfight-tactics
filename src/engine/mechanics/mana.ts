import type { Combatant } from "../stats/combatant";

/**
 * The mana pipeline's arithmetic: what an attack, a hit taken or a second
 * of combat is worth in mana for one combatant. Event processors call in;
 * nothing here touches the queue or decides when a cast happens.
 */

/**
 * Conversion of damage taken into mana, for units whose role grants it.
 * Each point of the raw hit (before mitigation) converts at the first
 * rate, each point actually suffered (after mitigation) adds the second,
 * and one single hit never grants more than the cap. Coefficients adopted
 * at wiki-lineage grade; the live upgrade pass discriminates them
 * (docs/data/calibration-log.md, C2).
 */
const PRE_MITIGATION_MANA_GAIN = 0.01;
const POST_MITIGATION_MANA_GAIN = 0.03;
const MAX_MANA_PER_HIT = 42.5;

/** A unit with no mana bar (`mana.max` at or below zero) never casts. */
export function hasManaBar(combatant: Combatant): boolean {
  return combatant.stats.mana.max > 0;
}

/**
 * Land a gain on the gauge — unless the unit has no mana bar. Every
 * origin funnels through here, the gauge's single write point. No
 * post-cast lock blocks gains: the live no-gain window is the cast
 * animation itself, unmodelled until spells bring durations
 * (docs/data/calibration-log.md, A2).
 */
export function gainMana(combatant: Combatant, amount: number): void {
  if (!hasManaBar(combatant)) {
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
 * One hit's worth for the hit's target. The role formula applies only to
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
    hasManaBar(combatant) && combatant.currentMana >= combatant.stats.mana.max
  );
}
