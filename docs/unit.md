# Unit

What describes a unit: how the game classifies it, and the numbers it carries.

## Classification

Cost runs one to five: it sets how rare a unit is, and how far it can be starred.
Damage profile — physical, magic or hybrid — says which damage its output deals.
The game folds that axis into the role name, calling a unit an Attack Fighter or
a Magic Caster; here the two are separate fields.

| Role       | Mana                                | Targeting                  | Also         |
| ---------- | ----------------------------------- | -------------------------- | ------------ |
| Tank       | 5 per attack, and from damage taken | More likely to be targeted |              |
| Fighter    | 10 per attack                       |                            | 10% omnivamp |
| Assassin   | 10 per attack                       | Less likely to be targeted |              |
| Marksman   | 10 per attack                       |                            |              |
| Caster     | 7 per attack, and 2 per second      |                            |              |
| Specialist | Generates resources its own way     |                            |              |

## Stats

| Stat            | What it does                                                                              |
| --------------- | ----------------------------------------------------------------------------------------- |
| Health          | Damage the unit absorbs before dying. Scales by star                                      |
| Armor           | Reduces physical damage                                                                   |
| Magic resist    | Reduces magic damage                                                                      |
| Durability      | Reduces every kind of incoming damage                                                     |
| Attack damage   | Base physical damage per auto-attack. Scales by star                                      |
| Ability power   | Multiplies scaled ability amounts. Normalised, so at rest it is one and not zero          |
| Attack speed    | Auto-attacks per second                                                                   |
| Crit chance     | Probability that an auto-attack crits                                                     |
| Crit damage     | Multiplier a crit applies                                                                 |
| Damage amp      | Multiplies outgoing damage                                                                |
| Range           | Attack distance in hexes                                                                  |
| Mana            | Minimum, starting and maximum. A unit casts at maximum                                    |
| Mana generation | Per attack, per second, and whether damage taken feeds it                                 |
| Omnivamp        | Heals for a share of post-mitigation damage dealt, and the Fighter role carries 10% of it |
