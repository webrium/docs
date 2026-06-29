# Webrium Documentation

This repository holds the official documentation for [Webrium](https://webrium.dev) — a lightweight, modular PHP framework for building web applications and JSON APIs.

The contents of this repository are rendered as the documentation pages on **[webrium.dev](https://webrium.dev)**.

---

## What is Webrium?

Webrium is built around four small, focused packages that work together as a full-stack framework — or independently in any PHP project:

| Package | Purpose | Repository |
| --- | --- | --- |
| **`webrium/core`** | Routing, controllers, requests, responses, sessions, validation, uploads, HTTP client, JWT, hashing, events, error handling | [github.com/webrium/core](https://github.com/webrium/core) |
| **`webrium/foxdb`** | Query builder, schema/migrations, ORM, relationships, collections, pagination | [github.com/webrium/foxdb](https://github.com/webrium/foxdb) |
| **`webrium/view`** | Blade-compatible templating engine with hybrid static caching | [github.com/webrium/view](https://github.com/webrium/view) |
| **`webrium/console`** | The `webrium` CLI for scaffolding, migrations, plugins, and more | [github.com/webrium/console](https://github.com/webrium/console) |

The **[`webrium/webrium`](https://github.com/webrium/webrium)** repository is the application skeleton that wires the four packages together with a sensible directory layout, default configuration, and an asset pipeline — a working application you can start building on immediately.

```bash
composer create-project webrium/webrium my-app
```

Each package is also independently usable. If you only need the database layer, install `webrium/foxdb`. If you only need the templating engine, install `webrium/view`. The documentation for each module begins with a self-contained introduction covering standalone installation.

---

## Documentation

### Getting Started

The full framework — what it is, how to install it, and how a request flows through it.

- [Introduction](getting-started/introduction.md)
- [Installation](getting-started/installation.md)
- [Configuration](getting-started/configuration.md)
- [Request Lifecycle](getting-started/request-lifecycle.md)

### Core

The framework's core: routing, controllers, requests, responses, sessions, validation, uploads, HTTP client, JWT, hashing, events, filesystem, localization, and error handling.

- [Introduction](core/introduction.md)
- [Routing](core/routing.md)
- [Controllers](core/controllers.md)
- [Requests & Responses](core/requests-responses.md)
- [Sessions](core/sessions.md)
- [Validation](core/validation.md)
- [File Uploads](core/file-uploads.md)
- [HTTP Client](core/http-client.md)
- [JWT](core/jwt.md)
- [Hashing](core/hashing.md)
- [Events](core/events.md)
- [Filesystem](core/filesystem.md)
- [Localization](core/localization.md)
- [Error Handling](core/error-handling.md)
- [Helper Functions](core/helper-functions.md)
- [Kernel](core/kernel.md)

### Database

FoxDB — the query builder, ORM, schema builder, migrations, and seeders.

- [Introduction](database/introduction.md)
- [Connections](database/connections.md)
- [Query Builder](database/query-builder.md)
- [Eloquent ORM](database/eloquent-orm.md)
- [Relationships](database/relationships.md)
- [Collections](database/collections.md)
- [Casts & Serialization](database/casts-serialization.md)
- [Pagination](database/pagination.md)
- [Migrations, Schema & Seeders](database/migrations-schema.md)

### Template Engine

The view engine — a Blade-compatible templating system with hybrid static caching and an Editor.js parser.

- [Introduction](template-engine/introduction.md)
- [Basic Syntax](template-engine/basic-syntax.md)
- [Control Flow](template-engine/control-flow.md)
- [Layouts](template-engine/layouts.md)
- [Components](template-engine/components.md)
- [Hybrid Cache](template-engine/hybrid-cache.md)
- [Editor.js Integration](template-engine/editorjs.md)

### Console

The `webrium` command-line toolkit — scaffolding, migrations, database management, and plugins.

- [Introduction](console/introduction.md)
- [Scaffolding](console/scaffolding.md)
- [Migrations & Seeders](console/migrations-and-seeders.md)
- [Database Management](console/database-management.md)
- [Diagnostics](console/diagnostics.md)
- [Plugins](console/plugins.md)

---

## Contributing

Found a typo, an outdated example, or a section that could be clearer? Pull requests and issues are very welcome. For larger structural changes, please open an issue first to discuss.

## License

The documentation in this repository is released under the MIT License.
