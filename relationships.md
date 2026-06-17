# Relationships
Database tables are often related to one another — a user has many posts, a post belongs to a user, users have many roles through a pivot table. Eloquent relationships let you define these connections as methods on your models, and FoxDB handles the underlying queries and joins.

FoxDB supports five relationship types: `HasOne`, `HasMany`, `BelongsTo`, `BelongsToMany`, and `HasManyThrough`. Each is both lazy-loadable (loaded on first access) and eager-loadable (loaded up front to avoid the N+1 query problem).

## One to One

### HasOne

A `User` has one `Profile`. The foreign key (`user_id`) lives on the `profiles` table.

```php
class User extends Model
{
    public function profile(): HasOne
    {
        return $this->hasOne(Profile::class, 'user_id', 'id');
        // hasOne(related, foreignKey, localKey)
    }
}
```

```php
$profile = $user->profile; // Profile|null
```

### BelongsTo

The inverse: a `Profile` belongs to a `User`.

```php
class Profile extends Model
{
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
        // belongsTo(related, foreignKey on this table, ownerKey on related table)
    }
}
```

```php
$user = $profile->user; // User|null
```

#### Associating and Dissociating

```php
// Set the foreign key by passing the related model
$profile->user()->associate($user);
$profile->save();

// Clear the foreign key
$profile->user()->dissociate();
$profile->save();
```

## One to Many

A `User` has many `Post` records. The foreign key (`user_id`) lives on the `posts` table.

```php
class User extends Model
{
    public function posts(): HasMany
    {
        return $this->hasMany(Post::class, 'user_id', 'id');
        // hasMany(related, foreignKey, localKey)
    }
}

class Post extends Model
{
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }
}
```

```php
$posts  = $user->posts;   // Collection<Post>
$author = $post->author;  // User|null
```

All four key arguments to `hasOne`, `hasMany`, and `belongsTo` are optional — FoxDB derives sensible defaults from the model names (e.g. `user_id` for a `User` relation, and the related model's primary key). Pass them explicitly whenever your schema doesn't follow the convention.

## Many to Many

Users can have many roles, and roles can belong to many users, through a pivot table (`user_role` by default — alphabetical snake_case of both model names).

```php
class User extends Model
{
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'user_role', 'user_id', 'role_id');
        // belongsToMany(related, pivotTable, foreignPivotKey, relatedPivotKey)
    }
}
```

```php
$roles = $user->roles; // Collection<Role>
```

### Pivot Table Operations

```php
// Attach
$user->roles()->attach(3);
$user->roles()->attach([3, 5, 7]);
$user->roles()->attach(3, ['granted_at' => date('Y-m-d')]); // with pivot data

// Detach
$user->roles()->detach(3);
$user->roles()->detach();          // detach all

// Sync — attach the given IDs, detach everything else
$user->roles()->sync([3, 5]);

// Toggle — attach if missing, detach if present
$user->roles()->toggle([3, 5]);

// Check
$user->roles()->isAttached(3); // bool

// Update pivot row data without detaching
$user->roles()->updateExistingPivot(3, ['granted_at' => date('Y-m-d')]);
```

### Accessing Pivot Data

```php
$roles = $user->roles()->withPivot('granted_at', 'expires_at')->get();

foreach ($roles as $role) {
    echo $role->pivot->granted_at;
}
```

## Has Many Through

`HasManyThrough` lets you access a relation through an intermediate model. For example, to get all comments on a user's posts without loading the posts themselves:

```php
class User extends Model
{
    public function comments(): HasManyThrough
    {
        return $this->hasManyThrough(
            Comment::class,  // final related model
            Post::class,     // intermediate model
            'user_id',       // FK on posts referencing users
            'post_id',       // FK on comments referencing posts
            'id',            // local key on users
            'id',            // local key on posts
        );
    }
}
```

```php
$comments = $user->comments; // Collection<Comment>
```

## Lazy Loading

By default, relations are loaded the first time you access them, and the result is cached on the model instance for subsequent access.

```php
$user = User::find(1);

$posts = $user->posts; // runs a query
$posts = $user->posts; // returns the cached result — no second query
```

## Eager Loading

Lazy loading a relation inside a loop causes the **N+1 problem**: one query for the parent rows, plus one additional query *per row* for the relation.

```php
// 1 + N queries
$users = User::all();
foreach ($users as $user) {
    echo $user->posts->count(); // a separate query for every user
}
```

`with()` solves this by loading the relation for all parent models in a single additional query:

```php
// Exactly 2 queries total
$users = User::with('posts')->get();
foreach ($users as $user) {
    echo $user->posts->count(); // already loaded
}
```

### Loading Multiple Relations

```php
$users = User::with('posts', 'profile', 'roles')->get();
```

### Constrained Eager Loading

Pass a closure to filter or order the eager-loaded relation:

```php
$users = User::with([
    'posts' => fn($query) => $query->where('published', 1)->orderBy('created_at', 'desc')
])->get();
```

### Eager Loading and Serialization

Eager-loaded relations are included automatically in `toArray()`:

```php
$data = User::with('posts')->get()->toArray();
// $data[0]['posts'] is an array of post arrays
```

## Choosing Between Lazy and Eager Loading

Use lazy loading when you only access the relation for a single model — for example, on a "show" page for one record. Use eager loading (`with()`) whenever you're iterating over a list of models and will access a relation on each one.

## Next Steps

- [Collections](./collections.md) — work with the `Collection` returned by `HasMany` and `BelongsToMany`
- [Migrations & Schema](./migrations.md) — define the foreign key columns and pivot tables used here