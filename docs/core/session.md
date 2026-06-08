# Session

The `Session` class provides a clean, static interface for managing PHP sessions in Webrium applications. It handles the full session lifecycle, flash messages, array helpers, counters, and security features like session regeneration.

---

## Table of Contents

- [Getting Started](#getting-started)
- [Storing & Retrieving Data](#storing--retrieving-data)
  - [set()](#set)
  - [get()](#get)
  - [pull() / once()](#pull--once)
  - [all()](#all)
  - [has() / exists()](#has--exists)
- [Removing Data](#removing-data)
- [Array Helper](#array-helper)
- [Flash Data](#flash-data)
  - [flash()](#flash)
  - [getFlash()](#getflash)
  - [reflash()](#reflash)
- [Counters](#counters)
- [Session Lifecycle](#session-lifecycle)
  - [start()](#start)
  - [destroy() / clear()](#destroy--clear)
  - [flush()](#flush)
  - [regenerate()](#regenerate)
- [Session Identity](#session-identity)
- [Cookie Configuration](#cookie-configuration)
- [API Reference](#api-reference)

---

## Getting Started

The session starts automatically the first time you call any `Session` method. You can also start it explicitly:

```php
use Webrium\Session;

Session::start();
```

To customize where session files are stored, call `setSavePath()` **before** any other session method:

```php
Session::setSavePath('/var/app/sessions');
Session::start();
```

---

## Storing & Retrieving Data

### set()

Store one or multiple values in the session:

```php
// Single value
Session::set('user_id', 42);

// Multiple values at once
Session::set([
    'user_id' => 42,
    'role'    => 'admin',
    'locale'  => 'en',
]);
```

### get()

Retrieve a value, with an optional default if the key does not exist:

```php
$userId = Session::get('user_id');

// With a default fallback
$locale = Session::get('locale', 'en');
```

### pull() / once()

Retrieve a value and immediately remove it from the session. Both methods are identical:

```php
$token = Session::pull('csrf_token');
// or
$token = Session::once('csrf_token');

// $token now holds the value; 'csrf_token' is gone from the session
```

### all()

Get the entire session as an associative array:

```php
$data = Session::all();
```

### has() / exists()

`has()` returns `true` if the key is set (even if its value is `null`).  
`exists()` returns `true` only if the key is set **and** its value is not `null`.

```php
if (Session::has('user_id')) {
    // key is set
}

if (Session::exists('user_id')) {
    // key is set and not null
}
```

Both methods accept an array of keys and return `true` only when **all** keys pass the check:

```php
if (Session::has(['user_id', 'role'])) {
    // both keys are present
}
```

---

## Removing Data

```php
// Remove a single key
Session::forget('user_id');

// Remove multiple keys
Session::forget(['user_id', 'role', 'locale']);

// remove() is an alias for forget()
Session::remove('user_id');
```

Both `forget()` and `remove()` return `true` if at least one key was successfully removed.

---

## Array Helper

Push a value onto a session key that holds an array. If the key does not exist or is not an array, it is initialized automatically:

```php
Session::push('notifications', 'Your profile was updated.');
Session::push('notifications', 'You have a new message.');

$notifications = Session::get('notifications');
// ['Your profile was updated.', 'You have a new message.']
```

---

## Flash Data

Flash data is stored for the **current request** and automatically deleted after the **next request**. It is ideal for one-time messages such as success alerts or validation errors.

### flash()

```php
// Single flash value
Session::flash('status', 'Profile updated successfully.');

// Multiple flash values
Session::flash([
    'status' => 'Profile updated.',
    'type'   => 'success',
]);
```

### getFlash()

Retrieve a flash value just like a regular session value:

```php
$message = Session::getFlash('status');

// With a default fallback
$message = Session::getFlash('status', 'No message.');
```

In your view or template:

```php
<?php if (Session::has('status')): ?>
    <div class="alert"><?= Session::getFlash('status') ?></div>
<?php endif; ?>
```

### reflash()

Keep flash data alive for one additional request:

```php
// Keep all flash data
Session::reflash();

// Keep specific keys only
Session::reflash('status');
Session::reflash(['status', 'type']);
```

---

## Counters

Increment or decrement an integer stored in the session:

```php
// Increment by 1 (default)
Session::increment('login_attempts');

// Increment by a custom amount
Session::increment('score', 10);

// Decrement by 1 (default)
Session::decrement('credits');

// Decrement by a custom amount
Session::decrement('credits', 5);
```

Both methods return the **new value** after the operation:

```php
$attempts = Session::increment('login_attempts');

if ($attempts >= 5) {
    // Too many attempts — lock the account
}
```

---

## Session Lifecycle

### start()

Start or resume the session. Safe to call multiple times — subsequent calls do nothing if the session is already active. Returns `true` if the session was started by this call, `false` if it was already running.

```php
Session::start();
```

Check if the session is currently active:

```php
if (Session::isStarted()) {
    // session is active
}
```

### destroy() / clear()

Completely destroy the session: clears all data, deletes the session cookie, and ends the session. Both methods are identical.

```php
Session::destroy();
// or
Session::clear();
```

Typical use after logout:

```php
Session::regenerate();   // prevent session fixation
Session::destroy();
header('Location: /login');
exit;
```

### flush()

Clear all session data but **keep the session active**:

```php
Session::flush();
// Session is still running, but $_SESSION is now empty
```

### regenerate()

Generate a new session ID. Call this after login or any privilege elevation to prevent session fixation attacks:

```php
Session::regenerate();               // deletes old session file (default)
Session::regenerate(false);          // keeps old session file
```

---

## Session Identity

Get or set the session ID:

```php
$id = Session::id();

// Set a custom ID (must be called before start)
Session::id('custom-session-id');
```

Get or set the session name (the cookie name, default is `PHPSESSID`):

```php
$name = Session::name();

// Set a custom name (must be called before start)
Session::name('my_app_session');
```

---

## Cookie Configuration

Control the session cookie lifetime:

```php
// Set lifetime to 2 hours
Session::setLifetime(7200);

// Expires when the browser closes (0 = session cookie)
Session::setLifetime(0);

$seconds = Session::getLifetime();
```

Set all cookie parameters at once (call before `start()`):

```php
Session::setCookieParams(
    lifetime: 3600,
    path: '/',
    domain: '.example.com',
    secure: true,       // HTTPS only
    httponly: true      // not accessible via JavaScript
);
```

Get the current cookie parameters:

```php
$params = Session::getCookieParams();
// [
//   'lifetime' => 3600,
//   'path'     => '/',
//   'domain'   => '.example.com',
//   'secure'   => true,
//   'httponly' => true,
// ]
```

---

## API Reference

### Lifecycle Methods

| Method | Description |
|---|---|
| `Session::start()` | Start or resume the session |
| `Session::isStarted()` | Check if the session is active |
| `Session::regenerate($deleteOld)` | Regenerate the session ID |
| `Session::destroy()` | Destroy the session and delete the cookie |
| `Session::clear()` | Alias for `destroy()` |
| `Session::flush()` | Clear all session data without destroying the session |
| `Session::setSavePath($path)` | Set a custom session file storage path |

### Data Methods

| Method | Description |
|---|---|
| `Session::set($key, $value)` | Store one or multiple values |
| `Session::get($key, $default)` | Retrieve a value |
| `Session::pull($key, $default)` | Retrieve and remove a value |
| `Session::once($key, $default)` | Alias for `pull()` |
| `Session::has($key)` | Check if a key is set |
| `Session::exists($key)` | Check if a key is set and not null |
| `Session::all()` | Get all session data |
| `Session::forget($keys)` | Remove one or multiple keys |
| `Session::remove($keys)` | Alias for `forget()` |
| `Session::push($key, $value)` | Push a value onto a session array |

### Flash Methods

| Method | Description |
|---|---|
| `Session::flash($key, $value)` | Store flash data for the next request |
| `Session::getFlash($key, $default)` | Retrieve flash data |
| `Session::reflash($keys)` | Keep flash data for one more request |

### Counter Methods

| Method | Description |
|---|---|
| `Session::increment($key, $amount)` | Increment a session integer value |
| `Session::decrement($key, $amount)` | Decrement a session integer value |

### Identity & Cookie Methods

| Method | Description |
|---|---|
| `Session::id($id)` | Get or set the session ID |
| `Session::name($name)` | Get or set the session name |
| `Session::setLifetime($seconds)` | Set the session cookie lifetime |
| `Session::getLifetime()` | Get the session cookie lifetime |
| `Session::setCookieParams(...)` | Set all cookie parameters |
| `Session::getCookieParams()` | Get all cookie parameters |