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
  burnTick: { 1: 60, 2: 90, 3: 135 },
  burnSeconds: 4,
  healTick: { 1: 30, 2: 45, 3: 70 },
  healSeconds: 8,
  tickInterval: 1,
  attackSpeedBonus: { 1: 0.2, 2: 0.25, 3: 0.3 },
  magicResistShred: { 1: 10, 2: 15, 3: 20 },
  buffSeconds: 6,
};

export const ember: SpellFn = (_ctx, params) => [
  {
    recipient: "opponent",
    modifier: {
      kind: "damage",
      damageType: "magic",
      amount: { base: params.burnTick, sources: ["abilityPower"] },
      temporality: {
        kind: "periodic",
        seconds: params.burnSeconds,
        interval: params.tickInterval,
        mode: "instance",
      },
    },
  },
  {
    recipient: "self",
    modifier: {
      kind: "heal",
      amount: { base: params.healTick },
      temporality: {
        kind: "periodic",
        seconds: params.healSeconds,
        interval: params.tickInterval,
        mode: "instance",
      },
    },
  },
  {
    recipient: "self",
    modifier: {
      kind: "stat-mod",
      target: "attackSpeed",
      amount: { base: params.attackSpeedBonus },
      temporality: { kind: "duration", seconds: params.buffSeconds },
    },
  },
  {
    recipient: "opponent",
    modifier: {
      kind: "stat-mod",
      target: "magicResist",
      amount: { base: -params.magicResistShred },
      temporality: { kind: "duration", seconds: params.buffSeconds },
    },
  },
];
```

**The id** is a branded string, so it cannot be passed where another kind of id
is expected. The cast is how you brand it.

That spell does four things at once, which is the ordinary case: it burns the
opponent, heals its caster over a longer window, hastens itself and softens the
opponent's magic resist. Read it as four independent effects that happen to be
emitted together — nothing binds them beyond the list.

**The parameters** hold a per-star card — `{ 1: …, 2: …, 3: … }` — wherever the
number moves with the star, and a plain number wherever it does not. Never a
nested object: one flat record covers the whole spell, however many effects it
emits.

Names are free, which is what lets two effects diverge. The burn and the heal
run on different windows, so they take `burnSeconds` and `healSeconds`; they
share a cadence, so one `tickInterval` serves both. Group by what the numbers
mean, not by the effect they end up in.

**The function** returns a list. Each entry names who it lands on and one
modifier, and the two recipients can be mixed freely — here the caster is
healed and hastened while the opponent burns and is shredded.

**A debuff is a negative amount.** The vocabulary has no debuff kind: a
`stat-mod` carries its direction in the sign, which is why the shred reads
`-params.magicResistShred`.

**A `stat-mod` adds; it never multiplies.** `attackSpeedBonus: 0.3` is three
tenths of an attack per second added to the stat, not thirty percent of it. A
genuine percentage reads the caster and multiplies there:

```ts
const bonus = ctx.caster.stats.attackSpeed * 0.3;
```

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

**Not every pairing is legal, and the type does not say so.** Three combinations
compile and then throw on the first cast:

| `kind`                                                      | Accepts                  |
| ----------------------------------------------------------- | ------------------------ |
| `damage`, `heal`                                            | `instant` or `periodic`  |
| `crowd-control`                                             | `duration` or `periodic` |
| `stat-mod`, `shield`, `damage-reduction`, `mana-generation` | any                      |

Damage over time is `periodic`, never `duration` — a hit lands and is done, so
there is nothing for an expiry to undo. A stun is the reverse: it has to be
lifted, so it carries a duration and never an instant.

**How big it is** — every kind except `crowd-control` carries an `amount`:

```ts
amount: { base: params.burnTick, sources: ["abilityPower"] }
```

`base` is the number. `sources` multiplies it by the sum of those stats, and is
left out entirely when the amount is flat — never passed as an empty list.
Ability power is normalised, so a spell that scales off it reads `× 1` at rest
rather than `× 0`.

`sources` draws from `SCALING_SOURCES`, which is narrower than the stats a
`stat-mod` can target: durability, damage amp and omnivamp can be moved but not
scaled from.

**How many** — as many effects as the spell needs, on either side, as in step 1.

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
plain numbers, and assert the effects. With several effects, pin the count
first, then take them by index — a spell that silently drops one otherwise still
passes.

```ts
const params = {
  burnTick: 60,
  burnSeconds: 4,
  healTick: 30,
  healSeconds: 8,
  tickInterval: 1,
  attackSpeedBonus: 0.2,
  magicResistShred: 10,
  buffSeconds: 6,
};

test("burns the opponent once a second for the window", () => {
  const effects = ember(ctx(), params);
  expect(effects).toHaveLength(4);
  expect(effects[0]).toEqual({
    recipient: "opponent",
    modifier: {
      kind: "damage",
      damageType: "magic",
      amount: { base: 60, sources: ["abilityPower"] },
      temporality: {
        kind: "periodic",
        seconds: 4,
        interval: 1,
        mode: "instance",
      },
    },
  });
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
