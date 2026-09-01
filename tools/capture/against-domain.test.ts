import { expect, test } from "bun:test";
import { checkAgainstDomain, kinds, whatDataCarries } from "./against-domain";

// What `data/` and `src/domain` disagree about today, by kind rather than by
// entry: a rotation moves the counts and leaves the kinds alone. A kind that
// appears here and not below is the next one to answer for; a kind that leaves
// is one the chain closed.
const KNOWN = [
  "augments.effects",
  "items.description",
  "items.effects",
  "units.cost",
  "units.damageProfile",
  "units.description",
  "units.iconPath",
  "units.role",
  "units.spellId",
  "units.stats.abilityPower",
  "units.stats.attackDamage",
  "units.stats.critChance",
  "units.stats.critDamage",
  "units.stats.damageAmp",
  "units.stats.durability",
  "units.stats.mana",
  "units.stats.manaGeneration",
  "units.stats.omnivamp",
  "units.traitIds",
];

test("reports the drifts that stand between data/ and the domain", () => {
  expect(kinds(checkAgainstDomain(whatDataCarries()))).toEqual(KNOWN);
});

test("every drift names an entry, a family, a field and what the two say", () => {
  for (const drift of checkAgainstDomain(whatDataCarries())) {
    expect(drift.entry.length).toBeGreaterThan(0);
    expect(drift.family.length).toBeGreaterThan(0);
    expect(drift.field.length).toBeGreaterThan(0);
    expect(drift.saying.length).toBeGreaterThan(0);
  }
});

test("reports mana generation as required and carried by no unit", () => {
  const drifts = checkAgainstDomain(whatDataCarries());
  const held = drifts.filter((d) => d.field === "stats.manaGeneration");
  expect(held).toHaveLength(whatDataCarries().units?.length ?? 0);
});

test("reports a value the domain has no place for, and says both sides", () => {
  const drifts = checkAgainstDomain({
    units: [{ id: "s18-ahri", role: "brawler" }],
  });
  const drift = drifts.find((d) => d.field === "role");
  expect(drift?.entry).toBe("s18-ahri");
  expect(drift?.saying).toContain('"brawler"');
  expect(drift?.saying).toContain("tank");
});

test("reports a required field the capture leaves out", () => {
  const drifts = checkAgainstDomain({ units: [{ id: "s18-ahri" }] });
  expect(drifts.map((d) => d.field)).toContain("name");
});

test("reports a nested field once the holder is there", () => {
  const drifts = checkAgainstDomain({
    units: [{ id: "s18-ahri", stats: { hp: 1 } }],
  });
  expect(drifts.map((d) => d.field)).toContain("stats.armor");
});

test("says nothing about a nested field when the holder is absent", () => {
  const drifts = checkAgainstDomain({ units: [{ id: "s18-ahri" }] });
  expect(drifts.filter((d) => d.field.startsWith("stats."))).toHaveLength(0);
});

test("edits neither side", () => {
  const units = [{ id: "s18-ahri", role: "brawler" }];
  checkAgainstDomain({ units });
  expect(units).toEqual([{ id: "s18-ahri", role: "brawler" }]);
});

test("orders drifts the same way twice", () => {
  const once = checkAgainstDomain(whatDataCarries());
  const again = checkAgainstDomain(whatDataCarries());
  expect(once.map((d) => `${d.family}.${d.field}.${d.entry}`)).toEqual(
    again.map((d) => `${d.family}.${d.field}.${d.entry}`),
  );
});
