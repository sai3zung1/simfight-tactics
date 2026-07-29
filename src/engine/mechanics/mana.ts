import type { Combatant } from "../stats/combatant";

const PRE_MITIGATION_MANA_GAIN = 0.01;
const POST_MITIGATION_MANA_GAIN = 0.03;
const MAX_MANA_PER_HIT = 42.5;

export function hasManaBar(combatant: Combatant): boolean {
  return combatant.stats.mana.max > 0;
}

export function gainMana(combatant: Combatant, amount: number): void {
  if (!hasManaBar(combatant)) {
    return;
  }
  combatant.currentMana += amount;
}

export function attackManaGain(attacker: Combatant): number {
  return (
    attacker.stats.manaGeneration.perAttack + attacker.manaGains["on-attack"]
  );
}

// Only the role conversion is capped — modifier gains are added on top,
// unbounded.
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

export function regenManaGain(combatant: Combatant): number {
  return (
    combatant.stats.manaGeneration.perSecond + combatant.manaGains["per-second"]
  );
}

export function readyToCast(combatant: Combatant): boolean {
  return (
    hasManaBar(combatant) && combatant.currentMana >= combatant.stats.mana.max
  );
}
