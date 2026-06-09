# Configuration

## Environment Variables

Webrium uses a `.env` file in the project root for environment-specific configuration. This file should **never be committed** to version control — commit `.env.example` instead.

### Accessing Environment Variables

Use `App::env()` or the global `env()` helper anywhere in your application:

```php
$dbHost = App::env('DB_HOST');

// With a default fallback
$debug = App::env('APP_DEBUG', false);
```

### Supported Value Types

The `.env` parser automatically converts these special values:

| `.env` value | PHP value |
|---|---|
| `true` / `false` | `bool` |
| `null` | `null` |
| `"quoted string"` | `string` (quotes stripped) |
| Any other value | `string` |

### Common Variables

```
# Application
APP_ENV=local           # local, production, staging
APP_DEBUG=true
APP_URL=http://localhost:8000

# Database
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=my_app
DB_USERNAME=root
DB_PASSWORD=

# Mail (if using the Email package)
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_FROM=noreply@example.com

# Security
APP_KEY=your-32-char-secret-key
JWT_SECRET=your-jwt-secret

# CORS (comma-separated)
CORS_ALLOWED_ORIGINS=https://myapp.com,https://admin.myapp.com
```

## Config Files

For structured configuration (database connections, mail settings, etc.), create PHP files in `app/Config/` and load them from `public/index.php`:

```php
// public/index.php
File::source('config', ['Config.php', 'DB.php', 'Mail.php']);
```

### Example: DB.php

```php
<?php
use Foxdb\DB;
use Foxdb\Config;

DB::addConnection('main', [
    'host'             => env('DB_HOST', 'localhost'),
    'port'             => env('DB_PORT', '3306'),
    'database'         => env('DB_DATABASE'),
    'username'         => env('DB_USERNAME'),
    'password'         => env('DB_PASSWORD'),
    'charset'          => Config::UTF8,
    'collation'        => Config::UTF8_GENERAL_CI,
    'fetch'            => Config::FETCH_CLASS,
    'throw_exceptions' => true,
]);
```

## Debug Mode

Define `DEBUG_MODE` to enable detailed error output in development:

```php
// public/index.php
define('DEBUG_MODE', App::env('APP_DEBUG', false));
```

When `DEBUG_MODE` is `true`:
- Detailed error messages are shown.
- Vite integration outputs HTML comments on errors.

::: warning
Never enable `DEBUG_MODE` in production. It may expose sensitive information.
:::
