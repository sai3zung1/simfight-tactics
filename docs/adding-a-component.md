# Adding a component to the ui

By the end you will have an atom that renders in Storybook, passes the story
tests, and cannot drift from its own contract.

Open `src/ui/atoms/button/` first — it is the fullest example, and everything
below follows its shape: one kebab-case folder, four files —
`<name>.contract.ts`, `<name>.classes.ts`, `<name>.tsx`,
`storybook/<name>.stories.tsx`.

## 1. The contract

Declare each axis as a const array, derive its type from the array, and close
with the defaults:

```ts
export const VARIANTS = ["solid", "outline"] as const;
export type ButtonVariant = (typeof VARIANTS)[number];

export const DEFAULTS = {
  variant: "solid",
  size: "m",
} as const satisfies {
  variant: ButtonVariant;
  size: ButtonSize;
};
```

An axis is a choice the caller makes — variant, size, radius. Anything with
exactly one sensible value is not an axis; hardcode it in the classes.

The arrays are the single source: the types derive from them, the class maps
are checked against them, and the Storybook controls list them. Add a value to
an array and the compiler walks you through every file that has to answer for
it.

A contract may read the domain. `text.contract.ts` draws its stat keywords from
`BaseStats`, so a stat the schema does not have cannot be styled.

## 2. The classes

One exported map per axis, each closed on its contract:

```ts
export const VARIANT_CLASS = {
  solid: "border-2 bg-accent text-ink-reverse font-medium …",
  outline: "border-1 bg-surface-raised text-ink font-light …",
} satisfies Record<ButtonVariant, string>;
```

`satisfies Record<Axis, string>` is the tie: a value added to the contract
stops this file compiling until the map covers it.

Class strings spend the token vocabulary only — `bg-accent`, `text-m`,
`rounded-lg`. Tailwind's default scales are erased in `src/styles/main.css`, so
`bg-red-500` and `text-2xl` do not exist: an unknown utility generates nothing,
with no error. A style that fails to show up in Storybook is usually this.

## 3. The component

`<name>.tsx` assembles: defaults pulled from `DEFAULTS`, one class per axis
map, the caller's `className` appended last, every other prop spread through.

Accessibility lives in the props type, not in review — `Button` takes either
`children` or an `aria-label`, so an icon-only button without a label does not
compile. Prefer making a misuse unrepresentable over documenting it.

## 4. The stories

The controls read the contract — `options: [...VARIANTS]`, defaults from
`DEFAULTS` — so they cannot fall out of date. Each axis gets a `description` in
its `argTypes`: with `autodocs`, that text is the component's documentation.

Stories are also the tests. `bun run test:stories` renders every story in a
real browser, and the a11y addon audits what renders. The gate runs both.

## 5. Run it

```sh
bun run storybook
```

```sh
bun run gate
```
