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

## Decision Log

| Module | Topic         | Log                                                                  |
| ------ | ------------- | -------------------------------------------------------------------- |
| 02     | Custom Hooks  | [module-02-custom-hooks.md](./decisions/module-02-custom-hooks.md)   |
| 03     | Data Fetching | [module-03-data-fetching.md](./decisions/module-03-data-fetching.md) |
| 04     | React Router  | [module-04-react-router.md](./decisions/module-04-react-router.md)   |
| 05     | Complex Forms | [module-05-complex-forms.md](./decisions/module-05-complex-forms.md) |
| 06     | Role Based UI | [module-06-role-based-ui.md](./decisions/module-06-role-based-ui.md) |

---

## Modules

| Module | Topic           | Status      |
| ------ | --------------- | ----------- |
| 02     | Custom Hooks    | ✅ Complete |
| 03     | Data Fetching   | ✅ Complete |
| 04     | React Router    | ✅ Complete |
| 05     | Complex Forms   | ✅ Complete |
| 06     | Role Based UI   | ✅ Complete |
| 07     | Styling         | ⏳ Pending  |
| 08     | Spring Boot     | ⏳ Pending  |
| 09     | Spring Security | ⏳ Pending  |
| 10     | PostgreSQL      | ⏳ Pending  |
| 11     | JPA & Hibernate | ⏳ Pending  |
| 12     | Redis           | ⏳ Pending  |
| 13     | AWS             | ⏳ Pending  |
| 14     | CI/CD           | ⏳ Pending  |
| 15     | Testing         | ⏳ Pending  |
| 16     | Security        | ⏳ Pending  |
| 17     | System Design   | ⏳ Pending  |
