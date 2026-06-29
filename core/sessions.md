# Sessions
Webrium's `Session` class wraps PHP's native session handling with a clean, static API. The `Flash` class builds on top of it to provide one-time flash messages, validation errors, and old input — commonly used after redirects.

## Basic Usage

Sessions start automatically the first time you read or write to them — there is no need to call `start()` manually in most cases.

```php
use Webrium\Session;

Session::set('user_id', 42);

$userId = Session::get('user_id');        // 42
$theme  = Session::get('theme', 'light'); // 'light' if not set
```

### Setting Multiple Values

```php
Session::set([
    'user_id' => 42,
    'role'    => 'admin',
]);
```

### Checking and Removing

```php
Session::has('user_id');     // true if the key exists (even if null)
Session::exists('user_id');  // true if the key exists and is not null

Session::forget('user_id');           // remove a single key
Session::forget(['user_id', 'role']); // remove multiple
```

### Reading and Removing in One Step

```php
$token = Session::pull('csrf_token'); // get and immediately forget
```

The shorter alias `Session::once()` does the same thing.

### All Session Data

```php
$all = Session::all();
```

## Arrays in Session

```php
Session::push('recent_searches', 'webrium framework');
// $_SESSION['recent_searches'][] = 'webrium framework'
```

## Counters

```php
Session::increment('page_views');    // +1
Session::increment('page_views', 5); // +5
Session::decrement('attempts');      // -1
```

## Flash Data (One-Request Lifetime)

Use `Session::flash()` for values that should be available on the **next** request only, then automatically removed:

```php
Session::flash('notice', 'Settings saved.');
```

```php
// On the next request:
$notice = Session::getFlash('notice'); // 'Settings saved.'

// On the request after that, it's gone.
```

To keep a flashed value alive for one more request, use `Session::reflash()`.

## Flash Messages, Errors, and Old Input

The `Flash` class provides a higher-level API built on top of session flash data, designed for the common redirect-with-feedback pattern.

### Flash Messages

```php
use Webrium\Flash;

Flash::success('Profile updated successfully.');
Flash::errorMessage('Something went wrong.');
Flash::message('Your session will expire soon.');

return back();
```

On the next request, retrieve and display the message:

```php
if (Flash::hasMessage()) {
    echo Flash::getMessage(); // rendered output
}
```

Or use the `message()` helper:

```php
echo message();     // rendered output
echo message(true); // raw text only
```

### Validation Errors

```php
Flash::withError(['email' => 'This email is already taken.']);

return back();
```

On the next request:

```php
if (Flash::hasErrors()) {
    foreach (Flash::errors() as $field => $message) {
        echo "$field: $message";
    }
}
```

Or using helpers:

```php
errors();        // all errors as ['field' => 'message']
errors('email'); // error message for a single field, or null
```

### Old Input

Flash the current request's input before redirecting, so a form can be repopulated:

```php
Flash::withError($validationErrors)->withInput();

return back();
```

On the next request:

```php
<input name="email" value="<?= old('email') ?>">
```

```php
old('email');                  // previously submitted value, or null
old('email', 'default@x.com'); // with a default
```

## Session Lifetime and Cookies

```php
use Webrium\Session;

Session::setLifetime(3600); // 1 hour, in seconds
Session::getLifetime();

Session::setCookieParams(
    lifetime: 3600,
    path: '/',
    domain: '',
    secure: true,
    httponly: true,
    samesite: 'Lax'
);
```

## Session Security

```php
Session::regenerate();      // new session ID, deletes old session data (default)
Session::regenerate(false); // new session ID, keeps old session data

Session::destroy();         // completely destroy the session
Session::clear();           // clear data but keep the session active
```

The framework also supports binding a session to the client's fingerprint:

```php
Session::bind();              // record the current fingerprint
Session::verifyFingerprint(); // true if the current client matches
```

This makes it harder for a stolen session ID to be reused from a different client.