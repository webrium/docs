# Routing
## The Default Route File

Routes are defined using the `Route` class and are typically placed in `app/Routes/web.php`, then loaded with `Route::source()` from your application's entry point.

```php
use Webrium\Route;

Route::get('/', function () {
    return 'Hello, World!';
});
```

## Available Router Methods

Webrium supports all the common HTTP verbs:

```php
Route::get($uri, $handler);
Route::post($uri, $handler);
Route::put($uri, $handler);
Route::patch($uri, $handler);
Route::delete($uri, $handler);
Route::any($uri, $handler);
```

`any()` matches the given URI regardless of HTTP method.

## Route Handlers

A route handler can be a closure:

```php
Route::get('/ping', function () {
    return 'pong';
});
```

Or a reference to a controller method, using either of two equivalent syntaxes:

```php
// String syntax
Route::get('/users', 'UserController@index');

// Array syntax (IDE-friendly — supports autocomplete and refactoring)
Route::get('/users', [UserController::class, 'index']);
```

Both forms resolve to the same controller class inside `App\Controllers`. See [Controllers](../controllers/01-basics.md) for details on how dispatching works.

## Route Parameters

Capture segments of the URI using `{parameter}` syntax:

```php
Route::get('/users/{id}', function ($id) {
    return "User #$id";
});

Route::get('/posts/{category}/{slug}', 'PostController@show');
```

Captured parameters are passed to the handler **in the order they appear** in the URL:

```php
namespace App\Controllers;

class PostController
{
    public function show($category, $slug)
    {
        return "Category: $category, Slug: $slug";
    }
}
```

## Named Routes

You can assign a name to a route as a third argument:

```php
Route::get('/dashboard', 'DashboardController@index', 'dashboard');
```

Generate a URL for a named route using the `route()` helper or `Route::route()`:

```php
$url = route('dashboard'); // /dashboard
```

For routes with parameters, pass an associative array of values:

```php
Route::get('/users/{id}', 'UserController@show', 'users.show');

$url = route('users.show', ['id' => 42]); // /users/42
```

If a required parameter is missing, or a named route doesn't exist, an error is triggered via `Debug`.

## Loading Route Files

Use `Route::source()` to load one or more route files. By default, files are resolved from the `routes` directory:

```php
Route::source(['web.php', 'api.php']);
```

### Loading from a Custom Directory

Pass a second argument to load route files from a different directory or registered alias — useful for modular applications or packages that ship their own routes:

```php
// Load from a directory alias registered with Directory
Route::source(['shop.php'], 'modules/shop/routes');

// Load from an absolute path
Route::source(['admin.php'], '/var/www/admin/routes');
```

If a file in the list doesn't exist, an error is triggered.

## Not Found Handling

By default, unmatched requests return a `404` with a plain "Page not found" message. You can override this with a custom handler:

```php
Route::setNotFoundHandler(function () {
    return view('errors.404');
});

// or a controller
Route::setNotFoundHandler('ErrorController@notFound');
```

## Next Steps

- [Middleware](./02-middleware.md) — protecting and transforming requests
- [Route Groups](./03-groups.md) — sharing prefixes and middleware across routes
- [Controllers](../controllers/01-basics.md) — handling requests with controller classes