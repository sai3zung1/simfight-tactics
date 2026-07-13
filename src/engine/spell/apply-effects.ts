import type { TargetedModifier } from "./contract";

/**
 * Deliver a cast's produced effects to combat state — the seam the first real
 * spell fills (#69). #68's contract only needs the effects to be produced and
 * reach here; resolving a modifier onto its recipient (routing self/opponent,
 * then applying to HP / stats / crowd control) lands with #69, which extends
 * this with the combat state it needs. The exhaustive switch makes a new
 * `Modifier` kind a compile break here, so #69's resolution cannot silently
 * skip one.
 */
export function applyEffects(effects: readonly TargetedModifier[]): void {
  for (const { modifier } of effects) {
    switch (modifier.kind) {
      case "damage":
      case "heal":
      case "shield":
      case "crowd-control":
      case "stat-mod":
      case "damage-reduction":
      case "mana-generation":
        break;
      default: {
        const _exhaustive: never = modifier;
        return _exhaustive;
      }
    }
  }
}
