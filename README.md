# PocketLibrary

A personal book tracker. Simple premise, production-grade architecture underneath it.
Every decision is documented: what the simpler path would have been, what the pattern
actually costs, and when it stops being overkill.

---

## What this consists of

Two roles. One shared book list. Reader and Admin. The premise never grows.

The architecture grows through 17 modules: React, Spring Boot, PostgreSQL, Redis, AWS.
By the end it is a fully deployed, production-grade application built on top of something
that did not need any of it. That is the point.

---

## Modules & Decision Log

| Module | Topic           | Log                                                                          | Status      |
| ------ | --------------- | ---------------------------------------------------------------------------- | ----------- |
| 02     | Custom Hooks    | [module-02-custom-hooks.md](./decisions/module-02-custom-hooks.md)           | ✅ Complete |
| 03     | Data Fetching   | [module-03-data-fetching.md](./decisions/module-03-data-fetching.md)         | ✅ Complete |
| 04     | React Router    | [module-04-react-router.md](./decisions/module-04-react-router.md)           | ✅ Complete |
| 05     | Complex Forms   | [module-05-complex-forms.md](./decisions/module-05-complex-forms.md)         | ✅ Complete |
| 06     | Role Based UI   | [module-06-role-based-ui.md](./decisions/module-06-role-based-ui.md)         | ✅ Complete |
| 07     | Styling         | [module-07-styling.md](./decisions/module-07-styling.md)                     | ✅ Complete |
| 08     | Spring Boot     | [module-08-spring-boot.md](./decisions/module-08-spring-boot.md)             | ✅ Complete |
| 09     | Spring Security | [module-09-spring-security.md](./decisions/module-09-spring-security.md)     | ✅ Complete |
| 10     | PostgreSQL      | [module-10-postgresql.md](./decisions/module-10-postgresql.md)               | ✅ Complete |
| 11     | JPA & Hibernate | [module-11-jpa-and-hibernate.md](./decisions/module-11-jpa-and-hibernate.md) | ✅ Complete |
| 12     | Redis           |                                                                              | ⏳ Pending  |
| 13     | AWS             |                                                                              | ⏳ Pending  |
| 14     | CI/CD           |                                                                              | ⏳ Pending  |
| 15     | Testing         |                                                                              | ⏳ Pending  |
| 16     | Security        |                                                                              | ⏳ Pending  |
| 17     | System Design   |                                                                              | ⏳ Pending  |
