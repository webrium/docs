# Migrations & Seeders

Two CLI commands drive FoxDB's database-evolution workflow:

- **`migrate`** — apply, roll back, refresh, and inspect schema migrations from `database/migrations`
- **`db:seed`** — run seeders from `database/seeders` to populate the database

Both delegate to the underlying APIs documented in *Database → Migrations, Schema & Seeders* — `Foxdb\Migrations\Migrator` and `Foxdb\Seeders\SeederRunner`. This page focuses on the CLI surface.

## `migrate`

```bash
php webrium migrate [<action>] [--step=<n>] [--connection=<name>] [--seed] [--force]
```

### Actions

| Action | Effect |
| --- | --- |
| `run` *(default)* | Apply all pending migrations |
| `rollback` | Roll back the last batch (or `--step` migrations across batches) |
| `reset` | Roll back every migration that has been run |
| `refresh` | Roll back everything, then re-run all migrations |
| `status` | Show which migrations have run, and in which batch |

`run` is the default, so `php webrium migrate` and `php webrium migrate run` are equivalent.

### Options

| Option | Description |
| --- | --- |
| `--step` | Limit `run` / `rollback` to a specific number of migrations |
| `--connection`, `-c` | Run against a named connection instead of the default |
| `--seed` | After a successful `run` or `refresh`, also run every seeder in `database/seeders` |
| `--force`, `-f` | Skip the confirmation prompt for `reset` / `refresh` |

### Examples

```bash
# Apply all pending migrations
php webrium migrate
php webrium migrate run

# Show migration status
php webrium migrate status

# Roll back the most recent batch
php webrium migrate rollback

# Roll back only the last 2 individual migrations
php webrium migrate rollback --step=2

# Roll back everything, with confirmation
php webrium migrate reset

# Roll back everything without confirmation
php webrium migrate reset --force

# Reset and re-run all migrations
php webrium migrate refresh --force

# Run against a non-default connection
php webrium migrate --connection=secondary

# Apply pending migrations, then run all seeders
php webrium migrate --seed

# Reset, re-run, and re-seed in one command
php webrium migrate refresh --seed --force
```

### Behaviour

- **Batches.** Every migration applied in the same `run` call is grouped under a single batch number in the `migrations` table. `rollback` with no `--step` reverses the entire most recent batch. `rollback --step=N` reverses the last `N` individual migrations regardless of batch boundaries.
- **Transactions.** Each migration runs inside its own database transaction. If a migration fails, the transaction is rolled back and `migrate` stops — earlier migrations in the same run stay applied.
- **Production safety.** `reset` and `refresh` ask for confirmation before running. Pass `--force` to bypass the prompt in scripts.
- **`--seed`.** When passed alongside `run` or `refresh`, every seeder in `database/seeders` runs after the schema is in place. The seed step uses the same connection as the migrate step.

### `migrate status`

Prints a table of every migration file in `database/migrations` and whether it's been applied:

```
+------------------------------------------+-----+-------+
| Migration                                | Ran | Batch |
+------------------------------------------+-----+-------+
| 2024_01_15_120000_create_users_table     | Yes | 1     |
| 2024_01_16_093000_add_score_to_users     | Yes | 1     |
| 2024_02_01_140000_create_posts_table     | No  | -     |
+------------------------------------------+-----+-------+
```

Useful for sanity-checking before a deploy or before rolling back. `status` is read-only — it never modifies the schema.

---

## `db:seed`

```bash
php webrium db:seed [<class>] [--connection=<name>] [--no-transaction] [--force]
```

Runs seeders from `database/seeders`. Seeders are **not tracked** between runs — calling `db:seed` repeatedly re-runs them. Write seeders to be idempotent (e.g. `updateOrInsert()`, `where(...)->exists()` guards) when this matters.

### Argument

| Argument | Description |
| --- | --- |
| `class` | Optional. Class or file name of a single seeder to run. If omitted, every seeder in `database/seeders` runs in alphabetical order |

### Options

| Option | Description |
| --- | --- |
| `--connection`, `-c` | Run against a named connection instead of the default |
| `--no-transaction` | Don't wrap each seeder in a transaction |
| `--force`, `-f` | Skip the confirmation prompt when `APP_ENV=production` |

### Examples

```bash
# Run every seeder in database/seeders
php webrium db:seed

# Run a single seeder by file name
php webrium db:seed UsersSeeder

# Run a single seeder by fully qualified class name
php webrium db:seed "App\\Seeders\\UsersSeeder"

# Use a non-default connection
php webrium db:seed --connection=secondary

# Disable per-seeder transactions (e.g. for DDL inside the seeder)
php webrium db:seed --no-transaction

# Run in production without an interactive prompt
APP_ENV=production php webrium db:seed --force
```

### Behaviour

- **Transactions.** Each seeder runs inside its own transaction by default, so a failure mid-seeder rolls back any inserts that seeder made. Pass `--no-transaction` for engines or operations that don't play well with transactional writes.
- **Order.** When run without a class argument, seeders execute in alphabetical order of file name. To control the order, either prefix file names (`01_users.php`, `02_roles.php`) or use a single top-level `DatabaseSeeder` that calls the others via `$this->call(...)`.
- **Failure handling.** If a seeder fails, `db:seed` stops and reports it — seeders that already completed remain applied.
- **Production confirmation.** When `APP_ENV` is `production` (or `prod`), `db:seed` asks for confirmation before running. `--force` bypasses the prompt — required for non-interactive deploys.

## A Typical Workflow

A common deploy or local-reset sequence:

```bash
# First time on a new machine
php webrium migrate --seed

# After pulling new migrations
php webrium migrate

# When something's wrong and you want a fresh start (dev only)
php webrium migrate refresh --seed --force
```

For continuous integration:

```bash
# A green-field DB for tests
php webrium migrate run --connection=testing
php webrium db:seed --connection=testing --force
```

For details on writing migrations and seeders themselves, see *Database → Migrations, Schema & Seeders*.
