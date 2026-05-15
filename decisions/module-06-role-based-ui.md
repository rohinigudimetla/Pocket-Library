# Module 06: Role Based UI

---

## What the app needs right now

PocketLibrary at Module 6 has two roles: Reader and Admin.

Reader can search for books, request books to be added to the shared library, cancel those requests, and track reading progress on books that are already in the library.

Admin can do everything a Reader can, plus add books directly, delete books from the shared library, accept Reader requests, and dismiss Reader requests.

Both roles share one book list. Any change Admin makes to the library is immediately visible to Reader. Any request Reader makes is immediately visible to Admin.

---

## What I'm not doing yet

- No server-side auth: credentials are hardcoded in the frontend. There is no database of users, no registration flow, no password hashing. Real authentication comes in Module 9 with Spring Security and JWT.
- No persistent state: books and requests live in memory. Everything resets on page refresh. Persistence comes in Module 10 with PostgreSQL.
- No per-user reading progress persistence: reading progress lives in local component state inside BookCard. It is not tied to identity. This gets resolved when user-specific data moves to the database in Module 10.
- No role management: roles are hardcoded onto each user object. There is no way to promote or demote a user at runtime. That comes with the users table in Module 10.

---

## The simple path

The simple path for role-based UI is a single boolean. One flag, one check, done. Something like `isAdmin` passed as a prop to every component that needs to render differently. The component checks the flag and shows or hides things accordingly.

This works for two components. It breaks down when ten components all need the same flag, because now the flag has to travel through every layer of the component tree regardless of whether the layers in between care about it. Change the flag, chase it through every component. Add a third role, touch every component again.

---

## What I did instead and why

**`types.ts` was created.**

Before this module, every component defined its own inline type for a book. `BookCard`, `BookDetailPage`, and `HomePage` each had their own version of `{ title: string, totalPages: number }`. Three separate definitions for the same shape with no guarantee they stayed in sync.

`types.ts` is a single file at the root of `src` that exports `User`, `Book`, and `Request`. Every component imports from it. Change the shape of a book in one place and TypeScript immediately flags every component that does not handle the change correctly.

**`AuthContext.tsx` was built as the identity layer.**

`AuthContext` holds one piece of state: `currentUser`, which is either a `User` object or `null`. Null means nobody is logged in. A `User` object means someone is, and their role is on that object.

`login` checks credentials against a hardcoded array and sets `currentUser` on match. `logout` sets it back to null. The `useAuth` custom hook exposes all three to any component in the tree.

The reason this lives in context and not in a prop is that identity is needed in many disconnected parts of the component tree. `ProtectedRoute` needs it. `SearchBooks` needs it. `BookCard` needs it. `RequestList` needs it. There is no single parent that connects all of these. Passing identity as a prop would mean threading the same value through every layer between the root and each of those components. Context eliminates that entirely.

**`AppContext.tsx` was built as the data layer.**

`AppContext` holds `books` and `requests` as shared state and exposes six functions for modifying them. Any component that needs to read or modify shared data calls `useAppContext` directly.

The separation of `AuthContext` and `AppContext` is deliberate. Identity and data are different concerns. A component that only needs to know who is logged in should not receive the entire books and requests array. A component that only needs to read books should not receive login and logout functions. Keeping them separate means each component pulls exactly what it needs and nothing else.

**`App.tsx` was stripped to routes only.**

`App.tsx` has no state, no functions, and no hooks. It defines routes and nothing else. Every route that requires a logged-in user is wrapped in `ProtectedRoute`. The routing structure of the entire app is readable at a glance in one file.

**`ProtectedRoute` was updated to read from `AuthContext`.**

In Module 4, `ProtectedRoute` used a hardcoded `isLoggedIn = true`. In Module 6 it reads `currentUser` from `AuthContext`. If `currentUser` is null, the user is redirected to `/login`. The component pattern is identical to Module 4. Only the condition it checks has changed.

**`LoginPage.tsx` was built with raw `useState`.**

`AddBookForm` uses React Hook Form and Zod because it has validation rules that need to be enforced and communicated clearly to the user. `LoginPage` has no validation rules of its own. The only question it asks is whether the credentials match. That is handled by `login` in `AuthContext`. Adding React Hook Form here would add a library and add complexity for no return.

**`SearchBooks` was updated with a dropdown and a request toggle.**

Before Module 6, search results pushed all page content down. Results now appear in a floating container positioned absolutely below the input. It has a maximum height and scrolls internally. Clicking outside closes it, handled by `useRef` and a `useEffect` that listens for clicks on the document and checks whether they landed inside or outside the container.

The request button for Readers is a toggle driven by state. `getRequestStatus` checks the `requests` array for an existing entry matching both the book title and the current user's name. Pending shows a Pending button that cancels on click. Anything else shows a Request button that creates or reactivates the request.

**`RequestList.tsx` was built.**

Reader sees only their own requests, filtered by name. Each entry shows the title and a toggle button reflecting the current status. Admin sees only pending requests. Each entry shows the title, who requested it, an Accept button, and a dismiss button. Both Accept and Dismiss match on title and requestedBy combined, not on title alone, so two users requesting the same book are handled independently.

**`BookCard` was updated with a delete button for Admin.**

The delete button renders only when `currentUser.role === "admin"`. Reader never sees it.

---

## The actual tradeoff

**What it costs:**

Two context files, a types file, a new page, a new component, and updates to five existing files. This is a significant increase in surface area.

For a two-role app with two hardcoded users, the split between `AuthContext` and `AppContext` adds two hooks where one might do. A component that needs both identity and data calls `useAuth` and `useAppContext`. The separation pays off when the app grows. At this size it is additional structure that earns its place later.

Hardcoded credentials mean this auth system cannot be used in production as-is. The architecture is correct. The implementation is a placeholder until Module 9.

**What it gives:**

Every component that needs to know the current user asks one question: `useAuth`. The answer is always current and always consistent. There is no prop to pass, no flag to thread through layers, no component responsible for deciding what the current user is.

Shared data has one home. `AppContext` is the single source of truth for books and requests. Changes made by one role are immediately visible to the other.

The request workflow is a genuine cross-role interaction. Reader creates a request. Admin sees it. Admin acts on it. Reader sees the result. The state that drives this lives in one place and flows outward to both roles simultaneously.

---

## At small scale (one developer, personal project)

A small project would likely skip context entirely and pass identity as a prop. The overhead of setting up `createContext`, a Provider, and a custom hook is not justified when only two or three components need the same value. Passing it as a prop is simpler and more direct.

Role checks would be inline booleans rather than structured context reads. Something like `const isAdmin = user.role === "admin"` computed once at the top level and passed down as a prop. The structure is flat enough that this does not become painful.

This works cleanly when the component tree is shallow and the number of role-dependent components is small.

---

## At medium scale (startup, five to ten engineers, real product)

At this scale the component tree is deep and many components need identity. Prop drilling becomes genuinely painful because identity has to pass through components that do not use it just to reach the ones that do. Context is the correct solution here and what we built matches this.

The split between `AuthContext` and `AppContext` also becomes important at this scale because different developers own different parts of the app. The developer working on auth should not have to touch the data layer to make a change. Keeping them in separate contexts means each has a clear boundary and ownership.

Role checks at the route level via `ProtectedRoute` are the correct pattern at this scale. If role checks live inside individual components, one developer forgetting to add the check to a new component means a page is accessible to the wrong role. Route-level protection is structural. It cannot be accidentally skipped.

---

## At large scale (hundreds of engineers, millions of users)

At large scale, the implementation of each piece changes but the architecture we built maps directly onto what a large system uses.

`AuthContext` gets replaced by a dedicated auth service. The frontend receives a JWT on login, stores it, and attaches it to every API request. `useAuth` still exists and still returns the current user. What changes is where that user comes from: a decoded token rather than a hardcoded array. The components that call `useAuth` do not change at all.

`AppContext` gets replaced by API calls and a data fetching library like React Query. Books and requests stop living in memory and start living in a database. `useAppContext` would likely be replaced by dedicated hooks like `useBooks` and `useRequests` that fetch from the server rather than reading from local memory. The components that consume them do not change.

The most significant difference at large scale is that role enforcement moves to the server entirely. The frontend reflects what a user is allowed to do. The server enforces it. No matter what a user does in the browser, a request to delete a book from a Reader account gets rejected at the API level. Module 9 is where these changes are made in PocketLibrary.

---

## TLDR

Role-based UI means different users see different things and can do different things. So in this module, I created a way to manage identities (Reader and Admin) and shared data separately. There's also a request workflow where Reader and Admin interact through a shared state. The credentials are still hardcoded. The server enforcement is not built yet.
