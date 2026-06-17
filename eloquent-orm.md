# Eloquent ORM
Eloquent is FoxDB's ORM layer. It lets you work with your database tables as PHP classes — each table maps to a Model, and each row becomes an instance of that Model. Instead of writing raw queries everywhere, you interact with your data through objects with automatic casting, mass-assignment protection, dirty tracking, and relationships.

## Defining a Model

A model is a class that extends `Foxdb\Eloquent\Model`. At minimum, the class itself is enough — FoxDB infers the table name automatically.

```php
use Foxdb\Eloquent\Model;

class User extends Model
{
    // The database table. If omitted, derived from the class name:
    // User → users, UserProfile → user_profiles
    protected string $table = 'users';

    // The primary key column. Defaults to 'id'.
    protected string $primaryKey = 'id';

    // Columns that may be set via create() or fill().
    protected array $fillable = ['name', 'email', 'age'];

    // Columns excluded from toArray() / toJson() output.
    protected array $hidden = ['password'];

    // Disable created_at / updated_at management.
    protected bool $timestamps = true;

    // Use a specific named connection instead of the default.
    protected ?string $connection = null;

    // Attribute casting — see "Attribute Casting" below.
    protected array $casts = [
        'is_active' => 'bool',
        'settings'  => 'array',
    ];
}
```

## Mass Assignment

Mass assignment means setting several attributes at once via `create()` or `fill()`. FoxDB protects against accidentally saving columns that should not be settable from user input — for example, an `is_admin` flag injected through a form.

- **`$fillable`** — an allowlist. Only these columns can be mass-assigned.
- **`$guarded`** — a blocklist. Everything except these columns can be mass-assigned. An empty array (`[]`) allows everything.

```php
// $fillable = ['name', 'email']
User::create(['name' => 'Ali', 'email' => 'a@b.com', 'role' => 'admin']);
// 'role' is silently ignored

// Bypass the guard entirely (e.g. in a seeder)
$user = new User();
$user->forceFill(['name' => 'Ali', 'role' => 'admin'])->save();
```

## Retrieving Models

```php
// All rows
$users = User::all();

// By primary key
$user = User::find(1);          // User|null
$user = User::findOrFail(1);    // User, or throws ModelNotFoundException

// First matching row
$user = User::where('email', 'ali@example.com')->first();
$user = User::firstWhere('email', 'ali@example.com'); // shorthand

// Any Builder method can be chained
$admins = User::where('role', 'admin')
              ->where('active', 1)
              ->orderBy('name')
              ->get();

// Aggregates
$count = User::where('active', 1)->count();
$avg   = User::avg('score');

// Existence check
$exists = User::exists(['email' => 'ali@example.com']); // bool
```

`first()` and `find()` return `null` (not `false`) when nothing matches, and the returned instance is always the concrete model class — so your editor's autocomplete works immediately after `where(...)->first()`.

## Inserting and Updating

```php
// create() fills, saves, and returns the new model
$user = User::create(['name' => 'Ali', 'email' => 'ali@example.com', 'age' => 25]);
echo $user->id;          // auto-increment ID
echo $user->created_at;  // set automatically

// Or build and save manually
$user        = new User();
$user->name  = 'Ali';
$user->email = 'ali@example.com';
$user->save();

// Update an existing model
$user       = User::findOrFail(1);
$user->name = 'New Name';
$user->save(); // only changed columns are written

// Mass update via query
User::where('active', 0)->update(['score' => 0]);
```

### Dirty Tracking

FoxDB tracks which attributes have changed since the model was loaded or last saved. `save()` uses this to only write changed columns.

```php
$user = User::find(1); // name = 'Ali'

$user->isDirty();        // false

$user->name = 'New Name';
$user->isDirty();         // true
$user->isDirty('name');   // true
$user->isDirty('email');  // false

$user->getDirty();        // ['name' => 'New Name']

$user->save();            // UPDATE users SET name = ? WHERE id = ?
                          // email is not included
```

## Deleting Models

```php
$user = User::findOrFail(1);
$user->delete();

// Delete all rows matching a condition
User::where('created_at', '<', '2020-01-01')->delete();
```

## Reloading

```php
// fresh() returns a new instance from the database, leaving $user untouched
$fresh = $user->fresh();

// refresh() updates the current instance in place
$user->refresh();
```

## Casting Attributes

Database values come back from PDO as strings — even for integers, booleans, and JSON columns. The `$casts` property tells FoxDB how to convert these to native PHP types automatically:

```php
class User extends Model
{
    protected array $casts = [
        'is_active' => 'bool',
        'settings'  => 'array',
    ];
}

$user = User::find(1);
$user->is_active; // true (bool), not "1" (string)
$user->settings;  // ['theme' => 'dark'] (array), decoded from JSON
```

See [Casts & Serialization](./casts-serialization.md) for the full list of cast types and how casting interacts with `toArray()` / `toJson()`.

## Soft Deletes

Soft deletes let you "delete" a record without removing it from the database, so it can be restored later. Add `HasSoftDeletes` to a model and a nullable `deleted_at` column to its table.

```php
use Foxdb\Eloquent\Concerns\HasSoftDeletes;

class Post extends Model
{
    use HasSoftDeletes;
}
```

```php
$post = Post::find(1);
$post->delete();      // sets deleted_at — row stays in the database

Post::find(1);         // null — soft-deleted rows are excluded by default
Post::count();         // does not count soft-deleted rows

$post->trashed();      // true

// Include soft-deleted rows
Post::withTrashed()->get();
Post::withTrashed()->find(1);

// Only soft-deleted rows
Post::onlyTrashed()->get();

// Restore
Post::withTrashed()->find(1)->restore(); // clears deleted_at
```

`HasSoftDeletes` is detected correctly even when applied on a parent model and inherited by a subclass:

```php
class BaseModel extends Model
{
    use HasSoftDeletes;
}

class Post extends BaseModel
{
    protected string $table = 'posts';
}

Post::find(1); // soft-delete scope still applies
```

## Local Scopes

A local scope is a reusable query condition defined as a method prefixed with `scope`. Call it as a static method without the prefix — and it is fully chainable with other scopes and Builder methods.

```php
class User extends Model
{
    public function scopeActive(Builder $q): Builder
    {
        return $q->where('is_active', 1);
    }

    public function scopeRole(Builder $q, string $role): Builder
    {
        return $q->where('role', $role);
    }
}
```

```php
User::active()->get();
User::role('admin')->get();

User::active()
    ->role('mod')
    ->orderBy('name')
    ->paginate(20, $page);
```

## Serialization

`toArray()` and `toJson()` convert a model — or a Collection of models — into plain data, with `$hidden` removed, `$casts` applied, and any loaded relations included.

```php
$user = User::with('posts')->find(1);

$arr  = $user->toArray();
$json = $user->toJson();

return ['ok' => true, 'user' => $arr];
```

> **Never** cast a model with `(array) $model` — this exposes internal properties with corrupted null-byte keys. Always use `->toArray()`.

See [Casts & Serialization](./casts-serialization.md) for the full reference, including how `json_encode()`, `JsonSerializable`, and Collection serialization work together.

## Next Steps

- [Casts & Serialization](./casts-serialization.md) — full reference for casting and output
- [Relationships](./relationships.md) — define and query related models
- [Collections](./collections.md) — work with the results returned by `all()` and `get()`
- [Migrations & Schema](./migrations.md) — define the tables behind your models