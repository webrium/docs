# Request Lifecycle

Understanding how a request flows through Webrium helps you know where your code fits in, and makes debugging far more intuitive. Webrium is deliberately explicit about this — the boot sequence is visible in your own `public/index.php`, not hidden behind a magic bootstrapper.

## The Entry Point

Every request to your application starts at `public/index.php`. This is the only file exposed to the web server, and its job is to bootstrap the framework and hand off control to the router.

A minimal entry point looks like this:

```php
<?php
require_once __DIR__ . '/../vendor/autoload.php';

use Webrium\App;
use Webrium\Route;

App::initialize(__DIR__ . '/..');
Route::source(['Web.php']);
App::run();
```

The skeleton project's `index.php` adds a few extra lines to configure error handling, the view engine, sessions, and the locale — but the three calls above are the core of every Webrium application.

## Step by Step

### 1. Autoloading

`vendor/autoload.php` registers Composer's PSR-4 autoloader. This resolves both the framework's `Webrium\` namespace and your application's `App\` namespace — no manual class loading is required.

### 2. `App::initialize($rootPath)`

This bootstraps the application:

- Records the project root path, used by helpers like `root_path()`, `storage_path()`, and `app_path()`
- Loads Webrium's global helper functions (`url()`, `redirect()`, `input()`, `env()`, and more)
- Prepares the request URL for routing

At this point the framework is configured but no routes are registered and no request handling has begun.

### 3. Loading Route Files

Route files in `app/Routes/` are loaded via `Route::source()`:

```php
Route::source(['Web.php', 'Api.php']);
```

Each file registers routes against the `Route` class:

```php
use Webrium\Route;

Route::get('/', function () {
    return 'Hello, World!';
});

Route::get('/users', 'UserController@index');
```

At this point routes are only **registered** — nothing is executed yet.

### 4. `App::run()`

This is where the request is actually handled. Internally, it:

1. Initializes the debugging system (`Debug::initialize()`)
2. Calls `Route::run()`, which matches the current request URI and method against the registered routes

### 5. Route Matching

`Route::run()` looks through the registered routes for one that matches both the HTTP method and the URL pattern (including any `{parameters}`). If a match is found, any middleware attached to the route or its group is executed first.

- If middleware fails, the request stops here with a `403 Forbidden` response.
- If no route matches, the configured "not found" handler runs (or a default `404` response is returned).

### 6. Dispatching the Handler

Once a route matches and middleware passes, the handler is dispatched:

- **Closures** are called directly, and their return value is passed to `Header::respond()`.
- **Controller handlers** (`'UserController@index'` or `[UserController::class, 'index']`) are passed to `Kernel::executeControllerMethod()`.

### 7. The Kernel

`Kernel::executeControllerMethod()` is the core execution layer responsible for running controller logic:

1. Instantiates the controller class
2. Calls `boot()` on the controller, if defined — useful for setup or authorization checks
3. Calls the target method, passing in any route parameters (with type coercion based on the parameter's declared type)
4. Passes the method's return value to `Header::respond()`
5. Calls `teardown()` on the controller, if defined — useful for cleanup or logging

For a deeper look at the Kernel, see **Core → Kernel**.

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
