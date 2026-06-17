# Localization
Webrium provides a simple file-based translation system for building multi-language applications.

## Language Files

Translation strings are stored in PHP files under `storage/langs/{locale}/`, where each file returns an associative array of key-value pairs:

```php
// storage/langs/en/messages.php
return [
    'welcome'       => 'Welcome to Webrium',
    'greeting'      => 'Hello, :name!',
    'items_in_cart' => 'You have :count items in your cart',
];
```

```php
// storage/langs/fa/messages.php
return [
    'welcome'  => 'به Webrium خوش آمدید',
    'greeting' => 'سلام، :name!',
];
```

You can have as many files as you like — `messages.php`, `validation.php`, `errors.php` — organized by topic.

## Setting the Locale

The default locale is `en`. Change it with `App::setLocale()`:

```php
use Webrium\App;

App::setLocale('fa');
```

A common pattern is to detect the locale from the request (a query parameter, session, or `Accept-Language` header) during bootstrap:

```php
App::setLocale(Session::get('locale', 'en'));
```

### Checking the Current Locale

```php
App::getLocale();        // "fa"
App::isLocale('fa');     // true
```

## Translating Strings

Translation keys use the format `'file.key'` — the filename (without `.php`) followed by the key within that file:

```php
echo lang('messages.welcome');
// "Welcome to Webrium" (en) or "به Webrium خوش آمدید" (fa)
```

`lang()` is a helper that calls `App::trans()` internally — both are equivalent:

```php
App::trans('messages.welcome');
lang('messages.welcome');
```

## Placeholders

Use `:placeholder` syntax in your translation strings, then pass values as the second argument:

```php
// storage/langs/en/messages.php
return [
    'greeting' => 'Hello, :name!',
];
```

```php
echo lang('messages.greeting', ['name' => 'Alice']);
// "Hello, Alice!"
```

## Missing Translations

If a translation key is not found within an existing language file, the key itself is returned as a fallback:

```php
// 'messages.nonexistent' is not defined
echo lang('messages.nonexistent'); // "nonexistent"
```

If the language file itself doesn't exist for the current locale, or the key format is invalid (not `file.key`), an error is triggered via `Debug` and `false` is returned.

## Example: Switching Locale via Route

```php
use Webrium\Route;
use Webrium\Session;

Route::get('/locale/{locale}', function ($locale) {
    Session::set('locale', $locale);
    return back();
});
```

```php
// In your bootstrap, before routing:
App::setLocale(Session::get('locale', 'en'));
```

## Next Steps

- [Validation](./01-validation.md) — translatable validation messages
- [Helper Functions Reference](../reference/helpers.md) — `lang()`, `env()`