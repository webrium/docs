The `Vite` class manages Vite asset integration in PHP applications. It automatically detects whether the app is running in **Development mode** (Vite dev server) or **Production mode** (built files), and generates the correct `<script>` and `<link>` tags accordingly.

> **Requires:** PHP 8.0+

---

## Table of Contents

- [Basic Usage](#basic-usage)
- [How It Works](#how-it-works)
- [Configuration](#configuration)
  - [Setting the Base Path](#setting-the-base-path)
  - [Setting the Dev Server](#setting-the-dev-server)
- [Generating Asset Tags](#generating-asset-tags)
  - [Default Entry Point](#default-entry-point)
  - [Custom Entry Point](#custom-entry-point)
- [Development vs Production](#development-vs-production)
  - [Development Mode Output](#development-mode-output)
  - [Production Mode Output](#production-mode-output)
- [Debug](#debug)
- [API Reference](#api-reference)

---

## Basic Usage

```php
use Webrium\Vite;

echo Vite::getInstance()->assets();
```

Place this in your HTML `<head>` or before `</body>`. The class handles everything automatically — in development it points to the Vite dev server, and in production it reads from the manifest file.

```html
<head>
    <?php echo Vite::getInstance()->assets(); ?>
</head>
```

---

## How It Works

On instantiation, the class:

1. **Detects the project base path** from `$_SERVER['DOCUMENT_ROOT']`, or falls back to the file's parent directory.
2. **Checks if the Vite dev server is running** by attempting a socket connection to the configured host and port (default: `localhost:5173`).
3. **Renders the appropriate tags** — dev server tags if running, or production tags from `manifest.json` if not.

---

## Configuration

All configuration methods return `$this`, so they can be chained.

### Setting the Base Path

By default, the base path is detected automatically. If needed, you can set it manually:

```php
Vite::getInstance()
    ->setBasePath('/var/www/my-project')
    ->assets();
```

The class will look for the manifest at `{basePath}/public/build/.vite/manifest.json`.

### Setting the Dev Server

If your Vite dev server runs on a different host or port:

```php
Vite::getInstance()
    ->setDevServer('localhost', 3000)
    ->assets();
```

This also re-checks whether the dev server is currently active.

---

## Generating Asset Tags

### Default Entry Point

The default entry point is `resources/js/app.js`, which must match what is configured in your `vite.config.js`:

```php
echo Vite::getInstance()->assets();
```

### Custom Entry Point

Pass a custom entry point string to override the default:

```php
echo Vite::getInstance()->assets('resources/js/admin.js');
```

---

## Development vs Production

### Development Mode Output

When the Vite dev server is detected, the following tags are rendered:

```html
<script type="module" src="http://localhost:5173/@vite/client"></script>
<script type="module" src="http://localhost:5173/resources/js/app.js"></script>
```

### Production Mode Output

When the dev server is **not** running, the class reads `public/build/.vite/manifest.json` and renders the appropriate tags:

```html
<link rel="stylesheet" href="/build/assets/app-Dz1mSbhN.css">
<script type="module" src="/build/assets/app-BgEXjGAa.js"></script>
```

If the manifest file does not exist or cannot be parsed, an empty string is returned (or an HTML comment if `DEBUG_MODE` is enabled).

---

## Debug

To inspect the current state of the Vite instance:

```php
$info = Vite::getInstance()->debug();
print_r($info);
```

The returned array contains:

| Key | Type | Description |
|---|---|---|
| `isDev` | `bool` | Whether the dev server is currently active |
| `host` | `string` | The configured dev server host |
| `port` | `int` | The configured dev server port |
| `basePath` | `string` | The resolved project base path |
| `manifestPath` | `string` | The full path to the manifest file |
| `manifestExists` | `bool` | Whether the manifest file exists |
| `manifestContent` | `array\|null` | Parsed manifest content, or `null` if not found |

### Debug Mode Errors

If you define `DEBUG_MODE` as `true` in your app, detailed HTML comments are rendered on errors:

```php
define('DEBUG_MODE', true);
```

Example error output:

```html
<!-- Vite Error: Manifest not found at: /var/www/project/public/build/.vite/manifest.json -->
<!-- Vite Error: Entry 'resources/js/app.js' not found. Available: resources/js/other.js -->
```

---

## API Reference

### `Vite::getInstance(): self`

Returns the singleton instance of the `Vite` class.

```php
$vite = Vite::getInstance();
```

---

### `assets(string $entryPoint = 'resources/js/app.js'): string`

Generates and returns the HTML `<script>` and `<link>` tags for the given entry point.

```php
echo Vite::getInstance()->assets();
echo Vite::getInstance()->assets('resources/js/admin.js');
```

---

### `setBasePath(string $path): self`

Manually sets the project base path. Useful when auto-detection fails.

```php
Vite::getInstance()->setBasePath('/var/www/my-project');
```

---

### `setDevServer(string $host, int $port): self`

Sets the dev server host and port, and immediately re-checks the connection.

```php
Vite::getInstance()->setDevServer('localhost', 3000);
```

---

### `isDevelopment(): bool`

Returns `true` if the Vite dev server is currently reachable.

```php
if (Vite::getInstance()->isDevelopment()) {
    echo 'Running in development mode';
}
```

---

### `debug(): array`

Returns an associative array with diagnostic information about the current Vite state.

```php
$info = Vite::getInstance()->debug();
```