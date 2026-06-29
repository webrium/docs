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

### Reading Values: `env()`

Read values from `.env` anywhere in your application with the `env()` helper:

```php
$dbHost = env('DB_HOST', 'localhost');

if (env('APP_DEBUG', false)) {
    // debug-only logic
}
```

The second argument is the default returned if the key is missing. `env()` returns `null` when no default is given. Common string values are converted to PHP equivalents: `"true"` and `"false"` become booleans, `"null"` becomes `null`, and empty values become `null`.

### Everything Else

The rest of Webrium's configuration — error display and logging, the view engine, session storage, locale, directory layout, CORS — is bootstrapped in `public/index.php`. You normally do not need to change it.

When you do, edit `public/index.php` directly and consult the relevant module documentation: **Core → Error Handling**, **Core → Localization**, **Core → Sessions**, **Core → Filesystem**, or the **CORS** section in **Core → Requests & Responses**.

---

## Directory Structure

A fresh Webrium project looks like this:

```
my-app/
├── app/
│   ├── Config/        ← Configuration files loaded at boot (e.g. DB.php)
│   ├── Controllers/   ← Your controller classes
│   ├── Models/        ← Your data models
│   ├── Routes/        ← Route files (Web.php is loaded by default)
│   └── Views/         ← Templates rendered by the view engine
│       ├── layouts/
│       ├── loaders/
│       └── pages/
├── database/
│   ├── Migrations/    ← Version-controlled schema changes
│   └── Seeders/       ← Scripts to populate initial or test data
├── public/            ← Web server document root
│   ├── build/         ← Compiled Vite assets
│   └── index.php      ← Application entry point
├── resources/         ← Frontend source files (CSS, JS, views)
├── storage/           ← Runtime files: sessions, logs, compiled views, langs
│   ├── app/           ← User-uploaded files and app-generated content
│   ├── framework/     ← Framework-level cache and temporary files
│   ├── langs/         ← Translations (ar, de, en, fa, ja, ru, zh)
│   └── logs/          ← Application error logs
├── .env               ← Environment configuration
├── .env.example
├── composer.json
├── package.json
├── vite.config.js
└── webrium            ← CLI binary
```

Everything in `app/` is yours to edit. Webrium follows PSR-4: the `App\` namespace is mapped to the `app/` directory.

### The `app` Directory

The heart of your application. Composer's `composer.json` maps the `App\` namespace to this folder:

```json
"autoload": {
    "psr-4": {
        "App\\": "app/"
    }
}
```

| Folder | Purpose |
| --- | --- |
| `app/Controllers` | Controllers handle incoming requests and return responses. Matched to routes by short name (`'UserController@index'`) or array syntax (`[UserController::class, 'index']`). |
| `app/Models` | Data models, typically extending FoxDB's `Model` class. |
| `app/Routes` | Route definition files. Loaded via `Route::source()` from `public/index.php`. |
| `app/Config` | Application configuration files — database connections, app-level settings, anything custom you need to load at boot. |
| `app/Views` | Server-side view templates rendered by the view engine. |

### The `database` Directory

Everything related to your database schema evolution:

- **`Migrations`** — version-controlled schema changes
- **`Seeders`** — scripts to populate the database with test or initial data

### The `public` Directory

The only directory that should be exposed to the web server. Contains:

- **`index.php`** — the single entry point for every HTTP request (see *Request Lifecycle*)
- **`build/`** — compiled frontend assets produced by Vite

### The `resources` Directory

Frontend source files — JavaScript, stylesheets, and any assets processed by Vite before being written to `public/build/`.

### The `storage` Directory

Files generated and used by the application at runtime:

- **`app/`** — user uploads and other content the application produces
- **`framework/`** — framework-level cache and temporary files
- **`langs/`** — translation files used by `lang()` and `trans()`
- **`logs/`** — application error logs (when `Debug` logging is enabled)

### Path Helpers

Resolve paths to these directories from anywhere in your code:

```php
public_path('images/logo.png');   // <root>/public/images/logo.png
app_path('Models/User.php');      // <root>/app/Models/User.php
storage_path('logs/app.log');     // <root>/storage/logs/app.log
root_path('composer.json');       // <root>/composer.json
```

These helpers always return absolute paths, so they are safe to use regardless of the working directory at the time the code runs.
