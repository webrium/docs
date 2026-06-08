# Routing

The `Route` class is the core routing engine of Webrium. It registers URL patterns for different HTTP methods, groups routes with shared prefixes or middleware, generates URLs by name, and handles 404 responses.

```php
use Webrium\Route;
```

## Basic Routing

The simplest route accepts a URL pattern and a closure:

```php
Route::get('/', function () {
    return 'Hello, World!';
});

Route::get('/about', function () {
    return 'About page';
});
```

The value returned from the closure is automatically sent as the response.

## HTTP Methods

```php
Route::get('/users', function () { /* ... */ });

Route::post('/users', function () { /* ... */ });

Route::put('/users/{id}', function ($id) { /* ... */ });

Route::delete('/users/{id}', function ($id) { /* ... */ });

// Matches any HTTP method
Route::any('/ping', function () {
    return 'pong';
});
```

## Route Parameters

Dynamic segments are defined with curly braces `{name}` and passed as arguments to the handler:

```php
Route::get('/users/{id}', function ($id) {
    return "User ID: $id";
});

Route::get('/posts/{year}/{slug}', function ($year, $slug) {
    return "Post: $slug ($year)";
});
```

## Named Routes

Assign a name to a route to generate URLs without hardcoding paths.

```php
// Option 1 — pass name as third argument
Route::get('/users/{id}', function ($id) {
    return "User $id";
}, 'user.show');

// Option 2 — chain the name() method
Route::get('/users/{id}', function ($id) {
    return "User $id";
})->name('user.show');
```

**Generate a URL from a named route:**

```php
$url = Route::route('user.show', ['id' => 42]);
// /users/42
```

Or use the global `route()` helper:

```php
$url = route('user.show', ['id' => 42]);
```

## Route Groups

### Prefix

```php
Route::group('/api', function () {

    Route::get('/users', function () {
        return 'GET /api/users';
    });

    Route::post('/users', function () {
        return 'POST /api/users';
    });

});
```

Groups can be nested:

```php
Route::group('/api', function () {
    Route::group('/v1', function () {
        Route::get('/status', function () {
            return 'GET /api/v1/status';
        });
    });
});
```

### Middleware

```php
Route::group(['middleware' => 'AuthMiddleware@handle'], function () {

    Route::get('/dashboard', function () {
        return 'Protected dashboard';
    });

});
```

Multiple middleware as an array:

```php
Route::group(['middleware' => ['AuthMiddleware@check', 'RoleMiddleware@admin']], function () {

    Route::get('/admin', function () {
        return 'Admin panel';
    });

});
```

### Prefix + Middleware Together

```php
Route::group(['prefix' => '/admin', 'middleware' => 'AuthMiddleware@check'], function () {

    Route::get('/users', function () {
        return 'GET /admin/users';
    });

    Route::delete('/users/{id}', function ($id) {
        return "Deleted user $id";
    });

});
```

## Controllers

Instead of a closure, a route handler can be a `"Controller@method"` string:

```php
Route::get('/users',       'UserController@index');
Route::get('/users/{id}',  'UserController@show');
Route::post('/users',      'UserController@store');
Route::put('/users/{id}',  'UserController@update');
Route::delete('/users/{id}', 'UserController@destroy');
```

Route parameters are passed as arguments to the controller method:

```php
class UserController
{
    public function show($id)
    {
        return "User: $id";
    }
}
```

## Middleware

Middleware controls whether a matched route executes. It must return a truthy value to allow the request through.

**Callable middleware:**
```php
Route::group(['middleware' => function () {
    return isset($_SESSION['user']);
}], function () {
    Route::get('/profile', function () {
        return 'My profile';
    });
});
```

**String middleware:**
```php
Route::group(['middleware' => 'AuthMiddleware@handle'], function () {
    Route::get('/settings', function () {
        return 'Settings';
    });
});
```

**Multiple middleware:** Each is executed in order; if any returns falsy, access is denied.

```php
Route::group(['middleware' => [
    'AuthMiddleware@handle',
    'SubscriptionMiddleware@check',
]], function () {
    Route::get('/premium', function () {
        return 'Premium content';
    });
});
```

See [Middleware](/core/middleware) for how to write middleware classes.

## 404 Not Found Handler

```php
// Closure
Route::setNotFoundHandler(function () {
    return 'Custom 404 — Page not found';
});

// Controller
Route::setNotFoundHandler('ErrorController@notFound');
```

## Loading Route Files

Split your routes into files in the `app/Routes/` directory:

```php
// public/index.php
Route::source(['web.php', 'api.php']);
```

**Example `app/Routes/api.php`:**
```php
use Webrium\Route;

Route::group(['prefix' => '/api/v1', 'middleware' => 'AuthMiddleware@handle'], function () {
    Route::get('/users',      'UserController@index');
    Route::post('/users',     'UserController@store');
    Route::get('/users/{id}', 'UserController@show');
});
```

## Running the Router

The router starts automatically when you call `App::run()`. You do not need to call `Route::run()` directly.

```php
App::initialize(__DIR__);

Route::get('/', function () {
    return 'Hello';
});

App::run(); // starts the router
```

## API Reference

### Registration Methods

| Method | Description |
|---|---|
| `Route::get($url, $handler, $name)` | Register a GET route |
| `Route::post($url, $handler, $name)` | Register a POST route |
| `Route::put($url, $handler, $name)` | Register a PUT route |
| `Route::delete($url, $handler, $name)` | Register a DELETE route |
| `Route::any($url, $handler, $name)` | Register a route for any HTTP method |

All registration methods return a `Route` instance for chaining `.name()`.

### Other Methods

| Method | Description |
|---|---|
| `->name(string $name)` | Assign a name to the last registered route |
| `Route::group($options, callable $callback)` | Group routes with shared prefix/middleware |
| `Route::route(string $name, array $params)` | Generate a URL for a named route |
| `Route::setNotFoundHandler($handler)` | Set a custom 404 handler |
| `Route::source(array $fileNames)` | Load route files from the routes directory |
