# App

The `App` class is the core of the Webrium framework. It handles application initialization, the request lifecycle, environment variables, localization, and CORS security.

```php
use Webrium\App;
```

## Initialization

### `App::initialize(string $dir)`

Initialize the framework with the project root directory. This must be called before anything else.

```php
App::initialize(__DIR__);
```

This call:
- Sets the application root path
- Registers the autoloader
- Loads helper functions
- Enforces URL standards (removes trailing slashes)

### `App::run()`

Start the application — initialize debugging and run the router. Called once at the end of `public/index.php`.

```php
App::run();
```

### `App::getRootPath()`

Get the application root path.

```php
$rootPath = App::getRootPath();
// /var/www/html/myapp
```

## Request & Response

### `App::input(?string $key = null, mixed $default = null)`

Read input from the current request. Works with GET, POST, JSON body, and PUT/DELETE bodies.

```php
// All input as an array
$data = App::input();

// Single field
$username = App::input('username');

// With default
$page = App::input('page', 1);
```

### `App::returnData(mixed $data, int $statusCode = 200)`

Send a response and exit. Automatically encodes arrays/objects as JSON.

```php
App::returnData(['status' => 'success', 'data' => $results]);

// With a custom status code
App::returnData(['error' => 'Not found'], 404);

// Plain text
App::returnData('Hello World');
```

## Environment Variables

### `App::env(string $key, mixed $default = null)`

Read a variable from the `.env` file.

```php
$dbHost = App::env('DB_HOST');
$debug  = App::env('APP_DEBUG', false);

if (App::env('APP_ENV') === 'production') {
    // Production-specific code
}
```

See [Configuration](/getting-started/configuration) for details on the `.env` file.

## Localization

### `App::setLocale(string $locale)`

Set the current locale.

```php
App::setLocale('en');
App::setLocale('fa');
```

### `App::getLocale(): string`

Get the current locale.

```php
$locale = App::getLocale(); // 'en'
```

### `App::isLocale(string $locale): bool`

Check if the current locale matches.

```php
if (App::isLocale('fa')) {
    // Persian locale active
}
```

### `App::trans(string $key, array $replacements = []): string`

Translate a key using the current locale. Language files are stored in `storage/Langs/{locale}/`.

```php
$text = App::trans('messages.welcome');
// "Welcome to our site"

$greeting = App::trans('messages.hello_name', ['name' => 'John']);
// "Hello, John!"
```

See [Localization](/core/localization) for the full guide.

## CORS

Webrium has a comprehensive CORS system. For the full guide see [CORS](/core/cors).

### `App::corsMiddleware(array $origins, array $config = [], int $errorCode = 403)`

The recommended way to handle CORS. Validates the request origin and blocks unauthorized cross-origin requests.

```php
App::corsMiddleware([
    'https://myapp.com',
    'https://admin.myapp.com',
]);

// With options
App::corsMiddleware(['https://app.myapp.com'], [
    'allow_credentials' => true,
    'allowed_methods'   => ['GET', 'POST', 'PUT', 'DELETE'],
    'allowed_headers'   => ['Content-Type', 'Authorization'],
    'max_age'           => 86400,
]);
```

### `App::enableCors(array $origins = [], array $config = [])`

Enable CORS headers without blocking the request.

```php
App::enableCors(['https://example.com']);
```

## Cache

### `App::disableCache()`

Disable browser caching for the current response. Useful for dynamic or sensitive content.

```php
App::disableCache();
```

Sets `Cache-Control: no-store, no-cache, must-revalidate` and `Pragma: no-cache`.

## API Reference

| Method | Description |
|---|---|
| `initialize($dir)` | Initialize framework with root directory |
| `getRootPath()` | Get application root path |
| `run()` | Start the application and router |
| `input($key, $default)` | Get request input |
| `returnData($data, $statusCode)` | Send a response |
| `env($key, $default)` | Get an environment variable |
| `setLocale($locale)` | Set the application locale |
| `getLocale()` | Get the current locale |
| `isLocale($locale)` | Check if a locale is active |
| `trans($key, $replacements)` | Translate a string |
| `corsMiddleware($origins, $config, $errorCode)` | CORS middleware with validation |
| `enableCors($origins, $config)` | Enable CORS headers |
| `disableCache()` | Disable browser caching |
