# Module 08: Spring Boot

---

## What the app needs right now

PocketLibrary at Module 8 has a complete frontend. Books and requests live in React state inside `AppContext`. Every time the page refreshes, all data resets. There is no server. There is no persistence. The frontend is talking to itself.

Module 8 introduces a real backend. A Spring Boot server runs independently of the browser, listens on port 8080, and serves book data over HTTP. The frontend fetches from it instead of reading from a hardcoded array. The data still resets when the server restarts persistence comes in Module 10 but the client-server architecture is established and working.

---

## What I'm not doing yet

- No database: books live in a Java `List` in memory. The server restarts and the list resets to the two hardcoded books. PostgreSQL replaces this in Module 10.
- No authentication on the backend: every endpoint is publicly accessible. Any request to `GET /api/books` returns data regardless of who is asking. Spring Security and JWT come in Module 9.
- No server-side request handling: the requests workflow Reader requests, Admin accepts, dismisses still lives entirely in frontend state. It moves to the backend in Module 10 when the database schema is built.
- No error handling beyond basic catch blocks: the frontend logs errors to the console but does not surface them to the user. Proper error states come later.
- No input validation on the server: the POST endpoint accepts any JSON body without checking whether the fields are valid. Bean validation with `@Valid` comes in Module 9.

---

## The simple path

For a personal book tracker with one developer, the simple path is to keep everything in frontend state indefinitely. Local state works. It is fast to build and easy to reason about. The data resets on refresh but for a personal app that one person uses, that is a minor inconvenience, not a product problem.

Adding a backend for a project at this scale is unnecessary. The complexity it introduces two running processes, HTTP across ports, CORS configuration, JSON serialization solves a problem that does not yet exist.

---

## What I did instead and why

**Spring Boot was chosen as the backend framework.**

Spring Boot is a Java framework that removes the boilerplate of setting up a Java web server. Without it, handling a single HTTP endpoint in raw Java requires manually creating a server socket, binding to a port, reading raw bytes from the connection, parsing the HTTP request line, routing by method and path, writing response headers, serializing the response body, and closing the stream. For one endpoint that is forty lines of infrastructure code before any business logic.

Spring Boot replaces all of that infrastructure code with annotations. `@RestController` marks a class as an HTTP handler. `@GetMapping` maps a method to a GET request at a specific path. The method returns a Java object. Spring converts it to JSON and sends it. The forty lines become four.

**The project follows a four-layer architecture.**

`Book.java` is the model. It defines the shape of a book id, title, author, totalPages, pagesRead, coverId. Lombok generates the getters, setters, and constructors so the class stays readable.

`BookRepository.java` is the data access layer. It holds the in-memory list and exposes four operations find all, find by id, save, delete by id. It knows nothing about HTTP and nothing about business rules. When Module 10 arrives, this is the only layer that changes. The controller and service stay exactly as they are.

`BookService.java` is the business logic layer. It sits between the controller and the repository. Right now it is a thin pass-through because the business logic is simple. As the application grows validation, authorization checks, cross-entity operations this is where that logic lives.

`BookController.java` is the HTTP layer. It maps four endpoints to four methods. It reads path variables and request bodies from incoming requests. It wraps responses in `ResponseEntity` with the correct status code. It knows nothing about where data is stored.

**The separation of layers is a deliberate architectural decision, not a convention to follow.**

If the controller talked directly to the repository, a change in how data is stored would require touching the controller. If the repository contained business logic, testing that logic would require standing up HTTP infrastructure. Each layer knowing exactly one thing means each layer can be changed, tested, and replaced independently.

**Dependency injection connects the layers.**

`BookController` depends on `BookService`. `BookService` depends on `BookRepository`. Neither creates its dependency with `new`. Spring creates one instance of each class, reads the constructors, figures out the dependency order, and wires them together automatically. This is called dependency injection. The practical result is that swapping `BookRepository` for a database-backed implementation in Module 10 requires no changes to `BookService` or `BookController`.

**`AppContext.tsx` was updated to fetch from the server.**

The hardcoded books array was replaced with an empty `useState` and a `useEffect` that calls `GET http://localhost:8080/api/books` on mount. The rest of `AppContext` is unchanged. Components that call `useAppContext` do not know or care where the books came from. They received data before from a local array. They receive it now from a server. The interface is identical.

**`@CrossOrigin` was added to the controller.**

The browser blocks HTTP requests from one origin to another by default. The frontend runs on port 5173. The backend runs on port 8080. Without `@CrossOrigin(origins = "http://localhost:5173")`, every fetch call from the frontend would be blocked before it reached the server. This is CORS Cross-Origin Resource Sharing and it is enforced by the browser, not the server.

---

## The actual tradeoff

**What it costs:**

Two processes now need to run simultaneously for the app to work. The frontend alone is no longer sufficient. A developer who starts the React app without starting the Spring Boot server sees an empty book list with a console error. This coordination cost is minor for one developer but compounds on a team.

The in-memory storage means every server restart resets the data. For the duration of Module 8, any books added through the frontend disappear when the server stops. This is a known and accepted limitation the architecture is correct, the storage is temporary.

`addBook`, `handleDelete`, `updateBookProgress`, and `updateTotalPages` in `AppContext` still mutate local state only. They do not call the server. This means changes made through the frontend do not persist to the server's list. This is a gap that gets closed in Module 10 when every mutation becomes an API call.

**What it gives:**

The frontend and backend are now separate processes with a defined API contract between them. The frontend sends HTTP requests. The backend handles them. Neither knows how the other is implemented. This separation is what makes the backend replaceable in Module 10 the in-memory list becomes a PostgreSQL database and the frontend does not change at all.

The four-layer architecture means each layer is independently testable. A unit test for `BookService` does not need a running HTTP server. A unit test for `BookRepository` does not need a service. This testability becomes important in Module 15.

---

## At small scale (one developer, personal project)

I would not build a separate backend. localStorage gives persistence across page refreshes with zero server infrastructure. The data is tied to one browser on one device, which is acceptable for a personal tracker. If persistence across devices is needed, a hosted database like Firebase handles it without standing up a Java server.

---

## At medium scale (startup, five to ten engineers, real product)

A dedicated backend is non-negotiable at this scale. Multiple users sharing data require a server that all clients talk to. The four-layer architecture is the correct starting point. Spring Boot is a reasonable choice and widely understood across the industry a new backend developer joining the team will know it.

The in-memory repository would be replaced by PostgreSQL immediately. No production team ships with in-memory storage.

CORS configuration becomes more careful. Rather than specifying `localhost:5173`, the allowed origins list reflects the actual deployed frontend domain.

---

## At large scale (hundreds of engineers, millions of users)

The monolithic Spring Boot server gets split into services as scaling demands it. The books service, the user service, the request workflow service each become independent deployments. The four-layer pattern inside each service stays identical. What changes is the boundary between services HTTP calls or a message queue replace direct method calls.

The controller layer gets thinner. An API gateway handles cross-cutting concerns like authentication, rate limiting, and request routing before requests ever reach a controller. The controller receives already-validated, already-authenticated requests and focuses entirely on the business operation.

---

## TLDR

I built a Spring Boot REST API with four endpoints, organized into four layers following the repository, service, and controller pattern. The frontend now fetches book data from the server instead of a hardcoded array. Data lives in memory for now. The architecture is correct and ready for a database in Module 10.
