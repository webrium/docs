# Installation

This page covers installing the full Webrium framework — the `webrium/webrium` application skeleton with all four packages wired up. If you only want a single module (Core, FoxDB, View, or Console) on its own, see the **Introduction** page in that module's section instead.

## Requirements

- **PHP 8.1 or newer**, with the `curl`, `mbstring`, `json`, and `openssl` extensions enabled
- **Composer**
- **Node.js & npm** — required only if you want to use the bundled Vite + TailwindCSS asset pipeline (you can ignore this for headless APIs)
- A web server: Apache, nginx, or PHP's built-in development server

## Creating a Project

Create a new application with Composer:

```bash
composer create-project webrium/webrium my-app
cd my-app
```

This installs the framework, copies `.env.example` to `.env`, and places a `webrium` CLI binary in the project root.

If you intend to use the frontend pipeline, install the JavaScript dependencies as well:

```bash
npm install
```

## Running the Application

For local development, use PHP's built-in server through the bundled Composer script:

```bash
composer serve
```

Then open `http://127.0.0.1:8000` in your browser — you should see the Webrium welcome screen.

If you are using the asset pipeline, start Vite alongside the PHP server with hot reloading for assets and views:

```bash
npm run dev
```

For production, point your web server's document root to the `public/` directory. Only `public/` should ever be exposed to the web.

## Verify Your Install

Open `app/Routes/Web.php` — it already maps `/` to `IndexController@index`. Add a quick route to confirm everything is wired up:

```php
use Webrium\Route;

Route::get('/hello/{name}', function (string $name) {
    return "Hello, {$name}!";
});
```

Reload `http://127.0.0.1:8000/hello/world` — you should see `Hello, world!`.

## Where to Go Next

- **Configuration** — the `.env` file and the project's directory layout
- **Request Lifecycle** — what `App::initialize()` and `App::run()` actually do
- **Core → Routing** — defining routes, groups, parameters, and middleware
- **Core → Controllers** — organizing request-handling logic into classes
