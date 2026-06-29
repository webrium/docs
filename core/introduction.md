# Introduction

**`webrium/core`** is the heart of the Webrium framework — and also a self-contained PHP library you can drop into any project. It provides routing, controllers, requests, responses, sessions, validation, file uploads, an HTTP client, JWT, hashing, events, localization, filesystem helpers, error handling, and a small set of global helper functions, with no required dependencies on the rest of the Webrium ecosystem.

You can use Core in two ways:

- **As part of the full Webrium framework** — included automatically when you run `composer create-project webrium/webrium`. The application skeleton already wires Core into `public/index.php` with sensible defaults; you can skip to *Routing* and start building.
- **Standalone, in any PHP project** — installed by itself, with the bootstrap done by hand. This page covers that path.

Whichever route you take, the APIs documented in the rest of this section are identical.

## What's in `webrium/core`

| Topic | Class | Helper(s) |
| --- | --- | --- |
| Routing | `Webrium\Route` | `route()` |
| Controllers (dispatch) | `Webrium\Kernel` | — |
| Requests | `Webrium\Url`, `Webrium\Header` | `input()`, `current_url()`, `headers()` |
| Responses | `Webrium\Header` | `respond()`, `redirect()` |
| Sessions & flash | `Webrium\Session`, `Webrium\Flash` | `session()`, `flash()`, `old()` |
| Validation | `Webrium\Validator` | — |
| File uploads | `Webrium\Upload` | — |
| HTTP client | `Webrium\HttpClient` | — |
| JWT | `Webrium\Jwt` | — |
| Hashing | `Webrium\Hash` | — |
| Events | `Webrium\Event` | — |
| Filesystem | `Webrium\File`, `Webrium\Directory` | `root_path()`, `app_path()`, `storage_path()`, `public_path()` |
| Localization | `Webrium\Lang` | `lang()`, `trans()` |
| Error handling | `Webrium\Debug` | — |
| Application bootstrap | `Webrium\App` | `env()` |

All helper functions are defined inside `webrium/core` itself, so they are available the moment the package is installed — both in standalone projects and inside the full framework.

## Standalone Installation

Require the package:

```bash
composer require webrium/core
```

Make sure Composer's autoloader is included in your entry point:

```php
require_once __DIR__ . '/vendor/autoload.php';
```

The package needs **PHP 8.1 or newer** with the `curl`, `mbstring`, `json`, and `openssl` extensions enabled.

## Minimal Bootstrap

The smallest useful Webrium-style application is three lines:

```php
<?php
require_once __DIR__ . '/vendor/autoload.php';

use Webrium\App;
use Webrium\Route;

App::initialize(__DIR__);

Route::get('/', fn() => 'Hello, World!');
Route::get('/hello/{name}', fn(string $name) => "Hello, {$name}!");

App::run();
```

Save this as `index.php`, then run:

```bash
php -S 127.0.0.1:8000 index.php
```

Open `http://127.0.0.1:8000/hello/world` — you should see `Hello, world!`.

### What `App::initialize()` and `App::run()` do

- `App::initialize($rootPath)` records the project root path (used by helpers like `root_path()`, `storage_path()`), loads Core's helper functions, and prepares the request URL for routing.
- `App::run()` initializes the debug system and calls `Route::run()`, which matches the request against registered routes, executes middleware, and dispatches the handler.

You can use `Route` without `App` if you want even less framework — `App` is purely a convenience that ties bootstrap, routing, and the debug system together. See *Kernel* for the underlying execution model.

## Loading Route Files

In a standalone project, you can register routes directly in your entry file, or split them across multiple files and `require` them yourself.

In the full framework, route files live in `app/Routes/` and are loaded with a single call:

```php
Route::source(['Web.php', 'Api.php']);
```

`Route::source()` resolves each filename relative to the registered `routes` directory and `require`s the file. It is a convention, not a requirement.

## Optional Companions

Core does not depend on the other Webrium packages, but pairs well with them:

- **[`webrium/view`](https://github.com/webrium/view)** — provides the `view()` helper and a Blade-compatible templating engine. Required if you want to render server-side templates.
- **[`webrium/foxdb`](https://github.com/webrium/foxdb)** — provides the query builder, schema, and ORM. Required if you want database access.

Both can be added at any time with `composer require`.

## Where to Go Next

The rest of this section is organized roughly from most-used to most-advanced:

- **Routing** — defining routes, route groups, middleware, named routes, typed parameters
- **Controllers** — controller classes and lifecycle hooks
- **Requests & Responses** — reading input, sending responses, headers, redirects, CORS
- **Sessions** — sessions, flash messages, validation errors, old input
- **Validation** — fluent input validation
- **File Uploads** — secure file uploads with safe defaults
- **HTTP Client** — talking to external APIs
- **JWT** — issuing and verifying signed tokens
- **Hashing** — passwords, HMACs, tokens, UUIDs
- **Events** — a simple publish/subscribe system
- **Filesystem** — `File` and `Directory` utilities
- **Localization** — file-based translations
- **Error Handling** — unified handling of errors, exceptions, and fatal shutdowns
- **Helper Functions** — the complete reference of global helpers
- **Kernel** — the framework's execution core (advanced)
