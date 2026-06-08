# Console (CLI)

The Webrium Console is a command-line toolkit for scaffolding files, managing databases, inspecting logs, and installing plugins.

## Requirements

- PHP 8.1+
- Symfony Console 6.4+

## Installation

```bash
composer require webrium/console
```

## Available Commands

| Command | Description |
|---|---|
| `init` | Create the project directory structure |
| `make:model` | Generate a model file |
| `make:controller` | Generate a controller file |
| `make:route` | Generate a route file |
| `call` | Call a method on a controller or model |
| `db` | Manage databases |
| `table` | Manage database tables and execute SQL files |
| `log` | Manage log files |
| `botfire:init` | Initialize a Telegram bot |
| `plugin:install` | Install a plugin |
| `plugin:update` | Update an installed plugin |
| `plugin:remove` | Remove an installed plugin |
| `plugin:list` | List installed plugins |
| `plugin:info` | Preview a plugin without installing |

---

## `init`

Creates all standard Webrium project directories.

```bash
php webrium init
```

---

## `make:model`

Generates a model file in the models directory.

```bash
php webrium make:model <Name> [--table=<table>] [--no-plural] [--force]
```

| Argument / Option | Description |
|---|---|
| `Name` | Model class name (e.g. `User`) |
| `--table, -t` | Database table name. If omitted, the name is auto-converted to snake_case and pluralized |
| `--no-plural` | Prevent automatic pluralization of the table name |
| `--force, -f` | Overwrite if the file already exists |

```bash
# DB model with explicit table name
php webrium make:model User --table=users

# DB model — table name auto-generated as "users"
php webrium make:model User -t

# Simple model (no DB)
php webrium make:model UserHelper

# DB model — table stays "status" instead of "statuses"
php webrium make:model Status -t --no-plural
```

---

## `make:controller`

Generates a controller file. Automatically appends `Controller` to the name if not present.

```bash
php webrium make:controller <Name> [--namespace=<Namespace>] [--force]
```

```bash
php webrium make:controller User
php webrium make:controller Admin --namespace="App\Controllers\Admin"
```

---

## `make:route`

Generates a route file in the routes directory.

```bash
php webrium make:route <Name> [--force]
```

```bash
php webrium make:route Api
php webrium make:route Web --force
```

---

## `call`

Calls a method on a controller or model class directly from the terminal.

```bash
php webrium call <Class@Method> [--params=<JSON>] [--model] [--namespace=<Namespace>]
```

```bash
php webrium call UserController@index
php webrium call UserController@find --params='[42]'
php webrium call User@active --model
php webrium call Report@generate --params='["2024-01", true]' --namespace="App\Services"
```

---

## `db`

Manages databases.

```bash
php webrium db <action> [<name>] [--use=<database>] [--force]
```

| Action | Description |
|---|---|
| `list` | List all databases |
| `tables` | List tables in a database |
| `create` | Create a new database |
| `drop` | Delete a database (prompts for confirmation) |

```bash
php webrium db list
php webrium db tables --use=my_database
php webrium db create my_database
php webrium db drop my_database
php webrium db drop my_database --force
```

---

## `table`

Inspects and manages individual tables.

```bash
php webrium table <action> <table_name> [--use=<database>] [--force]
```

| Action | Description |
|---|---|
| `info` | Show table information |
| `columns` | Show column details |
| `drop` | Delete the table |
| `truncate` | Remove all rows |
| `rename` | Rename an existing table |
| `copy` | Copy table structure to a new table |
| `exists` | Check whether a table exists |
| `count` | Count rows in a table |
| `run` | Execute a SQL file |

```bash
php webrium table info users
php webrium table columns orders --use=shop_db
php webrium table drop sessions --force
php webrium table rename old_table new_table
php webrium table copy products products_backup
php webrium table count orders
php webrium table run sql/setup_tables.sql --use=shop_db
```

---

## `log`

Manages Webrium log files.

```bash
php webrium log <action> [<name>]
```

| Action | Description |
|---|---|
| `list` | List all log files |
| `latest` | Display the most recent log file |
| `file <name>` | Display a specific log file |
| `clear` | Delete all log files |

```bash
php webrium log list
php webrium log latest
php webrium log file 2024-01-15.log
php webrium log clear
```

---

## `botfire:init`

Scaffolds the files needed to connect a Telegram bot.

```bash
php webrium botfire:init [<token>] [--debug=<chat_id>] [--force]
```

```bash
php webrium botfire:init 123456:ABC-DEF
php webrium botfire:init 123456:ABC-DEF --debug=987654321
```

---

## Plugin Commands

The Console also manages the plugin system. See the [Plugin System](/packages/plugins) page for full documentation.

```bash
php webrium plugin:install ./my-plugin.zip
php webrium plugin:install https://github.com/user/repo/releases/download/v1.0.0/plugin.zip
php webrium plugin:update  ./my-plugin-v2.zip
php webrium plugin:remove  my-plugin
php webrium plugin:list
php webrium plugin:info    ./my-plugin.zip
```
