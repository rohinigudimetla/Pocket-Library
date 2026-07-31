# Module 15: Testing

---

## What the app needs right now

Every module from 13 onward deployed to production with `-DskipTests` in the `mvn package` command inside `backend.yml`. `contextLoads()` in `ServerApplicationTests.java` attempted to start the full Spring `ApplicationContext` on startup, which required live PostgreSQL and Redis connections. Neither exists on a GitHub Actions runner. The test failed on every pipeline run, so skipping tests was the workaround from the moment CI/CD was introduced. The consequence was that PocketLibrary shipped to EC2 on every push with zero automated verification that any of its code was correct.

Module 15 deletes `contextLoads()`, builds a suite of 20 backend tests and 2 frontend tests, removes `-DskipTests` from `backend.yml`, and adds a frontend test step to `frontend.yml`. Every push to `main` now runs the full test suite before producing a deployable artifact.

---

## What I'm not doing yet

- Testcontainers is not included. The backend test suite uses mocks for all PostgreSQL and Redis interactions. A misconfigured bean or a wrong database URL passes every test silently because no test ever opens a connection to the database or to Redis. Testcontainers would spin up PostgreSQL and Redis containers per test run and catch that category of failure.
- Contract testing is not included. The frontend and backend share an implicit API contract that is only verified by running both together. A change to `BookController`'s response shape that breaks `AppContext.tsx` parsing is not caught by any test in this suite.
- Load testing is not included. No test in this suite verifies what happens to `GET /api/books` under concurrent cache misses, or whether the distributed lock in `BookService.getAllBooks` holds correctly under parallel requests.
- No endpoint for updating a book's `pagesRead` exists on the backend. This remains open from Module 10.
- No token refresh mechanism exists. This remains open from Module 9.
- The SSE endpoint still passes the token as a query parameter. This remains open from Module 12.

---

## The simple path

`contextLoads()` could have been fixed by adding `@TestPropertySource` with fake database and Redis addresses so the `ApplicationContext` could start on the runner without live infrastructure. The test would have passed with an empty body, proving only that Spring could start. That is not a test worth keeping, and fixing it would have cost several hours of debugging Spring Boot 4's auto-configuration behavior while adding no behavioral coverage. Deleting it was the correct decision.

For the service layer, Mockito unit tests could have been skipped entirely and the gap deferred to post-deployment. The same applies to `BookControllerTest`. Both choices would have left the codebase in the same state as Modules 13 and 14: a pipeline that says BUILD SUCCESS while verifying nothing.

---

## What I did instead and why

**I deleted `ServerApplicationTests.java` and removed `-DskipTests` from `backend.yml`.**

`contextLoads()` tested that Spring could start. Spring failing to start produces a loud, immediate error at deployment time. The test added no safety net that deployment itself did not already provide. Deleting it produced a clean baseline: `mvn test` passing with zero tests and zero failures, which is the correct starting state before adding tests that verify behavior.

**`JwtServiceTest` mocks `RedisTemplate` and tests five methods in isolation.**

`JwtService` has one constructor dependency: `RedisTemplate<String, String>`. Its constructor calls `loadOrGenerateKey()` immediately on construction, so the `RedisTemplate` stub must exist before the service is constructed. `@BeforeEach` registers the stubs and then constructs `JwtService` manually, which causes `loadOrGenerateKey()` to generate an in-memory key without opening a Redis connection. The five tests cover `generateToken()`, `isTokenValid()` on a valid token, `isTokenValid()` on a malformed string, `extractUsername()`, and `extractRole()`.

**`BookServiceTest` mocks three dependencies and tests five behaviors including cache paths.**

`BookService` takes `BookRepository`, `RedisTemplate`, and `ObjectMapper` through its constructor. Each test stubs only the dependencies it exercises, keeping stubs scoped to the behavior under test. The cache hit test verifies that when `valueOperations.get("books:cache")` returns a non-null string, `bookRepository.findAll()` is never called. The cache miss test verifies that when it returns `null`, `bookRepository.findAll()` is called and the result is returned. The `addBook` test verifies cache invalidation via `verify(redisTemplate).delete("books:cache")`. The two `deleteBook` tests verify that the `existsById` check gates the `deleteById` call.

**`AuthServiceTest` constructs a `BCryptPasswordEncoder` instance instead of mocking it.**

`AuthService` creates its own `BCryptPasswordEncoder` inside its constructor with `new BCryptPasswordEncoder()`. Because the encoder is not injected through a constructor parameter, there is no seam for Mockito to substitute a mock. The test creates its own `BCryptPasswordEncoder` instance, uses it to hash a known password, sets the hash on a `User` object returned by the mocked `UserRepository`, and passes the raw password into `authService.login()`. The `BCryptPasswordEncoder` inside `AuthService` hashes the same raw password and the `matches()` call succeeds. Three tests cover the happy path returning a token, the wrong password returning `Optional.empty()`, and a missing username returning `Optional.empty()`. In both failure cases, `jwtService.generateToken()` is never called.

**`BookControllerTest` uses `@WebMvcTest` with the security filter chain running.**

`@WebMvcTest` loads the web layer without a database or Redis connection. Because `SecurityConfig` depends on Spring Security beans that `@WebMvcTest` does not create by default in Spring Boot 4, those auto-configuration classes are declared explicitly via `@ImportAutoConfiguration`. `JwtFilter` runs against a mocked `JwtService` and a mocked `RedisTemplate`, so the filter processes each request through the same token validation and role extraction logic that runs in production. `SecurityConfig`'s rules fire against the authentication objects the filter produces. Seven tests cover the 401, 200, 403, 201, 403, 204, and 404 response codes across the relevant token and role combinations.

**`SecurityConfig` declares explicit failure behavior for unauthenticated requests.**

The HTTP specification distinguishes 401 (no identity established) from 403 (identity established but access denied). A `SecurityConfig` that does not declare an `AuthenticationEntryPoint` relies on Spring Security's default, which returns 403 for all rejected requests regardless of whether authentication was attempted. Declaring an explicit `AuthenticationEntryPoint` that calls `response.sendError(HttpServletResponse.SC_UNAUTHORIZED)` makes the security contract explicit in the configuration rather than relying on framework defaults. The decision is to own the failure response behavior in `SecurityConfig` rather than inherit it.

**`@EnableJpaAuditing` is moved to a dedicated `AuditingConfig` configuration class.**

Placing `@EnableJpaAuditing` on `ServerApplication` couples the auditing concern to the application entry point. Any test that loads a partial Spring context must either accept the full JPA auditing infrastructure or suppress it indirectly. Moving the annotation to `AuditingConfig.java` separates the auditing concern into its own configuration unit. A slice test that does not need auditing simply does not import `AuditingConfig`. A test that does need it imports it explicitly. This is the same separation-of-concerns principle that places `SecurityConfig` in its own class rather than on `ServerApplication`.

**`ProtectedRoute.test.tsx` tests two behaviors with a mocked `AuthContext`.**

`ProtectedRoute` reads `currentUser` from `AuthContext` and redirects to `/login` if it is null. The two tests supply a mock `AuthContext.Provider` directly rather than running the full login flow. The first test passes `currentUser: null` and asserts that `screen.getByText('Login Page')` is present. The second passes a populated user object and asserts that `screen.getByText('Protected Content')` is present. Both tests wrap the component in a `MemoryRouter` with explicit routes for `/dashboard` and `/login`, because `ProtectedRoute` uses React Router's `Navigate` component internally, which requires a router in the tree to function.

---

## The actual tradeoff

**What it costs:**

PocketLibrary has one developer and a small, stable set of classes. The failure modes that most frequently affect a solo deployment are a wrong environment variable, a misconfigured Redis connection, or a deployment step that ran in the wrong order. The 22 tests in this module catch none of those. A misconfigured `REDIS_CLUSTER_NODES` value passes every test silently because no test opens a connection to Redis. The test suite verifies code logic while leaving the failure modes that most frequently affect a solo-developer deployment undetected.

Maintaining 22 tests on a project where requirements still change has a cost. Any code change that touches a tested class requires updating the corresponding test stubs and assertions before the pipeline passes again. For one developer, that maintenance competes directly with building the remaining modules.

**What it gives:**

Every push to `main` now runs the service, controller, and frontend route tests before producing a deployable artifact. Each of those behaviors was previously verified only by manual testing after deployment.

Writing the test suite exposed two architectural gaps in the existing code. `SecurityConfig` did not own its failure response behavior, delegating it implicitly to Spring Security's default. `@EnableJpaAuditing` was coupled to the application entry point, making it impossible to write a web layer slice test without pulling in the JPA auditing infrastructure. Both gaps are architectural decisions that testing made visible: the first about who owns the security contract, the second about whether configuration concerns belong on `ServerApplication` or in their own classes.

---

## At small scale (one developer, personal project)

A personal project with one developer and no production users does not need a test suite before deployment. The value of automated tests increases with team size and deployment frequency. At this scale, maintaining a test suite in lockstep with every code change costs more than it saves.

---

## At medium scale (startup, five to ten engineers, a live product)

A team at this size runs unit tests and integration tests as a minimum. Unit tests with mocked dependencies cover the service and controller layers and run on every push. Integration tests spin up the database and cache in Docker containers and verify that the application configuration, migrations, and queries work against infrastructure that matches the deployed environment. The pipeline blocks deployment if either category fails. Test authorship at this size is usually informal: the developer who writes a feature writes its tests.

---

## At large scale (hundreds of engineers, millions of users)

At this scale, a platform or developer experience team owns the test infrastructure. Unit and integration tests run per service. Contract tests verify that the API responses one service produces match what dependent services expect. Load tests run against staging environments to verify that the system holds under concurrent traffic. Individual feature teams own the tests for their own services. Spinning up containers per test run does not hold across hundreds of services, so test infrastructure at this scale typically moves to dedicated ephemeral environments or service virtualization tools.

---

## TLDR

I replaced `-DskipTests` with a suite of 22 tests covering the service layer, controller layer, and frontend route guard. Every push to `main` now runs the full test suite before building or deploying anything.
