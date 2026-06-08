# Database Configuration

## Adding a Connection

Configure your database connection in `app/Config/DB.php`:

```php
<?php
use Foxdb\DB;
use Foxdb\Config;

DB::addConnection('main', [
    'host'             => env('DB_HOST', 'localhost'),
    'port'             => env('DB_PORT', '3306'),
    'database'         => env('DB_DATABASE'),
    'username'         => env('DB_USERNAME'),
    'password'         => env('DB_PASSWORD'),
    'charset'          => Config::UTF8,
    'collation'        => Config::UTF8_GENERAL_CI,
    'fetch'            => Config::FETCH_CLASS,
    'throw_exceptions' => true,
]);
```

The `'main'` string is the default connection name.

## Configuration Options

| Option | Description | Example |
|---|---|---|
| `host` | Database server hostname | `localhost` |
| `port` | Database server port | `3306` |
| `database` | Database name | `my_app` |
| `username` | Database username | `root` |
| `password` | Database password | `secret` |
| `charset` | Character set | `Config::UTF8` |
| `collation` | Collation | `Config::UTF8_GENERAL_CI` |
| `fetch` | Fetch mode | `Config::FETCH_CLASS` |
| `throw_exceptions` | Throw exceptions on error | `true` |

## Multiple Connections

```php
DB::addConnection('main', [/* ... */]);
DB::addConnection('analytics', [
    'host'     => env('ANALYTICS_DB_HOST'),
    'database' => env('ANALYTICS_DB_NAME'),
    // ...
]);

// Switch to a different connection
DB::use('analytics');
$results = DB::table('events')->get();

// Switch back
DB::use('main');
```

## Error Handling

### With Exceptions (Recommended)

```php
use Foxdb\DB;
use Foxdb\Exceptions\QueryException;
use Foxdb\Exceptions\DatabaseException;

try {
    $users = DB::table('users')->where('active', 1)->get();
} catch (QueryException $e) {
    echo "SQL Error: "  . $e->getMessage();
    echo "SQL Query: "  . $e->getSql();
    echo "Parameters: " . json_encode($e->getParams());
    echo "Error Code: " . $e->getErrorCode();
}
```

### Without Exceptions

Set `throw_exceptions: false` to return `false` on errors instead:

```php
DB::addConnection('main', [
    // ...
    'throw_exceptions' => false,
]);

$result = DB::query("SELECT * FROM non_existent_table");
if ($result === false) {
    // Handle the error
}
```

## Available Exception Classes

| Class | When thrown |
|---|---|
| `QueryException` | SQL query execution errors |
| `DatabaseException` | Connection and transaction errors |
