# Adding a spell to a set

By the end you will have a spell that a unit casts in a real fight, with a test
that pins what it emits.

Open `src/sets/fixture/spells/renew.ts` first — it is the smallest complete
example, and everything below follows its shape.

## 1. Create the file

Make `src/sets/<set>/spells/<name>.ts`. It exports exactly three things.

```ts
import type { SpellId } from "../../../domain/primitives";
import type { SpellParameters } from "../../../domain/catalog/spell";
import type { SpellFn } from "../../../engine/spell/contract";

export const FIXTURE_EMBER_SPELL_ID = "fixture-ember" as SpellId;

export const FIXTURE_EMBER_PARAMETERS: SpellParameters = {
  tickDamage: { 1: 60, 2: 90, 3: 135 },
  windowSeconds: 4,
};

export const ember: SpellFn = (_ctx, params) => [
  {
    recipient: "opponent",
    modifier: {
      kind: "damage",
      damageType: "magic",
      amount: { base: params.tickDamage, sources: ["abilityPower"] },
      temporality: { kind: "duration", seconds: params.windowSeconds },
    },
  },
];
```

**The id** is a branded string, so it cannot be passed where another kind of id
is expected. The cast is how you brand it.

**The parameters** hold a per-star card — `{ 1: …, 2: …, 3: … }` — wherever the
number moves with the star, and a plain number wherever it does not. Name them
whatever reads best; nothing constrains the names.

**The function** takes the combat context and the parameters, and returns a list
of effects. Each effect names who it lands on and one modifier.

## 2. Choose what the modifier does

Six independent choices. Everything a spell can express is a combination of
them.

**Who it lands on** — `recipient: "self"` or `"opponent"`.

**What it does** — one of seven kinds. Some carry an extra field:

| `kind`             | Extra field                                                                    |
| ------------------ | ------------------------------------------------------------------------------ |
| `damage`           | `damageType`: `"physical"`, `"magic"` or `"true"`                              |
| `heal`             | —                                                                              |
| `shield`           | —                                                                              |
| `damage-reduction` | —                                                                              |
| `crowd-control`    | `cc`: `"stun"`, `"silence"` or `"disarm"`                                      |
| `stat-mod`         | `target`: the stat to move, from `MODIFIABLE_STATS`                            |
| `mana-generation`  | `trigger`: `"on-attack"`, `"per-second"`, `"post-cast"` or `"on-damage-taken"` |

**How long it lasts** — every modifier carries a `temporality`:

| `kind`     | Fields                        | Meaning                              |
| ---------- | ----------------------------- | ------------------------------------ |
| `instant`  | —                             | applies once, now                    |
| `duration` | `seconds`                     | applies now, undone when it expires  |
| `periodic` | `seconds`, `interval`, `mode` | fires every `interval` for `seconds` |

For `periodic`, `mode` says what one tick leaves behind: `"instance"` lasts a
single interval, `"accrual"` lasts to the end of the fight. Damage and healing
consume their tick outright, so for those two the choice changes nothing. It
bites on the kinds that leave a residue, where `"instance"` refreshes each
interval and `"accrual"` stacks.

**How big it is** — every kind except `crowd-control` carries an `amount`:

```ts
amount: { base: params.tickDamage, sources: ["abilityPower"] }
```

`base` is the number. `sources` multiplies it by the sum of those stats, and is
left out entirely when the amount is flat — never passed as an empty list.
Ability power is normalised, so a spell that scales off it reads `× 1` at rest
rather than `× 0`.

`sources` draws from `SCALING_SOURCES`, which is narrower than the stats a
`stat-mod` can target: durability, damage amp and omnivamp can be moved but not
scaled from.

**How many** — the function returns a list, so one cast can land several
effects, on either side:

```ts
export const ember: SpellFn = (_ctx, params) => [
  { recipient: "opponent", modifier: { kind: "damage" /* … */ } },
  { recipient: "self", modifier: { kind: "shield" /* … */ } },
];
```

**Where the numbers come from** — usually the parameters, but the first argument
is the fight itself, for an amount that depends on it:

```ts
export const ember: SpellFn = (ctx, params) => [
  {
    recipient: "opponent",
    modifier: {
      kind: "damage",
      damageType: "true",
      amount: { base: ctx.opponent.hp.max * params.share },
      temporality: { kind: "instant" },
    },
  },
];
```

`ctx.caster` and `ctx.opponent` each carry `stats` and `hp: { current, max }`.
Name the argument `_ctx` when you do not read it.

Every spell in the fixture set makes the simplest choice on both counts — one
effect, no context — so copy the two shapes above rather than looking for a
worked example.

Anything TFT does that none of these kinds can express is listed in
`docs/effect-families.md`. Check there before building a spell around a mechanic
that has no kind.

## 3. Put it in the registry

Add one line to `src/sets/<set>/registry.ts`:

```ts
import { ember, FIXTURE_EMBER_SPELL_ID } from "./spells/ember";

export const FIXTURE_SPELL_REGISTRY: SpellRegistry = {
  // …
  [FIXTURE_EMBER_SPELL_ID]: ember,
};
```

## 4. Give it to a unit

A spell only fires if a combatant carries its id. Until the unit catalog lands,
give it a caster in `src/engine/provisional/provisional-casters.ts` — an id, and
one entry in `PROVISIONAL_CASTERS`:

```ts
export const PROVISIONAL_EMBER_CASTER_UNIT_ID =
  "provisional-ember-caster" as UnitId;

const PROVISIONAL_CASTERS: Readonly<Record<UnitId, ProvisionalCaster>> = {
  // …
  [PROVISIONAL_EMBER_CASTER_UNIT_ID]: {
    stats: PROVISIONAL_CASTER_STATS,
    spellId: FIXTURE_EMBER_SPELL_ID,
    parameters: FIXTURE_EMBER_PARAMETERS,
  },
};
```

Take the stats block from `provisional-stats.ts` — `PROVISIONAL_CASTER_STATS`
unless the spell needs something the others do not have.

**Skip this and nothing breaks — the spell simply never fires.** A caster whose
spell is not registered casts for nothing, and the engine treats that as normal
rather than as an error, so there is no message to warn you.

## 5. Write the test

Create `<name>.test.ts` beside the file. Build a context, call the function with
plain numbers, and assert the effects.

```ts
test("emits a magic damage effect on the opponent", () => {
  expect(ember(ctx(), { tickDamage: 60, windowSeconds: 4 })).toEqual([
    {
      recipient: "opponent",
      modifier: {
        kind: "damage",
        damageType: "magic",
        amount: { base: 60, sources: ["abilityPower"] },
        temporality: { kind: "duration", seconds: 4 },
      },
    },
  ]);
});
```

Copy the `stats` and `ctx` helpers from any neighbouring test — they build a
full `EffectiveStats`, which has to list every field.

## 6. Run it

```sh
bun test src/sets/<set>/spells/<name>.test.ts
```

```sh
bun run gate
```

## What to watch

**The function never sees a per-star card.** The parameters hold
`{ 1: 60, 2: 90, 3: 135 }`; the function receives `60`, already collapsed for
the star being simulated. Assert plain numbers in the test, never the card.

**Parameter names are free.** Nothing checks them, so a typo compiles. The test
is what pins a name to a value.

**The context is readable, not writable.** Read as much of the fight as the
spell needs; a spell returns what should happen and changes nothing itself.
