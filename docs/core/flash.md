
The `Flash` class is a session-based flash data manager. It stores temporary data — validation errors, status messages, and old form input — that persists for exactly **one subsequent request** and is then automatically discarded.

This pattern is most commonly used before a redirect: you flash the data, redirect the user, and read it back on the next page.

> **Requires:** PHP 8.0+

---

## Table of Contents

- [Basic Usage](#basic-usage)
- [Errors](#errors)
  - [Flashing Errors](#flashing-errors)
  - [Reading Errors](#reading-errors)
  - [Clearing Errors](#clearing-errors)
- [Messages](#messages)
  - [Flashing Messages](#flashing-messages)
  - [Reading Messages](#reading-messages)
  - [Custom Message Templates](#custom-message-templates)
  - [Clearing Messages](#clearing-messages)
- [Old Input](#old-input)
  - [Flashing Input](#flashing-input)
  - [Reading Old Input](#reading-old-input)
- [Chaining](#chaining)
- [API Reference](#api-reference)

---

## Basic Usage

```php
use Webrium\Flash;

// Before redirecting — store the data
Flash::withError(['email' => 'Invalid email address.'])
     ->withInput();

// redirect(...)

// On the next page — read the data
echo Flash::error('email');   // Invalid email address.
echo Flash::old('email');     // user@example.com
```

---

## Errors

### Flashing Errors

Store validation errors before a redirect. Accepts a single string or an associative `field => message` array.

**Single message:**
```php
Flash::withError('Something went wrong. Please try again.');
```

**Multiple field errors:**
```php
Flash::withError([
    'email'    => 'A valid email address is required.',
    'password' => 'Password must be at least 8 characters.',
]);
```

### Reading Errors

**Check if any errors exist:**
```php
if (Flash::hasErrors()) {
    // show error summary
}
```

**Check a specific field:**
```php
if (Flash::hasError('email')) {
    echo Flash::error('email');
}
```

**Get a single field error:**
```php
echo Flash::error('email') ?? '';
```

**Get all errors:**
```php
$errors = Flash::errors();  // ['email' => '...', 'password' => '...']

foreach ($errors as $field => $message) {
    echo "<p>{$field}: {$message}</p>";
}
```

**In a form (Blade-style example):**
```html
<input type="email" name="email" value="<?= Flash::old('email') ?>">

<?php if (Flash::hasError('email')): ?>
    <span class="error"><?= Flash::error('email') ?></span>
<?php endif; ?>
```

### Clearing Errors

Manually remove all flashed errors from the session:

```php
Flash::clearErrors();
```

---

## Messages

### Flashing Messages

Three message types are available, each rendered using its own configurable template.

**Success:**
```php
Flash::success('Your profile has been updated.');
```

**Error:**
```php
Flash::errorMessage('Failed to process your request.');
```

**Normal / neutral:**
```php
Flash::message('Maintenance is scheduled for tonight at 11 PM.');
```

### Reading Messages

**Check if a message is waiting:**
```php
if (Flash::hasMessage()) {
    echo Flash::getMessage();
}
```

**Render using the configured template (default):**
```php
echo Flash::getMessage();
```

**Get the raw text only, without any template:**
```php
$text = Flash::getMessage(raw: true);
```

`getMessage()` consumes the message from the session — it will not be available on the next call or next request.

### Custom Message Templates

Define PHP constants to control how each message type is rendered. Use `@text` as the placeholder for the message content.

```php
define('MESSAGE_SCRIPT',         '<div class="alert alert-info">@text</div>');
define('MESSAGE_SCRIPT_SUCCESS', '<div class="alert alert-success">@text</div>');
define('MESSAGE_SCRIPT_ERROR',   '<div class="alert alert-danger">@text</div>');
```

If no constant is defined for a given type, it falls back to:

```html
<script>alert('@text');</script>
```

> **Note:** Message text is always escaped with `htmlspecialchars` before being inserted into the template to prevent XSS.

### Clearing Messages

```php
Flash::clearMessage();
```

---

## Old Input

Repopulate form fields after a failed submission by flashing the current request input before redirecting.

### Flashing Input

Call `withInput()` before the redirect. It reads all current request input using the global `input()` helper.

```php
Flash::withInput();
```

### Reading Old Input

**Single field with optional default:**
```php
echo Flash::old('username');
echo Flash::old('country', 'NL');  // fallback default
```

**All old input at once:**
```php
$old = Flash::oldAll();  // ['username' => '...', 'email' => '...']
```

**In a form:**
```html
<input type="text"  name="name"  value="<?= Flash::old('name') ?>">
<input type="email" name="email" value="<?= Flash::old('email') ?>">
```

---

## Chaining

All write methods (`withError`, `success`, `errorMessage`, `message`, `withInput`) return a `static` instance, so they can be chained freely.

```php
Flash::withError(['email' => 'Invalid email.'])
     ->withInput()
     ->success('Some other message.');  // contrived, but valid
```

A typical controller pattern:

```php
public function store(Request $request)
{
    $validated = $request->validate([...]);

    if (!$validated) {
        Flash::withError($errors)->withInput();
        return redirect()->back();
    }

    // ... save record ...

    Flash::success('Record created successfully.');
    return redirect('/dashboard');
}
```

---

## API Reference

### Errors

| Method | Signature | Description |
|---|---|---|
| `withError` | `withError(string\|array $errors): static` | Flash one or more errors to the session |
| `hasErrors` | `hasErrors(): bool` | True if any errors are stored |
| `hasError` | `hasError(string $field): bool` | True if an error exists for the given field |
| `error` | `error(string $field): ?string` | Get the error message for a field, or null |
| `errors` | `errors(): array` | Get all errors as an associative array |
| `clearErrors` | `clearErrors(): void` | Remove all errors from the session |

### Messages

| Method | Signature | Description |
|---|---|---|
| `success` | `success(string $text): static` | Flash a success message |
| `errorMessage` | `errorMessage(string $text): static` | Flash an error message |
| `message` | `message(string $text): static` | Flash a neutral message |
| `hasMessage` | `hasMessage(): bool` | True if a message is waiting |
| `getMessage` | `getMessage(bool $raw = false): string\|false` | Retrieve and render (or return raw text of) the message |
| `clearMessage` | `clearMessage(): void` | Remove the message from the session |

### Old Input

| Method | Signature | Description |
|---|---|---|
| `withInput` | `withInput(): static` | Flash the current request's input to the session |
| `old` | `old(string $field, mixed $default = null): mixed` | Get a single old input value |
| `oldAll` | `oldAll(): array` | Get all old input as an associative array |