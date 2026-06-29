# Connections

Every FoxDB query — whether through the query builder, an Eloquent model, the schema builder, or a raw SQL call — runs on a **connection**. A connection is a registered PDO handle plus the configuration that opened it. FoxDB lets you register as many as you need, switch between them, and route specific tables or models to specific ones.

This page covers everything related to connections: registering them, switching between them, running raw SQL, transactions, and inspecting query activity.

## Registering Connections

Use `DB::addConnection($config, $name = null)` to register a connection. The first one registered also becomes the default:

```php
use Foxdb\DB;

DB::addConnection([
    'driver'   => 'mysql',
    'host'     => '127.0.0.1',
    'port'     => '3306',
    'database' => 'my_db',
    'username' => 'root',
    'password' => 'secret',
    'charset'  => 'utf8mb4',
]);
```

When no name is provided, the connection is registered as `main`. To register additional connections, pass a name:

```php
DB::addConnection([...], 'replica');
DB::addConnection([...], 'analytics');
```

### Supported drivers

FoxDB supports three drivers out of the box:

| Driver | Required PDO extension |
| --- | --- |
| `mysql` | `pdo_mysql` |
| `pgsql` | `pdo_pgsql` |
| `sqlite` | `pdo_sqlite` |

### Driver-specific config

**MySQL / PostgreSQL** accept the standard keys:

```php
[
    'driver'   => 'mysql',     // or 'pgsql'
    'host'     => '127.0.0.1',
    'port'     => '3306',      // 5432 for postgres
    'database' => 'my_db',
    'username' => 'root',
    'password' => 'secret',
    'charset'  => 'utf8mb4',   // optional
]
```

**SQLite** only needs `driver` and `database`. The `database` value is either a filesystem path or the special `:memory:` value for an in-memory database:

```php
DB::addConnection([
    'driver'   => 'sqlite',
    'database' => __DIR__ . '/app.sqlite',
]);

DB::addConnection([
    'driver'   => 'sqlite',
    'database' => ':memory:',
]);
```

## Switching the Default Connection

`DB::use($name)` changes which connection subsequent calls use when no explicit connection is specified:

```php
DB::use('replica');

DB::table('users')->get();           // runs on 'replica'

DB::use('main');
DB::table('users')->insert([...]);   // runs on 'main'
```

## Using a Specific Connection Inline

Most APIs accept an optional connection name as an extra argument, so you don't need to switch the default just for a single call:

```php
DB::table('users', 'replica')->get();          // query builder

Schema::create('users', $callback, 'replica'); // schema builder

DB::select('SELECT 1', [], 'replica');         // raw SQL
```

For Eloquent models, set the `$connection` property on the class:

```php
use Foxdb\Eloquent\Model;

class Log extends Model
{
    protected ?string $connection = 'replica';
}
```

## Getting the Connection Instance

`DB::connection($name = null)` returns the underlying `Connection` object, useful for working directly with the PDO handle or for some lower-level operations:

```php
$conn = DB::connection();           // default
$conn = DB::connection('replica');  // by name

$pdo = $conn->getPdo();             // raw PDO instance
```

## Inspecting Registered Connections

```php
DB::hasConnection('replica');   // bool
DB::getConnectionNames();       // array of names
DB::reset();                    // clear all registered connections
```

`DB::reset()` is mainly useful in tests, where each test case wants to start with a fresh registry.

## Raw SQL

When the query builder isn't the right tool — complex CTEs, vendor-specific features, schema introspection queries — drop down to raw SQL through the `DB` facade:

```php
// SELECT
DB::select('SELECT * FROM users WHERE active = ?', [1]);
// → array<stdClass>

DB::selectOne('SELECT * FROM users WHERE id = ?', [42]);
// → stdClass | false

// Write operations
DB::insert('INSERT INTO logs (message) VALUES (?)', ['hi']);
// → bool

DB::insertGetId('INSERT INTO users (name) VALUES (?)', ['Ali']);
// → int|string  (last inserted id)

DB::update('UPDATE users SET active = ? WHERE id = ?', [0, 5]);
// → int  (number of affected rows)

DB::delete('DELETE FROM users WHERE id = ?', [5]);
// → int  (number of affected rows)
```

For statements that don't naturally return data — `CREATE INDEX`, `ALTER`, `SET`, vendor pragmas:

```php
DB::statement('CREATE INDEX idx_users_email ON users(email)');
// → bool

DB::affectingStatement('UPDATE users SET seen_at = NOW()');
// → int (affected rows)
```

All bindings are passed as PDO parameters — never interpolated into the SQL string — so user input is safe even in raw queries.

## Transactions

### Automatic transactions

The simplest form is `DB::transaction()`, which wraps a closure. It begins a transaction, runs the closure, commits on success, and rolls back on any uncaught exception:

```php
DB::transaction(function () {
    DB::table('accounts')->where('id', 1)->decrement('balance', 100);
    DB::table('accounts')->where('id', 2)->increment('balance', 100);
});
```

If the closure throws, the transaction is rolled back and the exception is re-thrown — exactly what you want.

### Manual transactions

For longer or branching flows, manage the transaction yourself:

```php
DB::beginTransaction();

try {
    // ... your work ...
    DB::commit();
} catch (\Throwable $e) {
    DB::rollBack();
    throw $e;
}
```

`DB::inTransaction()` returns whether a transaction is currently open on the default connection.

### Per-connection transactions

All three methods (`transaction`, `beginTransaction`, `commit`, `rollBack`, `inTransaction`) operate on the default connection. To run a transaction on a specific connection, switch to it first or call the methods on the `Connection` instance directly:

```php
$conn = DB::connection('replica');
$conn->transaction(function () use ($conn) {
    // ... runs on 'replica' ...
});
```

## Query Log and Hooks

FoxDB has a built-in query log for debugging and profiling. It is **off by default** — enabling it should be a deliberate choice in development or in tests:

```php
DB::enableQueryLog();

DB::table('users')->where('active', 1)->get();
DB::table('orders')->where('user_id', 5)->get();

$log = DB::getQueryLog();
// array of entries: { sql, bindings, time (ms) }

DB::disableQueryLog();
```

Other inspection helpers:

```php
DB::getLastQuery();           // single entry: { sql, bindings, time }
DB::getQueryCount();           // int — number of queries logged
DB::getTotalQueryTime();       // float — total time in milliseconds
DB::getSlowQueries(100.0);     // entries slower than 100 ms
DB::flushQueryLog();           // clear log but keep logging on
```

### Hooks

Two callbacks let you observe every query — useful for logging, profiling, or detecting N+1 patterns in development:

```php
DB::beforeQuery(function (string $sql, array $bindings) {
    error_log("SQL: $sql");
});

DB::afterQuery(function (string $sql, array $bindings, float $timeMs) {
    if ($timeMs > 100) {
        error_log("Slow query ({$timeMs}ms): $sql");
    }
});
```

Both hooks fire on every query regardless of whether the query log is enabled — they are independent mechanisms. Multiple callbacks can be registered; they run in registration order.

## Multiple Connections in Practice

A common setup is one connection for the primary database and another for a read replica:

```php
DB::addConnection([
    'driver'   => 'mysql',
    'host'     => 'primary.db.local',
    'database' => 'app',
    // ...
], 'main');

DB::addConnection([
    'driver'   => 'mysql',
    'host'     => 'replica.db.local',
    'database' => 'app',
    // ...
], 'replica');

// Writes go to primary (default)
DB::table('orders')->insert([...]);

// Reads can be routed to the replica
DB::table('orders', 'replica')->where('user_id', $userId)->get();
```

For models, you can split read/write at the class level by overriding the `$connection` property in a base class:

```php
class ReadOnlyModel extends Model
{
    protected ?string $connection = 'replica';
}

class Order extends ReadOnlyModel {}
```

> **In the full framework:** Connection config lives in `app/Config/DB.php`, which is loaded automatically at boot. The skeleton's `DB.php` reads credentials from your `.env` file, so editing `.env` is normally all you need to change the connection.
