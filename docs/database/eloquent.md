# Eloquent ORM

FoxDB includes an Eloquent-style ORM that makes database interaction intuitive. Each database table has a corresponding **Model** class.

::: info
Webrium's Eloquent is inspired by Laravel's Eloquent. While it does not include every Laravel feature, it provides the most commonly used functionality.
:::

## Creating a Model

Use the Console to generate a model:

```bash
# Auto-generates table name (user → users)
php webrium make:model User -t

# Specify the table name explicitly
php webrium make:model User --table=users

# Without a database table
php webrium make:model UserHelper
```

A generated model looks like:

```php
<?php
namespace App\Models;

use Foxdb\Model;

class User extends Model
{
    //
}
```

## Table Names

By convention, Webrium converts the model name to snake_case and pluralizes it:

| Model | Assumed Table |
|---|---|
| `User` | `users` |
| `Flight` | `flights` |
| `AirTrafficController` | `air_traffic_controllers` |

To override the table name:

```php
class Flight extends Model
{
    protected $table = 'my_flights';
}
```

## Timestamps

By default, Eloquent expects `created_at` and `updated_at` columns and updates them automatically. To disable:

```php
class Flight extends Model
{
    protected $timestamps = false;
}
```

## Visible Fields

To limit which fields are returned by default:

```php
class Flight extends Model
{
    protected $visible = ['id', 'title', 'customer_id'];
}
```

## Retrieving Records

```php
use App\Models\User;

// Get all records
$users = User::get();

foreach ($users as $user) {
    echo $user->name;
}
```

### Building Queries

Since each model is also a query builder, you can chain constraints:

```php
$flights = Flight::where('active', 1)
               ->orderBy('name')
               ->take(10)
               ->get();
```

### Find by ID

```php
// Returns a Model instance (with save(), delete(), etc.)
$user = User::find(3);

if ($user) {
    echo $user->name;
    
    // Update
    $user->name = 'New Name';
    $user->save();
    
    // Delete
    $user->delete();
}
```

The difference between `find()` and `first()`:
- `first()` returns a `stdClass` object
- `find()` returns a full **Model** instance with save/delete methods

### First Match

```php
$user = User::where('email', 'john@example.com')->first();

if ($user) {
    echo $user->name;
}
```

### Pagination

```php
$page   = $_GET['page'] ?? 1;
$result = User::where('active', 1)->paginate(15, $page);

foreach ($result->data as $user) {
    echo $user->name;
}

echo "Page {$result->current_page} of {$result->last_page}";
```

## Inserting Records

```php
// Create a new record
$user = new User();
$user->name  = 'John Doe';
$user->email = 'john@example.com';
$user->save();

// Or using insert()
User::insert([
    'name'  => 'Jane Doe',
    'email' => 'jane@example.com',
]);
```

## Updating Records

```php
$user = User::find(1);
$user->name = 'Updated Name';
$user->save();
```

## Deleting Records

```php
$user = User::find(1);
$user->delete();

// Or via query
User::where('active', 0)->delete();
```

## Copying Records

The `copy()` method duplicates a record without the `created_at` and `updated_at` values:

```php
$trade = Trade::find(104);

$newTrade = Trade::copy($trade);
$newTrade->user_id = $newUserId;
$newTrade->save();
```

## Aggregates

```php
$count = User::count();
$max   = User::max('age');
$avg   = User::where('active', 1)->avg('score');
```

## Advanced: Custom Select with Aggregates

```php
$result = UserActivity::select(function($s) {
    $s->sum('percent')->as('sum');
    $s->count()->as('count');
})
->where('client_id', $client->id)
->first();

// $result->sum, $result->count
```

## Complex Conditions

```php
DB::table('messages')
  ->where('credit', '<', 0)
  ->where(function($w) use ($userA, $userB) {
    $w->where(function($s) use ($userA, $userB) {
        $s->where('from_user_id', $userA)->or('to_user_id', $userB);
    });
    $w->or(function($s) use ($userA, $userB) {
        $s->where('from_user_id', $userB)->or('to_user_id', $userA);
    });
  })
  ->get();
```
