# Requests & Responses

This guide covers the full HTTP cycle in Webrium: how to read incoming requests, and how to send responses back. Both sides revolve around a small set of framework primitives — the `input()` helper, the `Url` class, the `Header` class, and the `respond()` / `redirect()` helpers.

- [Reading the Request](#reading-the-request)
- [Sending Responses](#sending-responses)

---

## Reading the Request

### Accessing Input

The `input()` helper retrieves data from the current request — query string parameters for `GET` requests, or the request body for `POST`, `PUT`, `PATCH`, and `DELETE` requests.

```php
// /search?q=webrium
$query = input('q'); // "webrium"
```

```php
public function store()
{
    $name  = input('name');
    $email = input('email');
}
```

#### Default Values

Pass a second argument to return a default value when the key is missing:

```php
$page = input('page', 1);
```

#### Retrieving All Input

Call `input()` with no arguments to get every input value as an array:

```php
$data = input();

User::create($data);
```

### JSON Request Bodies

If the request's `Content-Type` is `application/json`, the body is automatically decoded and made available through `input()` — no extra steps required:

```php
// Content-Type: application/json
// Body: {"name": "Alice", "email": "alice@example.com"}

$name = input('name'); // "Alice"
```

If the JSON body is malformed, a `400 Bad Request` error is triggered automatically.

### Form Data

For `application/x-www-form-urlencoded` or `multipart/form-data` requests, `input()` reads from the standard PHP `$_POST` superglobal — so regular HTML forms work without any extra configuration:

```html
<form method="POST" action="/users">
    <input name="name">
    <input name="email">
</form>
```

```php
public function store()
{
    $name = input('name');
}
```

### The Current URL and Route

The `Url` class provides everything related to the current request's URL:

```php
use Webrium\Url;

Url::current();      // full current URL
Url::uri();          // path only, e.g. /users/42
Url::method();       // HTTP method, e.g. "POST"
Url::segments();     // ['users', '42']
Url::segment(1);     // "users"
Url::queryString();  // raw query string
Url::isSecure();     // true if HTTPS
Url::clientIp();     // visitor's IP address
```

#### Checking the Current Path

`Url::is()` checks the current URL against a pattern, useful for highlighting active navigation links. A trailing `*` matches any path that starts with the given prefix (and has at least one additional character):

```php
if (Url::is('admin/*')) {
    // matches /admin/users, /admin/settings, etc. — but not /admin itself
}

if (Url::is('about')) {
    // exact match only
}
```

`Url::isAny([...])` lets you check several patterns at once.

### Request Headers

Use the `Header` class to read incoming request headers:

```php
use Webrium\Header;

Header::get('X-Custom-Header');
Header::has('Authorization');
Header::getBearerToken();      // extracts "Bearer <token>" → "<token>"
Header::getBasicAuth();        // ['username' => ..., 'password' => ...] or null
Header::getApiKey();           // value of X-API-Key (or a custom header name)
Header::getContentType();
Header::getUserAgent();
Header::expectsJson();         // true if client accepts application/json
```

---

## Sending Responses

### Returning Responses

In Webrium, you do not call a "send response" function directly in most cases — instead, whatever your route handler or controller method **returns** is automatically passed to `Header::respond()`.

```php
Route::get('/ping', function () {
    return 'pong'; // sent as plain text
});

Route::get('/users', function () {
    return User::all(); // sent as JSON
});
```

### JSON Responses

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

### String and Scalar Responses

Strings, numbers, and other scalar values are sent as-is, with no automatic content type:

```php
return 'Hello, World!';
```

### Setting a Status Code

To return a response with a specific HTTP status code, call `respond()` directly:

```php
return respond(['error' => 'Not found'], 404);

return respond(['status' => 'created'], 201);
```

> `respond()` terminates the request immediately — code after it will not run.

For more explicit control over the response body and content type, return one of the typed payload helpers — `html()`, `json()`, or `text()` — which build a `ResponsePayload` object that the framework will send:

```php
return html('<h1>Hello</h1>', 200);
return json(['status' => 'ok'], 201);
return text('plain output');
```

### Redirects

Use the `redirect()` helper to send the client to a different URL:

```php
return redirect('/login');
```

By default, this uses a `303 See Other` status code. You can override it:

```php
return redirect('/login', 302);
```

#### Redirecting Back

The `back()` helper redirects to the previous page, based on the `Referer` header:

```php
return back();
```

If there is no `Referer` header, `back()` falls back to the application's base URL.

### Setting Response Headers

Use the `Header` class to set custom headers before returning a response:

```php
use Webrium\Header;

Header::set('X-Powered-By', 'Webrium');
Header::contentType('text/csv');

return $csvContent;
```

Convenience methods are available for the most common content types — `Header::json()`, `Header::html()`, `Header::xml()`, `Header::text()` — each setting the appropriate `Content-Type` with UTF-8 charset.

### Caching Headers

```php
use Webrium\Header;

// Cache for 3600 seconds
Header::cache(3600);

// Disable caching entirely
Header::noCache();
```

### Security Headers

```php
use Webrium\Header;

Header::security([
    'frame_options' => 'DENY',
    'hsts'          => true,
]);
```

`security()` sets a sensible default stack — HSTS (1 year, with subdomains), `X-Content-Type-Options: nosniff`, `X-XSS-Protection: 1; mode=block`, `X-Frame-Options: SAMEORIGIN`, and `Referrer-Policy: strict-origin-when-cross-origin` — and also removes the identifying `X-Powered-By` and `Server` headers. Pass options to override any of these defaults; a `csp` option adds a `Content-Security-Policy` header.

### CORS

To allow cross-origin requests — for example, when your frontend runs on a different domain or port — configure CORS once during application bootstrap:

```php
use Webrium\App;

App::enableCors(['https://example.com'], [
    'allowed_methods' => ['GET', 'POST', 'PUT', 'DELETE'],
    'allowed_headers' => ['Content-Type', 'Authorization'],
]);
```

This should be called after `App::initialize()` and before `App::run()`. `enableCors()` also handles `OPTIONS` preflight requests automatically — responding with `204 No Content` for allowed origins and `403 Forbidden` for disallowed ones.
