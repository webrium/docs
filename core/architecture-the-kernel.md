# Architecture: The Kernel

The `Kernel` class is Webrium's application execution core. It handles two related but distinct responsibilities: loading PHP files, and instantiating and invoking controllers. This page is aimed at developers who want to understand what happens beneath `Route` and `App`, or who are extending the framework itself.

> Most applications never call `Kernel` directly — it is used internally by `Route` and `App`. This page is reference material for understanding the framework's internals.

## Why a Separate Kernel?

Earlier versions of Webrium had controller-dispatching logic inside the `File` class, alongside filesystem utilities like reading, writing, and streaming. That mixed two unrelated responsibilities into a single class.

The framework now separates these concerns:

- **`File`** — pure filesystem I/O (reading, writing, streaming, metadata)
- **`Kernel`** — PHP file execution and controller dispatching
- **`Route`** — URL matching and request routing

Each class stays focused on a single responsibility, and the controller dispatch flow can be followed and tested independently of file operations.

## File Execution Methods

These methods wrap PHP's native `include` / `require` constructs with an existence check, returning a boolean instead of triggering a warning when a file is missing.

```php
use Webrium\Kernel;

Kernel::run($path);          // include
Kernel::runOnce($path);      // include_once
Kernel::requireFile($path);  // require
Kernel::requireOnce($path);  // require_once
```

All four return `true` if the file existed and was loaded, or `false` otherwise.

### `source()`

Loads multiple files from a registered directory alias:

```php
Kernel::source('routes', ['web.php', 'api.php']);
```

It returns the number of files that were successfully included. Internally, `Route::source()` is a thin wrapper around this method.

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

1. **Class resolution** — checks `class_exists($className)`. If the class is not found, an error is reported through `Debug` and execution stops.
2. **Instantiation** — creates a new instance of the controller: `new $className()`.
3. **`boot()` hook** — if the controller defines a `boot()` method, it is called before the action.
4. **Argument resolution** — route parameters are matched against the method signature and scalar values are coerced into the declared types (see below).
5. **Method dispatch** — if the target method exists, it is called with the resolved arguments and its return value is passed to `Header::respond()`.
6. **`teardown()` hook** — if the controller defines a `teardown()` method, it is called after the response has been sent.

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
    │       ├─Yes─► resolve arguments ──► Header::respond($controller->$methodName(...$args))
    │       │
    │       └─No──► Debug::triggerError()
    │
    └─► teardown() if defined
```

## Scalar Type Coercion for Route Parameters

Route parameters always arrive as strings from the URL. To let controllers declare native scalar types — even under `declare(strict_types=1)` — the Kernel inspects the target method's signature via reflection and coerces each positional value to the declared type.

```php
class PostController
{
    // $id arrives as the string "42" from the URL,
    // and is cast to int before the method is called.
    public function show(int $id) { /* ... */ }
}
```

Rules:

- Only built-in scalar types are coerced: `int`, `float`, `bool`, `string`.
- Untyped, union-typed, and class-typed parameters are passed through unchanged.
- A non-numeric value bound to `int` or `float` is passed through unchanged so PHP raises a proper `TypeError` instead of silently becoming `0`.
- `bool` values are parsed with `FILTER_VALIDATE_BOOLEAN`; unrecognized values are passed through unchanged.

This makes typed controller signatures work naturally without per-route casting boilerplate.

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
// → the FQCN is already complete and is passed through directly
Kernel::executeControllerMethod($handler[0], $handler[1], $params);
```

This separation means `Kernel` has no dependency on `Directory` and makes no assumption about where controllers live — it simply runs whatever class and method it is given. If you ever need controllers in a different namespace or directory, that logic lives in `Route`, not in `Kernel`.

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
