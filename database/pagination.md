# Pagination
FoxDB provides a simple, built-in way to paginate query results. Calling `paginate()` on a query returns an object containing both the rows for the requested page and metadata about the total result set — ready to use in a view or an API response.
## Basic Usage
```php
$page   = (int) ($_GET['page'] ?? 1);
$result = DB::table('posts')
    ->where('published', 1)
    ->orderBy('created_at', 'desc')
    ->paginate(15, $page);
```
`paginate()` accepts two arguments:
| Argument | Default | Description |
|---|---|---|
| `$perPage` | `15` | Number of rows per page |
| `$page` | `1` | The page number to retrieve |
## The Paginator Object
The object returned by `paginate()` has the following properties:
| Property | Type | Description |
|---|---|---|
| `total` | `int` | Total number of matching rows across all pages |
| `per_page` | `int` | Number of rows per page |
| `current_page` | `int` | The page number that was requested |
| `last_page` | `int` | Total number of pages |
| `from` | `int` | Row number of the first result on this page |
| `to` | `int` | Row number of the last result on this page |
| `data` | `Collection` | The rows for the current page |
## Displaying Results
`data` is a [Collection](./collections.md), so it can be iterated directly:
```php
foreach ($result->data as $post) {
    echo $post->title;
}
```
## Using Pagination in an API Response
A common pattern is to return the paginator's metadata alongside the page data:
```php
return [
    'meta' => [
        'total'        => $result->total,
        'per_page'     => $result->per_page,
        'current_page' => $result->current_page,
        'last_page'    => $result->last_page,
    ],
    'data' => $result->data->toArray(),
];
```
> Always call `->toArray()` on a Collection before returning or `json_encode`-ing it. Casting a model with `(array)` directly is unsafe and produces corrupted output — see [Serialization](./eloquent.md#serialization).
## Pagination with Eloquent
`paginate()` works the same way on an Eloquent query, and `data` contains model instances rather than plain objects:
```php
$result = User::where('active', 1)->paginate(20, $page);
foreach ($result->data as $user) {
    echo $user->name; // $user is a User instance
}
return ['data' => $result->data->toArray()];
```
## Building Page Links
FoxDB does not generate HTML pagination links — `last_page` and `current_page` give you everything needed to build links yourself, in whatever format your front end requires:
```php
$links = [];
for ($i = 1; $i <= $result->last_page; $i++) {
    $links[] = [
        'page'   => $i,
        'active' => $i === $result->current_page,
        'url'    => "/posts?page={$i}",
    ];
}
```
## Empty Result Sets
If there are no matching rows, `paginate()` still returns a valid object — `total` and `from`/`to` are `0`, `last_page` is `1`, and `data` is an empty Collection.
```php
$result = DB::table('posts')->where('id', -1)->paginate(15, 1);
$result->total;     // 0
$result->last_page; // 1
$result->data->count(); // 0
```
