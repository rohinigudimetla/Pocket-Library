# Module 09: Spring Security and JWT Authentication

---

## What the app needs right now

PocketLibrary at Module 9 has a working Spring Boot backend with no concept of identity. Every endpoint is publicly accessible. Anyone who knows the URL can call `DELETE /api/books/1` from outside the browser entirely, with no login, no token, and no check of any kind. The application has data and a server but no notion of who is allowed to touch that data.

Module 9 introduces real authentication and authorization. A user logs in with a username and password, receives a JWT, and presents that token on every subsequent request. The server reads the token, identifies who is asking, and enforces rules about what that identity is allowed to do. Reading the library requires being logged in. Adding or deleting a book requires being an admin specifically.

---

## What I'm not doing yet

- No password hashing: usernames and passwords are stored and compared as plain strings in `UserRepository`. BCrypt is introduced in Module 10 when the database arrives, because hashing a password that lives in a list that resets on every restart solves a problem that does not exist yet.
- No persistent user storage: users live in an in-memory `ArrayList`, the same pattern as `BookRepository` before Module 10. Two seed users exist, one reader and one admin. Restarting the server resets nothing about them because they are hardcoded in the constructor, but no new user can be created and none of this survives the eventual move to a real users table.
- No refresh tokens: a token is valid for ten hours and then simply stops working. There is no mechanism to extend a session without logging in again. This is acceptable for development and is not addressed in this module.
- No persistent signing key: `JwtService` generates a new secret key every time the server starts. Every token issued before a restart becomes invalid the moment the server restarts, because the key used to verify it no longer exists. Redis in Module 12 gives this key somewhere to live across restarts.
- No server-side sync for already-existing local mutations: `addBook`, `handleAccept`, and the other functions in `AppContext` that mutate `books` and `requests` still operate on local React state only. They do not call the server. This was already true going into this module from Module 8, and Module 9 did not change it. The practical effect, observed directly during this module, is that a book added or a request fulfilled in one browser session does not appear for a different user logged in separately, because the next fetch pulls the real list from the server, which never received the change. This is a known and accepted gap. It is not fixed in this module because the correct fix involves the application actually persisting state through real API calls, which is the subject of Module 10. Patching it now would mean writing the logic twice, once as a temporary fix and once correctly once the database exists.

---

## The simple path

For a personal book tracker used by one person, the simple path is no authentication at all. One user, no login screen, no token, no concept of roles. The app simply works the moment it opens, because there is only ever one person who could possibly be using it.

Building a full JWT authentication system for an application with two hardcoded users is unnecessary by the actual requirements of the product. The complexity introduced, a filter that runs on every single request, a security configuration class, a token issuance endpoint, a password check, exists to defend against a multi-user threat model that a personal tracker does not have.

---

## What I did instead and why

**JWT was chosen over session-based authentication.**

A session requires the server to remember something. Traditionally this means a session ID stored in a cookie, with the actual session data kept in server memory or a session store, looked up on every request. A JWT requires the server to remember nothing. The token itself carries the username and role, signed with a secret key. Validating a request means checking the signature, not looking anything up. This is why `SecurityConfig` sets `SessionCreationPolicy.STATELESS`. The server never creates a session because the token already contains everything it needs to know.

**The token's three parts each exist for a specific reason.**

The header states the signing algorithm. The payload carries the claims, the username as the subject and the role as a custom claim, along with an issued time and an expiration time. The signature is an HMAC hash of the header and payload combined with the secret key. Changing a single character in the payload, such as editing a role from `READER` to `ADMIN` inside the token itself, produces a completely different signature than the one the server signed it with. This is what makes a JWT tamper evident without the server needing to store anything about it.

**`JwtFilter` extends `OncePerRequestFilter` and runs before the controller layer.**

Every incoming request passes through a filter chain before it reaches any controller. `JwtFilter` sits in that chain specifically to answer one question: who is making this request. It reads the `Authorization` header, checks for a `Bearer` prefix, and if a token is present and valid, writes the identity into `SecurityContextHolder` for the rest of the request to read. If no token is present, or it is invalid, the filter does nothing and simply lets the request continue. The filter's only job is identification. It never blocks a request itself, because deciding what an identity is allowed to do is a separate concern handled entirely by `SecurityConfig`.

**`SecurityConfig` is what makes the filter's identification binding.**

A filter that identifies a request without a rulebook to enforce against that identity accomplishes nothing. During this module, building `JwtFilter` first without `SecurityConfig` in place meant the application had a checkpoint that recognized people but no gate that actually stopped anyone. `SecurityConfig` declares that `/api/auth/login` is open to anyone, since a token cannot be presented before one has been issued, that `POST` and `DELETE` on `/api/books` require the `ADMIN` role specifically, and that every other request requires some authenticated identity, role unspecified. This is also the file that wires `JwtFilter` into Spring Security's actual filter chain, since being a Spring-managed component is not the same as being registered as part of the security pipeline.

**Role enforcement exists at two layers deliberately.**

`SecurityConfig` blocks unauthorized `POST` and `DELETE` requests at the URL level before they reach any controller. `BookController` also carries `@PreAuthorize("hasRole('ADMIN')")` directly on `addBook` and `deleteBook`. This is not redundant by accident. The URL-level rule is the actual enforcement boundary and would stop an unauthorized request on its own. The method-level annotation makes that same rule visible at the exact point where the action happens, readable by anyone looking at the controller without needing to cross-reference a separate configuration file.

**The DTO pattern was extended to authentication with `LoginRequest`.**

`LoginRequest` holds exactly two fields, username and password, with no id field and nothing else. This follows the same reasoning already established for `CreateBookRequest` in Module 8. The request body that arrives at an endpoint should only ever be able to express the fields that endpoint is actually asking for. A login request has no reason to carry anything beyond credentials.

**Global CORS replaced the per-controller `@CrossOrigin` annotation.**

`BookController` previously declared its own `@CrossOrigin(origins = "http://localhost:5173")`. Adding `AuthController` in this module meant a second controller would need the exact same annotation, and forgetting it on the new controller specifically would have meant login worked perfectly from a tool like curl while failing silently from the browser, since CORS is enforced by the browser and not the server. `SecurityConfig` now defines one `CorsConfigurationSource` bean that applies to every endpoint in the application, so this category of mistake is no longer possible to make by omission on any future controller.

**The frontend stores the token in React state, not `localStorage`.**

`localStorage` is readable by any JavaScript running on the page, including injected scripts from an XSS vulnerability. Storing the token in React state means a page refresh clears it and the user has to log in again, which is a real cost. The tradeoff is accepted for this module because the alternative is a token sitting in a location any successful script injection can read directly.

---

## What went wrong during this module, and what it taught me

**I generated three files and presented them as verified against the repository when they had not been checked.**

While building `SecurityConfig`, `AuthService`, `AuthController`, and `LoginRequest`, I stated these matched the existing codebase using language that implied verification, when in fact they were written from architectural inference with no file actually checked. I caught this directly and corrected it before any further file was touched. The practical lesson is that an instruction to verify before writing is only as good as actually executing the verification step every single time, not just the first time.

**An algorithm mismatch crashed the application on startup.**

`JwtService` originally called `Keys.secretKeyFor(SignatureAlgorithm.ES256)`. ES256 is an elliptic curve algorithm requiring a public and private key pair. `Keys.secretKeyFor` only generates a single shared secret, which is what HMAC algorithms use. Asking the method to produce a shared secret for an algorithm that structurally cannot use one threw an exception the moment Spring tried to construct the bean, which meant the entire application failed to start before Tomcat ever came up. The fix was changing the algorithm to `HS256`, which is what `Keys.secretKeyFor` is actually designed to produce.

**A missing annotation on `UserRepository` would have caused a separate startup failure.**

`UserRepository` was written without `@Repository`. Without it, Spring has no reason to register the class as a managed bean, which means anything depending on it, including `JwtFilter`, would fail to construct. This was caught and fixed before it caused a visible failure, but it is worth noting that this category of mistake, a missing stereotype annotation, produces no compiler error and only surfaces at runtime when Spring tries to wire dependencies together.

**A missing `await` caused login to silently appear broken.**

`LoginPage.tsx` called `login(email, password)` and checked the return value directly as a boolean. The actual `login` function in `AuthContext` is asynchronous and returns a `Promise<boolean>`. A `Promise` object is truthy regardless of what it eventually resolves to, so the `if` check always evaluated as true immediately, before the real network request had finished. This caused the page to navigate away before the token had actually arrived, which looked from the outside like the form simply doing nothing. The fix was adding `async` to `handleSubmit` and `await` in front of the `login` call, so the function actually waits for the real response before deciding what to do.

**`AppContext` had no way to attach the token to its own requests.**

Once `SecurityConfig` required authentication on `GET /api/books`, the existing fetch call in `AppContext`, which had never needed to send any header at all, began failing with 403 on every load. The fix required `AppContext` to read the token out of `AuthContext` directly and attach it as an `Authorization` header, and to make the fetch depend on the token's presence so it only runs once a real token exists rather than attempting and failing on every initial page load before login has happened.

---

## The actual tradeoff

**What it costs:**

Every request that needs to be authenticated now depends on a token surviving the entire round trip from login to the actual API call. The async bug encountered during this module is a direct symptom of this cost. A frontend that forgets to await a login call, or forgets to attach a token to a fetch call, fails in ways that look like the backend is broken when the backend is working correctly. This is a category of failure that did not exist in Module 8, where every endpoint accepted every request unconditionally.

The in-memory signing key means every server restart invalidates every previously issued token. During active development, this means a token obtained before a restart simply stops working with no specific error indicating why, since from the token holder's perspective the signature check just starts failing.

Two separate enforcement points now exist for the same rule, the URL-level check in `SecurityConfig` and the method-level `@PreAuthorize` on `BookController`. Keeping these in sync is a manual responsibility. Adding a new admin-only endpoint requires remembering to update both, and nothing currently catches a developer who only updates one.

**What it gives:**

The application can now distinguish between requests, which is the actual prerequisite for everything that depends on identity going forward. Module 10's persistence layer will need to know who is making a request in order to eventually support per-user data. None of that is possible without the authentication layer this module establishes.

The stateless design means the server holds no session data anywhere. Restarting the server does not strand any logged-in user in a broken state the way a server-side session store could. The cost of this statelessness is paid entirely by the token itself, which is sufficient for the scale of this project.

The separation between `JwtFilter` and `SecurityConfig`, identification versus authorization, means either piece can change independently. The token format could change entirely and the authorization rules in `SecurityConfig` would not need to change, as long as the filter still ultimately writes a username and role into the security context the same way.

---

## At small scale (one developer, personal project)

I would not build full JWT authentication for an application one person uses on their own machine. A simple shared password check, or no authentication at all behind a private deployment, would be sufficient. The entire threat model JWT and role-based access defend against, multiple distinct users with different permissions interacting with the same data, does not exist when there is only ever one real user.

---

## At medium scale (startup, five to ten engineers, real product)

JWT-based authentication is a reasonable default at this scale, particularly for an API consumed by more than one type of client. The stateless property that makes it attractive here is the same property that makes horizontal scaling straightforward, since any server instance can validate a token without needing access to a shared session store.

Password hashing with BCrypt would be non-negotiable rather than deferred, since real user credentials would be at stake. Refresh tokens would also become necessary at this scale, since forcing a login every ten hours is an acceptable cost during development and an unacceptable cost for a real product's users.

The signing key would need to live somewhere that survives a restart and is shared across every server instance, rather than generated fresh in memory on each boot. A secrets manager or a shared store, which is the direction Module 12 takes with Redis, becomes the correct home for it.

---

## At large scale (hundreds of engineers, millions of users)

Authentication at this scale is typically pulled out of the application entirely and handled by a dedicated identity service or a managed provider, since every service in a large system needs to agree on how to verify identity without each one reimplementing the same logic independently.

An API gateway would handle token validation before a request ever reaches an individual service, the same way the gateway pattern handles cross cutting concerns generally at this scale. Individual services would receive an already authenticated request, with identity and role information attached, and would focus entirely on their own business logic rather than re-validating a token on every single call.

The filter and configuration pattern built in this module, a checkpoint that identifies and a separate rulebook that authorizes, is the same conceptual shape that survives at this scale even though the implementation moves out of any single service and into shared infrastructure.

---

## TLDR

I built JWT-based authentication and role-based authorization for PocketLibrary, including a login endpoint, a token validation filter, and a security configuration that distinguishes between authenticated access and admin-only access. Passwords remain unhashed and users remain in memory, both deliberately deferred to Module 10. Two real bugs surfaced and were fixed during this module, an algorithm mismatch that crashed the server on startup and a missing await that made login appear broken on the frontend. A known limitation carried over from Module 8, local state mutations that never reach the server, remains unresolved and is explicitly scheduled for Module 10 rather than patched here.
