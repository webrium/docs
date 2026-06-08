# FoxDB — Introduction

FoxDB is the database layer of the Webrium framework. It provides a **fluent query builder** similar to Laravel's, plus an **Eloquent-style ORM**.

## Features

- Low use of resources — lighter and faster than heavier ORMs
- Laravel-compatible query builder syntax
- PDO parameter binding (SQL injection protection)
- Eloquent ORM with models and relationships
- Schema builder for creating/modifying tables
- Comprehensive exception handling

## Installation

FoxDB is included in Webrium. To use it standalone:

```bash
composer require webrium/foxdb
```

## Next Steps

- [Configuration](/database/configuration) — set up your database connection
- [Query Builder](/database/query-builder) — SELECT, INSERT, UPDATE, DELETE
- [Eloquent ORM](/database/eloquent) — models and ORM usage
- [Schema Builder](/database/schema) — create and modify tables
