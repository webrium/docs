# Controllers

Controllers group related request-handling logic into a single class. In Webrium, a controller is a plain PHP class placed in `app/Controllers/`.

## Creating a Controller

Use the Console to generate a controller:

```bash
php webrium make:controller User
```

This creates `app/Controllers/UserController.php`:

```php
<?php
namespace App\Controllers;

class UserController
{
    //
}
```

## Basic Controller

```php
<?php
namespace App\Controllers;

use Webrium\App;

class UserController
{
    public function index()
    {
        $users = \App\Models\User::get();
        return view('users.index', compact('users'));
    }

    public function show($id)
    {
        $user = \App\Models\User::find($id);

        if (!$user) {
            App::returnData(['error' => 'User not found'], 404);
        }

        return view('users.show', compact('user'));
    }

    public function store()
    {
        $data = App::input();

        // validate and save...

        $user = \App\Models\User::create($data);
        App::returnData($user, 201);
    }

    public function update($id)
    {
        $user = \App\Models\User::find($id);
        $data = App::input();

        // update...

        App::returnData($user);
    }

    public function destroy($id)
    {
        \App\Models\User::find($id)?->delete();
        App::returnData(['message' => 'Deleted'], 204);
    }
}
```

## Registering Routes to a Controller

```php
use Webrium\Route;

Route::get('/users',       'UserController@index');
Route::get('/users/{id}',  'UserController@show');
Route::post('/users',      'UserController@store');
Route::put('/users/{id}',  'UserController@update');
Route::delete('/users/{id}', 'UserController@destroy');
```

## Namespace

By default, controllers are loaded from the `App\Controllers` namespace. You can customize this in your config or use the Console's `--namespace` option:

```bash
php webrium make:controller Admin --namespace="App\Controllers\Admin"
```

## Lifecycle Hooks

Controllers support two optional lifecycle methods that the router calls automatically:

- **`__init()`** — called before the target method
- **`__end()`** — called after the target method

```php
class UserController
{
    private $currentUser;

    public function __init()
    {
        // Runs before every method in this controller
        $token = \Webrium\Header::getBearerToken();
        $this->currentUser = authenticateToken($token);
    }

    public function index()
    {
        return view('users.index', ['user' => $this->currentUser]);
    }

    public function __end()
    {
        // Runs after every method — cleanup, logging, etc.
    }
}
```

## Calling a Controller Method Manually

To execute a controller method programmatically:

```php
use Webrium\Route;

$result = Route::executeControllerMethod('UserController@show', ['id' => 1]);
```

You can also do this from the Console:

```bash
php webrium call UserController@index
php webrium call UserController@find --params='[42]'
```

## API Controllers (JSON Responses)

For API controllers, use `App::returnData()` instead of `view()`:

```php
<?php
namespace App\Controllers;

use Webrium\App;
use Webrium\Header;

class ApiUserController
{
    public function index()
    {
        $users = \App\Models\User::get();
        App::returnData(['data' => $users]);
    }

    public function show($id)
    {
        $user = \App\Models\User::find($id);

        if (!$user) {
            App::returnData(['error' => 'Not found'], 404);
        }

        App::returnData(['data' => $user]);
    }
}
```
