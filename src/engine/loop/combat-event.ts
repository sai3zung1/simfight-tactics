import type { Ticks } from "./time";
import type { CombatantId } from "../stats/combatant-id";
import type { CrowdControl, Modifier } from "../../domain/catalog/modifier";

export type AutoAttackEvent = {
  readonly kind: "auto-attack";
  readonly time: Ticks;
  readonly attacker: CombatantId;
  readonly target: CombatantId;
};

export type ManaRegenEvent = {
  readonly kind: "mana-regen";
  readonly time: Ticks;
  readonly combatant: CombatantId;
};

export type CastEvent = {
  readonly kind: "cast";
  readonly time: Ticks;
  readonly caster: CombatantId;
};

export type CrowdControlExpiryEvent = {
  readonly kind: "crowd-control-expiry";
  readonly time: Ticks;
  readonly combatant: CombatantId;
  readonly cc: CrowdControl;
};

export type ModifierExpiryEvent = {
  readonly kind: "modifier-expiry";
  readonly time: Ticks;
  readonly combatant: CombatantId;
};

export type ShieldExpiryEvent = {
  readonly kind: "shield-expiry";
  readonly time: Ticks;
  readonly combatant: CombatantId;
};

export type PeriodicTickEvent = {
  readonly kind: "periodic-tick";
  readonly time: Ticks;
  readonly source: CombatantId;
  readonly target: CombatantId;
  readonly modifier: Modifier;
};

export type CombatEvent =
  | AutoAttackEvent
  | ManaRegenEvent
  | CastEvent
  | CrowdControlExpiryEvent
  | ModifierExpiryEvent
  | ShieldExpiryEvent
  | PeriodicTickEvent;
