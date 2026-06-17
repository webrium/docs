# Validation
Webrium's `Validator` class provides a fluent, chainable API for validating incoming request data.

## Basic Usage

```php
use Webrium\Validator;

$validator = new Validator();

$validator->field('email')->required()->email();
$validator->field('age')->required()->integer()->min(18);

if ($validator->fails()) {
    return respond(['errors' => $validator->getErrors()], 422);
}

// validation passed — continue
```

By default, the `Validator` reads its data from the current request via `input()`. You can also pass an array explicitly:

```php
$validator = new Validator([
    'email' => 'user@example.com',
    'age'   => 25,
]);
```

## Defining Fields and Rules

Call `field()` to start defining rules for a field, then chain rule methods:

```php
$validator->field('username')
    ->required()
    ->string()
    ->min(3)
    ->max(20)
    ->alphaNum();
```

### Custom Field Labels

By default, error messages use the field name. Pass a second argument to `field()` for a human-readable label:

```php
$validator->field('email_address', 'Email')->required()->email();
// "The Email field is required."
```

## Available Rules

| Rule | Description |
|---|---|
| `required()` | Field must be present and non-empty |
| `nullable()` | Field may be empty; skips remaining rules if so |
| `sometimes()` | Skip validation entirely if the field is not present |
| `string()` | Must be a string |
| `numeric()` | Must be numeric |
| `integer()` | Must be an integer |
| `boolean()` | Must be a boolean |
| `array()` | Must be an array |
| `object()` | Must be a valid object/associative structure |
| `alpha()` | Letters only |
| `alphaNum()` | Letters and numbers only |
| `digits($length)` | Exactly `$length` digits |
| `digitsBetween($min, $max)` | Between `$min` and `$max` digits |
| `min($value)` | Minimum value (numbers) or length (strings) |
| `max($value)` | Maximum value or length |
| `between($min, $max)` | Value or length within a range |
| `email()` | Valid email address |
| `url()` | Valid URL |
| `domain()` | Valid domain name |
| `ip()` | Valid IP address |
| `mac()` | Valid MAC address |
| `phone()` | Valid phone number |
| `regex($pattern)` | Must match the given regular expression |
| `in($values)` | Must be one of the given values |
| `notIn($values)` | Must not be one of the given values |
| `json()` | Must be valid JSON |
| `date($format)` | Must be a valid date in the given format (default `Y-m-d`) |
| `different($field)` | Must differ from another field's value |
| `confirmed($field)` | Must match another field's value (e.g. password confirmation) |

Every rule method accepts an optional custom error message as its last argument:

```php
$validator->field('age')->min(18, 'You must be at least 18 years old.');
```

## Running Validation

```php
$validator->validate();  // runs validation, returns bool
$validator->isValid();   // alias for validate()
$validator->fails();     // true if validation failed (runs validate() if not already run)
$validator->passes();    // inverse of fails()
```

`fails()` and `passes()` automatically trigger validation if it hasn't run yet, so in most cases you can call them directly without calling `validate()` first.

## Retrieving Errors

```php
$validator->getErrors();
// [
//   ['field' => 'email', 'message' => 'The Email field is required.'],
//   ['field' => 'age',   'message' => 'The Age must be at least 18.'],
// ]

$validator->getFirstError();
// ['field' => 'email', 'message' => '...']

$validator->getFirstErrorMessage();
// "The Email field is required."

$validator->getFieldErrors('email');
// errors for just the 'email' field

$validator->hasError('email'); // bool
```

## Custom Validation Messages

Validation error message templates are loaded from `storage/langs/{locale}/validation.php`:

```php
// storage/langs/en/validation.php
return [
    'required' => 'The :attribute field is required.',
    'email'    => 'The :attribute must be a valid email address.',
    'min'      => 'The :attribute must be at least :min.',
];
```

`:attribute` is replaced with the field's label, and rule-specific placeholders (like `:min`) are replaced with the rule's configured value.

## Validation Errors with Redirects

A common pattern is to validate input, flash errors and old input to the session, then redirect back to the form:

```php
$validator = new Validator();
$validator->field('email')->required()->email();

if ($validator->fails()) {
    Flash::withError(array_column($validator->getErrors(), 'message', 'field'))
        ->withInput();

    return back();
}
```

On the next request, the form can display errors and repopulate fields using the [`errors()` and `old()` helpers](./02-sessions.md#flash-data).

## Next Steps

- [Sessions](./02-sessions.md) — flash messages and old input
- [Requests](../requests/01-basics.md) — retrieving the data being validated