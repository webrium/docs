# Configuration
## Environment Variables

Webrium uses a `.env` file at the root of your project to store environment-specific configuration — values that typically differ between local development, staging, and production, such as database credentials and debug settings.

A typical `.env` file looks like:

```env
APP_NAME=Webrium
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=webrium
DB_USERNAME=root
DB_PASSWORD=
```

`.env` is excluded from version control. A `.env.example` file should be committed instead, containing the same keys with placeholder or default values, so other developers know what variables are required.

## Reading Environment Variables

Use the `env()` helper to read values from `.env`:

```php
$dbHost = env('DB_HOST', '127.0.0.1');
```

The second argument is a default value, returned if the key is not set.

```php
if (env('APP_DEBUG', false)) {
    // debug-only logic
}
```

## Debug Configuration

Webrium's `Debug` class controls how errors are displayed, logged, and formatted. By default, errors are displayed and logging is enabled.

```php
use Webrium\Debug;

Debug::enableErrorDisplay(true);   // show errors in the response
Debug::enableErrorLogging(true);   // write errors to storage/logs
Debug::setLogPath(storage_path('logs/app.log'));
```

### JSON Error Responses for APIs

If you're building an API, you may want errors returned as JSON instead of HTML:

```php
Debug::forceJsonResponse(true);
```

> **Note:** Any `Debug` configuration must be set **before** `App::initialize()` is called.

### Recommended Setup

```php
use Webrium\Debug;
use Webrium\App;

if (env('APP_DEBUG', false)) {
    Debug::enableErrorDisplay(true);
} else {
    Debug::enableErrorDisplay(false);
    Debug::enableErrorLogging(true);
}

App::initialize(__DIR__ . '/..');
```

## Application Locale

Webrium supports translation strings via `lang()` / `trans()`, backed by files in `storage/langs/{locale}/`.

```php
use Webrium\App;

App::setLocale('en');
```

```php
// storage/langs/en/messages.php
return [
    'welcome' => 'Welcome to Webrium',
];
```

```php
echo lang('messages.welcome'); // "Welcome to Webrium"
```

## CORS

If your application serves as an API consumed by a separate frontend, you can enable CORS via the `App` class:

```php
use Webrium\App;

App::enableCors(['https://example.com'], [
    'allowed_methods' => ['GET', 'POST', 'PUT', 'DELETE'],
    'allowed_headers' => ['Content-Type', 'Authorization'],
]);
```

The first argument is a list of allowed origins (or a single origin as a string). If omitted, it defaults to the application's own domain. The second argument accepts additional configuration:

| Key | Default |
|---|---|
| `allowed_methods` | `['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']` |
| `allowed_headers` | `['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']` |
| `allow_credentials` | `false` |
| `max_age` | `86400` |
| `expose_headers` | `[]` |

> **Note:** CORS configuration should be set before `App::run()` is called, ideally right after `App::initialize()`. `enableCors()` also handles `OPTIONS` preflight requests automatically and will terminate the request for them.

## Next Steps

- [Routing](../routing/01-basic-routing.md)
- [Helper Functions Reference](../reference/helpers.md)