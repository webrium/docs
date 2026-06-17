# Controllers
# 

Controllers group related request-handling logic into classes, keeping your route files clean and your application organized.

## Creating a Controller

Controller classes live in `app/Controllers` and belong to the `App\Controllers` namespace:

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

See [Responses](../responses/01-basics.md) for more on controlling status codes and headers.

## Lifecycle Hooks: `boot()` and `teardown()`

Controllers can define two optional hook methods that the [Kernel](../architecture/kernel.md) calls automatically:

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

Both hooks are entirely optional — if a controller doesn't define them, they're simply skipped.

## Next Steps

- [Requests](../requests/01-basics.md) — accessing input data inside controllers
- [Responses](../responses/01-basics.md) — shaping what `Header::respond()` sends
- [Views](./06-views.md) — rendering templates from a controller