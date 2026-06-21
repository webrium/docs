# Routing

This guide covers everything related to routing in Webrium: defining routes, organizing them into groups, and protecting them with middleware.

- [Routing Basics](#routing-basics)
- [Route Groups](#route-groups)
- [Middleware](#middleware)

---

## Routing Basics

### The Default Route File

Routes are defined using the `Route` class and are typically placed in `app/Routes/web.php`, then loaded with `Route::source()` from your application's entry point.

```php
use Webrium\Route;

Route::get('/', function () {
    return 'Hello, World!';
});
```

### Available Router Methods

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

Each verb method also accepts an optional third argument — a route name (see [Named Routes](#named-routes)).

#### Method Spoofing

Plain HTML forms can only submit `GET` or `POST`. To target a `PUT`, `PATCH`, or `DELETE` route from a form, submit a `POST` request with a `_method` field holding the intended verb:

```html
<form method="POST" action="/users/42">
    <input type="hidden" name="_method" value="DELETE">
    <!-- ... -->
</form>
```

Webrium reads `_method` on incoming `POST` requests and routes the request as the spoofed method. Only `PUT`, `PATCH`, and `DELETE` can be spoofed; any other value is ignored and the real `POST` method is used.

### Route Handlers

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

The string form resolves the controller class inside `App\Controllers` (so `'UserController@index'` becomes `App\Controllers\UserController`). The array form uses the fully-qualified class name you pass in.

### Route Parameters

Capture segments of the URI using `{parameter}` syntax:

```php
Route::get('/users/{id}', function ($id) {
    return "User #$id";
});

Route::get('/posts/{category}/{slug}', 'PostController@show');
```

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

> **Important — parameters are matched by name, not position.** Internally, captured values are passed to your handler keyed by their placeholder name (e.g. `category`, `slug`). This means the **parameter name in your closure or controller method must match the `{placeholder}` name** in the route — the order of the arguments in your function signature does not matter, but the spelling does.
>
> ```php
> // Works — names match (order is irrelevant)
> Route::get('/posts/{category}/{slug}', function ($category, $slug) { /* ... */ });
> Route::get('/posts/{category}/{slug}', function ($slug, $category) { /* ... */ });
> ```
>
> The same rule applies to controller methods.

#### Typed Parameters

You can constrain a parameter to a built-in pattern with `{name:type}`. If the captured segment does not match the type, the route is treated as a non-match (and matching continues to the next route, eventually falling through to the 404 handler):

```php
Route::get('/users/{id:int}', 'UserController@show');       // only matches numeric ids
Route::get('/posts/{slug:slug}', 'PostController@show');    // letters, digits, '-' and '_'
Route::get('/tokens/{token:uuid}', 'TokenController@show'); // a hexadecimal UUID (8-4-4-4-12)
```

The available types are:

| Type | Matches |
| --- | --- |
| `int` | An optionally-signed integer (e.g. `42`, `-7`) |
| `alpha` | Letters only (`a–z`, `A–Z`) |
| `alnum` | Letters and digits |
| `slug` | Letters, digits, hyphens, and underscores |
| `uuid` | A hexadecimal UUID in canonical 8-4-4-4-12 form (any version) |

Captured values are also coerced into the declared scalar type of your controller method's signature (e.g. `function show(int $id)` receives an `int`, not a string), so typed parameters integrate naturally with `declare(strict_types=1)`.

#### Optional Parameters

A trailing `?` marks a parameter as optional: `{name?}` or, combined with a type, `{name?:type}`. An optional parameter may be omitted from the URI; when omitted it is simply absent from the parameters passed to your handler, so give it a default in your signature:

```php
Route::get('/posts/{page?:int}', function ($page = 1) {
    return "Page $page";
});
```

Optional parameters are only meaningful at the **end** of the pattern — once an optional segment is omitted, no later segment may be present.

### Named Routes

You can assign a name to a route as a third argument:

```php
Route::get('/dashboard', 'DashboardController@index', 'dashboard');
```

Alternatively, name the most recently registered route fluently with `->name()`:

```php
Route::get('/dashboard', 'DashboardController@index')->name('dashboard');
```

Route names must be unique; registering the same name twice triggers an error via `Debug`.

Generate a URL for a named route using the `route()` helper or `Route::route()`:

```php
$url = route('dashboard'); // /dashboard
```

For routes with parameters, pass an associative array of values:

```php
Route::get('/users/{id}', 'UserController@show', 'users.show');

$url = route('users.show', ['id' => 42]); // /users/42
```

Parameter values are percent-encoded, so values containing slashes, spaces, or other reserved characters cannot corrupt the resulting URL. A typed placeholder such as `{id:int}` is substituted the same way — the `:type` suffix is stripped from the generated URL. If a required parameter is missing, or a named route does not exist, an error is triggered via `Debug`.

### Loading Route Files

Use `Route::source()` to load one or more route files. By default, files are resolved from the directory registered as `routes` in the `Directory` registry:

```php
Route::source(['web.php', 'api.php']);
```

#### Loading from a Custom Directory

The optional second argument is **the name of a directory alias registered in `Directory`** — not a relative or absolute path. Register the alias first, then refer to it by name. This is useful for modular applications or packages that ship their own routes:

```php
use Webrium\Directory;
use Webrium\Route;

// 1. Register the directory under any name you choose
Directory::set('shop_routes', 'modules/shop/routes');

// 2. Load route files from that alias
Route::source(['shop.php'], 'shop_routes');
```

Because `Route::source()` resolves the directory through `Directory::path()`, paths are always anchored to the application root and protected against traversal. Passing a raw path string (e.g. `'modules/shop/routes'` or `'/var/www/admin/routes'`) that has not been registered will fail.

If a file in the list does not exist, an error is triggered.

### Not Found Handling

By default, unmatched requests return a `404` with a plain "Page not found" message. You can override this with a custom handler:

```php
Route::setNotFoundHandler(function () {
    return 'Sorry, the page you requested could not be found.';
});

// or a controller
Route::setNotFoundHandler('ErrorController@notFound');
```

> Note: `view()` is **not** a built-in Webrium helper — the framework's core does not ship a templating layer. If you have added your own `view()` function (or one from a separate package) to render HTML templates, you can return its output from the handler just like any other string:
>
> ```php
> Route::setNotFoundHandler(function () {
>     return view('errors.404'); // only works if you have defined a view() helper yourself
> });
> ```

---

## Route Groups

Route groups let you share a URL prefix and/or middleware across multiple routes without repeating them.

### Basic Usage

`Route::group()` accepts either a string (used as a prefix) or an array of options, followed by a closure where the grouped routes are defined.

#### String Prefix

```php
use Webrium\Route;

Route::group('admin', function () {
    Route::get('/dashboard', 'AdminController@dashboard'); // /admin/dashboard
    Route::get('/users', 'AdminController@users');         // /admin/users
});
```

#### Array of Options

```php
Route::group(['prefix' => 'api'], function () {
    Route::get('/users', 'UserController@index'); // /api/users
    Route::get('/posts', 'PostController@index'); // /api/posts
});
```

### Grouping with Middleware

Add a `middleware` key to apply middleware to every route inside the group:

```php
Route::group(['prefix' => 'api', 'middleware' => 'App\Middlewares\AuthMiddleware'], function () {
    Route::get('/profile', 'ProfileController@show');
    Route::post('/profile', 'ProfileController@update');
});
```

Any of the middleware forms described in [Middleware](#middleware) — closures, class names, `Class@method`, function names, booleans, or arrays of these — can be used here.

### Middleware Without a Prefix

The `prefix` key is optional. You can apply middleware to a group of routes without changing their URLs:

```php
Route::group(['middleware' => 'App\Middlewares\AuthMiddleware'], function () {
    Route::get('/dashboard', 'DashboardController@index');
    Route::get('/settings', 'SettingsController@index');
});
```

### Nested Groups

Groups can be nested. Prefixes are concatenated across levels, and **middleware accumulates** across levels:

```php
Route::group(['prefix' => 'api'], function () {

    Route::get('/status', 'ApiController@status'); // /api/status, no middleware

    Route::group(['prefix' => 'admin', 'middleware' => 'App\Middlewares\AuthMiddleware@isAdmin'], function () {
        Route::get('/users', 'AdminController@users'); // /api/admin/users
    });

});
```

Here `/api/status` has no middleware, while `/api/admin/users` is prefixed with `api/admin` and protected by `AuthMiddleware@isAdmin`.

> **Middleware stacks across nested groups.** When an inner group declares its own `middleware`, it is **merged with** the middleware inherited from every enclosing group — the inner routes run the full chain from the outside in.
>
> ```php
> Route::group(['prefix' => 'api', 'middleware' => 'App\Middlewares\AuthMiddleware'], function () {
>
>     Route::get('/status', 'ApiController@status'); // protected by AuthMiddleware
>
>     Route::group(['prefix' => 'admin', 'middleware' => 'App\Middlewares\AdminMiddleware'], function () {
>         // protected by BOTH AuthMiddleware and AdminMiddleware, in that order
>         Route::get('/users', 'AdminController@users');
>     });
>
> });
> ```
>
> Inherited middleware runs first, then the inner group's. You can still list several on one group explicitly when you are not relying on nesting:
>
> ```php
> Route::group(['prefix' => 'admin', 'middleware' => ['App\Middlewares\AuthMiddleware', 'App\Middlewares\AdminMiddleware']], function () {
>     Route::get('/users', 'AdminController@users');
> });
> ```

---

## Middleware

Middleware runs logic before a route's handler executes — typically for authentication, authorization, logging, or rate limiting. If middleware blocks the request, the handler never runs.

Middleware in Webrium is applied through [route groups](#route-groups) — there is no per-route `->middleware()` method. Wrap any routes that need protection in a `Route::group()` call.

Middleware checks run **after** a route has matched the current request, and **before** its handler is dispatched. If no route matches, middleware is never evaluated at all — the request goes straight to the 404 handler.

### The Return-Value Contract

Each middleware returns a value that decides the outcome. The contract is **fail-secure**: a route advances to its handler only when every middleware returns exactly boolean `true`.

| Return value | Effect |
| --- | --- |
| `true` | Pass — continue to the next middleware, or to the handler |
| `false` | Deny with the default `403 Forbidden` |
| `array` | Short-circuit: sent as a JSON response. An optional `status` key sets the HTTP code (default `403`) and is removed from the body |
| `string` or `object` | Short-circuit: sent as the response with status `200` (e.g. a rendered view or redirect body) |
| anything else (`null`, `0`, `1`, `''`, ...) | Treated as a denial → default `403` |

The first middleware that returns anything other than `true` short-circuits the chain — later middleware and the route handler do not run.

### Defining Middleware

Webrium supports several forms of middleware.

#### Closures

The simplest form — any callable:

```php
Route::group(['middleware' => function () {
    return isset($_SESSION['user_id']);
}], function () {
    Route::get('/admin', 'AdminController@index');
});
```

#### Class-Based Middleware

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

Reference it by its fully-qualified class name:

```php
Route::group(['middleware' => 'App\Middlewares\AuthMiddleware'], function () {
    Route::get('/dashboard', 'DashboardController@index');
});
```

> Middleware classes are resolved with `class_exists()` against the exact string you pass, so give the full namespace (e.g. `App\Middlewares\AuthMiddleware`), not just the short class name.

#### Class-Based Middleware with a Custom Method

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
Route::group(['middleware' => 'App\Middlewares\AuthMiddleware@isAdmin'], function () {
    Route::get('/admin', 'AdminController@index');
});
```

#### Global Functions

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

#### Static Pass/Fail

Booleans are accepted directly — useful for feature flags or conditionally enabling a group of routes:

```php
Route::group(['middleware' => env('FEATURE_BETA', false)], function () {
    Route::get('/beta', 'BetaController@index');
});
```

### Multiple Middleware

Pass an array to apply multiple checks. They run in order, and the first one that does not return `true` stops the chain immediately — later middleware in the array is not executed:

```php
Route::group(['middleware' => ['App\Middlewares\AuthMiddleware', 'App\Middlewares\RateLimiter@check']], function () {
    Route::get('/api/data', 'ApiController@data');
});
```

### Middleware Failure Behavior

By default, a middleware that returns `false` (or any non-`true` scalar) produces:

```json
{ "error": "Forbidden" }
```

with HTTP status `403`. The route handler is never invoked, and no further routes are checked.

A middleware can also return a **custom response** instead of just passing or failing:

```php
// Custom JSON body and status code
Route::group(['middleware' => function () {
    if (!isset($_SESSION['user_id'])) {
        return ['error' => 'Unauthenticated', 'status' => 401];
    }
    return true;
}], function () {
    Route::get('/api/me', 'ProfileController@show');
});
```

Returning an array sends it as JSON, honouring an optional `status` key (default `403`). Returning a string or object sends it as the response with status `200`.

### Limitations to Keep in Mind

- **No request/next pipeline.** Middleware runs as a simple before-check; it cannot modify the request or pass data forward to the controller. It *can*, however, short-circuit with a custom response (array, string, or object) as described above — it is not limited to a fixed `403`.
- **No parameterized middleware.** There is no syntax like `auth:admin`. For variations of the same check, define separate methods and use `Class@method` instead (e.g. `AuthMiddleware@isAdmin`).
- **Middleware stacks across nested groups.** As shown in [Nested Groups](#nested-groups), an inner group's middleware is combined with — not a replacement for — its enclosing groups' middleware.
