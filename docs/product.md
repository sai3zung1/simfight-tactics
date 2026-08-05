# Product

The goal is to become the tool TFT players reach for.

Players theorycraft against builders today. A builder composes a board and shows
what was composed; it does not say what that board does. Simulation is the half
that is missing — a composition in, an outcome out.

Everything in the product answers one question: **what is best here?**

## Interface

Scrolling is searching, and a tool that leaves you searching has not answered.
The interface is built so there is nothing to scroll.

## Engine

A valid MVP is the engine no longer being touched, not a demo that runs.

That is stricter than whatever combat the product currently plays. A taunt
changes nothing in a duel, and it still has to work — otherwise multi-target
combat reopens the engine, and the MVP was never valid.

Everything the game can express has to land in the engine, whether the combat
the interface offers can exercise it or not. `docs/effect-families.md` records
what does not.

## Combat

The defender is a training dummy improved into an opponent: it casts, it
attacks, and its output is measured rather than assumed. The attacker cannot
die. A plain dummy — no attack, no cast — stays useful, and will be selectable
as the defender.
