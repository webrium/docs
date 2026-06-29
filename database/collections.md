# Collections
`Collection` is the object returned by `Builder::get()`, `Model::all()`, and any Eloquent query that returns multiple rows. It wraps the result array with a fluent, chainable API for filtering, transforming, and inspecting data — without writing manual loops.
`Collection` implements `ArrayAccess`, `Countable`, `IteratorAggregate`, and `JsonSerializable`, so it behaves like a normal array in `foreach` loops and `json_encode()`, while also providing the richer methods documented below.
```php
$users = User::all(); // Collection<User>
foreach ($users as $user) {
    echo $user->name;
}
$users->count();
$users[0];
json_encode($users);
```
Every transformation method returns a **new** Collection — the original is never modified.
## Creating a Collection
You will usually receive a Collection from a query, but you can also build one manually:
```php
use Foxdb\Support\Collection;
$collection = Collection::make([
    ['id' => 1, 'name' => 'Alice'],
    ['id' => 2, 'name' => 'Bob'],
]);
```
## Accessing Items
```php
$users->all();      // plain array of items
$users->count();    // number of items
$users->isEmpty();
$users->isNotEmpty();
$users->get(2);     // item at index 2, or null if out of range
$users[2];          // same, via ArrayAccess
$users->first();                                  // first item, or null
$users->first(fn($u) => $u->role === 'admin');    // first matching item
$users->last();                                    // last item
$users->last(fn($u) => $u->role === 'user');      // last matching item
```
### contains()
```php
$users->contains(fn($u) => $u->age > 18);   // closure form
$users->contains('role', 'admin');          // column/value form
```
> Only a `Closure` is treated as the callback form. A plain string is always a column name — even if it happens to match a built-in PHP function name like `key` or `count`.
## Filtering
```php
$active   = $users->filter(fn($u) => $u->active);
$inactive = $users->reject(fn($u) => $u->active); // inverse of filter
$unique   = $users->unique('email'); // keeps the first occurrence of each value
```
## Transforming
```php
$names = $users->map(fn($u) => (object) ['name' => strtoupper($u->name)]);
// flatMap merges the returned arrays/collections into a single flat collection
$tags = $posts->flatMap(fn($post) => $post->tags);
// each() iterates without transforming — return false to stop early
$users->each(function ($user, $index) {
    // ...
});
// reduce() folds the collection down to a single value
$total = $orders->reduce(fn($carry, $order) => $carry + $order->total, 0);
```
## Sorting
```php
$byName  = $users->sortBy('name');           // ascending
$byScore = $users->sortBy('score', 'desc');  // descending
$top     = $users->sortByDesc('score');      // shorthand for desc
// Custom comparator
$sorted = $users->sortWith(fn($a, $b) => $a->priority <=> $b->priority);
$reversed = $users->reverse();
```
## Slicing
```php
$first5  = $users->take(5);
$rest    = $users->skip(10);
$page1   = $users->only(0, 1, 2); // items at the given numeric indices
$chunks  = $users->chunk(100); // array of Collections, each with up to 100 items
```
## Combining
```php
$merged = $users->merge($otherCollection);
$merged = $users->merge($plainArray);
```
## Extracting Data
```php
$names    = $users->pluck('name');             // ['Alice', 'Bob', ...]
$nameById = $users->pluck('name', 'id');       // [1 => 'Alice', 2 => 'Bob']
$byId     = $users->keyBy('id');               // plain array keyed by id
$byRole   = $users->groupBy('role');           // plain array grouped by role value
```
## Aggregates
These operate on a numeric column across all items in the collection:
```php
$total   = $orders->sum('total');
$average = $orders->avg('total');
$lowest  = $orders->min('total');
$highest = $orders->max('total');
```
## Serialization
```php
$arr  = $users->toArray();    // array of arrays — uses each item's toArray() if available
$json = $users->toJson();
$json = json_encode($users);  // identical to toJson()
(string) $users;              // JSON string
```
When a Collection contains Eloquent models, `toArray()` calls each model's own `toArray()` — so `$hidden` fields, casts, and loaded relations are all applied correctly per item. This is why `toArray()` should always be used instead of casting with `(array)`.
```php
return ['ok' => true, 'users' => User::with('posts')->get()->toArray()];
```
## Full Method Reference
| Method | Description |
|---|---|
| `all()` | Get the underlying array |
| `count()` | Number of items |
| `isEmpty()` / `isNotEmpty()` | Check for items |
| `get($index)` | Item at index, or `null` |
| `first($filter = null)` | First item, optionally matching a closure |
| `last($filter = null)` | Last item, optionally matching a closure |
| `contains($callbackOrColumn, $value = null)` | Check existence by closure or column/value |
| `filter($callback)` | Keep items matching the callback |
| `reject($callback)` | Remove items matching the callback |
| `map($callback)` | Transform each item |
| `flatMap($callback)` | Map and flatten one level |
| `each($callback)` | Iterate; return `false` to stop |
| `reduce($callback, $initial = null)` | Fold to a single value |
| `pluck($column, $keyColumn = null)` | Extract a column as an array |
| `keyBy($column)` | Plain array keyed by a column |
| `groupBy($column)` | Plain array grouped by a column |
| `sum($column)` / `avg($column)` / `min($column)` / `max($column)` | Aggregates |
| `sortBy($column, $direction = 'asc')` | Sort by a column |
| `sortByDesc($column)` | Sort descending |
| `sortWith($callback)` | Sort with a custom comparator |
| `unique($column)` | Remove duplicate values for a column |
| `take($n)` / `skip($n)` | Slice from the start |
| `chunk($size)` | Split into an array of Collections |
| `merge($other)` | Combine with another Collection or array |
| `reverse()` | Reverse the order |
| `only(...$indices)` | Keep items at the given numeric indices |
| `toArray()` / `toJson()` | Serialize |
## Next Steps
- [Casts & Serialization](./casts-serialization.md) — how `toArray()` works on collections of models
- [Migrations & Schema](./migrations.md) — define the tables your collections come from
- [Query Builder](./query-builder.md) — build the queries that return collections