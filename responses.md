# Responses
## Returning Responses

In Webrium, you don't call a "send response" function directly in most cases — instead, whatever your route handler or controller method **returns** is automatically passed to `Header::respond()`.

```php
Route::get('/ping', function () {
    return 'pong'; // sent as plain text
});

Route::get('/users', function () {
    return User::all(); // sent as JSON
});
```

## JSON Responses

Arrays and objects are automatically encoded as JSON, with the `Content-Type: application/json` header set for you:

```php
return [
    'status' => 'ok',
    'data'   => $users,
];
```

```json
{
    "status": "ok",
    "data": [...]
}
```

## String and Scalar Responses

Strings, numbers, and other scalar values are sent as-is, with no automatic content type:

```php
return 'Hello, World!';
```

## Setting a Status Code

To return a response with a specific HTTP status code, call `respond()` directly:

```php
return respond(['error' => 'Not found'], 404);

return respond(['status' => 'created'], 201);
```

> `respond()` terminates the request immediately — code after it will not run.

## Redirects

Use the `redirect()` helper to send the client to a different URL:

```php
return redirect('/login');
```

By default, this uses a `303 See Other` status code. You can override it:

```php
return redirect('/login', 302);
```

### Redirecting Back

The `back()` helper redirects to the previous page, based on the `Referer` header:

```php
return back();
```

If there is no `Referer` header, `back()` falls back to the application's base URL.

## Setting Response Headers

Use the `Header` class to set custom headers before returning a response:

```php
use Webrium\Header;

Header::set('X-Powered-By', 'Webrium');
Header::contentType('text/csv');

return $csvContent;
```

## Caching Headers

```php
use Webrium\Header;

// Cache for 3600 seconds
Header::cache(3600);

// Disable caching entirely
Header::noCache();
```

## Security Headers

```php
use Webrium\Header;

Header::security([
    'frame_options' => 'DENY',
    'hsts'          => true,
]);
```

`security()` sets a sensible set of security headers by default (HSTS, `X-Content-Type-Options: nosniff`, `X-XSS-Protection`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy`), and also removes the `X-Powered-By` and `Server` headers. Pass options to override any of these defaults.

## CORS

To allow cross-origin requests — for example, when your frontend runs on a different domain or port — configure CORS once during application bootstrap:

```php
use Webrium\App;

App::enableCors(['https://example.com'], [
    'allowed_methods' => ['GET', 'POST', 'PUT', 'DELETE'],
    'allowed_headers' => ['Content-Type', 'Authorization'],
]);
```

This should be called after `App::initialize()` and before `App::run()`. See [Configuration](../getting-started/04-configuration.md#cors) for details.

## Next Steps

- [Views](./06-views.md) — returning rendered templates
- [Validation](../validation/01-basics.md) — returning validation errors