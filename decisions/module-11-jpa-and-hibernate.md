# Module 11: JPA and Hibernate

---

## What the app needs right now

`BookRepository` and `UserRepository` extend `JpaRepository` and Spring generates their implementations at startup. Both work, but neither has a single custom query. The only operations available are the ones `JpaRepository` provides by default: find all, find by id, save, delete by id. There is no way to ask for books that are still in progress, no way to find requests belonging to a specific user, and no way to limit how many rows come back at once. The `Request` workflow was built in Module 6 and never reached the database. Modules 7 through 10 did not change it. Module 11 adds custom queries, pagination, controlled fetch behavior, automatic auditing, and a persisted `Request` entity backed by its own database table.

---

## What I'm not doing yet

- No endpoint for updating a book's `pagesRead` on the backend. The frontend tracks reading progress in local state and the backend never receives it. This gap has been open since Module 8 and remains open.
- No cancel-request capability. A Reader cannot withdraw a pending request. The `Request` status moves from `PENDING` to `ACCEPTED` or `DISMISSED` by Admin action only.
- The JWT signing key is still generated in memory on every server start. Every token issued before a restart becomes invalid immediately after one. Module 12 moves the key to Redis.
- `RequestsPage.tsx`, which would give the Sidebar's `/requests` link a destination, is deferred. The link has been inactive since Module 7 and fixing it requires styling work that belongs in a later module.

---

## The simple path

The simple path for querying is JDBC with hand-written SQL. `JdbcTemplate` is available through the Spring Boot JDBC starter and requires no entity mapping, no relationship management, and no knowledge of how Hibernate generates SQL. A developer writes `SELECT * FROM books WHERE pages_read < total_pages`, hands it to `JdbcTemplate`, and maps the result rows to Java objects manually. Every query is explicit and visible. Nothing is generated.

For a single developer running a small application with two tables, this is a defensible choice. The productivity cost of writing mappers by hand is low when there are only two entities. The gain is that the SQL is exactly what it says it is, with no intermediate translation step.

---

## What I did instead and why

**Request became a persisted entity with its own database table.**

The `Request` workflow was built in Module 6 as frontend-only state inside `AppContext`. A Reader's request existed only in the browser memory of the session that created it. No other logged-in user could see it because nothing was ever sent to the backend, and nothing survived a page refresh. This was a deliberate deferral because the database did not exist until Module 10. Keeping requests in frontend state while books persist in PostgreSQL means two kinds of application data have different lifespans for no structural reason. `Request` now has an entity class, a Liquibase changeset, a repository, a service, and a controller, matching the structure `Book` already has.

**Spring Data JPA's method name parser handles simple lookups without SQL.**

`UserRepository.findByUsername` has been running since Module 9 with no explanation of the mechanism behind it. At startup, Spring reads every method name declared on a repository interface, strips the `findBy` prefix, and maps what remains to fields on the entity the repository manages. `Username` maps to the `username` field on `User`, producing a `WHERE username = ?` query with the method's parameter bound to the placeholder. `RequestRepository.findByRequestedBy` works the same way, except that `requestedBy` is a relationship rather than a scalar column. Spring compares the primary key of the `User` object passed as a parameter against the `requested_by` foreign key in the `requests` table.

**JPQL via `@Query` for comparisons the name parser cannot express.**

A derived method name can compare a field against a parameter. It cannot compare two fields on the same row against each other. `findBooksInProgress` needs rows where `pagesRead` is less than `totalPages`, both columns on `books`. There is no method name that expresses this because the name parser has no syntax for a two-column comparison. `@Query("SELECT b FROM Book b WHERE b.pagesRead < b.totalPages")` expresses it in JPQL, which is written against entity field names rather than column names, with Hibernate handling the translation to SQL at runtime. The choice between a derived name and `@Query` follows from what the name parser can represent, not from style.

**FetchType.LAZY set explicitly on every @ManyToOne relationship.**

JPA's default fetch type for `@ManyToOne` is `EAGER`. With `EAGER` on `Book.user`, fetching any list of books triggers one additional query per book to load its owner, whether or not the response ever uses that data. With eight books in the current database that is nine queries where one would do. `FetchType.LAZY` defers the load until code actually calls `getUser()` on a specific book instance. Leaving a lazy relationship unaddressed causes Jackson to serialize Hibernate's internal proxy object, which adds a `hibernateLazyInitializer` key to the JSON output. `@JsonIgnore` on `Book.user` removes the field from serialization. A list endpoint that never reads owner data has no reason to serialize it.

**JOIN FETCH on the admin's request queue to prevent N+1.**

The admin's pending queue needs the requesting user's username for every row it returns. With lazy loading, accessing that username after the initial fetch would trigger one additional query per row. For a queue of 20 pending requests that is 21 queries where one would do. `findByStatusWithRequester` uses `JOIN FETCH r.requestedBy` in its `@Query` to pull the `User` in the same SQL statement as the `Request` rows. This pattern is safe when the fetched relationship is a single object. `JOIN FETCH` on a collection relationship combined with `Pageable` causes Hibernate to apply pagination in memory rather than in the database, loading every matching row before slicing, which defeats the purpose of pagination. That problem does not apply here because `requestedBy` is a single `User` per `Request`.

**Pagination with Pageable and Page<T>.**

`JpaRepository` already inherits `findAll(Pageable)` from `PagingAndSortingRepository`. Adding pagination to the books list required changing `BookController.getAllBooks` to accept `page` and `size` as request parameters, construct a `PageRequest`, and return `Page<Book>` instead of `List<Book>`. A bare list gives the frontend no way to know whether more pages exist, so a pagination control cannot be built without total count information. `Page<Book>` carries `totalElements` and `totalPages` alongside the current slice. The response shape change broke the existing frontend. `GET /api/books` no longer returns a JSON array. It returns an object with a `content` array alongside that metadata. `AppContext`'s `setBooks(data)` became `setBooks(data.content)` to account for this.

**RequestSummary DTO to control the response shape.**

The raw `Request` entity carries a `@ManyToOne` relationship to `User`. Serializing it directly produces a nested `User` object in every response. Even with `@JsonIgnore` on `User.password`, the nested object still carries `id`, `username`, and `role`, none of which belong in a response that only needs to identify who made a request by name. `RequestSummary` is a plain class with no JPA annotations, holding only the fields a consumer needs: `id`, `title`, `author`, `coverId`, `totalPages`, `status`, and `requestedByUsername` as a plain `String`. The mapping from `Request` to `RequestSummary` happens in `RequestService.toSummary()`, where `request.getRequestedBy().getUsername()` triggers the lazy load that `JOIN FETCH` already resolved in the repository query. The call costs nothing extra at that point.

**@CreatedDate and @EnableJpaAuditing for automatic timestamps.**

`@CreatedDate` on a `LocalDateTime` field marks it for automatic population by Hibernate the first time a row is saved. `@EntityListeners(AuditingEntityListener.class)` on the entity class registers the listener that performs that population. `@EnableJpaAuditing` on `ServerApplication.java` turns the auditing feature on at the application level. Without it, `@CreatedDate` and `AuditingEntityListener` are wired correctly on the entity but do nothing. `005-add-created-at-to-books.yaml` re-adds the `created_at` column to the `books` table with `defaultValueComputed: NOW()` so that existing rows receive a timestamp rather than `NULL`. Rows added before that migration ran share the migration's own execution timestamp rather than their individual insertion times.

---

## The actual tradeoff

**What it costs:**

PocketLibrary has one Admin and two Readers. It has fewer than twenty books. None of the patterns in this module solve a problem that exists at this scale. Pagination, JOIN FETCH, DTO projection, and named JPQL queries add files, layers, and surface area to an application where a single `findAll()` call returning a bare list would work correctly and completely for the foreseeable future. The cost is complexity introduced ahead of any demand for it.

Within that complexity, three specific failure modes appeared that would not exist with the simpler path. A method that loads a list and then calls a relationship getter on every element triggers one query per element even with `FetchType.LAZY`, because `LAZY` defers the load rather than preventing it. `JOIN FETCH` is the fix, but it has to be written deliberately for each query that needs it. Nothing in the compiler or the framework warns when N+1 appears in new code. Changing `BookController.getAllBooks` from `List<Book>` to `Page<Book>` broke the existing frontend `setBooks(data)` call without a compiler error. The frontend loaded. The books list stopped rendering because `data` was no longer an array. The type was `any` at the point of consumption, which meant TypeScript had nothing to catch. Every field on `RequestSummary` has to be kept manually in sync with the fields the frontend TypeScript type expects. A field renamed on the Java side produces no error on the TypeScript side and arrives as `undefined` at runtime.

**What it gives:**

The repository layer now expresses queries as named operations tied to the domain rather than generic fetch calls. `findBooksInProgress` is readable as intent. A developer reading `BookRepository` understands what kinds of questions the application asks about books without tracing through the controller or the service.

The admin's pending queue arrives as a single SQL statement regardless of how many rows it returns, because the join strategy was chosen at the query level rather than discovered after the fact by observing slow load times.

Pagination means the books list will not degrade as the library grows. A query returning page 0 with size 10 transfers a bounded amount of data over the wire regardless of the total table size. Returning all rows unconditionally transfers an amount that grows linearly with every row added to the table.

---

## At small scale (one developer, personal project)

A personal tracker with one user and a small number of books does not need pagination, custom queries, or a formal ORM. JDBC with hand-written SQL and a simple row mapper is sufficient. There is no N+1 problem to solve when there are no relationships worth joining across a meaningful number of rows. The additional surface area of entity classes, repository interfaces, JPQL, fetch type configuration, and DTO mapping adds overhead without addressing a problem that exists at this scale.

---

## At medium scale (startup, five to ten engineers, a live product)

At this scale, N+1, unbounded list responses, and leaky entity serialization tend to appear together as the first wave of performance problems after launch. A list endpoint that performs adequately with 20 rows in development can issue 201 queries against a table with 200 rows in production. The application logs do not surface this clearly unless Hibernate SQL logging is enabled explicitly and someone is actively reading the output. Setting `spring.jpa.show-sql=true` and `logging.level.org.hibernate.SQL=DEBUG` during development catches this pattern before it reaches a deployed environment. Production teams typically add connection pool monitoring with query count thresholds instead of relying on log inspection.

Pagination becomes necessary before the table reaches a size where the delay is noticeable to users. A response time target on a list endpoint cannot be maintained if the endpoint returns a number of rows that grows with the total table size.

DTO projections become more important as the API surface area expands. Returning full entity graphs on read-heavy endpoints sends more data than consumers need and couples external response contracts to internal schema decisions that should be free to change independently.

---

## At large scale (hundreds of engineers, millions of users)

Spring Data JPA's generated queries become a constraint at significant read scale. The generated SQL is correct but not always what the database's query planner would execute most efficiently. Teams cannot tune it without abandoning the derived method pattern. Many large Java teams route complex query paths through QueryDSL or jOOQ, which allow type-safe SQL construction with full control over the generated statement. Spring Data repositories remain in place for simple CRUD operations while the query-intensive paths bypass the ORM.

A single PostgreSQL write primary becomes a bottleneck before the application logic does. Read replicas absorb the dominant read traffic. `@Transactional(readOnly = true)` on service methods signals to Spring that a query can be routed to a replica rather than the primary, though whether that routing actually occurs depends on the datasource and connection pool configuration rather than the annotation alone.

Application-level auditing with `@EnableJpaAuditing` populates timestamps only when writes go through the Spring application. At large scale this is insufficient because data enters the database through migration scripts, bulk imports, and other services that bypass the application entirely. Teams at this scale move timestamp population to database triggers or a Change Data Capture tool such as Debezium, which fires regardless of how or where the write originated. The `created_at` and `updated_at` columns produced by those systems then drive cache invalidation logic and event sourcing pipelines rather than serving only as display metadata.

---

## TLDR

I added custom queries to `BookRepository` and `RequestRepository` using derived method names and `@Query` with JPQL. I set `FetchType.LAZY` explicitly on all `@ManyToOne` relationships and used `JOIN FETCH` on the admin's request queue to prevent N+1. I added pagination to the books list endpoint, which required a breaking change to the frontend's response handling. `Request` became a persisted entity replacing the frontend-only state it had lived in since Module 6. `RequestSummary` is a DTO that controls what the request endpoints serialize. `@CreatedDate` and `@EnableJpaAuditing` add automatic creation timestamps to both `Book` and `Request`.
