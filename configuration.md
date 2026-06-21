# Configuration

Webrium keeps day-to-day configuration in a single `.env` file at the project root. Everything else — the error handler, view engine, sessions, locale, CORS — is wired up once in `public/index.php` with sensible defaults, so you only touch those subsystems when you actually want to change their behaviour.

## The `.env` File

A fresh project ships with a small `.env.example`:

```ini
DB_HOST = localhost
DB_PORT = 3306
DB_DATABASE = test
DB_USERNAME = root
DB_PASSWORD = 1234

APP_DEBUG = true
APP_LOG_ERRORS = true
```

The installer copies this file to `.env` the first time you create a project. Edit it for your environment, and add any application-specific variables (mail credentials, API keys, feature flags) below — there is no fixed schema.

`.env` is excluded from version control. Commit `.env.example` instead, with placeholder values, so collaborators know which variables to define.

## Reading Values: `env()`

Read values from `.env` anywhere in your application with the `env()` helper:

```php
$dbHost = env('DB_HOST', 'localhost');

if (env('APP_DEBUG', false)) {
    // debug-only logic
}
```

The second argument is the default returned if the key is missing. `env()` returns `null` when no default is given. Common string values are converted to PHP equivalents: `"true"` and `"false"` become booleans, `"null"` becomes `null`, and empty values become `null`.

## Everything Else

The rest of Webrium's configuration — error display and logging, the view engine, session storage, locale, directory layout, CORS — is bootstrapped in `public/index.php` with reasonable defaults. You normally do not need to change it.

When you do, edit `public/index.php` directly and consult the chapter for the subsystem you are configuring: **Error Handling & Debugging**, **Localization**, **Sessions**, **File & Directory**, or the **CORS** section in **Requests & Responses**.