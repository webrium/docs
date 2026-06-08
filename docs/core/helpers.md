# Helper Functions

Webrium provides global helper functions as convenient shortcuts for the most commonly used operations. They are available everywhere — in controllers, views, and route closures — without any import.

## URL Helpers

### `url(string $path = ''): string`

Generate an absolute URL for any relative path.

```php
$link = url('products/list');
// https://example.com/products/list

$home = url();
// https://example.com/
```

### `current_url(): string`

Get the full URL of the current request including the query string.

```php
$current = current_url();
// https://example.com/dashboard?tab=settings
```

## Redirects

### `redirect(string $url, int $code = 302)`

Redirect the user to any URL.

```php
return redirect('/login');

// Permanent redirect
return redirect('/new-page', 301);
```

### `back()`

Redirect the user back to the previous page using the `HTTP_REFERER` header.

```php
return back();
```

Typical use after form validation:

```php
public function store()
{
    $input = input();

    if (empty($input['title'])) {
        Flash::withError(['title' => 'Title is required.'])->withInput();
        return back();
    }

    // ... save and redirect
    return redirect('/posts');
}
```

## Request Input

### `input(?string $key = null, mixed $default = null)`

Retrieve input values from the current request (GET, POST, or JSON body).

```php
// Single field
$name = input('name');

// With a default fallback
$page = input('page', 1);

// All input as an associative array
$all = input();
```

## Form Helpers

These helpers make it easy to repopulate form fields and display validation errors after a failed submission.

### `old(string $field, mixed $default = null)`

Retrieve the previously submitted value for a field (flashed by `Flash::withInput()`).

```php
<input type="text" name="email" value="<?= old('email') ?>">

// With a default
<input type="text" name="country" value="<?= old('country', 'US') ?>">
```

### `errors(?string $field = null)`

Retrieve validation error messages from the previous request.

```php
// Get the error for a specific field
$error = errors('email');

// Get all errors as an array
$allErrors = errors();
```

Example in a view:

```php
<input type="text" name="email" value="<?= old('email') ?>">
<?php if ($error = errors('email')): ?>
    <span class="error"><?= $error ?></span>
<?php endif; ?>
```

## Flash Messages

### `message(bool $rawText = false)`

Retrieve a flash message set during the previous request.

```php
// Get the rendered message HTML
$msg = message();

// Get only the message text
$text = message(true);
```

Example in a view:

```php
<?php if ($text = message(true)): ?>
    <div class="alert"><?= $text ?></div>
<?php endif; ?>
```

## Path Helpers

### `public_path(string $path = ''): string`

Get an absolute path inside the `public/` directory.

```php
$path = public_path('images/logo.png');
// /var/www/app/public/images/logo.png
```

### `app_path(string $path = ''): string`

Get an absolute path inside the `app/` directory.

```php
$path = app_path('Models/User.php');
// /var/www/app/app/Models/User.php
```

### `storage_path(string $path = ''): string`

Get an absolute path inside the `storage/` directory.

```php
$path = storage_path('logs/app.log');
// /var/www/app/storage/logs/app.log
```

### `root_path(string $path = ''): string`

Get an absolute path relative to the application root.

```php
$path = root_path('.env');
// /var/www/app/.env
```

## Environment

### `env(string $key, mixed $default = null)`

Read an environment variable from the `.env` file.

```php
$debug  = env('APP_DEBUG');
$dbHost = env('DB_HOST', 'localhost');
```

## Localization

### `lang(string $key, array $replacements = []): string`

Translate a key using the current locale.

```php
$text = lang('auth.login_failed');
// "Invalid email or password."

$text = lang('welcome.greeting', ['name' => 'John']);
// "Welcome, John!"
```

## Named Routes

### `route(string $name, array $params = []): string`

Generate a URL for a named route.

```php
$url = route('user.show', ['id' => 42]);
// /users/42
```

## Vite Assets

### `vite_assets(string $entryPoint = 'resources/js/app.js'): string`

Output the correct HTML `<script>` and `<link>` tags for your Vite entry point.

```php
<!DOCTYPE html>
<html>
<head>
    <?= vite_assets() ?>
</head>
<body>
    ...
</body>
</html>
```

In **development**, outputs the Vite dev server script tag.
In **production**, reads the hashed manifest and outputs versioned asset tags.

See [Vite Integration](/core/vite) for setup details.
