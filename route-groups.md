# Route Groups
Route groups let you share a URL prefix and/or middleware across multiple routes without repeating them.

## Basic Usage

`Route::group()` accepts either a string (used as a prefix) or an array of options, followed by a closure where the grouped routes are defined.

### String Prefix

```php
use Webrium\Route;

Route::group('admin', function () {
    Route::get('/dashboard', 'AdminController@dashboard'); // /admin/dashboard
    Route::get('/users', 'AdminController@users');         // /admin/users
});
```

### Array of Options

```php
Route::group(['prefix' => 'api'], function () {
    Route::get('/users', 'UserController@index'); // /api/users
    Route::get('/posts', 'PostController@index');  // /api/posts
});
```

## Grouping with Middleware

Add a `middleware` key to apply middleware to every route inside the group:

```php
Route::group(['prefix' => 'api', 'middleware' => 'AuthMiddleware'], function () {
    Route::get('/profile', 'ProfileController@show');
    Route::post('/profile', 'ProfileController@update');
});
```

Any of the middleware forms described in [Middleware](./02-middleware.md) — closures, class names, `Class@method`, function names, or arrays of these — can be used here.

## Middleware Without a Prefix

The `prefix` key is optional. You can apply middleware to a group of routes without changing their URLs:

```php
Route::group(['middleware' => 'AuthMiddleware'], function () {
    Route::get('/dashboard', 'DashboardController@index');
    Route::get('/settings', 'SettingsController@index');
});
```

## Nested Groups

Groups can be nested. Prefixes are concatenated, and the innermost middleware applies to its own routes:

```php
Route::group(['prefix' => 'api'], function () {

    Route::get('/status', 'ApiController@status'); // /api/status

    Route::group(['prefix' => 'admin', 'middleware' => 'AuthMiddleware@isAdmin'], function () {
        Route::get('/users', 'AdminController@users'); // /api/admin/users
    });

});
```

In this example, `/api/status` has no middleware, while `/api/admin/users` is both prefixed with `api/admin` and protected by `AuthMiddleware@isAdmin`.

## Next Steps

- [Middleware](./02-middleware.md) — all supported middleware forms
- [Controllers](../controllers/01-basics.md) — handling grouped routes with controllers