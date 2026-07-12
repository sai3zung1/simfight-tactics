import type { CombatEvent } from "./combat-event";

/** A pending event plus its arrival number — the number exists only to break ties. */
type Entry = { readonly event: CombatEvent; readonly seq: number };

/**
 * EventQueue — the engine's scheduling interface: enqueue events, pop them
 * earliest-first, drop ones no longer due to happen. Hiding the structure
 * behind these three methods lets the array be swapped for a faster one
 * later without touching the loop (ADR 0002).
 */
export type EventQueue = {
  push(event: CombatEvent): void;
  popNext(): CombatEvent | undefined;
  /**
   * Drop every pending event `matches` accepts. Used when a state change
   * makes an already-scheduled event moot — e.g. crowd control landing on an
   * attacker cancels its pending swing outright, rather than leaving it to
   * pop later and do nothing (#50).
   */
  cancel(matches: (event: CombatEvent) => boolean): void;
  /**
   * Whether any pending event matches `matches` — guards against scheduling
   * a duplicate when more than one state change could each want to (e.g. two
   * crowd-control effects expiring on the same tick both re-arming the same
   * attack, #50).
   */
  has(matches: (event: CombatEvent) => boolean): boolean;
};

/** A cast pre-empts anything else scheduled on the same tick (#50) — the one
 * kind-based tie the game needs so far; every other kind still ties on
 * arrival order. */
function castsFirst(event: CombatEvent): 0 | 1 {
  return event.kind === "cast" ? 0 : 1;
}

/**
 * Order is total and deterministic: ascending `time`, then `castsFirst`,
 * then ascending `seq` (arrival order) as the final tiebreaker. `seq` alone
 * guarantees a total order whatever the structure; the kind-based rule
 * layers on top of it exactly as this comment used to anticipate.
 *
 * `seq` is per-instance: each queue owns its counter, so the engine keeps no
 * module-level mutable state (a global counter would be a side effect on every
 * push, breaking purity).
 */
export function createEventQueue(): EventQueue {
  const items: Entry[] = [];
  let nextSeq = 0;

  return {
    push(event: CombatEvent): void {
      items.push({ event, seq: nextSeq });
      nextSeq++;
    },

    popNext(): CombatEvent | undefined {
      items.sort(
        (a, b) =>
          a.event.time - b.event.time ||
          castsFirst(a.event) - castsFirst(b.event) ||
          a.seq - b.seq,
      );
      return items.shift()?.event;
    },

    cancel(matches: (event: CombatEvent) => boolean): void {
      for (let i = items.length - 1; i >= 0; i--) {
        if (matches(items[i].event)) {
          items.splice(i, 1);
        }
      }
    },

    has(matches: (event: CombatEvent) => boolean): boolean {
      return items.some((entry) => matches(entry.event));
    },
  };
}
