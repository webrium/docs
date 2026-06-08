# Webrium Validator

A powerful and flexible form validation class for the Webrium framework. This validator provides a fluent interface for validating form inputs with comprehensive rules, custom error messages, and built-in security features.

## Features

- **Fluent Interface**: Chain validation rules for clean and readable code
- **Comprehensive Rules**: 25+ built-in validation rules
- **Localization Support**: Multi-language error messages
- **Security Built-in**: Protection against ReDoS attacks in regex validation
- **Flexible**: Custom error messages and conditional validation
- **Type-Safe**: Validates data types with proper type checking
- **No Installation Required**: Part of the Webrium framework

## Basic Usage

```php
use Webrium\Validator;

$validator = new Validator([
    'email' => 'user@example.com',
    'password' => 'secret123',
    'age' => 25
]);

$validator->field('email', 'Email Address')
    ->required()
    ->email();

$validator->field('password', 'Password')
    ->required()
    ->min(8);

$validator->field('age', 'Age')
    ->required()
    ->integer()
    ->min(18)
    ->max(120);

if ($validator->fails()) {
    $errors = $validator->getErrors();
    print_r($errors);
} else {
    echo "Validation passed!";
}
```

### Using Current Request Data

```php
// Automatically uses current request data via App::input()
$validator = new Validator();

$validator->field('username')->required()->alphaNum();

if ($validator->passes()) {
    // Process the form
}
```

## Validation Rules

### Required & Optional

#### `required(?string $message = null)`
Field must be present and not empty.

```php
$validator->field('name')->required();
```

#### `nullable()`
Allow the field to be null or empty. Skips validation if no value provided.

```php
$validator->field('middle_name')->nullable()->string();
```

#### `sometimes()`
Apply validation only when the field is present in the request.

```php
$validator->field('optional_field')->sometimes()->email();
```

### Type Validation

#### `string(?string $message = null)`
Value must be a string.

```php
$validator->field('name')->string();
```

#### `numeric(?string $message = null)`
Value must be numeric (integer or float).

```php
$validator->field('price')->numeric();
```

#### `integer(?string $message = null)`
Value must be an integer (supports negative integers).

```php
$validator->field('quantity')->integer();
```

#### `boolean(?string $message = null)`
Value must be boolean (true, false, 1, 0, "1", "0").

```php
$validator->field('is_active')->boolean();
```

#### `array(?string $message = null)`
Value must be an array.

```php
$validator->field('items')->array();
```

#### `object(?string $message = null)`
Value must be an object.

```php
$validator->field('config')->object();
```

### String Validation

#### `alpha(?string $message = null)`
Must contain only alphabetic characters (a-z, A-Z).

```php
$validator->field('first_name')->alpha();
```

#### `alphaNum(?string $message = null)`
Must contain only alphanumeric characters (a-z, A-Z, 0-9).

```php
$validator->field('username')->alphaNum();
```

#### `digits(int $length, ?string $message = null)`
Must have an exact number of digits.

```php
$validator->field('pin')->digits(4);
```

#### `digitsBetween(int $min, int $max, ?string $message = null)`
Must have digits between min and max length.

```php
$validator->field('phone')->digitsBetween(10, 15);
```

### Size Validation

#### `min($min, ?string $message = null)`
Validates minimum value/length:
- **Strings**: minimum character length
- **Numbers**: minimum value
- **Arrays**: minimum item count

```php
$validator->field('password')->min(8);
$validator->field('age')->min(18);
$validator->field('items')->min(3);
```

#### `max($max, ?string $message = null)`
Validates maximum value/length:
- **Strings**: maximum character length
- **Numbers**: maximum value
- **Arrays**: maximum item count

```php
$validator->field('bio')->max(500);
$validator->field('price')->max(9999.99);
$validator->field('tags')->max(10);
```

#### `between($min, $max, ?string $message = null)`
Value must be between min and max:
- **Strings**: character length
- **Numbers**: numeric value
- **Arrays**: item count

```php
$validator->field('username')->between(3, 20);
$validator->field('quantity')->between(1, 100);
```

### Format Validation

#### `email(?string $message = null)`
Must be a valid email address.

```php
$validator->field('email')->email();
```

#### `url(?string $message = null)`
Must be a valid URL.

```php
$validator->field('website')->url();
```

#### `domain(?string $message = null)`
Must be a valid domain name.

```php
$validator->field('domain')->domain();
```

#### `phone(?string $message = null)`
Must be a valid phone number (supports international formats).

```php
$validator->field('phone')->phone();
```

#### `ip(?string $message = null)`
Must be a valid IP address (IPv4 or IPv6).

```php
$validator->field('ip_address')->ip();
```

#### `mac(?string $message = null)`
Must be a valid MAC address.

```php
$validator->field('mac_address')->mac();
```

#### `json(?string $message = null)`
Must be a valid JSON string.

```php
$validator->field('metadata')->json();
```

#### `date(string $format = 'Y-m-d', ?string $message = null)`
Must be a valid date in the specified format.

```php
$validator->field('birth_date')->date('Y-m-d');
$validator->field('created_at')->date('Y-m-d H:i:s');
```

### Comparison Validation

#### `confirmed(string $otherField, ?string $message = null)`
Field must match another field (useful for password confirmation).

```php
$validator->field('password')->required()->min(8);
$validator->field('password_confirmation')->confirmed('password');
```

#### `different(string $otherField, ?string $message = null)`
Field must be different from another field.

```php
$validator->field('new_email')->different('old_email');
```

### Advanced Validation

#### `regex(string $pattern, ?string $message = null)`
Must match a regular expression pattern. Includes security protection against ReDoS attacks.

**Security Limits:**
- Maximum pattern length: 500 characters
- Blocks nested quantifiers
- Blocks nested lookahead/lookbehind
- Blocks recursive patterns
- Maximum execution time: 2 seconds

```php
$validator->field('postal_code')->regex('/^[A-Z]\d[A-Z] \d[A-Z]\d$/');
$validator->field('custom_id')->regex('/^[A-Z]{3}-\d{4}$/');
```

#### `in(array $values, ?string $message = null)`
Value must be one of the given values.

```php
$validator->field('status')->in(['pending', 'approved', 'rejected']);
$validator->field('color')->in(['red', 'green', 'blue']);
```

#### `notIn(array $values, ?string $message = null)`
Value must not be one of the given values.

```php
$validator->field('username')->notIn(['admin', 'root', 'system']);
```

## Custom Error Messages

You can provide custom error messages for any validation rule:

```php
$validator->field('email', 'Email Address')
    ->required('Email is required!')
    ->email('Please provide a valid email address');

$validator->field('age', 'Age')
    ->required('Age is required')
    ->integer('Age must be a number')
    ->min(18, 'You must be at least 18 years old');
```

## Error Handling

### Check Validation Status

```php
// Check if validation passed
if ($validator->passes()) {
    // Validation succeeded
}

// Check if validation failed
if ($validator->fails()) {
    // Validation failed
}

// Alias for validate()
if ($validator->isValid()) {
    // Valid
}
```

### Retrieve Errors

```php
// Get all errors
$errors = $validator->getErrors();
// Returns: [
//     ['field' => 'email', 'message' => 'Email must be valid'],
//     ['field' => 'age', 'message' => 'Age must be at least 18']
// ]

// Get first error
$firstError = $validator->getFirstError();
// Returns: ['field' => 'email', 'message' => 'Email must be valid']

// Get first error message only
$message = $validator->getFirstErrorMessage();
// Returns: "Email must be valid"

// Get errors for specific field
$emailErrors = $validator->getFieldErrors('email');

// Check if specific field has errors
if ($validator->hasError('email')) {
    // Email field has validation errors
}
```

## Advanced Examples

### Registration Form

```php
$validator = new Validator();

$validator->field('username', 'Username')
    ->required()
    ->alphaNum()
    ->between(3, 20);

$validator->field('email', 'Email Address')
    ->required()
    ->email();

$validator->field('password', 'Password')
    ->required()
    ->min(8);

$validator->field('password_confirmation', 'Password Confirmation')
    ->required()
    ->confirmed('password');

$validator->field('age', 'Age')
    ->required()
    ->integer()
    ->min(13);

$validator->field('terms', 'Terms of Service')
    ->required('You must accept the terms of service');

if ($validator->fails()) {
    // Return errors to user
    $errors = $validator->getErrors();
    return json_encode(['errors' => $errors]);
}

// Process registration
```

### Optional Fields with Conditional Validation

```php
$validator = new Validator();

$validator->field('name')->required()->string();

// Only validate phone if it's provided
$validator->field('phone')
    ->sometimes()
    ->phone();

// Company field is optional but must be string if provided
$validator->field('company')
    ->nullable()
    ->string()
    ->max(100);

// Validate alternate email only if provided
$validator->field('alternate_email')
    ->sometimes()
    ->email();

$validator->validate();
```

### Complex Form with Multiple Rules

```php
$validator = new Validator();

$validator->field('product_code', 'Product Code')
    ->required()
    ->regex('/^[A-Z]{3}-\d{4}$/')
    ->max(8);

$validator->field('quantity', 'Quantity')
    ->required()
    ->integer()
    ->between(1, 1000);

$validator->field('price', 'Price')
    ->required()
    ->numeric()
    ->min(0.01)
    ->max(999999.99);

$validator->field('category', 'Category')
    ->required()
    ->in(['electronics', 'clothing', 'food', 'books']);

$validator->field('tags', 'Tags')
    ->nullable()
    ->array()
    ->max(10);

$validator->field('metadata', 'Metadata')
    ->sometimes()
    ->json();

if (!$validator->passes()) {
    foreach ($validator->getErrors() as $error) {
        echo "{$error['field']}: {$error['message']}\n";
    }
    exit;
}
```

### API Endpoint Validation

```php
use Webrium\Validator;
use Webrium\App;

function createUser() {
    $validator = new Validator();
    
    $validator->field('email')->required()->email();
    $validator->field('name')->required()->string()->between(2, 50);
    $validator->field('role')->required()->in(['admin', 'user', 'moderator']);
    
    if ($validator->fails()) {
        App::returnData([
            'success' => false,
            'errors' => $validator->getErrors()
        ], 400);
    }
    
    // Process user creation
    App::returnData([
        'success' => true,
        'message' => 'User created successfully'
    ]);
}
```

## Localization

The Validator class supports localization. Error messages are loaded from:
```
/langs/{locale}/validation.php
```

Example validation.php structure:
```php
<?php
return [
    'required' => 'The :attribute field is required.',
    'email' => 'The :attribute must be a valid email address.',
    'min' => [
        'numeric' => 'The :attribute must be at least :min.',
        'string' => 'The :attribute must be at least :min characters.',
        'array' => 'The :attribute must have at least :min items.'
    ],
    'max' => [
        'numeric' => 'The :attribute may not be greater than :max.',
        'string' => 'The :attribute may not be greater than :max characters.',
        'array' => 'The :attribute may not have more than :max items.'
    ],
    'between' => 'The :attribute must be between :min and :max.',
    // ... more messages
];
```

## Security Features

### ReDoS Protection
The `regex()` validation method includes built-in protection against Regular Expression Denial of Service (ReDoS) attacks:

- Maximum pattern length: 500 characters
- Blocks dangerous patterns (nested quantifiers, recursive patterns)
- Maximum execution time: 2 seconds
- Automatic validation of regex safety

### Input Sanitization
All values are automatically sanitized:
- Whitespace trimming
- Null byte removal for strings
- Type checking before validation

## PHP Version Compatibility

The Validator class is **fully compatible with PHP 8.0 and higher**, including:
- PHP 8.0+
- PHP 8.1+
- PHP 8.2+
- PHP 8.3+

## Requirements

- Part of the Webrium framework
- PHP 8.0 or higher
- Webrium\App class for input handling
- Webrium\File class for file operations
- Webrium\Directory class for directory operations


## Contributing

This is a framework component. For bug reports or feature requests, please contact the Webrium framework maintainers.