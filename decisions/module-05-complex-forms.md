# Module 05: Complex Forms and Validation

---

## What the app needs right now

PocketLibrary at Module 5 has one form: `AddBookForm`.

It replaces the original `AddBook` component which had a single text input with no validation whatsoever. The user could type anything, submit nothing, or enter a negative page count and the app would accept it without complaint.

`AddBookForm` has two fields and enforces rules on both:

- Title: required, minimum 3 characters
- Page count: required, must be a positive number

Error messages appear below each field when the user leaves a field without satisfying its rule. The form only submits if both fields pass validation.

---

## What I'm not doing yet

- No server-side validation: rules are enforced in the browser only. A raw HTTP request to the backend bypasses all of this entirely. Server-side validation comes in Module 9 with Spring Boot.
- No file inputs: profile picture upload and other file handling come later.
- No debouncing on validation: errors appear on blur, not on every keystroke. Debounced validation comes if needed in later modules.
- No optimistic updates: the book appears in the list only after the form submits successfully. Real-time preview comes later.

---

## The simple path

The simple path is manual validation with `useState` and if statements.

For two fields it looks like this: two state variables for the values, two more for the error messages, a validate function with if statements checking each rule, and an onSubmit that calls validate before doing anything. For two fields that is around 25 lines before any JSX.

Nothing about this is wrong for a small form. It works. The problem is that it does not scale. A form with ten fields means ten useState calls, ten error useState calls, ten if statements, and ten onChange handlers all written slightly differently by whoever happened to write them. By the time a codebase has twenty forms, no two of them behave consistently.

---

## What I did instead and why

`React Hook Form` manages all form state internally. There are no useState calls for field values. No onChange handlers written by hand. The `register` function connects each input to React Hook Form in one line, giving it a name, a ref, an onChange, and an onBlur automatically. React Hook Form tracks every field's value and dirty state without any manual wiring.

`Zod` defines what valid data looks like as a schema outside the component. The schema is the single source of truth for every validation rule. Change a rule once in the schema and it applies everywhere the schema is used.

`zodResolver` connects the two libraries. React Hook Form runs the Zod schema against the current field values when the user leaves a field or submits the form. If validation fails, the errors object is populated with messages that came directly from the schema. The component just renders `errors.title.message` and `errors.pageCount.message` wherever they are needed.

`z.infer` extracts a TypeScript type from the schema automatically. The type `FormData` is always in sync with the schema without any manual interface definition.

`valueAsNumber: true` on the page count input tells React Hook Form to treat the input value as a number before passing it to Zod. Without this, all HTML input values are strings by default and Zod's `z.number()` check fails on every submission.

---

## The actual tradeoff

**What it costs:**

Two new libraries added as dependencies. React Hook Form and Zod both have their own APIs that take time to learn. The syntax looks nothing like standard React state management -- `register`, `handleSubmit`, `zodResolver`, `z.infer` are all new patterns with no equivalent in plain React.

The setup cost is front-loaded. For a two-field form, the boilerplate is comparable to manual validation. The payoff only becomes obvious at five fields or more.

**What it gives:**

Every form in the app now has a consistent structure. The schema defines the rules. React Hook Form manages the state. The component just renders. A new developer can read any form in the codebase and immediately understand how it works because every form follows the same pattern.

Validation rules are testable in isolation. The Zod schema can be imported and tested independently without rendering any component. Pass it a value, check the result. No browser required.

The `errors` object is always accurate. React Hook Form knows exactly which fields have been touched, which have errors, and when to show them. Replicating that level of precision manually requires significant extra code.

---

## At small scale (one developer, personal project)

For one or two simple forms, manual validation with useState is the pragmatic choice. The learning curve of React Hook Form and Zod is not justified by a single login form and a single add item form.

The threshold is roughly three or more forms with multiple fields each. At that point the consistency benefit of a shared schema pattern outweighs the setup cost.

---

## At medium scale (startup, five to ten engineers, real product)

At this scale, form inconsistency becomes a real problem. Different developers writing validation differently means different error timing, different error messages, and different submission behavior across the app. Users notice. Support tickets get filed.

React Hook Form and Zod are the industry standard at this scale. Almost every production React codebase uses them or something equivalent. A new developer joining the team already knows how they work.

Zod schemas also start doing double duty here in TypeScript-only stacks like Next.js or Node.js backends. The same schema that validates a form on the frontend can validate incoming request bodies on the backend. One schema, two validation layers, guaranteed consistency between them. PocketLibrary uses Spring Boot on the backend so this does not apply here, but it is worth knowing the pattern exists.

---

## At large scale (hundreds of engineers, millions of users)

Form validation schemas become shared packages distributed across teams. A user profile schema defined once is imported by the profile edit form, the admin user management form, and the onboarding flow. Change the schema in one place and every form that imports it picks up the change.

At this scale, Zod schemas are also used for API response validation. Data coming back from the server is parsed through a schema before being stored in state. If the server changes its response shape, the schema catches the mismatch immediately instead of silently breaking the UI.

---

## TLDR

Manual validation works for one form. It falls apart across ten. Define the rules once in a schema and let the library handle the rest.
