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

## Reaching the browser

`iconPath` in the capture is a path from the repository root, and nothing
serves that path. Vite's root-absolute glob is what turns one into a URL — its
keys are those same paths with a leading slash, so `"/" + iconPath` is the
lookup:

```ts
import.meta.glob("/src/assets/icons/**/*.{png,jpg,svg}", {
  eager: true,
  query: "?url",
  import: "default",
});
```

Every path the capture names resolves through it, and every one of them exists
here. The files none of them names are the monochrome trait variants, which an
interface derives from the trait's own path rather than reading.

Eager and `?url` on their own are a trap. Vite inlines an asset under 4096
bytes as a data URI, which swallows every SVG and every JPG here: the entry
chunk goes from 190 kB to 904 kB, and the browser parses that base64 before it
paints anything. `build.assetsInlineLimit: 0` in `vite.config.ts` emits them as
files instead and brings the chunk back to 334 kB. Measured on Vite 8.0.13.

## Some of these files are the same file

636 names, 561 distinct contents. Seventy-five are byte-identical copies of
another, and one group of twenty-seven augments shares a single image — the art
Community Dragon serves when an entry has none of its own. A bundler collapses
them, so they cost nothing to ship; a catalogue does not, and a grid of
twenty-seven identical tiles is a display problem rather than a capture one.
