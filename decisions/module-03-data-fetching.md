# Module 03: Data Fetching

---

## What the app needs right now

PocketLibrary at Module 3 has two data fetching needs.

`FeaturedBook`: already existed from module 2. It uses the hook `useFetch` which got upgraded to handle five failure modes that the previous version ignored.

`SearchBooks`: takes user input, builds a search URL, fetches matching books from Open Library as the user types, displays the results as a list.

## That is the entire data layer at this stage.

## What I'm not doing yet

- No backend: there is no server between the app and Open Library. The React app calls Open Library directly from the browser.
- No caching layer: every search fires a fresh network request.
- No pagination: Open Library returns up to 100 results and all of them render at once.
- No authentication: Open Library is public. These things come in later modules.

---

## The simple path

For an app this size with one developer, the simple path is:

`FeaturedBook`: I would write three useState calls and a useEffect directly inside the component. Fetch on mount, parse the response, set data. If it fails, set an error message. No AbortController, no response.ok check, no cleanup.

`SearchBooks`: same pattern. One input, one useState for the query, one useEffect that fetches when the query changes. There's no debouncing. I would just fire a fetch on every keystroke and let the results update as they come in.

Nothing about this is wrong for a personal project. It works. The bugs it creates(ghost setState calls, race conditions, API hammering) are invisible in development where the network is fast and you are the only user.

---

## What I did instead and why

**`useFetch` with AbortController, response.ok, and error reset.**

**`useDebounce` as a separate hook used inside `SearchBooks`.**

Each one addresses a specific failure mode that only shows up under real conditions.

---

## The failure modes and the fixes

**Failure mode 1: ghost setState.**

The component mounts, the fetch fires and the user navigates away before the fetch completes. Then, the component unmounts but the fetch completes anyway and calls setState on a component that no longer exists.

In development on a fast network this doesn't really happen. The fetch completes in 50ms and the user cannot realistically navigate away that fast. In production on a slow mobile connection, fetches take 2-3 seconds. Users navigate away constantly. This happens on every slow page.

The fix is AbortController. When the component unmounts, the cleanup function calls `controller.abort()`. The fetch stops. setState never fires. The browser reclaims the memory.

```ts
const controller = new AbortController();
const response = await fetch(url, { signal: controller.signal });

return () => controller.abort();
```

**Failure mode 2: silent bad data.**

A fetch resolves successfully at the network level even when the server returns a 404 or 500. The catch block never fires. `response.json()` runs on an error response body. You get unexpected data in state with no indication that anything went wrong.

<!-- i'd rather the below thing was just a comment in the actual code. -->

```ts
// Without this check, a 404 silently sets bad data
if (!response.ok) {
	throw new Error(`HTTP error: ${response.status}`);
}
```

This forces the catch block to handle server errors the same way it handles network errors.

**Failure mode 3: stale error state.**

A fetch fails and sets an error message. The user corrects their input and tries again. The new fetch succeeds but the error message from the previous attempt is still visible because nothing cleared it.

<!-- same here -->

```ts
setError("");
setIsLoading(true);
```

These two lines run at the start of every fetch. Every attempt starts clean.

**Failure mode 4: API hammering.**

The user types "Dune" which is four keystrokes, meaning four fetches. But three of them are wasted. On a real search box with real users typing at normal speed, a five letter word produces five requests. Ten users searching simultaneously produce fifty requests for ten actual results needed.

`useDebounce` waits until the user stops typing for 500ms before the URL updates. The URL changing is what triggers `useFetch`. So the fetch only fires after the input settles.

<!-- why are we doing this pls stop -->

```ts
const debouncedQuery = useDebounce(query, 500);
const searchUrl = debouncedQuery
	? `https://openlibrary.org/search.json?q=${debouncedQuery}`
	: "";
```

Four keystrokes. One fetch.

**Failure mode 5: race condition.**

Two fetches are in flight simultaneously. The first one was for "Dun", the second for "Dune". The network is unpredictable. "Dun" resolves after "Dune". The screen shows "Dun" results even though the user typed "Dune". Wrong data, no error, no indication anything went wrong.

AbortController solves this too. When `url` changes, the useEffect cleanup runs before the new effect starts. The old fetch is aborted. Only the most recent fetch can set data.

This is the same AbortController from failure mode 1. One tool, two problems solved.

---

## The actual tradeoff

**What it costs:**

`useFetch` is now 35 lines handling five distinct failure modes. The simple inline version was twelve lines handling zero. Every component that fetches data now has an invisible layer of complexity underneath it.

Each fetch creates one AbortController object and runs one cleanup call. That is basically nothing. But every unaborted fetch holds onto memory and keeps a network connection open. At thousands of users doing this simultaneously, that adds up fast.

`useDebounce` adds a 500ms delay before results appear. This is a deliberate UX tradeoff. The user experiences a slight lag. The server receives dramatically fewer requests.

**What it gives:**

Every component that calls `useFetch` gets all five failure modes handled automatically. A new developer adding a third data-fetching component writes one line and gets correct behaviour for free. They do not need to know about AbortController, response.ok, or race conditions. The hook handles it.

---

## At small scale (one developer, personal project)

AbortController is unnecessary here. On a fast connection, fetches complete in under 100ms. The user cannot navigate away fast enough to trigger a ghost setState. The bug exists in theory but never in practice.

`response.ok` is worth keeping even at small scale. Silent bad data is hard to debug regardless of team size.

Debouncing is worth keeping if the app hits a rate-limited API. Open Library has no rate limit for personal use so it is technically unnecessary here. For any API with rate limits or costs per request (like Google Maps, OpenAI, paid data APIs) debouncing is mandatory from day one.

---

## At medium scale (startup, five to ten engineers, real product)

All five failure modes become real. Users are on mobile, on flaky networks, navigating quickly. The ghost setState bug ships within the first week without AbortController. Race conditions appear as soon as the network slows down under load.

At this scale `useFetch` stops being overkill and becomes the minimum acceptable implementation. Any hook that fetches data without AbortController and response.ok is considered incomplete in a code review.

Debouncing becomes mandatory the moment the app has any API cost. Even a small team burning through API credits on keystrokes gets expensive fast.

---

## At large scale (hundreds of engineers, millions of users)

`useFetch` gets retired and replaced with React Query or SWR. `useFetch` handles all five failure modes correctly. But, it gets replaced because it cannot handle the problems that emerge at this scale.

`useFetch` has no caching. Every component mount fires a network request. React Query serves cached responses instantly while revalidating in the background. Users see data immediately instead of a loading spinner on every navigation.

`useFetch` has no deduplication. If there are ten components calling `useFetch` with the same URL, then ten requests are fired. But React Query fires one and shares the result across all ten components.

`useFetch` has no background refetching. For example, data that was loaded five minutes ago would sit stale on screen. React Query detects the user returning to a tab and quietly refetches. This keeps the UI current without the user noticing.

`useFetch` has no stale data management. React Query lets you define how long data is considered fresh per query. After that time, the next render triggers a background refetch automatically.

---

## TLDR

Every fetch has five ways to go wrong silently. Handle all five or ship bugs you cannot reproduce in development.
