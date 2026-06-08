# Localization

Webrium has built-in support for multi-language applications through locale-based translation files.

## Setting the Locale

```php
App::setLocale('en');
App::setLocale('fa');
App::setLocale('es');
```

Call this early in `public/index.php`, or dynamically based on the request:

```php
// From a request header
$locale = substr(Header::get('Accept-Language', 'en'), 0, 2);
App::setLocale($locale);

// From a URL segment or session
App::setLocale(Session::get('locale', 'en'));
```

## Getting the Current Locale

```php
$locale = App::getLocale(); // 'en'

if (App::isLocale('fa')) {
    // Persian locale active
}
```

## Translation Files

Create PHP files in `storage/Langs/{locale}/`:

**`storage/Langs/en/messages.php`:**
```php
<?php
return [
    'welcome'      => 'Welcome to our site',
    'hello_name'   => 'Hello, :name!',
    'items_count'  => 'You have :count items',
];
```

**`storage/Langs/fa/messages.php`:**
```php
<?php
return [
    'welcome'      => 'به سایت ما خوش آمدید',
    'hello_name'   => 'سلام، :name!',
    'items_count'  => 'شما :count مورد دارید',
];
```

## Translating Strings

Use `App::trans()` or the global `lang()` helper:

```php
// Simple translation
$text = App::trans('messages.welcome');
// "Welcome to our site"

// With replacements
$greeting = App::trans('messages.hello_name', ['name' => 'John']);
// "Hello, John!"

// Using the global helper
$text = lang('messages.welcome');
$text = lang('messages.hello_name', ['name' => 'John']);
```

The key format is `{filename}.{key}` — e.g. `messages.welcome` looks for the `welcome` key inside `messages.php`.

## Validator Localization

Form validation error messages also support localization. Create `storage/Langs/{locale}/validation.php`:

```php
<?php
return [
    'required' => 'The :attribute field is required.',
    'email'    => 'The :attribute must be a valid email address.',
    'min'      => [
        'numeric' => 'The :attribute must be at least :min.',
        'string'  => 'The :attribute must be at least :min characters.',
        'array'   => 'The :attribute must have at least :min items.',
    ],
    'max'      => [
        'numeric' => 'The :attribute may not be greater than :max.',
        'string'  => 'The :attribute may not be greater than :max characters.',
    ],
];
```
