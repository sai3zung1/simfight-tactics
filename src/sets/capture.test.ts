import { test, expect } from "bun:test";
import {
  SET_18_AUGMENTS,
  SET_18_ITEMS,
  SET_18_KEYWORDS,
  SET_18_MECHANICS,
  SET_18_ROLES,
  SET_18_TRAITS,
  SET_18_UNITS,
} from "./capture";

type CapturedFile = { readonly entries: readonly { readonly id: string }[] };

const CAPTURE: Record<string, CapturedFile> = {
  SET_18_UNITS,
  SET_18_TRAITS,
  SET_18_MECHANICS,
  SET_18_ITEMS,
  SET_18_AUGMENTS,
  SET_18_ROLES,
  SET_18_KEYWORDS,
};

test("the units file carries s18-ahri", () => {
  const ahri = SET_18_UNITS.entries.find((entry) => entry.id === "s18-ahri");
  expect(ahri?.name).toBe("Ahri");
});

test("every export exposes entries", () => {
  const empty = Object.entries(CAPTURE)
    .filter(([, file]) => file.entries.length === 0)
    .map(([name]) => name);
  expect(empty).toEqual([]);
});

test("every entry carries an id", () => {
  const missing: string[] = [];
  for (const [name, file] of Object.entries(CAPTURE)) {
    file.entries.forEach((entry, index) => {
      if (typeof entry.id !== "string" || entry.id.length === 0) {
        missing.push(`${name}[${index}]`);
      }
    });
  }
  expect(missing).toEqual([]);
});

test("no id repeats, inside a file or across them", () => {
  const taken = new Map<string, string>();
  const collisions: string[] = [];
  for (const [name, file] of Object.entries(CAPTURE)) {
    file.entries.forEach((entry, index) => {
      const first = taken.get(entry.id);
      if (first === undefined) taken.set(entry.id, `${name}[${index}]`);
      else collisions.push(`${entry.id}: ${first} and ${name}[${index}]`);
    });
  }
  expect(collisions).toEqual([]);
});

test("a key only some entries carry cannot be read as present", () => {
  const [first] = SET_18_UNITS.entries;
  // @ts-expect-error cost is absent on the summoned entries, so it is optional
  const cost: number = first.cost;
  expect(cost).toBe(4);
});
