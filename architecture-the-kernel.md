# Architecture: The Kernel
The `Kernel` class is Webrium's application execution core. It handles two related but distinct responsibilities: loading PHP files, and instantiating/invoking controllers. This page is aimed at developers who want to understand what happens beneath `Route` and `App`, or who are extending the framework itself.

> Most applications never call `Kernel` directly — it's used internally by `Route` and `App`. This page is reference material for understanding the framework's internals.

## Why a Separate Kernel?

Earlier versions of Webrium had controller-dispatching logic inside the `File` class, alongside file I/O utilities like reading, writing, and streaming. This mixed two unrelated responsibilities into one class.

`Kernel` separates these concerns:

- **`File`** — pure filesystem I/O (reading, writing, streaming, metadata)
- **`Kernel`** — PHP file execution and controller dispatching
- **`Route`** — URL matching and request routing

This keeps each class focused on a single responsibility, and makes the controller dispatch flow easy to follow and test independently of file operations.

## File Execution Methods

These methods wrap PHP's native `include`/`require` constructs with existence checks, returning a boolean instead of triggering a warning on a missing file.

```php
use Webrium\Kernel;

Kernel::run($path);          // include
Kernel::runOnce($path);       // include_once
Kernel::requireFile($path);   // require
Kernel::requireOnce($path);   // require_once
```

All four return `true` if the file existed and was loaded, or `false` otherwise.

### `source()`

Loads multiple files from a registered directory alias:

```php
Kernel::source('routes', ['web.php', 'api.php']);
```

Internally, `Route::source()` is a thin wrapper around this method — see [Routing — Loading Route Files](../routing/01-basic-routing.md#loading-route-files).

## Controller Dispatch: `executeControllerMethod()`

This is the heart of the Kernel — it takes a fully-qualified class name and a method name, and runs the full controller lifecycle.

```php
Kernel::executeControllerMethod(
    string $className,   // e.g. App\Controllers\UserController
    string $methodName,  // e.g. 'index'
    array $params = []   // route parameters, passed positionally
): void;
```

### What It Does

1. **Class resolution** — checks `class_exists($className)`. If the class doesn't exist, an error is triggered via `Debug` and execution stops.
2. **Instantiation** — creates a new instance of the controller: `new $className()`.
3. **`boot()` hook** — if the controller defines a `boot()` method, it's called before the action.
4. **Method dispatch** — if the target method exists, it's called with `$params` as positional arguments, and the return value is passed to `Header::respond()`.
5. **`teardown()` hook** — if the controller defines a `teardown()` method, it's called after the response has been sent.

```
executeControllerMethod()
    │
    ├─► class_exists? ──No──► Debug::triggerError() ──► return
    │
    ├─► new $className()
    │
    ├─► boot() if defined
    │
    ├─► method_exists($methodName)?
    │       │
    │       ├─Yes─► Header::respond($controller->$methodName(...$params))
    │       │
    │       └─No──► Debug::triggerError()
    │
    └─► teardown() if defined
```

## How `Route` Builds the Class Name

`Kernel::executeControllerMethod()` deliberately knows nothing about directory structure or namespaces — it only accepts a fully-qualified class name. Building that name is `Route`'s responsibility:

```php
// String syntax: 'UserController@index'
// → Route builds: App\Controllers\UserController
[$shortClass, $method] = explode('@', $handlerString, 2);
$fqcn = 'App\\Controllers\\' . $shortClass;

Kernel::executeControllerMethod($fqcn, $method, $params);
```

```php
// Array syntax: [UserController::class, 'index']
// → the FQCN is already complete, passed through directly
Kernel::executeControllerMethod($handler[0], $handler[1], $params);
```

This separation means `Kernel` has no dependency on `Directory` or any assumptions about where controllers live — it simply runs whatever class and method it's given. If you ever needed controllers in a different namespace or directory, that logic would live in `Route`, not `Kernel`.

## Relationship to `App::run()`

```
App::run()
    │
    ├─► Debug::initialize()
    │
    └─► Route::run()
            │
            ├─► matches route?
            │
            ├─► middleware passes?
            │
            └─► dispatch()
                    │
                    ├─► Closure ──────► Header::respond()
                    │
                    └─► Controller ──► Kernel::executeControllerMethod()
```

See the full [Request Lifecycle](../getting-started/03-lifecycle.md) for how this fits into a complete request.

## Next Steps

- [Request Lifecycle](../getting-started/03-lifecycle.md)
- [Controllers](../controllers/01-basics.md) — `boot()` and `teardown()` from the application side
- [Routing](../routing/01-basic-routing.md)