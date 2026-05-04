# Module 04: React Router

---

## What the app needs right now

PocketLibrary at Module 4 has three pages.

`HomePage`: the book list, search, and add book form. Lives at `/`.

`BookDetailPage`: displays one specific book's details. Lives at `/books/:id`. The `:id` is a URL parameter that matches the book's index in the array.

`NotFoundPage`: a 404 page that renders for any URL that does not match the routes defined above it.

`ProtectedRoute`: a wrapper component that checks whether the user is logged in before rendering a page. For now the auth check is a hardcoded boolean. It gets replaced with a real check from `AuthContext` in Module 6.

---

## What I'm not doing yet

- No real auth: the `isLoggedIn` flag in `ProtectedRoute` is hardcoded. There is no login page, no user session, no token.
- No nested routes: all routes are flat. Nested routing comes later when the app has sections with shared layout.
- No active nav highlighting: `useLocation` is available and was introduced conceptually, but PocketLibrary has no navbar yet. That comes in Module 7 with styling.
- No programmatic redirect after adding a book: the Add Book form just adds to the list on the same page. A proper post-submit redirect comes in Module 5.

---

## The simple path

For an app this size, the simple path is to put everything on one page and never change the URL. One component, one route, everything visible at once. This is what PocketLibrary looked like at the end of Module 3.

It works fine until the app needs to share a link to a specific book, bookmark a page, or navigate back after clicking something. All of those are impossible on a single-page app with no routing. There is no URL to share, no URL for the browser to bookmark, and no URL change for the back button to navigate to.

---

## What I did instead and why

React Router was added so every meaningful view in the app has its own URL.

The URL is the oldest piece of state in a web application. It existed before React, before JavaScript frameworks, before SPAs. It is the one piece of state that survives a page refresh, can be bookmarked, can be copied and shared, and is always honest about where the user is. Ignoring it means losing all of that with no good reason.

`BrowserRouter` wraps the entire app in `main.tsx` and gives every component in the tree access to the router. React Router uses the browser's History API to listen for URL changes and swap components without triggering a server request. The server only gets involved once, on the first load. After that all navigation happens in the browser with no round trips.

`Routes` and `Route` in `App.tsx` define which component renders at which URL. When the URL is `/`, `HomePage` renders. When the URL is `/books/1`, `BookDetailPage` renders with `id` set to `"1"`. When the URL matches nothing, `NotFoundPage` renders.

`useParams` inside `BookDetailPage` reads the `:id` from the URL and uses it to find the right book in the array. The URL is the source of truth for which book is being viewed.

`Link` replaces anchor tags for internal navigation. Clicking a `Link` updates the URL without triggering a full page reload. The rest of the page stays exactly as it was.

`useNavigate` is used inside `BookDetailPage` for the back button. It is a hook that returns a function. Calling that function with a path navigates programmatically. This is different from `Link` which the user clicks. `useNavigate` fires from code in response to events.

`Navigate` is used inside `ProtectedRoute`. It is a component, not a hook. Returning it from a component causes an immediate redirect without any user interaction. The distinction matters: `useNavigate` is for user-triggered navigation, `Navigate` is for condition-based automatic redirects.

`ProtectedRoute` wraps `BookDetailPage` in `App.tsx`. Any route that should require authentication gets wrapped with it. When `isLoggedIn` is false, the user is redirected to home before the protected component ever renders.

---

## The actual tradeoff

**What it costs:**

The books array had to move from `HomePage` to `App.tsx` so both `HomePage` and `BookDetailPage` could access it as props. Without a backend or a shared state solution like context, the common ancestor has to own shared data. This is prop drilling and it is a known limitation of local state at this scale.

As the app grows and more pages need access to books, this pattern breaks down. The books array ends up being passed through multiple layers of components that do not use it themselves. That is the signal to move it into context or fetch it from a backend. Both of those happen in later modules.

React Router adds a dependency and a layer of abstraction. Every navigation now goes through the router instead of being a direct DOM operation. For a simple app this is overhead. For anything with more than one view it is the correct default.

**What it gives:**

Every view has a stable, shareable URL. Refreshing the page on `/books/1` still shows the correct book. Copying the URL and opening it in a new tab works. The browser back button works correctly because the browser history is real.

The app structure becomes explicit. Looking at `App.tsx` shows exactly what pages exist and what URLs they live at. That is not true of a single-page app where everything is conditionally rendered with state flags.

---

## At small scale (one developer, personal project)

For a truly simple app with one or two views, routing adds complexity without much return. A single page with conditional rendering based on a state variable is faster to build and easier to reason about.

The moment the app has more than two views, or the moment a user needs to share a link or use the back button, routing becomes necessary. That threshold is lower than most developers expect.

---

## At medium scale (startup, five to ten engineers, real product)

Routing is non-negotiable. Users expect URLs to be stable and shareable. The back button must work. Pages must be bookmarkable.

At this scale the router also becomes a coordination tool between developers. Routes are the contract between frontend developers. One developer owns a route and its component. Another developer links to it. The URL is the interface between them.

`ProtectedRoute` becomes a critical pattern here. Auth-gating pages at the route level means no individual component has to remember to check permissions. The protection is structural, not reliant on every developer remembering to add a check.

---

## At large scale (hundreds of engineers, millions of users)

React Router is still used but the routing layer becomes significantly more complex. Route-level code splitting is applied using `React.lazy` and `Suspense` so each page's JavaScript is only downloaded when the user navigates to that page. A user who only visits the home page never downloads the code for the book detail page.

Protected routes become more sophisticated. Instead of one boolean, they check against a permissions system with roles, scopes, and expiry times. The `ProtectedRoute` component pattern stays identical. The condition it checks becomes more complex.

Server-side rendering enters the picture for performance and SEO. This applies specifically to SSR frameworks like Next.js, not to client-side React Router on its own. The server renders the correct page for a given URL on the first load. React then takes over for subsequent navigation. The URL routing logic now runs in two places, on the server and in the browser, and they must agree.

---

## TLDR

The URL is state. Add routing from the beginning or spend time rebuilding an app that was never designed to support it.
