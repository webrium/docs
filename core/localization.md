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

> Under the hood, the framework resolves the language directory through the `langs` alias registered in `Directory`. By default this is mapped to `storage/langs` via `Directory::initDefaultStructure()`, but you can point it elsewhere by calling `Directory::set('langs', '...')` before any translation is loaded.

## Default Locales

Webrium ships with ready-made language directories for seven locales:

| Code | Language |
|------|----------|
| `ar` | Arabic |
| `de` | German |
| `en` | English |
| `fa` | Persian |
| `ja` | Japanese |
| `ru` | Russian |
| `zh` | Chinese |

Each of these contains a starter `validation.php` file with translated error messages for the built-in validation rules, so the `Validator` works out of the box for these locales. Add your own files (such as `messages.php`) to extend any of them, or create a new directory under `storage/langs/` for additional locales.

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
App::getLocale();    // "fa"
App::isLocale('fa'); // true
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

Once a language file is loaded, the framework keeps it in an in-memory cache per locale, so repeated lookups within the same request do not re-read the file from disk.

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

If a translation **key** is not found within an existing language file, the key itself (the part after the dot) is returned as a fallback:

```php
// 'messages.nonexistent' is not defined
echo lang('messages.nonexistent'); // "nonexistent"
```

If the language **file** does not exist for the current locale, or the key format is invalid (not `file.key`), an error is reported through `Debug` and `false` is returned.

## Example: Switching Locale via Route

```php
use Webrium\Route;
use Webrium\Session;
use Webrium\App;

Route::get('/locale/{locale}', function ($locale) {
    Session::set('locale', $locale);
    return back();
});
```

```php
// In your bootstrap, before routing:
App::setLocale(Session::get('locale', 'en'));
```