# Effect families

Everything a spell, an item, a trait or an augment applies in TFT is one of a
small number of kinds. This page records those kinds and where each one lands in
the engine. It does not decide the vocabulary — it records what the vocabulary
reaches and what it misses.

| Effect           | What it does                                                                     | Where it lands                                                                                                                     |
| ---------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Direct damage    | Physical, magic or true                                                          | `damage`, with `DamageType`                                                                                                        |
| Heal             | Restores health                                                                  | `heal`                                                                                                                             |
| Shield           | Absorbs damage until spent or expired                                            | `shield` — the spending is held by the shield pool, not by the vocabulary                                                          |
| Damage reduction | Reduces incoming damage                                                          | `damage-reduction`, alongside the `durability` stat                                                                                |
| Stat buffs       | Any modifiable stat, up or down                                                  | `stat-mod`                                                                                                                         |
| Mana generation  | On attack, per second, after a cast, on damage taken                             | `mana-generation`, with `ManaTrigger`                                                                                              |
| Stun             | Blocks attacking and casting                                                     | `crowd-control` → `stun`                                                                                                           |
| Silence          | Blocks casting                                                                   | `crowd-control` → `silence`                                                                                                        |
| Disarm           | Blocks attacking                                                                 | `crowd-control` → `disarm`                                                                                                         |
| **Wound**        | Reduces healing received, from every source of it                                | **Nowhere.** No stat carries healing received, and no kind expresses it                                                            |
| **Mana Reave**   | Raises max mana until the next cast                                              | **Nowhere.** `mana` is nested in the stat schema, so `stat-mod` cannot target it, and "until the next cast" is not a `Temporality` |
| **Sleep**        | Blocks acting until the unit takes damage                                        | **Nowhere.** It ends at its duration or at the first damage taken, and `Temporality` has no conditional ending                     |
| **Taunt**        | Forces a unit to attack the source                                               | **Nowhere.** A duel schedules its targets up front; there is nothing to redirect                                                   |
| **Airborne**     | Displaces and stuns                                                              | The stun half fits. Displacement has no meaning without positions                                                                  |
| **Banish**       | Removes from combat, untargetable                                                | The inaction fits. Untargetable has no expression                                                                                  |
| **Shred**        | Reduces magic resist. Several sources: strongest wins                            | The reduction fits — `stat-mod` → `magicResist`. Strongest-wins does not: timed modifiers carry no identity, so sources add        |
| **Sunder**       | Reduces armor. Several sources: strongest wins                                   | The reduction fits — `stat-mod` → `armor`. Same missing identity as Shred                                                          |
| **Chill**        | Reduces attack speed. Several sources: strongest wins                            | The reduction fits — `stat-mod` → `attackSpeed`. Same missing identity as Shred                                                    |
| **Burn**         | A share of max health as true damage, over time. Several sources: strongest wins | The burn fits — `damage` · `true` · `periodic`. Strongest-wins does not: periodic schedules carry no identity either, so burns add |
