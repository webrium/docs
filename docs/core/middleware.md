# Middleware

Middleware intercepts HTTP requests before they reach a route handler. In Webrium, middleware is defined at the route group level and controls whether the routes inside the group are accessible.

## How Middleware Works

A middleware must return a **truthy** value to allow the request through. If it returns falsy, the router skips the group and continues looking for another matching route (or returns 404).

## Creating Middleware

Create a class in `app/Middleware/`:

```php
<?php
namespace App\Middleware;

use Webrium\Header;
use Webrium\App;

class AuthMiddleware
{
    public static function handle(): bool
    {
        $token = Header::getBearerToken();

        if (!$token) {
            App::returnData(['error' => 'Unauthorized'], 401);
        }

        $user = validateToken($token);

        if (!$user) {
            App::returnData(['error' => 'Invalid token'], 401);
        }

        return true;
    }
}
```

## Attaching Middleware to Routes

```php
use Webrium\Route;

Route::group(['middleware' => 'AuthMiddleware@handle'], function () {
    Route::get('/dashboard', 'DashboardController@index');
    Route::get('/profile',   'ProfileController@show');
});
```

## Multiple Middleware

Pass an array of middleware. They run in order — if any returns falsy, the request is blocked.

```php
Route::group(['middleware' => [
    'AuthMiddleware@handle',
    'SubscriptionMiddleware@check',
]], function () {
    Route::get('/premium', 'PremiumController@index');
});
```

## Inline Middleware (Closure)

For simple cases, use a closure directly:

```php
Route::group(['middleware' => function () {
    return isset($_SESSION['user_id']);
}], function () {
    Route::get('/account', 'AccountController@index');
});
```

## Middleware with Prefix

Middleware and prefix can be combined:

```php
Route::group([
    'prefix'     => '/admin',
    'middleware' => 'AdminMiddleware@check',
], function () {
    Route::get('/users',    'AdminUserController@index');
    Route::get('/settings', 'AdminSettingController@index');
});
```

## Common Middleware Examples

### Session Auth

```php
<?php
namespace App\Middleware;

class SessionMiddleware
{
    public static function check(): bool
    {
        return !empty($_SESSION['user_id']);
    }
}
```

### Role Check

```php
<?php
namespace App\Middleware;

use Webrium\Header;

class RoleMiddleware
{
    public static function admin(): bool
    {
        $token = Header::getBearerToken();
        $user  = getUserFromToken($token);

        return $user && $user->role === 'admin';
    }
}
```

### API Key

```php
<?php
namespace App\Middleware;

use Webrium\Header;
use Webrium\App;

class ApiKeyMiddleware
{
    public static function handle(): bool
    {
        $apiKey = Header::getApiKey();

        if ($apiKey !== App::env('API_KEY')) {
            App::returnData(['error' => 'Invalid API key'], 403);
        }

        return true;
    }
}
```
