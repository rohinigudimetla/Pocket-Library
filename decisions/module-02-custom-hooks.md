# Module 02: Custom Hooks

---

## What the app needs right now

PocketLibrary at Module 2 has three components and one user.

`BookCard`: displays a book. Needs to track two things locally: whether the book has been read, and what page the user is on.

`AddBook`: one text input. User types a title, clicks Add, book appears in the list.

`FeaturedBook`: fetches one book from the Open Library API and displays the title.

That's the app so far. No routing. No backend. No database. The books live in an array in App's useState and disappear on refresh.

---

## What I'm not doing yet

- No routing: every book lives on the same page.
- No real backend: books are hardcoded as a starting array.
- No database: nothing persists.
- No auth: one user, no login. No connection between what the user adds and what the API returns. The API call in FeaturedBook is hardcoded to one book. These things come in later modules.

---

## The simple path

For an app this size, the honest simple path is this:

`BookCard`: write `useState(false)` for read/unread directly inside the component. Write `useState(0)` for the page number directly inside the component. Done. Four lines total.

`AddBook`: write `useState("")` for the input directly inside the component. One line.

`FeaturedBook`: write three useState calls and a useEffect directly inside the component. Fetch on mount, set data, handle loading, handle error. Three useState calls, one useEffect, one async function inside it, one fetch, one .then, one .catch, one .finally, two early returns for loading and error states. Twelve lines, all in one place.

Nothing about this is wrong. It works. It's readable. For one developer building a personal app, this is the correct decision.

---

## What I did instead and why

I extracted all of that logic into four custom hooks: `useToggle`, `useCounter`, `useInput`, `useFetch` Each one has its own file inside a `hooks/` folder.

The reason is not that the app needs it now. The reason is that the pattern becomes necessary the moment the same logic appears in more than one place.

Here is the specific moment it would have paid off, had I not already built it:

In Module 3, `SearchBooks` arrives. It fetches from Open Library as the user types. `FeaturedBook` already fetches from Open Library on mount. Without `useFetch`, I now have two components each containing their own version of the same fetch pattern, which is three useState calls, a useEffect, error handling, loading state.

If I need to change how errors are handled in one, I have to remember to change it in the other. If I forget, the two components behave differently in failure states. That is a bug that costs time to find because it only shows up when the API fails, not in normal usage.

With `useFetch` already extracted, `SearchBooks` is one line:

```ts
const { data, isLoading, error } = useFetch(searchUrl);
```

One place to change. No chance of inconsistency between components.

---

## The actual tradeoff (with evidence)

**What the overkill costs:**

- Indirection: When something breaks in `BookCard`, you now look in two files, `BookCard.tsx` and `useToggle.ts`, instead of one. For a bug as simple as "the toggle isn't working", this doubles the surface area you have to check.

- Measurable: the hooks folder adds four files. Each file is an additional import in every component that uses it. Every component that uses `useFetch` now has a dependency on an external file. If that file has a bug, every consumer is affected simultaneously. In a solo project that is a minor risk. In a team codebase with ten developers, it means a bad change to `useFetch` breaks ten components at once instead of one.

Re-render cost. `useFetch` returns an object:

```ts
return { data, isLoading, error };
```

Every time the component re-renders, this object is created fresh at a new memory address. This only becomes a problem if you pass that object as a prop to child components. The child sees a new reference and re-renders even if nothing inside actually changed. If the component that calls `useFetch` renders the data directly in its own JSX without passing the result down, this cost never materialises. If you do pass it down, the fix is `useMemo` wrapping the return object or `useCallback` wrapping any functions (additional complexity on top of the abstraction). This is not the reason you eventually move to React Query. React Query solves different problems entirely with caching, deduplication, background refetching. The re-render problem is a separate concern solved separately.

**What the overkill gives:**

- Consistency guarantee: Every component that calls `useFetch` handles loading, error, and data the same way because they all call the same code.

- Single point of change: If the Open Library API changes its response shape, or if I want to add request timeout handling, or if I want to log errors to an analytics service, I change it in one place.

- Testability: `useFetch` can be tested in isolation without rendering any component. Pass it a URL, mock the fetch call, assert that `isLoading` starts true, transitions to false, and `data` gets set correctly. Without the extraction, testing that logic means rendering the full component.

---

## At small scale (one developer, personal project)

Honestly, I wouldn't actually do this. I'd write the logic inline. The app has three components. Extracting into hooks adds files, adds imports, adds indirection, with no return.

The decision log for a personal project at this scale would say: useState inline, useEffect inline, done.

---

## At medium scale (startup, five to ten engineers, real product)

This is where `useFetch` earns its place. This is its sweet spot.

Five developers working in the same codebase will write the fetch pattern five different ways if there is no shared hook. Some will handle the case where `response.ok` is false. Some won't. Some will abort the fetch on unmount. Some won't. Some will reset the error state before each new fetch. Some won't.

The inconsistency is a reliability problem. Users on slow connections or flaky APIs will hit different behaviour depending on which developer wrote the component they're looking at.

The re-render cost is also manageable here. At medium scale, components that call `useFetch` typically render the data directly rather than passing it as props to deeply nested children. When the result stays local to the component that fetched it, the new object reference on every render never reaches a child. The problem doesn't exist in practice.

`useFetch` solves inconsistency at a cost that stays invisible at this scale. That is the definition of the right tool.

---

## At large scale (hundreds of engineers, millions of users)

`useFetch` breaks down here and gets replaced. Here is exactly why:

- **Caching.** `useFetch` has no memory. Every time a component mounts, it fires a fresh network request. So if you navigate away from the Books page and come back, the loading spinner appears again and the same data gets fetched from the server again.
  React Query remembers the response from the first fetch. When you come back to the same page, it serves the cached result instantly. At the same time, it quietly checks in the background whether anything has changed on the server. The user sees data immediately instead of a spinner.

- **Deduplication.** If a navbar, a sidebar, and a main panel all call `useFetch("/api/user")` because they all need the current user's name, three separate network requests go out for identical data. React Query sees three calls to the same URL, makes one request, and gives all three components the same result. The other two never hit the network. At millions of users, three times the requests means three times the server cost.

- **Background refetching.** `useFetch` has no awareness of time. Once data is loaded, it sits on screen indefinitely. If the server data changes while the user is away, the app has no way of knowing. As an example, a user opens PocketLibrary, the book list loads, and they leave the tab open for twenty minutes. When they come back, they are looking at data from twenty minutes ago. The only way to get fresh data is to manually refresh the page.
  React Query detects when the user returns to a tab and quietly refetches the data in the background. The old data stays visible until the new data arrives. No loading spinner. No stale results sitting there indefinitely.

- **Stale data management.** `useFetch` has no concept of freshness. Data is either loading or it is loaded. Once it is loaded, `useFetch` never questions whether it is still accurate.
  React Query lets you define exactly how long each piece of data is considered fresh. As an example, a user profile might be set to stay fresh for five minutes, while a book list might be set to go stale after thirty seconds. Once that time is up, the next render automatically triggers a background refetch. The rules are defined once per query and React Query handles the rest.
  None of these four things are about re-renders. They are about making the relationship between the app and the server intelligent instead of naive. `useFetch` asks the server every single time, trusts nothing, remembers nothing. React Query asks the server only when it needs to, remembers what it learned, and keeps the UI current without the user noticing.

The custom hook pattern is not wrong at large scale. The specific implementation of `useFetch` just hits a ceiling. The right move is to replace the implementation with React Query while keeping the same calling convention in components so components don't care what's underneath.

`const { data, isLoading, error } = useBooks()`

---

## TLDR

I extract logic into hooks when it is shared across components. Doing it before that point is practice, not necessity.
