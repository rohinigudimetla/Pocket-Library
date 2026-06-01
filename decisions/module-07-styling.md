# Module 07: Styling

---

## What the app needs right now

PocketLibrary at Module 7 has a fully functional frontend. Role-based UI works. The request workflow works. Protected routes work. Authentication flows correctly. The logic is complete and correct.

None of it has any visual treatment. Every component renders with browser defaults. No colors, no spacing system, no typography hierarchy, no surface design. The app functions but looks like unstyled HTML.

Module 7 gives it a visual identity through a design system built to production standards on top of a premise that does not need it.

---

## What I'm not doing yet

- No complete component styling: the token system is in place and applied throughout, but some components such as the 404 page are minimally styled. The remaining visual work continues module by module as features stabilize with real backend data.
- No book cover images: every book card and featured book shows a dark placeholder. Real cover art comes from the Open Library covers API once the backend is handling book data properly.
- No dark mode: the token system supports it structurally because semantic tokens separate color intent from color value. Whether to implement it is a decision for later.
- No animation system beyond basic transitions: hover states and button presses use CSS transitions. Page transitions and loading skeletons are not built yet.

---

## The simple path

For a personal book tracker with one developer and no design handoff, the simple path is Tailwind utility classes written directly in components. Pick a color, write it inline, move on. No token file, no naming system, no hierarchy. When something looks wrong, change the class. When the same color appears in ten components, change it in ten places.

This is a completely reasonable approach for a project at this scale. It is fast and direct. PocketLibrary does not need a three-level token hierarchy.

---

## What I did instead and why

**A three-level token hierarchy was built in `index.css`.**

Level 1 holds raw primitives. These are literal values with no meaning attached. `--raw-brick-500: #BE5B50`. `--raw-space-6: 24px`. `--raw-radius-4: 24px`. Nothing in any component references these directly. They exist as the single source of truth for every literal value in the system.

Level 2 holds semantic tokens in `@theme`. These give the raw values intent. `--color-primary: var(--raw-brick-500)` means the primary action color is brick red today. If that changes, one line changes and every component that references `bg-primary` updates. `--spacing-gap-sm: var(--raw-space-4)` means the standard small gap between sibling elements is 16px. The component says what kind of space it needs, not what number it wants.

Level 3 holds component-specific tokens. `--sidebar-width: 240px`. `--cover-sm-width: 148px`. `--cover-request-width: 44px`. Values that belong to one component and nowhere else. These live in `:root` as CSS variables consumed via `var()` in inline styles, because they are structural dimensions, not visual decisions.

The separation follows the same reasoning as the `AuthContext` and `AppContext` split in Module 6. Different concerns should not share a namespace. A color decision and a layout dimension are different kinds of decisions. Keeping them in separate levels means changing one cannot accidentally affect the other.

**Tailwind v4 is used as the utility layer.**

`--spacing: initial` is set in `@theme` to disable Tailwind's default numeric spacing scale entirely. `p-4`, `gap-2`, `m-8` produce no CSS output. Every spacing class must reference a named semantic token. `p-inset-lg`, `gap-gap-xs`, `mt-gap-md`. A class that references a token that does not exist produces nothing, which makes violations obvious immediately rather than silently applying the wrong value.

**A two-axis spacing convention was established.**

The `gap` axis describes space between sibling elements and maps to the CSS `gap` property in flex and grid containers. The `space` axis describes internal padding of a container. A card's internal padding and the gap between two buttons inside it are semantically different even if they share a value. Naming them separately makes the intent readable in the component without opening `index.css`.

**Shared primitives were extracted into dedicated components.**

`Button.tsx` is the only file in the codebase where button visual rules are defined. Five variants: primary, secondary, ghost, danger, icon. Full state coverage for hover, active, focus-visible, and disabled. Every interactive element that uses it gets consistent behavior automatically. Components that needed custom action controls, like the page count buttons in `BookCard` and the accept and dismiss buttons in `RequestList`, use raw button elements styled with tokens because their visual treatment is specific to their context and does not belong in the shared primitive.

**The sidebar is a sticky flex child.**

`Sidebar.tsx` sits as the first child in a flex row. The main content area takes the remaining width naturally. There are no `margin-left` hacks that would break when the sidebar width changes. On mobile the sidebar becomes a fixed drawer triggered by a hamburger menu, with a backdrop overlay and a close handler. This is built inside `Sidebar.tsx` directly with an `isOpen` and `onClose` prop interface.

**The `.grain` utility handles texture.**

Surfaces that need the noise texture use the `.grain` class, which applies a scoped `::after` pseudo-element with `isolation: isolate`. The grain clips to its parent's border radius, never bleeds outside, and never blocks pointer events. An earlier `.noise > *` approach was replaced because it created specificity conflicts with absolutely positioned children inside those surfaces.

**Component-level design decisions worth noting.**

`FeaturedBook` takes the first book in the array and renders it in a hero card with a dark gradient background, a book cover placeholder rotated slightly, a progress bar, and a circular SVG progress ring. The ring is built with `stroke-dasharray` and `stroke-dashoffset` calculated from the reading percentage, which makes it genuinely dynamic rather than decorative.

`SearchBooks` renders results in a dropdown that is part of the card's own layout rather than a floating overlay. Results are contained within the card. The request toggle in each result row uses the `badge-pending` utility class for the pending state, giving it visual consistency with the request list without duplicating style logic.

`RequestList` shows a maximum of four items with a "View all" link when there are more. Admin sees pending requests with accept and dismiss icon buttons. Reader sees their own requests with status badges. The empty state uses an icon and copy that differs by role.

---

## The actual tradeoff

**What it costs:**

Every new visual value must be justified, named at the correct level, and added to `index.css` before it can appear in a component. That friction is real and it slows down the early stages of every new component.

The decision to disable the numeric spacing scale with `--spacing: initial` is the most opinionated call in the system. A developer who writes `p-4` gets no output and no error. The class compiles to nothing. This requires discipline to catch.

Some token violations remain in the current codebase. The sidebar gradient is still an inline `style` with raw hex values. The dismiss button in `RequestList` and the delete button in `BookCard` use raw `rgba` values for their danger border and hover background because the appropriate tokens were not added at the time. These are known gaps, not systemic failures.

**What it gives:**

Any color, spacing, or radius value in the entire codebase traces back to one line in `index.css`. Changing the primary color means changing one line. No grep, no find-and-replace, no missed instance.

Components describe intent rather than values. `bg-surface-sunken` communicates that a surface is recessed. `gap-gap-xs` communicates that siblings are tightly grouped. A developer reading a component file understands the layout decisions without opening the token file.

---

## At small scale (one developer, personal project)

I would not build this. Inline Tailwind with the default numeric scale is faster, more direct, and easier to change. The payoff of a semantic token system only becomes real when multiple people are making styling decisions, or when a design update needs to propagate consistently across many components at once.

For a personal project: pick a color palette, use the default Tailwind spacing scale, and build the token system only when a specific problem demands it.

---

## At medium scale (startup, five to ten engineers, real product)

Five developers making independent styling decisions will produce inconsistent spacing and color within weeks. One uses `p-4` for card padding, another uses `p-5`, a third uses `p-6`. There is no system telling them which is correct. The result is cards that look inconsistent in ways that are hard to identify without a systematic audit.

A semantic token system with the numeric scale disabled makes the correct choice the only accessible one. `p-inset-lg` is the card padding. The decision is made once and enforced everywhere.

At this scale, enforcement moves from discipline to automation. ESLint rules fail the build when raw hex values or numeric spacing classes appear in component files. The system stops relying on developers remembering the rules.

---

## At large scale (hundreds of engineers, millions of users)

The token system becomes a shared package distributed across teams and products. A CI pipeline syncs design tokens from Figma directly to the token file. When a designer updates the primary color, a pull request opens automatically and every affected component is surfaced before anything merges.

Multiple products import from the same token package. A brand update ships once and propagates everywhere.

The three-level hierarchy itself survives at this scale regardless of whether the underlying CSS tooling stays as Tailwind. The mental model of separating raw values, semantic intent, and component specifics is not Tailwind-specific. It maps to any CSS methodology that needs to scale across teams.

---

## TLDR

I built a three-level design token system in Tailwind v4, extracted shared UI primitives into dedicated components, and applied that system across every component in the app. The visual result is intentionally incomplete in places because full polish depends on real data and stable features that do not exist until the backend arrives. The system is built to receive those things correctly when they come.
