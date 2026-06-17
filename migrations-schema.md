# Migrations & Schema
The Schema Builder lets you create and modify database tables using a fluent PHP API instead of writing raw DDL. Migrations are version-controlled PHP classes that apply (and reverse) schema changes, so your database structure can evolve alongside your code.

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
$table->timestamps();        // adds created_at and updated_at
$table->softDeletes();       // adds deleted_at (default name)
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
Schema::drop('users');               // drop the table (errors if it doesn't exist)
Schema::dropIfExists('users');       // safe — no error if missing
Schema::rename('old_table', 'new_table');

Schema::hasTable('users');                    // bool
Schema::hasColumn('users', 'email');          // bool
Schema::getColumnNames('users');              // array<string>
Schema::getColumns('users');                  // detailed column info
```

All Schema methods accept an optional `$connection` argument as their last parameter, for working with a non-default database connection.

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

### File Naming Convention

Migration files must follow the pattern `YYYY_MM_DD_HHMMSS_description.php`, for example:

```
2024_01_15_120000_create_users_table.php
2024_01_16_093000_add_score_to_users_table.php
```

The timestamp prefix determines run order.

## Running Migrations

The `Migrator` class manages applying and reversing migrations, tracking which have already run in a `migrations` table.

```php
use Foxdb\Migrations\Migrator;

$migrator = new Migrator('/path/to/migrations');

// Run all pending migrations
$migrator->run();

// Run only the next 3 pending migrations
$migrator->run(3);

// Roll back the most recent batch
$migrator->rollback();

// Roll back the last 2 batches
$migrator->rollback(2);

// Roll back everything
$migrator->reset();

// Reset and re-run everything — useful for refreshing a dev database
$migrator->refresh();
```

### Inspecting Migration Status

```php
$status = $migrator->status();
// Returns an array describing each migration file and whether it has run

if ($migrator->hasPendingMigrations()) {
    echo "Database is not up to date.";
}

$pending = $migrator->getPendingMigrations();
```

### Using a Custom Migrations Table or Connection

```php
$migrator = new Migrator(
    path: '/path/to/migrations',
    table: 'custom_migrations',
    connection: 'analytics',
);
```

## Summary

This concludes the database section of the documentation. From here:

- [Getting Started](./getting-started.md) — connection setup
- [Query Builder](./query-builder.md) — fluent SQL queries
- [Pagination](./pagination.md) — paging large result sets
- [Eloquent ORM](./eloquent.md) — models, mass assignment, and queries
- [Relationships](./relationships.md) — hasOne, hasMany, belongsToMany, and more
- [Collections](./collections.md) — working with query results
- [Casts & Serialization](./casts-serialization.md) — type casting and output formatting