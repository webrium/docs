# Introduction

**`webrium/console`** is the command-line toolkit that ships with the Webrium framework. It scaffolds files, runs migrations and seeders, manages databases, inspects logs, and installs distributable plugins — everything you'd otherwise do by hand or through ad-hoc scripts.

Unlike the other Webrium packages, **Console is framework-coupled**: it's designed specifically to work inside a Webrium project and is not intended to be used outside one. There is no standalone bootstrap section in this documentation because the binary handles bootstrap for you — when you create a new project with `composer create-project webrium/webrium`, the `webrium` CLI is already in place at the project root.

## The `webrium` Binary

Every command runs through the `webrium` binary in your project root:

```bash
php webrium <command> [arguments] [options]
```

The binary:

1. Discovers and loads Composer's autoloader (works whether Console is installed in the project's `vendor/` or as a standalone clone).
2. Initialises the framework — `App::initialize()`, `Directory::initDefaultStructure()`, and `Kernel::source('config', ['DB.php'])` so the database connection is available to every command.
3. Builds a Symfony Console application, registers all built-in commands, and dispatches your command.

You can see the full list of registered commands at any time with:

```bash
php webrium list
```

…and get help for any specific command:

```bash
php webrium help migrate
php webrium make:model --help
```

Both are standard Symfony Console behaviour — every Webrium command supports `-h` / `--help`, `-v` / `-vv` / `-vvv` for verbosity, `-q` for quiet mode, and `--no-interaction` for non-interactive (CI) environments.

## Command Categories

The commands group naturally into a few areas:

| Category | Commands | Page |
| --- | --- | --- |
| Scaffolding | `init`, `make:model`, `make:controller`, `make:route`, `make:migration`, `make:seeder` | *Scaffolding* |
| Migrations & seeders | `migrate`, `db:seed` | *Migrations & Seeders* |
| Database management | `db`, `table` | *Database Management* |
| Diagnostics | `call`, `log` | *Diagnostics* |
| Plugin system | `plugin:install`, `plugin:update`, `plugin:remove`, `plugin:list`, `plugin:info`, `plugin:new`, `plugin:export` | *Plugins* |

## Conventions

A few conventions hold across every command:

- **Output styling.** Commands use Symfony's `SymfonyStyle` for tables, warnings, errors, and success blocks. Output is colourised in an interactive terminal and plain when piped.
- **Exit codes.** A successful command returns `0`. A handled failure (file already exists, table missing, migration errored) returns a non-zero status, so you can chain commands together in scripts.
- **`--force` / `-f`.** Almost every destructive or overwriting command supports `--force` to skip the confirmation prompt — useful in CI and deployment scripts.
- **`--connection` / `-c`.** Commands that touch the database (`migrate`, `db:seed`, `table run`) accept `--connection` to run against a named connection from `app/Config/DB.php` instead of the default.
- **Production safety.** When `APP_ENV` is set to `production` (or `prod`), the destructive commands (`migrate reset/refresh`, `db:seed`) ask for confirmation before running. Pass `--force` to bypass.

## What's Underneath

Webrium Console is built on **Symfony Console 6.4+**, which is brought in as a dependency. Every Webrium command is a regular `Symfony\Component\Console\Command\Command` subclass — there's no proprietary command framework on top. If you've written Symfony commands before, the patterns will feel familiar.

This also means you can extend the CLI with your own commands using the same Symfony Console APIs you'd use anywhere else. The `webrium` binary registers a fixed set of commands today; if you need a project-specific one, the cleanest path is to copy the binary's bootstrap pattern into a separate script tailored to your project, or to wait for / contribute to a public command-registration hook in a future release.

## Where to Go Next

- **Scaffolding** — create models, controllers, routes, migrations, and seeders
- **Migrations & Seeders** — apply schema changes and seed data
- **Database Management** — list, create, drop, and inspect databases and tables
- **Diagnostics** — call application code from the terminal, manage log files
- **Plugins** — install, update, and create plugin packages
