# Module 10: PostgreSQL

---

## What the app needs right now

`BookRepository` and `UserRepository` are plain Java classes holding `ArrayList`s. Every time the server restarts, both lists go back to whatever was hardcoded in their constructors. There is no database. This module installs PostgreSQL, sets up Liquibase to manage the schema, and converts `Book` and `User` into JPA entities so the data the app holds stops resetting every time I stop the server.

---

## What I'm not doing yet

- No pagination or custom queries on `BookRepository` or `UserRepository`. That comes in Module 11.
- No Redis. `JwtService` still generates a new signing key on every restart, so a token issued before a restart fails afterward. Module 12 fixes this.
- No registration endpoint. `UserRepository`'s two seed accounts, the same `r@p` and `a@p` from Module 9, are inserted through a Liquibase changeset instead of a constructor. There is still no way for a new account to be created.
- `BookController` has no endpoint for updating a book's pages read after it is created. The frontend can change that number on screen, but there is nowhere on the backend to send it, so it does not save.

---

## The simple path

I could have kept the `ArrayList` versions from Module 8 indefinitely, or used SQLite, which needs no separate server process at all. Either choice skips installing PostgreSQL, picking and learning a migration tool, and writing a schema with columns and constraints.

---

## What I did instead and why

**I installed PostgreSQL and created the database by hand.**

I set a password for the `postgres` superuser during install, then ran `CREATE DATABASE pocketlibrary` myself at a `psql` prompt. Amazon RDS does this same setup automatically in Module 13. Doing it by hand first means I know exactly what RDS is doing for me later instead of treating it as a button I clicked.

**I started with Flyway and switched to Liquibase partway through the module.**

Spring Boot picks up Flyway automatically the moment the dependency is on the classpath, so that was the first plan. Flyway and Liquibase both track which schema changes have run against a database, the same way Git tracks which commits have been made. The actual difference is rollback. Flyway's rollback is a paid feature. Liquibase's is free. For a project hitting one PostgreSQL database, like this one, Flyway alone would have been enough. I switched to Liquibase anyway, since I wanted to work with the tool that has the larger feature set.

**The first schema I wrote did not match what the app actually tracks, so I wrote a second changeset to fix it.**

`001-create-users.yaml` and `002-create-books.yaml` came from an early planning document. They put `current_page` and `is_read` on `books`, and `email` on `users`. By the time I ran them, the frontend already tracked `totalPages` and `pagesRead`, two numbers showing how far into a book someone is, not just whether they are done. `003-align-schema-with-app.yaml` renamed `email` to `username`, since `r@p` is not an email address, and replaced `current_page` and `is_read` with `total_pages`, `pages_read`, and `cover_id`.

**Hibernate checks the schema. It does not write it.**

`spring.jpa.hibernate.ddl-auto` is set to `validate`. Liquibase creates every table. Hibernate's only job at startup is comparing `Book` and `User` against what already exists, and refusing to start if they disagree. This is how I found that both entities were missing `@Table`. Hibernate's default guess for a table name is the class name itself, singular, so it expected `book` and `user`. The real tables are `books` and `users`. Adding `@Table(name = "books")` and `@Table(name = "users")` fixed it.

**`Book` now has a `@ManyToOne` field pointing at `User`.**

`BookController.addBook` calls `SecurityContextHolder.getContext().getAuthentication().getName()` to get the logged in username, looks that user up through `UserRepository`, and sets it on the book before saving. Before this module, `Book` had no field for an owner at all.

**`AuthService` now hashes passwords with `BCryptPasswordEncoder` instead of comparing plain strings.**

The two seed accounts in `004-seed-users.yaml` are inserted with real BCrypt hashes, generated outside the app with Python's `bcrypt` library, not the plain words `r` and `a` from Module 9. `BCryptPasswordEncoder.matches` takes the password someone types, hashes it, and checks that against the stored hash. It never decodes the stored value, so the seed data had to already be hashed for login to work once this change landed.

---

## The actual tradeoff

**What it costs:**

PostgreSQL has to already be running before the app will start at all. In Module 8 and Module 9, the app ran with nothing else installed.

Every schema correction is a new changeset file. `003-align-schema-with-app.yaml` could not replace `001-create-users.yaml` or `002-create-books.yaml`, it could only sit on top of them, since Liquibase will not let me edit a changeset once it has run.

`BookController.addBook` now depends on `SecurityContextHolder` actually holding a valid identity at the moment a book is saved. If that lookup against `UserRepository` ever fails, the book does not save. This is a failure mode that did not exist when `Book` had no owner field at all.

**What it gives:**

A book added through `BookController` is still there the next time the server starts. This is the actual reason the module exists.

`Book` now has a foreign key to a real `User` row instead of no concept of ownership at all. Finding all books for one specific user, which Module 11 needs, is only possible because that relationship exists now.

The `db/changelog` folder holds the full, ordered history of the schema, including the one I got wrong and corrected. Anyone reading the project later can see what changed and in what order without asking me.

---

## At small scale (one developer, personal project)

A personal project used by one person on one machine does not need a separate database server running in the background. SQLite gives the same relational structure as PostgreSQL, tables, foreign keys, real queries, but the whole database is a single file on disk with nothing to install or start up. PostgreSQL exists to let multiple processes read and write the same data safely at the same time, a problem a single user on a single machine does not have.

---

## At medium scale (startup, five to ten engineers, a live product)

Several developers changing the schema at the same time would need a shared changelog checked into the same repository as the code, with every developer running `liquibase update` against their own local database before pushing, so nobody's local schema ever drifts from what is actually in source control.

`004-seed-users.yaml` would be deleted entirely. A real registration endpoint on `AuthController` would let anyone create an account, with `AuthService` hashing the password through `BCryptPasswordEncoder` the same way it already does for login, and the two demo accounts would only exist in a local seed file that never ships to a shared environment.

---

## At large scale (hundreds of engineers, millions of users)

One PostgreSQL instance would be split into a primary handling writes and several read replicas handling the much higher volume of reads, with reporting and analytics queries pointed at the replicas so they never compete with the primary for write capacity.

A migration team would test every Liquibase changeset against a staging database holding a full copy of production data before it ever runs against the real one, and would write the matching rollback changeset in the same pull request, not after something has already gone wrong.

---

## TLDR

I installed PostgreSQL, started with Flyway and switched to Liquibase, and used it to write and then correct a schema for `users` and `books`. `Book` and `User` are now JPA entities, and `BookRepository`/`UserRepository` are now interfaces extending `JpaRepository`. `Book` has a `@ManyToOne` owner set by `BookController` on save. `AuthService` hashes passwords with BCrypt instead of comparing them as plain text. Updating a book's pages read still does not reach the backend, and that is still open.
