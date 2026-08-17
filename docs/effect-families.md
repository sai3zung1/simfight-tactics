# Effect families

Everything a spell, an item, a trait or an augment applies in TFT is one of a
small number of kinds. This page records those kinds and where each one lands in
the engine. It does not decide the vocabulary — it records what the vocabulary
reaches and what it misses.

The named ones are data: `data/keywords.json` says what each keyword does and
which shape it aims at, whether or not the engine can produce it yet. This page
is the other half — what the engine actually reaches today.

| Effect           | What it does                                                    | Where it lands                                                                                                                                            |
| ---------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Direct damage    | Physical, magic or true                                         | `damage`, with `DamageType`                                                                                                                               |
| Heal             | Restores health                                                 | `heal`                                                                                                                                                    |
| Shield           | Absorbs damage until spent or expired                           | `shield` — the spending is held by the shield pool, not by the vocabulary                                                                                 |
| Damage reduction | Reduces incoming damage                                         | `damage-reduction`, alongside the `durability` stat                                                                                                       |
| Stat buffs       | Any modifiable stat, up or down                                 | `stat-mod`                                                                                                                                                |
| Mana generation  | On attack, per second, after a cast, on damage taken            | `mana-generation`, with `ManaTrigger`                                                                                                                     |
| Stun             | Blocks attacking and casting                                    | `crowd-control` → `stun`                                                                                                                                  |
| Silence          | Blocks casting                                                  | `crowd-control` → `silence`                                                                                                                               |
| Disarm           | Blocks attacking                                                | `crowd-control` → `disarm`                                                                                                                                |
| **Wound**        | Reduces healing received, from every source of it               | **Nowhere.** No stat carries healing received, and no kind expresses it                                                                                   |
| **Mana Reave**   | Raises max mana until the next cast                             | **Nowhere.** `mana` is nested in the stat schema, so `stat-mod` cannot target it, and "until the next cast" is not a `Temporality`                        |
| **Sleep**        | Blocks acting until the unit takes damage                       | **Nowhere.** It ends at its duration or at the first damage taken, and `Temporality` has no conditional ending                                            |
| **Taunt**        | Forces a unit to attack the source                              | **Nowhere.** With one candidate on the far side, nothing carries who a unit is attacking, so there is nothing to redirect                                 |
| **Airborne**     | Displaces and stuns                                             | The stun half fits. Displacement has no meaning without positions                                                                                         |
| **Banish**       | Removes from combat, untargetable                               | The inaction fits. Untargetable has no expression                                                                                                         |
| **Shred**        | Reduces magic resist. Several sources: strongest wins           | The reduction fits — `stat-mod` → `magicResist`. Strongest-wins does not: timed modifiers carry no identity, so sources add                               |
| **Sunder**       | Reduces armor. Several sources: strongest wins                  | The reduction fits — `stat-mod` → `armor`. Same missing identity as Shred                                                                                 |
| **Slow**         | Reduces attack speed. Several sources: strongest wins           | The reduction fits — `stat-mod` → `attackSpeed`. Same missing identity as Shred                                                                           |
| **Vulnerable**   | Raises damage taken                                             | The rise fits — `stat-mod` → `durability`, downwards. Same missing identity as Shred                                                                      |
| **Burn**         | A share of the target's max health as true damage, every second | The shape fits — `damage` · `true` · `periodic`. The amount does not: a `Magnitude` resolves against the caster's stats, and no source reads the target's |
| **Bleed**        | Bonus true damage over time                                     | Same shape, same wall: the share is of the damage dealt, which no `Magnitude` reads                                                                       |
| **Precision**    | Lets ability damage critically strike                           | **Nowhere.** `deliverDamage` sends every spell through `neverCrit` — the crit stats reach it and the policy discards them                                 |

## Who an effect lands on

The table above records **what** an effect does. **Who** it lands on is a second
axis, and it is the one a duel hid: with one unit on each side, `recipient` needs
two values — `"self"` and `"opponent"` — and every row above is silent about it.

The game's answer is not two values, and it is not open either. Read off the
catalog, it is roughly eleven shapes: the target itself, what stands adjacent to
it, a radius in hexes, a line, a cone, the nearest few, a jump to a qualified
target, a chain of bounces, a whole row, the lowest or the highest on a stat, and
a number of them picked at random. Titanic Hydra hits the target and its
neighbours, Sivir bounces eight times, Hextech Gunblade heals the ally lowest on
health, Luden's Tempest hits the two enemies closest to the target.

A closed vocabulary is what that asks for, on the same terms as the kinds above:
a shape the engine cannot resolve stops compiling instead of resolving wrong.

Two properties come with it, and neither is optional:

- **A shape names which, never where.** Positions belong to the board, and the
  board moves during a fight. What a spell states is the shape; resolving it
  against hexes is the engine's.
- **A shape resolves when the effect lands, not when it is cast.** A burn on
  everything within two hexes recomputes on every tick — units move, units die.
  `schedulePeriodicTicks` queues every tick up front with its target already
  fixed, which is right for one opponent and wrong for a board.

## What a magnitude reads

The third axis, and the smallest. A `Magnitude` resolves against the **caster**'s
stats, which is why Burn and Bleed sit in the table with no home: one takes a
share of the target's max health, the other a share of the damage dealt, and no
source reads either.

`data/keywords.json` already writes it down — Burn carries
`"basis": "targetMaxHealth"`. The data states the axis the type does not have.
