# Middleware
Middleware provides a way to run logic before a route's handler executes — typically for authentication, authorization, logging, or rate limiting. If middleware fails, the request is stopped immediately with a `403 Forbidden` response, and the route handler never runs.

Middleware in Webrium is applied through [route groups](./03-groups.md) — there is no per-route `->middleware()` method. Wrap any routes that need protection in a `Route::group()` call.

## Defining Middleware

Webrium supports several forms of middleware.

### Closures

The simplest form — any callable that returns a boolean:

```php
Route::group(['middleware' => function () {
    return isset($_SESSION['user_id']);
}], function () {
    Route::get('/admin', 'AdminController@index');
});
```

> Middleware callables must return `true` to allow the request through, or `false` to block it.

### Class-Based Middleware

For reusable middleware, create a plain class with a `handle()` method:

```php
namespace App\Middlewares;

class AuthMiddleware
{
    public function handle()
    {
        return isset($_SESSION['user_id']);
    }
}
```

Reference it by class name:

```php
Route::group(['middleware' => 'AuthMiddleware'], function () {
    Route::get('/dashboard', 'DashboardController@index');
});
```

### Class-Based Middleware with a Custom Method

If you want multiple checks in one class, or a more descriptive method name, use `Class@method` syntax:

```php
namespace App\Middlewares;

class AuthMiddleware
{
    public function handle()
    {
        return isset($_SESSION['user_id']);
    }

    public function isAdmin()
    {
        return isset($_SESSION['user_id']) && $_SESSION['role'] === 'admin';
    }
}
```

```php
Route::group(['middleware' => 'AuthMiddleware@isAdmin'], function () {
    Route::get('/admin', 'AdminController@index');
});
```

### Global Functions

A plain function name is also supported:

```php
function isLoggedIn(): bool
{
    return isset($_SESSION['user_id']);
}

Route::group(['middleware' => 'isLoggedIn'], function () {
    Route::get('/profile', 'ProfileController@index');
});
```

### Static Pass/Fail

Booleans are accepted directly — useful for feature flags or conditionally enabling a group of routes:

```php
Route::group(['middleware' => env('FEATURE_BETA', false)], function () {
    Route::get('/beta', 'BetaController@index');
});
```

## Multiple Middleware

Pass an array to apply multiple checks. All must return `true` for the request to proceed:

```php
Route::group(['middleware' => ['AuthMiddleware', 'RateLimiter@check']], function () {
    Route::get('/api/data', 'ApiController@data');
});
```

## Middleware Failure Behavior

If any middleware in the chain returns `false`, the router immediately responds with:

```json
{ "error": "Forbidden" }
```

with HTTP status `403`. The route handler is never invoked, and no further routes are checked.

## Next Steps

- [Route Groups](./03-groups.md) — applying middleware to multiple routes at once
- [Controllers](../controllers/01-basics.md) — the `boot()` hook as an alternative for per-controller checks