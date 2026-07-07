# Module 12: Redis

---

## What the app needs right now

`JwtService` generates a new `HS256` signing key on every JVM start. `parseClaimsJws` compares a token's signature against the key that signed it. After a restart, that key is gone. Every token issued before the restart fails verification. `AuthContext.logout()` clears React state and nothing else. A token that was valid five seconds before logout stays valid for up to ten hours against the backend, because the server has no record that logout happened. `GET /api/books` hits PostgreSQL on every request regardless of whether the book list has changed since the last call. When the cached key expires and many requests arrive simultaneously, all of them fall through to the database without coordination.

Module 12 moves the signing key into Redis, adds a cache-aside layer in front of `GET /api/books`, blacklists tokens on logout using a Redis Set, and introduces Pub/Sub so a Reader receives a live notification when an Admin accepts their request.

---

## What I'm not doing yet

- No token refresh mechanism. A token expires after ten hours and the user must log in again. This remains open from Module 9.
- The SSE endpoint passes the token as a query parameter because `EventSource` does not support custom headers in browsers. This exposes the token in server logs. A ticket-based alternative is deferred to post-deployment.
- `RequestsPage.tsx` and the dead Sidebar link remain open from Module 11.
- No cancel-request capability for Readers.
- No endpoint for updating a book's `pagesRead` on the backend.

---

## The simple path

The signing key could stay in memory permanently. For a development environment where the server rarely restarts and sessions are short, the only observable effect of a restart-induced key change is needing to log in again, which most developers do habitually anyway.

`GET /api/books` could continue hitting PostgreSQL on every request indefinitely. With nine books in the database and one or two concurrent users, no query takes long enough for the absence of caching to be measurable.

Logout could remain a frontend-only action. Clearing React state ends the session for any normal user. A token sitting in browser memory becomes inaccessible the moment the page closes.

Pub/Sub could be skipped entirely. A Reader who wants to know whether their request was accepted can refresh the page.

None of these gaps cause a user-visible problem at PocketLibrary's actual scale. Every Redis pattern in this module solves a problem that does not exist yet.

---

## What I did instead and why

**Redis is wired in as a separate server process.**

`spring-boot-starter-data-redis` added to `pom.xml` gives Spring Boot access to the Redis client library. `application.properties` points the connection at `localhost:6379`. `RedisConfig.java` declares a `RedisTemplate<String, String>` bean with `StringRedisSerializer` on both keys and values. The eviction policy is set to `allkeys-lru` so that when Redis runs out of allocated memory, it evicts the key that has gone the longest without being read. The signing key is touched on every authenticated request, making it the least likely candidate for eviction under this policy. `ObjectMapper` is declared as a bean in `RedisConfig` rather than instantiated inline. `BookService` and any future service that needs serialization share one configured instance.

**The JWT signing key is persisted across restarts.**

`JwtService` previously declared `private final Key secretKey = Keys.secretKeyFor(SignatureAlgorithm.HS256)` as a field initializer, generating a fresh key on every JVM start. The field is now assigned in the constructor by `loadOrGenerateKey()`, which checks Redis for an existing key under `jwt:signing-key` before generating one. If the key exists, it decodes the stored Base64 string back into a `Key` object using `Keys.hmacShaKeyFor`. If it does not exist, it generates a new key, encodes it as Base64, and stores it in Redis with no TTL. The stored value has no TTL. Expiring it would silently invalidate every active token immediately.

**`GET /api/books` uses cache-aside with TTL and invalidation.**

`BookService.getAllBooks` checks Redis for `books:cache` before calling `bookRepository.findAll`. On a cache hit, it deserializes the stored JSON back into a `List<Book>` using `ObjectMapper.readValue` with a `TypeReference`, wraps it in a `PageImpl`, and returns it without touching PostgreSQL. On a miss, it queries PostgreSQL, serializes the result using `objectMapper.writeValueAsString(books.getContent())`, and stores it under `books:cache` with a five-minute TTL. `addBook`, `deleteBook`, and `RequestService.acceptRequest` each call `redisTemplate.delete("books:cache")` immediately after writing to PostgreSQL. Spring Boot 4 ships `tools.jackson` internally. It handles `LocalDateTime` fields on `Book` without an additional module.

**SETNX prevents a cache stampede on expiry.**

When `books:cache` expires, the first thread to detect the miss calls `redisTemplate.opsForValue().setIfAbsent("books:lock", "locked", 10, TimeUnit.SECONDS)`. This is SETNX. Only one thread gets a return value of `true`. That thread queries PostgreSQL, populates the cache, and deletes the lock inside a `finally` block so the lock is released even if the query fails. Every other thread gets `false` and falls back to querying PostgreSQL directly. The ten-second TTL on the lock prevents a permanent deadlock if the winning thread crashes before the `finally` block runs. At PocketLibrary's scale, two or three readers at most would ever hit this simultaneously, so the protection is never exercised in practice.

**Logged-out tokens are blacklisted in a Redis Set.**

`POST /api/auth/logout` reads the token from the `Authorization` header, calls `jwtService.getRemainingExpiry(token)` to calculate the seconds remaining before expiration, adds the token to the Redis Set `jwt:blacklist` using `opsForSet().add`, and sets a TTL on the Set matching that remaining lifetime. Using a Set rather than a plain string key means multiple tokens can share one top-level Redis key. `SISMEMBER` checks are O(1) regardless of how many tokens the Set holds. `JwtFilter` calls `redisTemplate.opsForSet().isMember("jwt:blacklist", token)` before passing any request through. A token present in the Set is rejected with 401 regardless of signature validity or expiration time. `AuthContext.logout()` was updated to call the logout endpoint before clearing React state, so a token in browser memory is invalidated at the server before it disappears from the client.

**Redis Pub/Sub delivers live acceptance notifications to Readers.**

`RequestService.acceptRequest` calls `redisTemplate.convertAndSend("requests:accepted", username + ":" + bookTitle)` after updating the request status and saving the new book. `RedisConfig` declares a `RedisMessageListenerContainer` bean subscribed to the `requests:accepted` channel using a `PatternTopic` and a `MessageListenerAdapter` wrapping `NotificationService`. `NotificationService` implements `MessageListener` and maintains a `ConcurrentHashMap<String, SseEmitter>` keyed by username. When a message arrives, `onMessage` splits the payload on `:`, looks up the emitter for the recipient username, and calls `emitter.send(SseEmitter.event().data(...))`. `RequestController` exposes `GET /api/requests/notifications/stream`, which extracts the username from the token query parameter using `jwtService.extractUsername`, calls `notificationService.register(username)` to create and store a new `SseEmitter`, and returns it. The browser opens this connection after login through a `useEffect` in `AppContext.tsx`. The notification clears from React state after four seconds via `setTimeout`.

The SSE endpoint is whitelisted in `SecurityConfig` with `permitAll()` because `EventSource` cannot send custom headers. The token arrives as a query parameter instead, and the endpoint validates it directly through `JwtService`. This bypasses `JwtFilter` for this one endpoint, which is a deliberate architectural choice documented as a known gap rather than an oversight.

---

## What went wrong during this module

A version conflict appeared when instantiating `com.fasterxml.jackson.databind.ObjectMapper` directly alongside Spring Boot 4's internal `tools.jackson`. The conflict produced empty serialization output rather than an error, which meant `books:cache` stored `""` instead of a JSON list. Declaring `ObjectMapper` as a bean in `RedisConfig` and injecting it into `BookService`'s constructor resolved it by giving the entire application one consistently configured instance.

---

## The actual tradeoff

**What it costs:**

Persisting the signing key in Redis means the application cannot start if Redis is unavailable. Before this module, the application had no dependency on Redis at all. That dependency is the direct price of key persistence across restarts.

Caching `GET /api/books` introduces a five-minute window during which a book written to PostgreSQL through any path other than `BookService` will not appear in the cached response. Choosing application-level cache invalidation, where `BookService` explicitly deletes the key after every write, means any writer that bypasses `BookService` creates a silent staleness gap. That is the price of keeping the cache-aside logic inside the service layer rather than closer to the database.

Storing logged-out tokens in Redis means the blacklist only covers tokens whose remaining lifetime falls within the TTL window. A token with one second left is blacklisted for one second. A token with nine hours left is blacklisted for nine hours. If Redis restarts and loses the blacklist Set before those tokens expire, all of them become valid again. That is the price of using an in-memory store without persistence for security-sensitive state.

Redis Pub/Sub delivers a notification only if the Reader's SSE connection is open at the moment the message is published. Choosing Pub/Sub over a durable message broker means a Reader whose connection dropped at the wrong moment never receives the notification. That is the price of Pub/Sub's simplicity.

**What it gives:**

A server restart no longer invalidates every active token. A Reader mid-session when the server restarts does not need to log in again.

A Reader who logs out cannot have their token used by someone who intercepts it afterward, as long as the remaining lifetime is within the blacklist window.

`GET /api/books` returns cached data on the second and subsequent requests within the five-minute window, avoiding a PostgreSQL round trip on every page load.

A Reader knows their request was accepted without refreshing the page.

---

## At small scale (one developer, personal project)

Redis adds a second running process that must be managed alongside the application and the database. For key persistence, the common alternative is writing the signing key to a local file on startup and reading it back on every subsequent start. SQLite is the standard choice for the database at this scale. It stores the entire database as a single file on disk with no server process to manage.

Caching a list of nine books for one user adds complexity with no measurable benefit. A direct PostgreSQL query at this scale returns fast enough that the cache layer adds nothing.

Short token lifetimes paired with refresh tokens are a simpler alternative to a blacklist at this scale. A stolen token expires quickly enough that blacklisting is not needed, and the process dependency on Redis disappears.

Pub/Sub for a single user has no purpose. The user is both the Reader and the Admin. There is nobody else to notify.

---

## At medium scale (startup, five to ten engineers, a live product)

Redis moves to a dedicated server shared across all application instances. The signing key is consistent across every instance because all of them read from the same Redis process. The blacklist Set is checked against one shared source regardless of which instance handles a given request.

The `allkeys-lru` eviction policy requires a `maxmemory` limit in Redis configuration. Without it, `allkeys-lru` has no threshold to enforce and eviction never fires. Production teams set this limit based on the expected working set size before deploying.

Application-level cache invalidation breaks down when more than one service writes to the `books` table. A service that writes directly through JDBC has no reference to `BookService` and will not call `redisTemplate.delete("books:cache")`. Some teams at this scale move invalidation out of the application layer and into an event-driven pattern, where any write to `books` publishes an event and a dedicated consumer handles cache deletion independently of which service triggered the write.

The SSE token-in-query-parameter approach must be replaced before deploying to a shared environment. Query strings appear in every log aggregation pipeline the request passes through. The ticket-based approach issues a short-lived single-use Redis key in exchange for the bearer token, and the SSE connection presents that ticket instead. The ticket expires after a few seconds, so its appearance in logs carries no long-term risk.

---

## At large scale (hundreds of engineers, millions of users)

A single Redis instance becomes a single point of failure. Redis Sentinel provides automatic failover: one primary handles writes, replicas handle reads, and Sentinel processes promote a replica if the primary goes down. Redis Cluster shards data across multiple primaries for horizontal write scaling, which Sentinel does not provide.

The JWT blacklist Set grows with the number of active sessions and logout events. At high user volume, a Set membership check on every authenticated request becomes a measurable cost. Some teams at this scale move to short-lived tokens without blacklisting, accepting that a logged-out token remains usable until it expires naturally. That is a product decision, not a purely technical one.

Redis Pub/Sub has no delivery guarantee regardless of scale. At high user volume, the volume of missed messages becomes significant enough that teams replace it with Kafka or RabbitMQ. Kafka retains messages on disk for a configurable retention period, so a consumer that was temporarily unavailable can catch up after reconnecting. For a notification system where a missed message has business consequences, this durability matters. For PocketLibrary's notification, a missed message means a toast that never appeared. The Redis Pub/Sub tradeoff is acceptable here.

---

## TLDR

Four Redis patterns: signing key persistence across restarts, book list caching with SETNX stampede protection, JWT blacklist on logout using a Redis Set, and Pub/Sub notifications delivered via SSE. The SSE endpoint passes its token as a query parameter due to a browser limitation with `EventSource`. That is documented as a known gap for post-deployment remediation.
