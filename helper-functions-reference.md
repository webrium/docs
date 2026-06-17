# Helper Functions Reference
Webrium provides a set of global helper functions, available everywhere in your application without any `use` statements. Most are thin wrappers around the framework's core classes, designed for quick, expressive access in routes, controllers, and views.

## URL & Routing

### `url(string $path = ''): string`

Generate a full URL for a given relative path.

```php
url('products/list'); // https://example.com/products/list
url();                  // https://example.com/
```

### `current_url(): string`

Get the full URL of the current request.

```php
current_url(); // https://example.com/users/42?tab=settings
```

### `route(string $name, array $params = []): string`

Generate a URL for a named route.

```php
route('users.show', ['id' => 42]); // /users/42
```

See [Routing — Named Routes](../routing/01-basic-routing.md#named-routes).

## Responses & Redirects

### `respond(mixed $data, int $statusCode = 200): never`

Send a response and terminate the request. Arrays and objects are JSON-encoded automatically.

```php
return respond(['status' => 'ok']);
return respond(['error' => 'Not found'], 404);
```

### `redirect(string $url, int $statusCode = 303): never`

Redirect to a URL and terminate the request.

```php
return redirect('/login');
return redirect('/dashboard', 302);
```

### `back(): never`

Redirect to the previous page, based on the `Referer` header. Falls back to the application base URL if no referer is present.

```php
return back();
```

## Request Input

### `input(?string $name = null, mixed $default = null): mixed`

Retrieve a value from the current request — query string for `GET`, body for `POST`/`PUT`/`PATCH`/`DELETE` (JSON or form-encoded).

```php
input('email');                // a single field
input('page', 1);              // with a default
input();                        // all input as an array
```

See [Requests](../requests/01-basics.md).

## Validation, Errors & Old Input

### `errors(string|false $name = false): mixed`

Retrieve flashed validation errors from the previous request.

```php
errors();          // all errors: ['field' => 'message', ...]
errors('email');    // error message for 'email', or null
```

### `old(string $name, mixed $default = ''): mixed`

Retrieve the previous request's input value for a field — useful for repopulating forms.

```php
old('email');
old('email', 'default@example.com');
```

### `message(bool $justGetText = false): mixed`

Retrieve a flashed message from the previous request.

```php
message();        // rendered output
message(true);    // raw text only
```

See [Sessions — Flash Messages, Errors, and Old Input](../digging-deeper/02-sessions.md#flash-messages-errors-and-old-input).

## Paths

### `public_path(string $path = ''): string`

Absolute path inside the `public` directory.

```php
public_path('images/logo.png');
```

### `app_path(string $path = ''): string`

Absolute path inside the `app` directory.

```php
app_path('Models/User.php');
```

### `storage_path(string $path = ''): string`

Absolute path inside the application's storage directory.

```php
storage_path('logs/app.log');
storage_path('app/uploads');
```

### `root_path(string $path = ''): string`

Absolute path relative to the project root.

```php
root_path('composer.json');
```

> These path helpers resolve through directory aliases registered in the `Directory` class, so they reflect your project's actual configured paths.

## Configuration & Localization

### `env(string $name, mixed $default = false): mixed`

Retrieve a value from `.env`.

```php
env('DB_HOST', '127.0.0.1');
env('APP_DEBUG', false);
```

See [Configuration](../getting-started/04-configuration.md).

### `lang(string $key, array $replacements = []): string`

Translate a string using the current locale.

```php
lang('messages.welcome');
lang('messages.greeting', ['name' => 'Alice']);
```

See [Localization](../digging-deeper/03-localization.md).

## Frontend

### `vite_assets(): string`

Render the appropriate `<script>`/`<link>` tags for Vite assets — the dev server tag in development, or hashed manifest assets in production.

```blade
<head>
    {!! vite_assets() !!}
</head>
```

## Quick Reference Table

| Function | Returns | Purpose |
|---|---|---|
| `url($path)` | `string` | Build a full URL |
| `current_url()` | `string` | Current request URL |
| `route($name, $params)` | `string` | URL for a named route |
| `respond($data, $code)` | `never` | Send a response and exit |
| `redirect($url, $code)` | `never` | Redirect and exit |
| `back()` | `never` | Redirect to previous page |
| `input($name, $default)` | `mixed` | Get request input |
| `errors($name)` | `mixed` | Get flashed validation errors |
| `old($name, $default)` | `mixed` | Get previous input value |
| `message($raw)` | `mixed` | Get flashed message |
| `public_path($path)` | `string` | Path in `public/` |
| `app_path($path)` | `string` | Path in `app/` |
| `storage_path($path)` | `string` | Path in storage |
| `root_path($path)` | `string` | Path from project root |
| `env($name, $default)` | `mixed` | Get `.env` value |
| `lang($key, $replacements)` | `string` | Translate a string |
| `vite_assets()` | `string` | Vite asset tags |

## Next Steps

- [Architecture: The Kernel](./02-kernel.md) — what runs underneath these helpers