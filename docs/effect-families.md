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
| **Taunt**        | Forces a unit to attack the source                              | **Nowhere.** A duel schedules its targets up front; there is nothing to redirect                                                                          |
| **Airborne**     | Displaces and stuns                                             | The stun half fits. Displacement has no meaning without positions                                                                                         |
| **Banish**       | Removes from combat, untargetable                               | The inaction fits. Untargetable has no expression                                                                                                         |
| **Shred**        | Reduces magic resist. Several sources: strongest wins           | The reduction fits — `stat-mod` → `magicResist`. Strongest-wins does not: timed modifiers carry no identity, so sources add                               |
| **Sunder**       | Reduces armor. Several sources: strongest wins                  | The reduction fits — `stat-mod` → `armor`. Same missing identity as Shred                                                                                 |
| **Slow**         | Reduces attack speed. Several sources: strongest wins           | The reduction fits — `stat-mod` → `attackSpeed`. Same missing identity as Shred                                                                           |
| **Vulnerable**   | Raises damage taken                                             | The rise fits — `stat-mod` → `durability`, downwards. Same missing identity as Shred                                                                      |
| **Burn**         | A share of the target's max health as true damage, every second | The shape fits — `damage` · `true` · `periodic`. The amount does not: a `Magnitude` resolves against the caster's stats, and no source reads the target's |
| **Bleed**        | Bonus true damage over time                                     | Same shape, same wall: the share is of the damage dealt, which no `Magnitude` reads                                                                       |
| **Precision**    | Lets ability damage critically strike                           | **Nowhere.** `deliverDamage` sends every spell through `neverCrit` — the crit stats reach it and the policy discards them                                 |
