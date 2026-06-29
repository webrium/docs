# Helper Functions Reference

`webrium/core` defines a set of global helper functions that are loaded automatically when the package is installed — available everywhere in your application without any `use` statements. Most are thin wrappers around the core classes, designed for quick, expressive access in routes, controllers, and views. They work identically whether you are using Core standalone or as part of the full Webrium framework.

## URL & Routing

### `url(string $path = ''): string`

Generate a full URL for a given relative path.

```php
url('products/list'); // https://example.com/products/list
url();                // https://example.com
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

## Responses & Redirects

### `respond(mixed $data, int $statusCode = 200): never`

Send a response and terminate the request. Arrays and objects are JSON-encoded automatically; any other value is cast to string and sent as-is.

```php
return respond(['status' => 'ok']);
return respond(['error' => 'Not found'], 404);
```

### `redirect(string $url, int $statusCode = 303): never`

Redirect to a URL and terminate the request. URLs containing line breaks are rejected with an `InvalidArgumentException` to prevent header injection.

```php
return redirect('/login');
return redirect('/dashboard', 302);
```

### `back(): never`

Redirect to the previous page, based on the `Referer` header. Falls back to the application base URL if no referer is present.

```php
return back();
```

### Building Response Payloads — `html()`, `json()`, `text()`

These return a `ResponsePayload` object (with the right `Content-Type` set) instead of terminating the request, so you `return` them from a controller and let the framework send them. This is the alternative to `respond()` when you want to set the content type explicitly or keep building the response.

```php
return html('<h1>Hello</h1>');         // text/html; charset=utf-8
return json(['status' => 'ok']);       // application/json; charset=utf-8
return text('plain output');           // text/plain; charset=utf-8

return json(['error' => 'Not found'], 404);
```

- `html(string $content, int $statusCode = 200): ResponsePayload`
- `json(mixed $data, int $statusCode = 200): ResponsePayload` — encodes the data here; if encoding fails it returns a `500` error payload instead.
- `text(string $content, int $statusCode = 200): ResponsePayload`

## Request Input

### `input(?string $name = null, mixed $default = null): mixed`

Retrieve a value from the current request — query string for `GET`, body for `POST`/`PUT`/`PATCH`/`DELETE` (JSON or form-encoded).

```php
input('email');                // a single field
input('page', 1);              // with a default
input();                       // all input as an array
```

## Validation, Errors & Old Input

### `errors(string|false $name = false): mixed`

Retrieve flashed validation errors from the previous request.

```php
errors();          // all errors: ['field' => 'message', ...]
errors('email');   // error message for 'email', or null
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
message();        // full message data
message(true);    // raw text only
```

## Paths

All path helpers except `root_path()` resolve through directory aliases registered in the `Directory` class, so they reflect your project's actual configured paths. Each accepts an optional sub-path and returns an absolute filesystem path (an empty string if the alias is not registered).

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

### `config_path(string $path = ''): string`

Absolute path inside the `config` directory.

```php
config_path('database.php');
```

### `resource_path(string $path = ''): string`

Absolute path inside the views directory.

```php
resource_path('emails/welcome.php');
```

### `root_path(string $path = ''): string`

Absolute path relative to the project root (resolved directly from the application root, not via a directory alias).

```php
root_path('composer.json');
```

## Configuration & Localization

### `env(string $name, mixed $default = null): mixed`

Retrieve a value from `.env`.

```php
env('DB_HOST', '127.0.0.1');
env('APP_DEBUG', false);
env('OPTIONAL_KEY');           // returns null if unset
```

### `lang(string $key, array $replacements = []): string`

Translate a string using the current locale.

```php
lang('messages.welcome');
lang('messages.greeting', ['name' => 'Alice']);
```

## Frontend

### `vite_assets(?string $entryPoint = null): string`

Render the appropriate `<script>`/`<link>` tags for Vite assets — the dev server tag in development, or hashed manifest assets in production. Pass an entry point to override the default.

```blade
<head>
    {!! vite_assets() !!}
    {!! vite_assets('resources/js/admin.js') !!}
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
| `html($content, $code)` | `ResponsePayload` | Build an HTML response |
| `json($data, $code)` | `ResponsePayload` | Build a JSON response |
| `text($content, $code)` | `ResponsePayload` | Build a plain-text response |
| `input($name, $default)` | `mixed` | Get request input |
| `errors($name)` | `mixed` | Get flashed validation errors |
| `old($name, $default)` | `mixed` | Get previous input value |
| `message($raw)` | `mixed` | Get flashed message |
| `public_path($path)` | `string` | Path in `public/` |
| `app_path($path)` | `string` | Path in `app/` |
| `storage_path($path)` | `string` | Path in storage |
| `config_path($path)` | `string` | Path in `config/` |
| `resource_path($path)` | `string` | Path in views directory |
| `root_path($path)` | `string` | Path from project root |
| `env($name, $default)` | `mixed` | Get `.env` value |
| `lang($key, $replacements)` | `string` | Translate a string |
| `vite_assets($entry)` | `string` | Vite asset tags |