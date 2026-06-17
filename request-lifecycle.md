# Request Lifecycle
Understanding how a request flows through Webrium helps you know where your code fits in, and makes debugging far more intuitive.

## The Entry Point

Every request to your application starts at `public/index.php`. This is the only file exposed to the web server, and its job is to bootstrap the framework and hand off control to the router.

A minimal entry point looks like this:

```php
<?php

require_once __DIR__ . '/../vendor/autoload.php';

use Webrium\App;
use Webrium\Route;

App::initialize(__DIR__ . '/..');

Route::source(['web.php']);

App::run();
```

## Step by Step

### 1. Autoloading

`vendor/autoload.php` registers Composer's PSR-4 autoloader. This resolves both the framework's `Webrium\` namespace and your application's `App\` namespace — no manual class loading is required.

### 2. `App::initialize()`

This bootstraps the application:

- Sets the application's root path, used by helpers like `root_path()`, `storage_path()`, etc.
- Loads Webrium's helper functions (`url()`, `redirect()`, `input()`, and more)
- Prepares the request URL for routing

### 3. Defining Routes

Routes are typically loaded from `app/Routes` using `Route::source()`:

```php
Route::source(['web.php', 'api.php']);
```

Inside these files, routes are registered against the `Route` class:

```php
use Webrium\Route;

Route::get('/', function () {
    return 'Hello, World!';
});

Route::get('/users', 'UserController@index');
```

At this point, routes are only **registered** — nothing is executed yet.

### 4. `App::run()`

This is where the request is actually handled. Internally, it:

1. Initializes the debugging system (`Debug::initialize()`)
2. Calls `Route::run()`, which matches the current request URI and method against the registered routes

### 5. Route Matching

`Route::run()` looks through the registered routes for one that matches both the HTTP method and the URL pattern (including any `{parameters}`). If a match is found, any middleware attached to the route or its group is executed first.

- If middleware fails, the request stops here with a `403 Forbidden` response.
- If no route matches, the configured "not found" handler runs (or a default `404` response is returned).

### 6. Dispatching to the Kernel

Once a route matches and middleware passes, the handler is dispatched:

- **Closures** are called directly, and their return value is passed to `Header::respond()`.
- **Controller handlers** (`'UserController@index'` or `[UserController::class, 'index']`) are passed to `Kernel::executeControllerMethod()`.

### 7. The Kernel

`Kernel::executeControllerMethod()` is the core execution layer responsible for running controller logic:

1. Instantiates the controller class
2. Calls `boot()` on the controller, if defined — useful for setup or authorization checks
3. Calls the target method, passing in any route parameters
4. Passes the method's return value to `Header::respond()`
5. Calls `teardown()` on the controller, if defined — useful for cleanup or logging

### 8. Sending the Response

`Header::respond()` is the final step for every request, whether it came from a closure or a controller:

- Arrays and objects are automatically JSON-encoded with the appropriate `Content-Type` header
- Strings and other scalar values are output as-is
- The process terminates after sending the response

## Visual Summary

```
Request
   │
   ▼
public/index.php
   │
   ▼
App::initialize()  ──► root path, helpers, URL setup
   │
   ▼
Route::source()    ──► route files registered
   │
   ▼
App::run()
   │
   ▼
Route::run()
   │
   ├─► No match ──► 404 / notFoundHandler
   │
   ├─► Middleware fails ──► 403
   │
   ▼
Dispatch
   │
   ├─► Closure ──────────────► Header::respond()
   │
   └─► Controller ──► Kernel::executeControllerMethod()
                          │
                          ├─► boot()
                          ├─► action method
                          ├─► Header::respond()
                          └─► teardown()
```

## Next Steps

- [Routing](../routing/01-basic-routing.md) — defining and matching routes
- [Controllers](../controllers/01-basics.md) — writing controller classes
- [Responses](../responses/01-basics.md) — controlling what `Header::respond()` sends back