import type { CombatEvent } from "./combat-event";

/** A pending event plus its arrival number — the number exists only to break ties. */
type Entry = { readonly event: CombatEvent; readonly seq: number };

/**
 * EventQueue — the engine's scheduling interface: enqueue events, pop them
 * earliest-first. Hiding the structure behind `push` / `popNext` lets the array
 * be swapped for a faster one later without touching the loop (ADR 0002).
 */
export type EventQueue = {
  push(event: CombatEvent): void;
  popNext(): CombatEvent | undefined;
};

/**
 * Order is total and deterministic: ascending `time`, then ascending `seq`
 * (arrival order) for events on the same tick. `seq` is the bedrock tiebreaker —
 * it guarantees a total order whatever the structure; game-semantic priority
 * (e.g. cast before auto-attack) layers on top in later tickets, never below.
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
      items.sort((a, b) => a.event.time - b.event.time || a.seq - b.seq);
      return items.shift()?.event;
    },
  };
}
