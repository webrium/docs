# Controllers
Controllers group related request-handling logic into classes, keeping your route files clean and your application organized.

## Creating a Controller

A controller is just a PHP class with public methods. There is no required base class to extend and no interface to implement.

```php
<?php

namespace App\Controllers;

class UserController
{
    public function index()
    {
        return view('users.index');
    }

    public function show($id)
    {
        return view('users.show', ['id' => $id]);
    }
}
```

> **In the full framework:** Controllers live in `app/Controllers/` under the `App\Controllers\` namespace. When you reference a controller by short name (e.g. `'UserController@index'`), Webrium automatically prefixes it with `App\Controllers\`. In a standalone project, use the array syntax (`[UserController::class, 'index']`) or call `Kernel::setControllerNamespace()` to set your own prefix.

## Routing to Controllers

Reference controller methods from your route files using either syntax:

```php
use Webrium\Route;

// String syntax — resolves to App\Controllers\UserController
Route::get('/users', 'UserController@index');
Route::get('/users/{id}', 'UserController@show');

// Array syntax
Route::get('/users', [UserController::class, 'index']);
```

Both syntaxes are equivalent. The string syntax automatically prefixes the class name with `App\Controllers\`. The array syntax uses the fully-qualified class name directly via `::class`, which gives you IDE autocompletion and safe refactoring.

## Route Parameters in Controllers

Parameters captured from the URL are passed to the controller method as positional arguments, in the order they appear in the route:

```php
Route::get('/posts/{category}/{slug}', 'PostController@show');
```

```php
namespace App\Controllers;

class PostController
{
    public function show($category, $slug)
    {
        return "Category: $category — Slug: $slug";
    }
}
```

### Typed Parameters

Route parameters always arrive as strings from the URL, but Webrium inspects your method signature and coerces values to the declared scalar type before invoking the action. This means typed parameters work naturally — even under `declare(strict_types=1)`:

```php
Route::get('/posts/{id}', 'PostController@show');
```

```php
public function show(int $id)
{
    // $id arrives as an integer, not the string "42"
    return Post::find($id);
}
```

Only built-in scalar types (`int`, `float`, `bool`, `string`) are coerced. Untyped, union-typed, and class-typed parameters are passed through unchanged. A non-numeric value bound to `int` or `float` is also passed through unchanged, so PHP raises a proper `TypeError` instead of silently converting it to `0`.

## Returning Responses

Whatever a controller method returns is passed to `Header::respond()`:

- **Arrays and objects** are automatically converted to JSON, with the `Content-Type` header set accordingly.
- **Strings** are sent as-is.

```php
public function index()
{
    return ['status' => 'ok', 'users' => User::all()];
    // → application/json
}

public function ping()
{
    return 'pong';
    // → plain text
}
```

## Lifecycle Hooks: `boot()` and `teardown()`

Controllers can define two optional hook methods that Webrium calls automatically:

```php
namespace App\Controllers;

class DashboardController
{
    public function boot()
    {
        // Runs before the action method.
        // Useful for authentication checks, loading shared data, etc.
    }

    public function index()
    {
        return view('dashboard.index');
    }

    public function teardown()
    {
        // Runs after the response has been sent.
        // Useful for logging, cleanup, etc.
    }
}
```

Both hooks are entirely optional — if a controller does not define them, they are simply skipped.