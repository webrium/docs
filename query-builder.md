# Query Builder
The FoxDB query builder provides a fluent, convenient interface for creating and executing database queries. It can be used to perform most database operations and works across MySQL, PostgreSQL, and SQLite.

Every query starts with `DB::table()`, which returns a query builder instance for that table. You chain methods to build the query, then call a terminal method to execute it.

All values passed to the builder are bound as PDO parameters — FoxDB never interpolates values directly into SQL, so your queries are protected against SQL injection without any extra work.

```php
use Foxdb\DB;

$users = DB::table('users')->where('active', 1)->get();
```

## Retrieving Results

### Retrieving All Rows

`get()` executes the query and returns a [Collection](./collections.md) of `stdClass` objects.

```php
$users = DB::table('users')->get();

foreach ($users as $user) {
    echo $user->name;
}
```

### Retrieving a Single Row

`first()` returns the first matching row, or `null` if nothing matches.

```php
$user = DB::table('users')->where('email', 'ali@example.com')->first();

if ($user) {
    echo $user->name;
}
```

### Retrieving a Single Column

```php
// Single value from the first matching row
$email = DB::table('users')->where('id', 5)->value('email');

// A flat array of values from one column
$names = DB::table('users')->pluck('name');
// → ['Alice', 'Bob', 'Carol']

// An array keyed by another column
$nameById = DB::table('users')->pluck('name', 'id');
// → [1 => 'Alice', 2 => 'Bob']
```

### Finding a Row by Primary Key

```php
$user = DB::table('users')->find(5);
```

### Selecting Specific Columns

```php
$users = DB::table('users')->select('id', 'name', 'email')->get();

// Raw expressions
$stats = DB::table('orders')
    ->selectRaw('COUNT(*) as total, SUM(amount) as revenue')
    ->where('status', 'paid')
    ->first();

// Remove duplicates
$countries = DB::table('users')->distinct()->pluck('country');
```

### Chunking Results

When working with large tables, use `chunk()` to process rows in batches without loading everything into memory.

```php
DB::table('users')->orderBy('id')->chunk(200, function ($users) {
    foreach ($users as $user) {
        // ...
    }

    // Return false to stop chunking early
});

// Or iterate one row at a time
DB::table('users')->orderBy('id')->each(function ($user) {
    // ...
});
```

## Where Clauses

### Basic Where Clauses

```php
->where('active', 1)              // WHERE active = 1
->where('age', '>', 18)           // WHERE age > 18
->where('role', '!=', 'banned')   // WHERE role != 'banned'
->orWhere('role', 'admin')        // OR role = 'admin'
->whereNot('status', 'deleted')   // WHERE status != 'deleted'
```

### whereIn / whereNotIn

```php
->whereIn('id', [1, 2, 3])
->whereNotIn('status', ['banned', 'pending'])
->orWhereIn('role', ['admin', 'mod'])
```

> An empty array passed to `whereIn()` or `whereNotIn()` is handled safely — it compiles to `1 = 0` (always false) or `1 = 1` (always true) respectively, so your query remains valid SQL on every driver.

### whereBetween / whereNotBetween

```php
->whereBetween('age', 18, 65)
->whereNotBetween('score', 0, 10)
```

### whereNull / whereNotNull

```php
->whereNull('deleted_at')
->whereNotNull('verified_at')
```

### Date Where Clauses

Compare against parts of a datetime column:

```php
->whereDate('created_at', '=', '2024-01-15')
->whereYear('created_at', '=', 2024)
->whereMonth('created_at', '=', 1)
->whereDay('created_at', '=', 15)
->whereTime('created_at', '>', '08:00:00')
```

### Column Comparisons

```php
->whereColumn('updated_at', '>', 'created_at')
```

### Raw Where Clauses

```php
->whereRaw('YEAR(created_at) = ? AND MONTH(created_at) = ?', [2024, 3])
```

### Logical Grouping

Pass a `Closure` to group conditions in parentheses. Only closures are treated as nested groups — a plain string is always a column name, even if it happens to match a built-in PHP function name like `key` or `count`.

```php
// WHERE (role = 'admin' OR role = 'mod') AND active = 1
DB::table('users')
    ->where(function ($q) {
        $q->where('role', 'admin')->orWhere('role', 'mod');
    })
    ->where('active', 1)
    ->get();
```

### Subquery Where Clauses

```php
// WHERE EXISTS (SELECT * FROM orders WHERE orders.user_id = users.id)
->whereExists(function ($q) {
    $q->table('orders')->whereColumn('user_id', '=', 'users.id');
})
```

### Shorthand Methods

For common patterns, FoxDB provides shorter alternatives (kept for compatibility with earlier versions):

```php
->is('active', 1)       // where('active', 1)
->true('active')        // where('active', 1)
->false('active')       // where('active', 0)
->null('deleted_at')    // whereNull('deleted_at')
->notNull('email')      // whereNotNull('email')
->in('id', [1,2,3])     // whereIn('id', [...])
->notIn('id', [4,5])    // whereNotIn('id', [...])
->like('name', '%ali%') // WHERE name LIKE '%ali%'
->and('age', '>', 18)   // where()
->or('role', 'admin')   // orWhere()
```

## Ordering, Grouping, and Limiting

### Ordering

```php
->orderBy('name')                   // ASC by default
->orderBy('created_at', 'desc')
->orderByDesc('score')
->latest()                          // ORDER BY created_at DESC
->oldest()                          // ORDER BY created_at ASC
->inRandomOrder()

// Multiple columns
->orderBy('role')->orderBy('name', 'desc')
```

### Grouping

```php
->groupBy('country')
->having('total_users', '>', 100)
->havingRaw('COUNT(*) > 100')
```

### Limit and Offset

```php
->limit(10)->offset(20)
->take(10)->skip(20)   // aliases for limit/offset
```

## Joins

```php
// INNER JOIN
DB::table('users')
    ->join('orders', 'orders.user_id', '=', 'users.id')
    ->select('users.name', 'orders.total', 'orders.status')
    ->get();

// LEFT JOIN — include users even if they have no orders
DB::table('users')
    ->leftJoin('orders', 'orders.user_id', '=', 'users.id')
    ->select('users.name', 'orders.total')
    ->get();

->rightJoin('table', 'a', '=', 'b')
->crossJoin('tags')

// Join against a subquery
->joinSub($subQuery, 'alias', 'alias.user_id', '=', 'users.id')
```

## Aggregates

Aggregate methods execute the query immediately and return a single value.

```php
$count    = DB::table('users')->count();
$active   = DB::table('users')->where('active', 1)->count();
$revenue  = DB::table('orders')->where('status', 'paid')->sum('total');
$avgScore = DB::table('users')->avg('score');
$lowest   = DB::table('products')->min('price');
$highest  = DB::table('products')->max('price');

$exists = DB::table('users')->where('email', 'ali@example.com')->exists(); // bool
```

## Inserts

```php
DB::table('users')->insert([
    'name'  => 'Ali',
    'email' => 'ali@example.com',
]);

// Insert and return the auto-increment ID
$id = DB::table('users')->insertGetId([
    'name'  => 'Ali',
    'email' => 'ali@example.com',
]);

// Insert multiple rows in a single query
DB::table('users')->insertBatch([
    ['name' => 'Ali',  'email' => 'ali@example.com'],
    ['name' => 'Sara', 'email' => 'sara@example.com'],
]);
```

## Updates

```php
$affected = DB::table('users')
    ->where('id', 1)
    ->update(['name' => 'New Name']);

// Increment / decrement
DB::table('users')->where('id', 1)->increment('login_count');
DB::table('users')->where('id', 1)->increment('score', 10);
DB::table('users')->where('id', 1)->decrement('credits', 5);

// Increment and set other columns in the same query
DB::table('users')->where('id', 1)->increment('score', 10, [
    'last_activity' => date('Y-m-d H:i:s'),
]);

// Update if a match exists, otherwise insert
DB::table('settings')->updateOrInsert(
    ['key' => 'theme'],
    ['value' => 'dark']
);
```

## Deletes

```php
DB::table('users')->where('id', $id)->delete();

DB::table('sessions')
    ->where('user_id', $userId)
    ->where('created_at', '<', date('Y-m-d', strtotime('-30 days')))
    ->delete();

// Remove all rows
DB::table('cache')->truncate();
```

## Raw SQL

When the builder cannot express what you need, run raw SQL directly through the `DB` facade.

```php
$rows = DB::select('SELECT * FROM users WHERE active = ? AND age > ?', [1, 18]);
$user = DB::selectOne('SELECT * FROM users WHERE id = ?', [$id]);

DB::insert('INSERT INTO logs (level, message) VALUES (?, ?)', ['info', 'Logged in']);
$id = DB::insertGetId('INSERT INTO users (name) VALUES (?)', ['Ali']);

DB::update('UPDATE users SET active = ? WHERE last_login < ?', [0, '2023-01-01']);
DB::delete('DELETE FROM logs WHERE created_at < ?', ['2023-01-01']);

DB::statement('ALTER TABLE users ADD COLUMN bio TEXT NULL');
```

### Raw Expressions

`DB::raw()` produces an expression that is embedded directly into the query, bypassing parameter binding. Use it for things like aggregate expressions in `select()`.

```php
$stats = DB::table('products')
    ->select(DB::raw('category_id, COUNT(*) as count, AVG(price) as avg_price'))
    ->groupBy('category_id')
    ->get();
```

## Transactions

The simplest way to use transactions is to pass a closure to `DB::transaction()`. FoxDB commits automatically if the closure completes, or rolls back if it throws.

```php
DB::transaction(function () use ($fromId, $toId, $amount) {
    DB::table('accounts')->where('id', $fromId)->decrement('balance', $amount);
    DB::table('accounts')->where('id', $toId)->increment('balance', $amount);
    DB::table('transfers')->insert([
        'from_id' => $fromId,
        'to_id'   => $toId,
        'amount'  => $amount,
    ]);
});
```

For manual control:

```php
DB::beginTransaction();

try {
    // ...
    DB::commit();
} catch (\Throwable $e) {
    DB::rollBack();
    throw $e;
}

DB::inTransaction(); // bool
```

## Debugging Queries

```php
$sql      = DB::table('users')->where('active', 1)->toSql();
$bindings = DB::table('users')->where('active', 1)->getBindings();

// Dump and continue
DB::table('users')->where('active', 1)->dump()->get();

// Dump and stop execution
DB::table('users')->where('active', 1)->dd();
```

## Error Handling

By default, FoxDB throws `Foxdb\Exceptions\QueryException` when a query fails, giving you access to the SQL, bindings, and the underlying database error.

```php
use Foxdb\Exceptions\QueryException;

try {
    DB::table('users')->where('nonexistent_column', 1)->get();
} catch (QueryException $e) {
    echo $e->getSql();
    echo $e->getErrorCode();
    echo $e->getFormattedMessage();
}
```

Set `'throw_exceptions' => false` in the connection configuration to return `false` from failed operations instead of throwing.

## Next Steps

- [Pagination](./pagination.md) — split large result sets into pages
- [Eloquent ORM](./eloquent.md) — work with query results as model objects