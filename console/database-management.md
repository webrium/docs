# Database Management

Two commands handle the database from the outside — creating and dropping databases, inspecting and managing individual tables, and executing SQL files. Both work against any registered connection from `app/Config/DB.php`.

| Command | Purpose |
| --- | --- |
| `db` | List, create, drop databases; list tables in a database |
| `table` | Inspect, rename, copy, drop, truncate tables; execute SQL files |

These are intended for ad-hoc administration tasks during development and operations — not for code running in your application. For programmatic database access, use the FoxDB query builder, ORM, or schema builder documented in the *Database* section.

## `db`

```bash
php webrium db <action> [<name>] [--use=<database>] [--force]
```

### Actions

| Action | Effect |
| --- | --- |
| `list` | List all databases visible to the configured connection |
| `tables` | List tables in a database |
| `create` | Create a new database |
| `drop` | Delete a database (prompts for confirmation) |

### Options

| Option | Description |
| --- | --- |
| `--use`, `-u` | Specify a database for the `tables` action |
| `--force`, `-f` | Skip the confirmation prompt when dropping |

### Examples

```bash
# List databases visible to the default connection
php webrium db list

# List tables in a specific database
php webrium db tables --use=my_database

# Create a database
php webrium db create my_database

# Drop a database (interactive prompt)
php webrium db drop my_database

# Drop without confirmation (use in scripts)
php webrium db drop my_database --force
```

### Notes

- `db list` shows the databases the connection's user has visibility to. On a tightly permissioned production database, the user may not have rights to list *or* create databases — that's expected.
- `db drop` is **destructive and immediate**. There is no undo. The `--force` flag exists for automation; use it deliberately.
- Across drivers, `db list` works on MySQL and PostgreSQL. SQLite doesn't have a multi-database concept — there's just the file you opened — so `db list` isn't meaningful there.

---

## `table`

```bash
php webrium table <action> <table_name> [--use=<database>] [--force]
```

Inspects and manages individual tables. Also handles executing an arbitrary SQL file when the action is `run`.

### Actions

| Action | Effect |
| --- | --- |
| `info` | Show general table information (engine, collation, row count) |
| `columns` | Show column details: name, type, nullable, key, default, extra |
| `drop` | Delete the table (prompts for confirmation) |
| `truncate` | Remove all rows from the table (prompts for confirmation) |
| `rename` | Rename an existing table — `<table_name>` is the old name, the new name is read from the next argument |
| `copy` | Copy table structure to a new table — the destination name is the next argument |
| `exists` | Check whether a table exists |
| `count` | Print the row count |
| `run` | Execute a SQL file — `<table_name>` is treated as a file path |

### Options

| Option | Description |
| --- | --- |
| `--use`, `-u` | Specify a database |
| `--force`, `-f` | Skip confirmation prompts for destructive actions |

### Examples

```bash
# Show table information
php webrium table info users

# Show columns (against a specific database)
php webrium table columns orders --use=shop_db

# Drop a table with prompt
php webrium table drop sessions

# Drop without prompt (in scripts)
php webrium table drop sessions --force

# Rename
php webrium table rename old_table new_table

# Copy structure (no data) to a backup table
php webrium table copy products products_backup

# Check existence
php webrium table exists users
# Exit code 0 if it exists, non-zero if not — usable in shell scripts

# Row count
php webrium table count orders

# Execute a SQL file
php webrium table run sql/setup_tables.sql --use=shop_db
```

### `table run`

The `run` action is a small but useful escape hatch — it reads a SQL file from disk and executes its contents against the database. Useful for one-off scripts that don't fit into a migration: bulk data fixes, vendor-provided setup scripts, exploratory queries written for `mysql` / `psql` / `sqlite3` that you want to apply through the framework's connection.

```bash
php webrium table run reports/q3_cleanup.sql
php webrium table run vendor-imports/seed.sql --use=imports
```

The file is run as a single batch — multiple statements separated by semicolons all execute. If a statement fails partway through, the command stops and reports the error; whether earlier statements roll back depends on the database driver and whether you wrapped the file in `BEGIN; ... COMMIT;` blocks yourself.
