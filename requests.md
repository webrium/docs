# Requests
## Accessing Input

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

### Default Values

Pass a second argument to return a default value when the key is missing:

```php
$page = input('page', 1);
```

### Retrieving All Input

Call `input()` with no arguments to get every input value as an array:

```php
$data = input();

User::create($data);
```

## JSON Request Bodies

If the request's `Content-Type` is `application/json`, the body is automatically decoded and made available through `input()` — no extra steps required:

```php
// Content-Type: application/json
// Body: {"name": "Alice", "email": "alice@example.com"}

$name = input('name'); // "Alice"
```

If the JSON body is malformed, a `400 Bad Request` error is triggered automatically.

## Form Data

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

## The Current URL and Route

The `Url` class provides everything related to the current request's URL:

```php
use Webrium\Url;

Url::current();         // full current URL
Url::uri();              // path only, e.g. /users/42
Url::method();           // HTTP method, e.g. "POST"
Url::segments();         // ['users', '42']
Url::segment(1);         // "users"
Url::queryString();      // raw query string
Url::isSecure();         // true if HTTPS
Url::clientIp();         // visitor's IP address
```

### Checking the Current Path

`Url::is()` checks the current URL against a pattern, useful for highlighting active navigation links. A trailing `*` matches any path that starts with the given prefix (and has at least one additional character):

```php
if (Url::is('admin/*')) {
    // matches /admin/users, /admin/settings, etc. — but not /admin itself
}

if (Url::is('about')) {
    // exact match only
}
```

## Request Headers

Use the `Header` class to read incoming request headers:

```php
use Webrium\Header;

Header::get('X-Custom-Header');
Header::has('Authorization');
Header::getBearerToken();      // extracts "Bearer <token>" → "<token>"
Header::getContentType();
Header::expectsJson();         // true if client accepts application/json
```

## Next Steps

- [Responses](../responses/01-basics.md) — sending data back to the client
- [Validation](../validation/01-basics.md) — validating and sanitizing input