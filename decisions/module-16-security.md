# Module 16: Security

---

## What the app needs right now

PocketLibrary had one security layer: JWT authentication. A caller with a valid token could send any value in any field, and the application accepted it without inspection. Field values arrived from callers with no constraints on what they could contain. HTTP responses carried no headers instructing the browser to enforce security policies. The codebase had no documented position on any OWASP Top 10 category.

Module 16 adds input validation at the API boundary, five security response headers, and a complete OWASP Top 10 audit against the existing code.

---

## What I'm not doing yet

The following are accepted gaps with no scheduled fix across the remaining modules. They are documented here rather than deferred because addressing them would require product decisions, infrastructure changes, or ongoing operational work that falls outside the scope of a single module.

- No rate limiting on the login endpoint. A bot can attempt an unlimited number of password combinations against any account. This is documented as an open gap under the OWASP "Identification and Authentication Failures" category.
- No account lockout after repeated failed login attempts. This compounds the rate limiting gap.
- No password strength enforcement at registration. Users can register with a single-character password.
- No alerting on security-relevant log events. CloudWatch captures logs but no threshold alert exists for failed login spikes or repeated 401 responses.

The following item is deferred, not abandoned. The fix is planned but requires a backend architectural change that is out of scope for this module.

- The SSE endpoint still passes its token as a query parameter, exposing it in Nginx access logs. A ticket-based alternative was documented in Module 12: a short-lived single-use Redis key is issued in exchange for the bearer token, and the SSE connection presents that key instead. This remains open from Module 12 and is scheduled for post-deployment remediation.

---

## The simple path

The application could continue accepting raw `Book` entity objects at the `POST /api/books` endpoint. With one Admin and a small, stable book list, no malformed input has ever caused a visible problem. `totalPages = -500` would write to RDS and display incorrectly in the UI, but no user would be harmed at this scale.

Security headers could remain absent. Browsers do not require them. PocketLibrary has no history of XSS attacks, clickjacking attempts, or MIME-type confusion errors. Adding them costs nothing at runtime but adds configuration surface area to `SecurityConfig`.

---

## What I did instead and why

**`BookRequest.java` replaces `Book` as the `@RequestBody` parameter in `BookController.addBook`.**

Placing constraint annotations directly on the `Book` entity would affect every path through which a `Book` object is created, including internal service calls, test fixtures, and database seeds. A `@Min(1)` on `Book.totalPages` would cause any internal code that constructs a `Book` with a zero page count to fail validation. `BookRequest` exists only at the API boundary. Its fields are the only fields a caller is permitted to supply: `title`, `author`, `totalPages`, and `coverId`. `pagesRead` is set to zero internally in `BookController.addBook` regardless of what the caller sends, because a book added to the tracker has zero pages read by definition.

**`@NotBlank` and `@Size` are the only constraints on string fields.**

`@NotBlank` rejects null, empty strings, and strings containing only whitespace. `@Size(min = 1, max = 255)` enforces an upper bound that matches the column width in PostgreSQL. No `@Pattern` constraint restricts which characters are permitted in `title` or `author`. A pattern constraint built to exclude HTML characters would reject titles containing ampersands, angle brackets used in technical book titles, or non-Latin characters in author names. The XSS risk from stored content is addressed at the rendering layer by React's JSX encoding, not at the storage layer by character restriction.

**`@Min(1)` on `totalPages` enforces a floor that the domain requires.**

A book with zero or fewer pages cannot exist. This is not a security constraint; it is a domain constraint. `@Min(1)` expresses that directly on the field rather than encoding it as conditional logic in `BookService`.

**`spring-boot-starter-validation` provides the `jakarta.validation` annotations.**

The dependency pulls in Hibernate Validator as the implementation. Without it, every annotation in `BookRequest` is present in the compiled class but is never read at runtime. `@Valid` on the `BookController.addBook` parameter triggers Hibernate Validator to inspect `BookRequest`'s fields against their constraints before the method body runs. A constraint failure produces a 400 response from Spring's `MethodArgumentNotValidException` handler before execution reaches `BookService`.

**Five security headers are added to every HTTP response via a single `.headers()` block in `SecurityConfig`.**

`Content-Security-Policy: default-src 'self'` instructs the browser to refuse scripts, styles, and other resources that originate from any domain other than `pocklib.site`. This is a browser-enforced layer of XSS defense that operates independently of whether the application's own code encodes output correctly.

`X-Content-Type-Options: nosniff` instructs the browser to treat the `Content-Type` header as authoritative and not attempt to infer the content type from the response body. Without this header, a browser that receives a JavaScript file labeled as an image may execute it as a script. Spring Boot sets `Content-Type` correctly on every response, so enforcing `nosniff` introduces no risk of legitimate content being mishandled.

`X-Frame-Options: DENY` instructs the browser to refuse to render this page inside an `iframe` on any other domain. PocketLibrary has no feature that requires embedding its pages in another site's frame, so `DENY` is the correct value. This closes the clickjacking attack surface entirely.

`Referrer-Policy: no-referrer` instructs the browser to omit the `Referer` request header on every outbound navigation. PocketLibrary's internal URLs may contain query parameters carrying user-specific identifiers. Sending those to third-party domains as referrer data is unintended information disclosure.

`Strict-Transport-Security: max-age=31536000; includeSubDomains` instructs the browser to communicate with `pocklib.site` and all of its subdomains exclusively over HTTPS for one year from the time the header is received. After the first successful HTTPS response, the browser will not send a plain HTTP request to this domain for the duration of the `max-age` period. This closes the SSL stripping attack window that exists between a user typing an HTTP URL and the server's first redirect to HTTPS.

**CSRF protection remains disabled.**

`SecurityConfig` has disabled CSRF protection since Module 9. CSRF attacks exploit the browser's automatic attachment of session cookies to cross-origin requests. PocketLibrary authenticates via a JWT carried in the `Authorization` header. The browser does not attach `Authorization` headers automatically. A cross-site request arriving at the API carries no token and receives a 401 from `JwtFilter` before reaching any controller. Disabling CSRF protection is correct for a stateless token-based authentication model and would only become incorrect if the application were changed to use session cookies.

**TLS terminates at Nginx on EC2.**

Spring Boot receives plain HTTP on port 8080. Nginx handles the TLS handshake, decrypts the incoming request, and forwards it to the application. The unencrypted segment between Nginx and Spring Boot never leaves the EC2 instance, which means it is not exposed to any network path an attacker could reach. ACM manages the certificate for `api.pocklib.site`. The `Strict-Transport-Security` header in the response adds an application-layer enforcement of the HTTPS requirement on top of the infrastructure-layer enforcement that Nginx and ACM already provide.

---

## OWASP Top 10 audit

| Category | Status | Evidence |
|---|---|---|
| Broken Access Control | Mitigated | `@PreAuthorize("hasRole('ADMIN')")` on `POST /api/books` and `DELETE /api/books/**`; `SecurityConfig` enforces the same rules at the filter chain level |
| Cryptographic Failures | Mitigated | BCrypt hashes passwords; JWTs are HMAC-signed with a key persisted in Redis; all traffic travels over HTTPS |
| Injection | Mitigated | JPA generates parameterized queries for all derived methods; the one custom `@Query` in `BookRepository.findBooksInProgress` contains no user-supplied input |
| Insecure Design | Gap | No rate limiting on the login endpoint; no account lockout; no password strength enforcement at registration |
| Security Misconfiguration | Mitigated | Five security headers added in this module; no debug endpoints exposed; no default credentials in use |
| Vulnerable and Outdated Components | Low risk | All dependencies managed through the Spring Boot 4.0.6 BOM; no dependency with a known published CVE at the time of this module |
| Identification and Authentication Failures | Gap | No account lockout after failed login attempts; no password strength enforcement; tokens expire after ten hours with no refresh mechanism |
| Software and Data Integrity Failures | Low risk | No external CDN scripts in the React build; all backend dependencies sourced from Maven Central through the BOM |
| Security Logging and Monitoring Failures | Gap | CloudWatch captures application logs but no alert is configured for failed login spikes or repeated 401 responses |
| Server-Side Request Forgery | Not applicable | No endpoint accepts a URL from a caller and issues a server-side HTTP request against it |

---

## The actual tradeoff

PocketLibrary has one Admin and a small number of known Readers. No anonymous public has access to the API. The threat model that motivated every decision in this module (malicious callers submitting crafted input, attackers injecting scripts into a shared book list, browsers being tricked into executing unauthorized code) does not apply to this application at its current scale. Every security measure added here is architecture built ahead of any demand for it.

**What it costs:**

`BookRequest` adds a file that must stay synchronized with `Book` as the domain evolves. Every future field change requires updating `BookRequest`, `BookController.addBook`, and the tests that exercise that endpoint. Updating three files for every field change is a disproportionate cost for a codebase of this size.

The five security headers apply a browser security contract to an application that has no anonymous users and no public attack surface. They cost nothing at runtime but add configuration that must be understood by anyone who modifies `SecurityConfig` in future.

**What it gives:**

A book tracker with two roles now has the same input boundary architecture as a public API. The separation between `BookRequest` and `Book` means a caller cannot set fields on the entity that the developer did not explicitly expose. This boundary does not solve a problem that exists today; it prevents a class of problem from appearing as the application grows or changes hands.

The security headers establish a documented, reviewable browser security contract. A reviewer reading `SecurityConfig` can verify the application's security posture without running it. The OWASP audit table gives any future contributor a baseline assessment of where the application stands against the industry's standard vulnerability checklist.

---

## At small scale (one developer, personal project deployed to users)

At this scale, input validation typically lives directly on the controller or the entity, if it exists at all. A dedicated boundary DTO like `BookRequest` is uncommon in solo projects because the overhead of maintaining two parallel representations of the same data is immediately visible and there is no second developer to protect against accidental mass assignment. Validation constraints on the entity itself are the more common choice, with the understanding that they affect internal code paths as well as API calls.

Security headers at this scale are rarely configured by default. Platform-as-a-service deployments on Railway or Render do not add security headers automatically. A developer who checks their headers against securityheaders.com will typically find a failing grade on a freshly deployed application with no additional configuration.

---

## At medium scale (startup, five to ten engineers, a live product)

At this scale, the DTO boundary pattern becomes a team convention rather than an individual choice. Validation logic that lives on the entity produces subtle bugs when internal code needs to construct objects that would fail the user-facing constraints, and those bugs are harder to catch when multiple engineers are writing to the same class. Teams typically establish the DTO boundary during an early architecture review and enforce it through code review rather than tooling.

Security headers at this scale are commonly moved to the infrastructure layer. An API gateway or reverse proxy such as Nginx, Caddy, or AWS API Gateway applies headers to every response from every service in a single configuration block, which removes the per-service configuration burden and prevents inconsistency when a new service is added. An application-level header block remains correct but becomes a candidate for removal once a gateway is in place, because duplicate headers from both layers can produce inconsistent browser behavior.

---

## At large scale (hundreds of engineers, millions of users)

At this scale, input validation is enforced by a combination of API schema validation at the gateway layer and static analysis tooling in the build pipeline. Tools such as SpotBugs with the Find Security Bugs plugin or custom Checkstyle rules can flag controller methods that accept raw JPA entities as request bodies and fail the build before the code is reviewed. The application-level `@Valid` annotation is still present, but the surrounding toolchain means it is checked mechanically rather than by individual engineers during review.

Security headers are owned by a dedicated platform security team and applied through a centralized proxy configuration. Individual services do not configure headers. A service that attempts to set its own headers risks producing duplicate values that browsers resolve inconsistently across implementations. The platform team also runs automated scans against deployed services and files tickets when headers are missing or misconfigured.

OWASP gaps at this scale are tracked in a security backlog with assigned owners and SLA deadlines. Unmitigated gaps do not persist indefinitely without a documented decision to accept the risk, and that acceptance decision requires sign-off from a security lead rather than the individual engineer who wrote the code.

---

## TLDR

I added a validated boundary DTO at the book creation endpoint and five security response headers to `SecurityConfig`. The OWASP Top 10 audit found seven categories mitigated by existing architecture and three open gaps (rate limiting, account lockout, and security alerting) with no scheduled fix.
