# ADR 0006 — Design system: component workshop and taxonomy

**Status:** Accepted · 2026-07

## Context

The token layer shipped (#77) and the component layer is about to be written:
`App.tsx` is still empty, so no existing component constrains the choice. Two
questions had more than one defensible answer, and both would otherwise be
settled implicitly by whoever wrote the first component.

_Which tool renders a component in isolation._ The stack is narrow — one
framework (React), Vite as the build, Bun as runtime and package manager — and
narrow stacks can pay for generality they never use. Lighter Vite-native
workshops exist and start measurably faster.

_Which vocabulary names the tiers._ The repo had already grown a tiered
structure implicitly, visible only in the ordering of its tickets and never
written down. Atomic Design supplies a well-known naming for the same idea.

A fair objection stands against a workshop at all: the product is a single
view, no scroll, no redirection. If the app never navigates, why build a
surface that shows components apart from it?

## Decision

1. **Component workshop: Storybook.** The deciding factor is accessibility
   tooling, not speed. This design system carries explicit accessibility
   commitments — a focus-ring token (#77), a keyboard interaction model
   (#102), a single-pointer alternative for every drag path (#103), text
   alternatives required on icons, labels natively bound to their controls.
   Storybook's a11y addon runs axe-core against every story and integrates
   with its Vitest addon, so those commitments are checked continuously rather
   than asserted in a checklist. No lighter workshop offers an equivalent.

   Startup time and bundle size were weighed and rejected as criteria: a cold
   start measured in seconds happens once per session, and a workshop is a
   development dependency that never reaches a user. Storybook's documented
   package-manager detection friction under Bun is accepted as a known
   workaround cost.

2. **Legibility counts as a criterion.** This repository is read by people
   evaluating how it was built. A widely recognised workshop and a widely
   recognised taxonomy carry meaning on first contact; a bespoke choice spends
   the reader's attention before it earns it. Where two options are otherwise
   close, the recognised one wins.

3. **The workshop is a contributor surface, not a product surface.** The
   single-view rule governs what the user sees; the workshop serves whoever
   builds a component — checking its states, both themes, and its adherence to
   the tokens, in isolation. It is a dev dependency and never enters the
   product bundle. The two rules address different audiences and do not
   conflict.

4. **Taxonomy: Atomic Design.** Adopted for its hierarchical composition and
   named with its vocabulary — atoms, molecules, organisms, templates, pages.
   Every component in the cartography lands in a tier without forcing.

   Its author is explicit that the labels were never the point and that few
   teams apply all five strictly. This record follows that reading: the
   hierarchy is the commitment, the labels are the convention it is expressed
   in, and neither is applied where it would obscure rather than clarify.

5. **An atom is the smallest independently usable and meaningful piece.** This
   criterion decides tier placement, not intuition. A lone radio button means
   nothing on its own — the group is the atom. A wrapper that encloses another
   control is not usable alone, so it is a molecule rather than an atom.

6. **Layout primitives are atoms by convention, not by definition.** Row,
   Stack and Container exist to contain other components, which sits awkwardly
   against the strict reading of an atom as a component that contains none.
   Common practice files them as atoms — foundational utility components — and
   this record follows it rather than inventing a sixth tier. The page-level
   skeleton is a different object and stays a template: it places regions and
   holds no content of its own.

## Consequences

- The workshop is a development dependency; nothing it renders ships to users.
- Accessibility regressions surface per story, while a component is being
  written, rather than at review time.
- Storybook's weight is accepted: a slower cold start and a heavier dev
  install, in exchange for the addon ecosystem those accessibility
  commitments depend on.
- "Which tier does this belong to" is answered by the atom criterion above, at
  the moment a component is specified rather than when it is coded.
- A reader arriving with Atomic Design habits finds the tiers where expected;
  the one deviation — layout primitives as atoms — is recorded here rather
  than restated per ticket.
- Component granularity follows CONTRIBUTING's one ticket, one branch, one PR:
  one component per ticket, its tier named in the title. A tier is never
  delivered as a single bundled ticket, which is what the earlier grouped
  design tickets attempted.
