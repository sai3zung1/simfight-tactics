# Stats

The numbers that describe a unit. Two columns record what the engine allows: a
modifier can target a stat, and an effect can scale its amount off one.

| Stat            | What it does                                                                                                                                    | Targetable | Scales from |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ----------- |
| Health          | Damage the unit absorbs before dying. Scales by star                                                                                            | ✓          | ✓           |
| Armor           | Reduces physical damage                                                                                                                         | ✓          | ✓           |
| Magic resist    | Reduces magic damage                                                                                                                            | ✓          | ✓           |
| Durability      | Reduces every kind of incoming damage                                                                                                           | ✓          | —           |
| Attack damage   | Base physical damage per auto-attack. Scales by star                                                                                            | ✓          | ✓           |
| Ability power   | Multiplies scaled ability amounts. Normalised, so at rest it is one and not zero                                                                | ✓          | ✓           |
| Attack speed    | Auto-attacks per second                                                                                                                         | ✓          | ✓           |
| Crit chance     | Probability that an auto-attack crits. The engine weights every hit instead of rolling                                                          | ✓          | ✓           |
| Crit damage     | Multiplier a crit applies                                                                                                                       | ✓          | ✓           |
| Damage amp      | Multiplies outgoing damage                                                                                                                      | ✓          | —           |
| Range           | Attack distance in hexes. A no-op both ways — the engine has no positions to spend it on                                                        | no-op      | no-op       |
| Mana            | Minimum, starting and maximum. A unit casts at maximum. Effects reach it through `mana-generation`, never `stat-mod`                            | —          | —           |
| Mana generation | Per attack, per second, and whether damage taken feeds it                                                                                       | —          | —           |
| Omnivamp        | Heals for a share of post-mitigation damage dealt, and the Fighter role carries 10% of it. **Reaches the effective stats, read by nothing yet** | ✓          | —           |
