# Directory Structure
## The Root Structure

A fresh Webrium project looks like this:

```
my-app/
├── app/
│   ├── Config/
│   ├── Controllers/
│   ├── Models/
│   ├── Routes/
│   └── Views/
├── database/
│   ├── Migrations/
│   └── Seeders/
├── public/
│   └── index.php
├── resources/
│   ├── js/
│   ├── css/
│   └── views/
├── storage/
│   ├── app/
│   ├── framework/
│   ├── langs/
│   └── logs/
├── .env
├── .env.example
├── composer.json
├── package.json
└── vite.config.js
```

## The `app` Directory

The `app` directory contains the core of your application code and is mapped to the `App\` namespace via Composer's PSR-4 autoloading:

```json
"autoload": {
    "psr-4": {
        "App\\": "app/"
    }
}
```

### `app/Controllers`

Controllers handle incoming requests and return responses. A controller class is matched to a route either by its short class name (`'UserController@index'`) or directly via `[UserController::class, 'index']`.

```php
namespace App\Controllers;

class UserController
{
    public function index()
    {
        return view('users.index');
    }
}
```

### `app/Models`

Your application's data models, typically used with [FoxDB](https://github.com/webrium/foxdb), Webrium's query builder and ORM.

### `app/Routes`

Route definition files. These are loaded via `Route::source()` and define how URLs map to controllers or closures.

### `app/Config`

Application configuration files — database connections, app-level settings, and any custom configuration your application needs.

### `app/Views`

Server-side view templates, if your application uses server-rendered pages alongside or instead of a frontend framework.

## The `database` Directory

Holds everything related to your database schema evolution.

- **`Migrations`** — version-controlled database schema changes
- **`Seeders`** — scripts to populate the database with test or initial data

## The `public` Directory

The only directory that should be exposed to the web server. Contains `index.php`, the single entry point for all HTTP requests, along with compiled frontend assets.

## The `resources` Directory

Frontend source files — Vue components, stylesheets, and any assets processed by Vite before being output to `public`.

## The `storage` Directory

Files generated and used by the application at runtime:

- **`app/`** — user-uploaded files and application-generated content
- **`framework/`** — framework-level cache and temporary files
- **`langs/`** — language/translation files used by `lang()` and `trans()`
- **`logs/`** — application error logs (when `Debug` logging is enabled)

## Helper Functions for Paths

Webrium provides helper functions to resolve paths to these directories from anywhere in your code:

```php
public_path('images/logo.png');   // public/images/logo.png
app_path('Models/User.php');      // app/Models/User.php
storage_path('logs/app.log');     // storage/logs/app.log
root_path('composer.json');       // project root
```

## Next Steps

- [Request Lifecycle](./03-lifecycle.md) — how a request travels through these directories
- [Routing](../routing/01-basic-routing.md) — defining routes in `app/Routes`