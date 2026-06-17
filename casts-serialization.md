# Casts & Serialization
This page covers two related topics: how FoxDB converts database values to PHP types when you read a model's attributes (**casting**), and how models and collections are converted back into arrays and JSON for output (**serialization**).

## Attribute Casting

PDO always returns raw values as strings (or `null`) — even for integer, boolean, and JSON columns. Casts tell FoxDB how to convert these raw values into proper PHP types automatically whenever you read an attribute, and convert them back when you write.

```php
class User extends Model
{
    protected array $casts = [
        'is_active' => 'bool',
        'age'       => 'int',
        'score'     => 'float',
        'settings'  => 'array',
        'born_at'   => 'datetime',
    ];
}
```

### Available Cast Types

| Cast | Aliases | PHP type |
|---|---|---|
| `int` | `integer` | `int` |
| `float` | `double`, `real` | `float` |
| `bool` | `boolean` | `bool` |
| `string` | — | `string` |
| `array` | `json` | `array` (JSON encoded/decoded) |
| `object` | — | `stdClass` (JSON decoded) |
| `datetime` | `date` | `DateTime` |
| `immutable_datetime` | — | `DateTimeImmutable` |

### Reading Cast Attributes

```php
$user = User::find(1);

$user->is_active; // true or false — not "1" or "0"
$user->age;       // 25 (int) — not "25" (string)
$user->score;     // 99.5 (float)
$user->settings;  // ['theme' => 'dark', 'lang' => 'fa'] — decoded from JSON
$user->born_at;   // DateTime instance — can call ->format(), ->diff(), etc.
```

### Writing Cast Attributes

Casts work in both directions. When you assign a value and call `save()`, FoxDB converts it back to the correct format for storage.

```php
$user->settings = ['theme' => 'light'];
$user->save(); // stored as '{"theme":"light"}'

$user->is_active = true;
$user->save();  // stored as 1
```

### object vs array Casts

`array` decodes JSON into a PHP array (accessed with `[]`); `object` decodes into a `stdClass` (accessed with `->`):

```php
protected array $casts = [
    'settings' => 'array',   // $user->settings['theme']
    'metadata' => 'object',  // $user->metadata->theme
];
```

### datetime vs immutable_datetime

`datetime` returns a mutable `DateTime` instance. `immutable_datetime` returns a `DateTimeImmutable` instance, which is safer when you want to guarantee the original value cannot be accidentally modified elsewhere in your code.

```php
protected array $casts = [
    'created_at' => 'datetime',           // DateTime
    'expires_at' => 'immutable_datetime', // DateTimeImmutable
];
```

### Checking for a Cast

```php
$user->hasCast('age');     // true
$user->hasCast('name');    // false
```

### Null Values

A `null` value is never passed through a cast — it remains `null` regardless of the declared cast type.

```php
protected array $casts = ['settings' => 'array'];

// If settings is NULL in the database:
$user->settings; // null, not []
```

## Serialization

Serialization converts a model — or a Collection of models — into a plain array or JSON string, ready for an API response, a view, or storage.

### toArray()

`toArray()` returns an associative array of the model's attributes, with:

- All `$casts` applied
- All `$hidden` attributes removed
- Any loaded relations included

```php
class User extends Model
{
    protected array $hidden = ['password'];
    protected array $casts  = ['is_active' => 'bool'];
}

$user = User::with('posts')->find(1);

$user->toArray();
// [
//     'id'        => 1,
//     'name'      => 'Ali',
//     'is_active' => true,
//     'posts'     => [ ... ],
// ]
// 'password' is excluded
```

### toJson()

`toJson()` returns the result of `toArray()` encoded as a JSON string.

```php
$user->toJson();        // '{"id":1,"name":"Ali","is_active":true,...}'
(string) $user;         // same as toJson()
```

### json_encode()

`Model` and `Collection` both implement `JsonSerializable`, so passing either directly to `json_encode()` (or returning them inside an array from a controller) produces the same result as `toJson()` / `toArray()`.

```php
$user = User::where('email', 'ali@example.com')->first();

json_encode($user);                       // same as $user->toJson()
return ['ok' => true, 'user' => $user];   // 'user' serializes correctly
```

### Serializing Collections

When `toArray()` is called on a `Collection`, each item's own `toArray()` is used — so hidden fields, casts, and relations are correctly applied per item, not just on the outer collection.

```php
$users = User::with('posts')->get();

$users->toArray();    // array of per-model arrays
json_encode($users);  // same result
```

### The `(array)` Pitfall

Never cast a model directly with `(array)`:

```php
$arr = (array) $user; // WRONG
```

PHP's object cast exposes the model's internal `protected` properties, producing keys with null-byte prefixes (e.g. `"\0*\0attributes"`). This is not valid output and will corrupt JSON responses. Always use `->toArray()` or `->toJson()` instead.

```php
$arr = $user->toArray(); // correct
```

## Putting It Together

A typical API endpoint combines casting and serialization without any manual conversion:

```php
public function show($id)
{
    $user = User::with('posts')->findOrFail($id);

    return [
        'ok'   => true,
        'user' => $user->toArray(),
    ];
}
```

Here, `is_active` is already a boolean, `settings` is already an array, `password` is automatically excluded, and `posts` is included as an array of post arrays — all without any extra code in the controller.

## Next Steps

- [Eloquent ORM](./eloquent.md) — defining models, mass assignment, and queries
- [Relationships](./relationships.md) — how loaded relations appear in `toArray()`
- [Collections](./collections.md) — serialization at the collection level