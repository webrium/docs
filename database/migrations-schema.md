# Migrations, Schema & Seeders

This page covers three related topics:

- **Schema** — building and altering tables in a database-agnostic way through `Foxdb\Schema` and `Foxdb\Schema\Blueprint`
- **Migrations** — version-controlled schema changes, applied and reversed by the `Migrator`
- **Seeders** — repeatable scripts that populate the database with default or test data

The Schema Builder lets you create and modify tables using a fluent PHP API instead of writing raw DDL. Migrations are version-controlled PHP classes that apply (and reverse) schema changes — so your database structure can evolve alongside your code, and a fresh checkout can rebuild the database from zero. Seeders, in contrast, are *not* tracked: they're scripts you can run any number of times, useful for filling in reference data, demo accounts, or test fixtures.

---

## Creating a Table

```php
use Foxdb\Schema;
use Foxdb\Schema\Blueprint;

Schema::create('users', function (Blueprint $table) {
    $table->id();                                  // BIGINT AUTO_INCREMENT PRIMARY KEY
    $table->string('name');                        // VARCHAR(255)
    $table->string('email', 255)->unique();
    $table->boolean('is_active')->default(true);
    $table->integer('age')->default(0);
    $table->text('bio')->nullable();
    $table->json('settings')->nullable();
    $table->enum('role', ['admin', 'user', 'mod'])->default('user');
    $table->timestamps();                          // created_at + updated_at
    $table->softDeletes();                         // deleted_at
    $table->foreignId('category_id');
    $table->foreign('category_id')->references('id')->on('categories')->cascadeOnDelete();
    $table->index('role');
});
```

## Column Types

| Method | Column Type |
|---|---|
| `id()` | `BIGINT AUTO_INCREMENT PRIMARY KEY` |
| `increments($col)` | `INT AUTO_INCREMENT PRIMARY KEY` |
| `bigIncrements($col)` | `BIGINT AUTO_INCREMENT PRIMARY KEY` |
| `tinyInteger($col)` | `TINYINT` |
| `smallInteger($col)` | `SMALLINT` |
| `integer($col)` | `INT` |
| `bigInteger($col)` | `BIGINT` |
| `float($col, $precision = 8, $scale = 2)` | `FLOAT(precision, scale)` |
| `decimal($col, $precision = 10, $scale = 2)` | `DECIMAL(precision, scale)` |
| `boolean($col)` | `TINYINT(1)` (MySQL), `BOOLEAN` (PostgreSQL), `INTEGER` (SQLite) |
| `string($col, $length = 255)` | `VARCHAR(length)` |
| `char($col, $length = 1)` | `CHAR(length)` |
| `text($col)` | `TEXT` |
| `mediumText($col)` | `MEDIUMTEXT` |
| `longText($col)` | `LONGTEXT` |
| `enum($col, $allowed)` | `ENUM(...)` on MySQL, `VARCHAR` with a `CHECK` constraint on PostgreSQL, `TEXT` on SQLite |
| `json($col)` | `JSON` (MySQL), `JSONB` (PostgreSQL), `TEXT` (SQLite) |
| `uuid($col)` | `CHAR(36)` (MySQL/SQLite), `UUID` (PostgreSQL) |
| `binary($col)` | `BLOB` (MySQL/SQLite), `BYTEA` (PostgreSQL) |
| `date($col)` | `DATE` |
| `time($col)` | `TIME` |
| `dateTime($col)` | `DATETIME` (MySQL/SQLite), `TIMESTAMP` (PostgreSQL) |
| `timestamp($col)` | `TIMESTAMP` |
| `foreignId($col)` | `BIGINT UNSIGNED` |

### Convenience Methods

```php
$table->timestamps();              // adds created_at and updated_at
$table->softDeletes();             // adds deleted_at (default name)
$table->softDeletes('removed_at'); // custom column name
```

> PostgreSQL requires `TIMESTAMP` (not `DATETIME`) and `TRUE`/`FALSE` (not `1`/`0`) for boolean defaults. The Schema Builder generates the correct syntax for each driver automatically — write your migration once and it works on MySQL, PostgreSQL, and SQLite.

## Column Modifiers

Modifiers are chained onto a column definition:

```php
$table->integer('score')->nullable();
$table->integer('score')->default(0);
$table->bigInteger('views')->unsigned();
$table->string('email')->unique();
$table->string('slug')->index();
$table->string('id')->primary();
$table->integer('id')->autoIncrement();
$table->string('comment_field')->comment('Internal note');
```

### Modifying Existing Columns

```php
Schema::table('users', function (Blueprint $table) {
    // Add a new column after an existing one
    $table->integer('score')->nullable()->after('email');
    // Move a column to the first position
    $table->string('uuid')->first();
    // Change an existing column's definition
    $table->string('name', 100)->change();
});
```

## Indexes, Unique Constraints, and Primary Keys

```php
Schema::create('users', function (Blueprint $table) {
    $table->id();
    $table->string('email');
    $table->string('first_name');
    $table->string('last_name');
    $table->integer('tenant_id');

    // Single column index
    $table->index('email');

    // Named index
    $table->index(['first_name', 'last_name'], 'idx_full_name');

    // Unique constraint (single or composite)
    $table->unique('email');
    $table->unique(['tenant_id', 'email']);

    // Composite primary key
    $table->primary(['tenant_id', 'id']);
});
```

## Foreign Keys

```php
Schema::create('posts', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id');
    $table->foreignId('category_id')->nullable();

    $table->foreign('user_id')
          ->references('id')
          ->on('users')
          ->cascadeOnDelete();

    $table->foreign('category_id')
          ->references('id')
          ->on('categories')
          ->nullOnDelete();

    // Or specify the action explicitly
    $table->foreign('user_id')
          ->references('id')
          ->on('users')
          ->onDelete('cascade')
          ->onUpdate('cascade');
});
```

`foreignId()` is a shorthand for an unsigned big integer column, typically paired with `foreign()` as shown above:

```php
$table->foreignId('category_id');
$table->foreign('category_id')->references('id')->on('categories');
```

### Deriving the Column from a Model

`foreignIdFor()` infers the foreign key column name from a model's table name — `User` → `users` → `user_id`:

```php
$table->foreignIdFor(User::class);
// equivalent to: $table->foreignId('user_id');
```

This is convenient when you want the column name to track the model: rename the model's table, and the column name follows.

## Modifying Tables

```php
Schema::table('users', function (Blueprint $table) {
    // Drop columns
    $table->dropColumn('old_field');
    $table->dropColumn(['field_a', 'field_b']);

    // Rename a column
    $table->renameColumn('bio', 'about');

    // Drop indexes / constraints
    $table->dropIndex('idx_full_name');
    $table->dropUnique('email_unique');
    $table->dropForeign('posts_user_id_foreign');
});
```

## Other Schema Operations

```php
Schema::drop('users');                        // drop the table (errors if it doesn't exist)
Schema::dropIfExists('users');                // safe — no error if missing
Schema::rename('old_table', 'new_table');

Schema::hasTable('users');                    // bool
Schema::hasColumn('users', 'email');          // bool
Schema::getColumnNames('users');              // array<string>
Schema::getColumns('users');                  // detailed column info
```

All `Schema` methods accept an optional `$connection` argument as their last parameter, for working with a non-default database connection.

---

## Writing Migrations

A migration is a class with `up()` and `down()` methods. `up()` applies the change; `down()` reverses it.

```php
use Foxdb\Migrations\Migration;
use Foxdb\Schema;
use Foxdb\Schema\Blueprint;

class CreateUsersTable extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('password');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
}
```

Both methods are required — `Migration` is an abstract class that enforces them.

### File Naming Convention

Migration files must follow the pattern `YYYY_MM_DD_HHMMSS_description.php`, for example:

```
2024_01_15_120000_create_users_table.php
2024_01_16_093000_add_score_to_users_table.php
```

The timestamp prefix determines run order. The class name inside the file is derived by stripping the timestamp prefix and converting `snake_case` to `PascalCase`:

```
2024_01_15_120000_create_users_table.php  →  class CreateUsersTable
```

### Per-Migration Connection

A migration can target a specific connection by setting the public `$connection` property:

```php
class CreateLogsTable extends Migration
{
    public ?string $connection = 'analytics';

    public function up(): void { /* ... */ }
    public function down(): void { /* ... */ }
}
```

When set, this overrides the migrator's default connection for that single migration.

## Running Migrations

The `Migrator` class manages applying and reversing migrations, tracking which have already run in a `migrations` table:

```php
use Foxdb\Migrations\Migrator;

$migrator = new Migrator(__DIR__ . '/database/migrations');

$results = $migrator->run();          // run all pending
$results = $migrator->run(3);         // run only the next 3 pending
$results = $migrator->rollback();     // roll back the last batch
$results = $migrator->rollback(2);    // roll back the last 2 individual migrations
$results = $migrator->reset();        // roll back everything (reverse order)
$results = $migrator->refresh();      // reset, then run all again
```

`run()`, `rollback()`, and `reset()` return an array of `MigrationResult` objects, one per migration executed. `refresh()` returns an associative array: `['down' => [...], 'up' => [...]]` — the results of the reset phase followed by the re-run phase.

### Batches

When `run()` is called, every migration it applies in that single call is grouped into the **same batch** — identified by an incrementing integer in the `migrations` table. `rollback()` with no argument reverses the most recent batch as a unit. `rollback($n)` instead rolls back the last `$n` *individual* migrations across any batch, in reverse order.

This distinction matters when several migrations are grouped together — calling `rollback()` to undo a deploy is usually what you want; calling `rollback(1)` is what you want when you've made a mistake in the most recent file and need to step back one.

### Migration Results

Each migration returns a `MigrationResult`:

```php
final class MigrationResult
{
    public readonly string $name;       // file name without .php
    public readonly string $direction;  // 'up' or 'down'
    public readonly bool   $success;
    public readonly float  $timeMs;
    public readonly string $error;      // empty when success is true
}

$result = $results[0];
echo $result->toString();
// "[OK] up 2024_01_15_120000_create_users_table (12.34 ms)"
```

If a migration fails, the migrator stops processing the rest of the batch — subsequent migrations are **not** attempted. Each migration runs inside its own transaction, so a failure leaves the database in the state it was in before that file started.

### Inspecting Status

```php
$status = $migrator->status();
// → array<{name: string, ran: bool, batch: int|null}>

if ($migrator->hasPendingMigrations()) {
    echo "Database is not up to date.";
}

$pending = $migrator->getPendingMigrations();
// → array<string>
```

### Using a Custom Migrations Table or Connection

```php
$migrator = new Migrator(
    path:       __DIR__ . '/database/migrations',
    table:      'custom_migrations',
    connection: 'analytics',
);
```

The `table` argument changes the tracking table name (default `migrations`), and `connection` selects which connection the migrator runs on — independent of any per-migration `$connection` override.

---

## Seeders

Seeders populate the database with default or test data: an initial admin user, a list of countries, sample products for development. Unlike migrations, **seeders are not tracked** — each call runs them fresh. Write them to be idempotent if it matters that they can be re-run, or accept that re-running will produce duplicates.

### Writing a Seeder

A seeder extends `Foxdb\Seeders\Seeder` and implements `run()`:

```php
use Foxdb\Seeders\Seeder;
use Foxdb\DB;

class UsersSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('users')->insert([
            'name'     => 'Admin',
            'email'    => 'admin@example.com',
            'password' => password_hash('change-me', PASSWORD_BCRYPT),
        ]);
    }
}
```

You can use any FoxDB API inside `run()` — query builder, raw SQL, Eloquent models, transactions. There is no requirement about which.

### Calling Other Seeders

A seeder can run other seeders through `$this->call()`:

```php
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(UsersSeeder::class);
        $this->call(RolesSeeder::class);
        $this->call([
            ProductsSeeder::class,
            OrdersSeeder::class,
        ]);
    }
}
```

The pattern is to have a single top-level `DatabaseSeeder` that orchestrates the rest — the same way `composer install` runs all sub-installers.

### Running Seeders

The `SeederRunner` discovers and executes seeder files in a directory:

```php
use Foxdb\Seeders\SeederRunner;

$runner = new SeederRunner(__DIR__ . '/database/seeders');

// Run all seeder files in the directory, sorted alphabetically
$results = $runner->runAll();

// Run a single seeder by class name (with or without namespace)
$result = $runner->runClass(UsersSeeder::class);

// Run a single seeder by file name (without .php)
$result = $runner->runFile('UsersSeeder');

// List discovered seeder files (without .php)
$files = $runner->getSeederFiles();
```

When you call `runClass()` with a class that's already autoloadable (a real namespace registered with Composer), it instantiates directly. When the class isn't autoloadable, the runner looks for a file with the matching short name inside the seeders directory and `require`s it — so you can mix autoloaded and stand-alone files.

If `runAll()` encounters a failing seeder, it stops on the first failure and doesn't run the rest.

### Per-Seeder Connection

Like migrations, a seeder can target a specific connection by setting the public `$connection` property:

```php
class AnalyticsSeeder extends Seeder
{
    public ?string $connection = 'analytics';

    public function run(): void { /* ... */ }
}
```

When unset, the seeder uses the runner's default connection (or the global default if the runner has none).

### Transactions

By default, each seeder runs inside its own transaction — a failure mid-seeder rolls back any inserts it made, so the database isn't left half-populated. You can disable this for the runner (useful for engines or operations that don't play well with transactional DDL, or when you explicitly want partial inserts to persist):

```php
$runner = new SeederRunner(__DIR__ . '/database/seeders');
$runner->useTransaction(false);

$runner->runAll();
```

### Seeder Results

`runAll()`, `runClass()`, and `runFile()` return `SeederResult` objects:

```php
final class SeederResult
{
    public readonly string $name;
    public readonly bool   $success;
    public readonly float  $timeMs;
    public readonly string $error;   // empty when success is true
}

foreach ($results as $result) {
    echo $result->toString() . PHP_EOL;
    // "[OK] seed UsersSeeder (8.74 ms)"
    // "[FAILED] seed BadSeeder (1.20 ms) — SQLSTATE[42S02]: Base table or view not found ..."
}
```

### Naming and Namespacing

The runner is flexible about how seeders are named on disk. When loading from a file (`runFile()` or `runAll()`), it tries these class names in order:

1. The bare class name (`UsersSeeder`)
2. `App\Seeders\UsersSeeder`
3. `Database\Seeders\UsersSeeder`

The first one that exists wins. So you can write seeders without any namespace and they'll work, or you can namespace them under `App\Seeders` or `Database\Seeders` and they'll work the same way.

> **In the full framework:** Migrations live in `database/Migrations/`, seeders in `database/Seeders/`. The `webrium` CLI provides commands to generate, run, and roll them back — see the *Console* section.
