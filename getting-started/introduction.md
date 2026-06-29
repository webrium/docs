# Introduction

Webrium is a lightweight PHP framework for building web applications and JSON APIs. It is designed to feel as productive as a full-stack framework while staying small, explicit, and easy to read end-to-end.

Webrium is **modular**. The framework is the sum of four focused packages, each of which is independently usable:

| Package | Purpose | Repository |
| --- | --- | --- |
| **`webrium/core`** | Routing, controllers, requests, responses, sessions, validation, uploads, HTTP client, JWT, hashing, events, error handling | [github.com/webrium/core](https://github.com/webrium/core) |
| **`webrium/foxdb`** | Query builder, schema/migrations, ORM, relationships, collections, pagination | [github.com/webrium/foxdb](https://github.com/webrium/foxdb) |
| **`webrium/view`** | Blade-compatible templating engine | [github.com/webrium/view](https://github.com/webrium/view) |
| **`webrium/console`** | The `webrium` command-line tool and a kit for writing custom commands | [github.com/webrium/console](https://github.com/webrium/console) |

The repository **[`webrium/webrium`](https://github.com/webrium/webrium)** is the application skeleton: it wires the four packages together, ships a sensible directory layout, configures error handling, sessions, the view engine, and the asset pipeline, and gives you a working app you can start building on immediately.

## Two Ways to Use Webrium

### As a full framework

Use [`webrium/webrium`](https://github.com/webrium/webrium) when you want a complete, batteries-included starting point — routing, views, database, CLI, asset pipeline, and conventional directory structure already wired up. This is what the rest of **Getting Started** describes.

```bash
composer create-project webrium/webrium my-app
```

### As standalone packages

Every Webrium package is published independently on Packagist and can be installed into any PHP project, with or without the other packages. For example:

- Add **FoxDB** to a legacy application that needs a modern query builder.
- Use **`webrium/view`** as the templating engine inside a different framework.
- Pull in **`webrium/core`** to get just routing and request handling, with no ORM.
- Drop **`webrium/console`** into any project that needs a CLI.

Each module section in this documentation begins with an **Introduction** page that covers standalone installation and the minimum setup needed to use that package on its own. If you arrived here from a module's GitHub repository, that page is your real starting point — you can skip the rest of *Getting Started*.

## Design Goals

A few principles shape every decision in Webrium:

- **Small surface area.** Each class has one job and a short, predictable API.
- **Explicit over magical.** Boot order, configuration, and the request lifecycle are visible in your own `public/index.php` — no hidden bootstrappers.
- **Composable.** Packages depend on the standard library and on each other only where it makes sense. You can swap any of them out.
- **Safe defaults.** Uploads validate real MIME types, hashing uses modern algorithms, and JWT verification checks signatures and time claims by default.

## What's in This Section

The rest of *Getting Started* covers the full framework:

- **Installation** — requirements, creating a project, running the dev server
- **Configuration** — the `.env` file, the directory layout, and where conventions live
- **Request Lifecycle** — what happens between an incoming HTTP request and the outgoing response

Once your application is running, move on to the **Core**, **Database**, **Template Engine**, and **Console** sections to dive into each subsystem.
