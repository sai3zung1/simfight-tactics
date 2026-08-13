# Icon attribution

636 files, taken on 2026-08-13, one per catalog entry plus the two monochrome
variants each trait carries. The name of a file is the `id` of the entry it
belongs to, so a missing icon and an orphan file are both a machine check away.

## Where each family comes from

| Family   | Source                                                            | Format        |
| -------- | ----------------------------------------------------------------- | ------------- |
| Traits   | lolchess, through the dak.gg API                                  | SVG           |
| Units    | Community Dragon, `assets/characters/tft18_*`                     | PNG, four JPG |
| Spells   | lolchess, through the dak.gg API                                  | JPG, one PNG  |
| Items    | Community Dragon, `assets/maps/particles/tft`                     | PNG           |
| Augments | Community Dragon, `assets/maps/particles/tft/item_icons/augments` | PNG           |

Community Dragon publishes what the game ships. Riot allows its assets to be
used in a non-commercial project that does not claim endorsement; the terms are
theirs to state and ours to respect.

The trait icons are not Riot files. Riot ships raster textures; these SVGs are
lolchess's own vectorisation, and they are here as their work rather than as
Riot's.

Extensions follow the bytes rather than the URL: lolchess serves JPEG under a
`.png` name on 68 of these files, and the name would otherwise lie.

## Spell file names are provisional

A spell takes the `id` of the unit that casts it, because `units.json` holds an
ability without an id of its own while `Spell` in the domain declares one. They
get renamed the day spells carry theirs.
