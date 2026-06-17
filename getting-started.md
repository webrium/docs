# Getting Started
FoxDB is the database layer of the Webrium framework. It provides a fluent query builder, an Eloquent-style ORM, a schema builder, and a migration system — all built on top of PDO with no external dependencies beyond the driver itself.

This page covers everything you need to connect FoxDB to a database and start running queries.

## Requirements

- PHP 8.1 or higher
- A PDO driver for your database: `pdo_mysql`, `pdo_pgsql`, or `pdo_sqlite`

## Installation

FoxDB is included with Webrium by default. If you are using it as a standalone package:

```bash
composer require webrium/foxdb
```

## Supported Databases

FoxDB supports three database drivers, each with correct SQL generation for that driver's syntax:

| Driver | Value | Notes |
|---|---|---|
| MySQL | `mysql` | Identifiers wrapped in `` ` `` |
| PostgreSQL | `pgsql` | Identifiers wrapped in `"`, supports `RETURNING` |
| SQLite | `sqlite` | Ideal for local development and testing |

## Connecting to a Database

Before running any query, register a connection using `DB::addConnection()`. This is typically done once, in your application's bootstrap file.

```php
use Foxdb\DB;

DB::addConnection([
    'driver'           => 'mysql',
    'host'             => '127.0.0.1',
    'port'             => '3306',
    'database'         => 'my_app',
    'username'         => 'root',
    'password'         => 'secret',
    'charset'          => 'utf8mb4',
    'throw_exceptions' => true,
]);
```

### SQLite

SQLite only needs a path to the database file (or `:memory:` for an in-memory database, which is useful for tests):

```php
DB::addConnection([
    'driver'   => 'sqlite',
    'database' => '/var/data/app.sqlite',
]);

// In-memory database — useful for testing
DB::addConnection([
    'driver'   => 'sqlite',
    'database' => ':memory:',
]);
```

### PostgreSQL

```php
DB::addConnection([
    'driver'   => 'pgsql',
    'host'     => '127.0.0.1',
    'port'     => '5432',
    'database' => 'my_app',
    'username' => 'postgres',
    'password' => 'secret',
]);
```

## Connection Options

| Option | Default | Description |
|---|---|---|
| `driver` | — | `mysql`, `pgsql`, or `sqlite` |
| `host` | `127.0.0.1` | Database host (not used by SQLite) |
| `port` | driver default | Database port |
| `database` | — | Database name, or file path for SQLite |
| `username` | — | Database user (not used by SQLite) |
| `password` | — | Database password (not used by SQLite) |
| `charset` | `utf8mb4` | Connection charset (MySQL) |
| `throw_exceptions` | `true` | Throw `QueryException` on errors instead of returning `false` |

## Multiple Connections

If your application needs to talk to more than one database, register each connection under a name and switch between them as needed.

```php
DB::addConnection([...], 'main');
DB::addConnection([...], 'analytics');

// Use a specific connection for a single query
DB::table('events', 'analytics')->count();

// Switch the default connection for subsequent calls
DB::use('analytics');
DB::use('main'); // switch back

// Get the raw Connection instance
$connection = DB::connection('analytics');
```

A Model can also be assigned to a specific connection:

```php
class AnalyticsEvent extends Model
{
    protected ?string $connection = 'analytics';
}
```

## Verifying the Connection

Once a connection is registered, you can immediately run a query to confirm everything is working:

```php
$tables = DB::select("SELECT name FROM sqlite_master WHERE type='table'");

// Or, for any driver:
$result = DB::table('users')->count();
```

## Next Steps

- [Query Builder](./query-builder.md) — learn how to build and run queries
- [Eloquent ORM](./eloquent.md) — work with your tables as PHP objects