import type { CombatEvent } from "./combat-event";

type Entry = { readonly event: CombatEvent; readonly seq: number };

export type EventQueue = {
  push(event: CombatEvent): void;
  popNext(): CombatEvent | undefined;
  cancel(matches: (event: CombatEvent) => boolean): void;
  has(matches: (event: CombatEvent) => boolean): boolean;
};

function castsFirst(event: CombatEvent): 0 | 1 {
  return event.kind === "cast" ? 0 : 1;
}

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
