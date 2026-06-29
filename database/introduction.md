# Introduction

**FoxDB** is the database layer that ships with the Webrium framework — and also a self-contained PHP library you can install in any project. It bundles a fluent query builder, an Eloquent-style ORM, a schema builder for DDL, and a migration runner into a single package with no dependencies beyond PDO.

You can use FoxDB in two ways:

- **As part of the full Webrium framework** — already wired in `public/index.php`. Connection config lives in `app/Config/DB.php`, migrations in `database/Migrations/`, and your models extend `Foxdb\Eloquent\Model`. You can skip directly to *Query Builder* or *Eloquent ORM*.
- **Standalone, in any PHP project** — installed by itself, with the connection registered by hand. This page covers that path.

Whichever route you take, the APIs documented in the rest of this section are identical.

## Design Goals

A few principles shape FoxDB:

- **Zero dependencies.** The only requirement beyond PHP is PDO and the relevant driver extension (`pdo_mysql`, `pdo_pgsql`, or `pdo_sqlite`). FoxDB itself ships nothing else.
- **One API, three drivers.** MySQL, PostgreSQL, and SQLite are all first-class. Driver-specific grammar differences (`AUTO_INCREMENT` vs `SERIAL`, identifier quoting, `RETURNING` clauses) are handled inside the grammars, not in your code.
- **Safe by construction.** Every value passed through the builder is bound as a PDO parameter. Identifiers are quoted by the grammar, never interpolated. There is no string-concatenation path that touches user input.
- **Predictable behaviour.** `Builder::first()` returns `false` on no match. `Model::find()` returns `null`. Collections are immutable — transformations return new collections, never mutate in place. Casts are applied on read, leaving the raw row untouched.
- **No magic at boot.** Connections are registered explicitly. Nothing happens to your database until you make a call.

## Namespace

FoxDB lives under the `Foxdb\` namespace — not `Webrium\`. The package originated as a standalone library and kept its independent identity even after being adopted into the Webrium ecosystem:

```php
use Foxdb\DB;
use Foxdb\Schema;
use Foxdb\Eloquent\Model;
use Foxdb\Support\Collection;
use Foxdb\Migrations\Migration;
```

Every example in this section uses this namespace as-is.

## Standalone Installation

Require the package:

```bash
composer require webrium/foxdb
```

Make sure Composer's autoloader is included in your entry point:

```php
require_once __DIR__ . '/vendor/autoload.php';
```

Requirements:

- **PHP 8.1 or newer**
- A PDO driver extension for the database you're using — `pdo_mysql`, `pdo_pgsql`, or `pdo_sqlite`

## Registering a Connection

Before any query runs, you need to give FoxDB at least one connection:

```php
use Foxdb\DB;

DB::addConnection([
    'driver'   => 'mysql',        // 'mysql' | 'pgsql' | 'sqlite'
    'host'     => '127.0.0.1',
    'port'     => '3306',
    'database' => 'my_db',
    'username' => 'root',
    'password' => 'secret',
    'charset'  => 'utf8mb4',
]);
```

The first call to `addConnection()` registers a connection named `main` and uses it as the default. You can name additional connections with the second argument and switch between them:

```php
DB::addConnection([...], 'replica');
DB::use('replica');                  // switch the default connection
DB::table('users', 'replica');       // use a specific connection inline
```

For SQLite (useful for tests and small apps):

```php
DB::addConnection([
    'driver'   => 'sqlite',
    'database' => __DIR__ . '/app.sqlite',
]);

// or in-memory:
DB::addConnection(['driver' => 'sqlite', 'database' => ':memory:']);
```

See *Connections* for the full set of supported options (SSL, persistent connections, PDO attributes) and the multi-connection patterns.

> **In the full framework:** Connection config lives in `app/Config/DB.php`, loaded automatically at boot via `Kernel::source('config', ['DB.php'])`. The skeleton's `DB.php` reads from your `.env` file, so you only edit credentials in one place. You don't need to call `DB::addConnection()` yourself.

## A Quick Tour

Once a connection is registered, the rest of FoxDB is available.

### The query builder

```php
use Foxdb\DB;

$users = DB::table('users')
    ->where('active', 1)
    ->orderBy('created_at', 'desc')
    ->limit(10)
    ->get();

foreach ($users as $user) {
    echo $user->name;
}
```

### The Eloquent ORM

```php
use Foxdb\Eloquent\Model;

class User extends Model
{
    protected array $fillable = ['name', 'email'];
}

$user = User::create(['name' => 'Ali', 'email' => 'a@b.com']);
$user->name = 'Ali Khan';
$user->save();

$adults = User::where('age', '>=', 18)->get();
```

### Schema builder

```php
use Foxdb\Schema;
use Foxdb\Schema\Blueprint;

Schema::create('users', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->string('email')->unique();
    $table->timestamps();
});
```

### Migrations

```php
use Foxdb\Migrations\Migrator;

$migrator = new Migrator(__DIR__ . '/database/migrations');
$migrator->run();        // run all pending migrations
$migrator->rollback();   // roll back the most recent batch
```

## What's in `webrium/foxdb`

| Topic | Classes | Page |
| --- | --- | --- |
| Connections & raw SQL | `DB`, `Connection` | *Connections* |
| Query builder | `Foxdb\Query\Builder`, `RawExpression` | *Query Builder* |
| ORM | `Eloquent\Model` | *Eloquent ORM* |
| Relationships | `HasOne`, `HasMany`, `BelongsTo`, `BelongsToMany`, `HasManyThrough` | *Relationships* |
| Soft deletes & scopes | `Concerns\HasSoftDeletes` | *Eloquent ORM* |
| Attribute casts & serialization | (Model casts) | *Casts & Serialization* |
| Result collections | `Foxdb\Support\Collection` | *Collections* |
| Pagination | `Builder::paginate()` | *Pagination* |
| Schema builder | `Foxdb\Schema`, `Schema\Blueprint` | *Migrations & Schema* |
| Migrations | `Migrations\Migration`, `Migrations\Migrator` | *Migrations & Schema* |
| Transactions | `DB::transaction()`, `DB::beginTransaction()` | *Connections* |
| Query log & debug | `DB::enableQueryLog()`, hooks | *Connections* |

FoxDB does **not** register any global helper functions — everything goes through the static facades on `DB`, `Schema`, and your model classes. This keeps the package self-contained: nothing leaks into the global namespace just by installing it.

## Where to Go Next

The rest of this section is organised from the most common workflows outward:

- **Query Builder** — `DB::table()`, selects, conditions, joins, aggregates, writes
- **Eloquent ORM** — models, CRUD, mass assignment, dirty tracking, scopes
- **Relationships** — `HasOne`, `HasMany`, `BelongsTo`, `BelongsToMany`, `HasManyThrough`, eager loading
- **Collections** — the fluent API for working with query result sets
- **Casts & Serialization** — converting database values to PHP types, and models to arrays/JSON
- **Pagination** — paginating large result sets
- **Migrations & Schema** — defining tables, evolving the schema, running migrations
