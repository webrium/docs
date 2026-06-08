# Introduction

**Webrium** is a PHP web application framework built for developers who value simplicity, speed, and clean structure. It provides everything you need to build web applications and REST APIs without unnecessary complexity.

## What is Webrium?

Webrium follows the **MVC** (Model-View-Controller) architecture and ships with:

- A powerful routing system with middleware and groups
- The **FoxDB** query builder and ORM for database operations
- A custom **View** template engine with static caching
- Built-in security tools: JWT, hashing, validation, CORS
- A **Console** CLI for scaffolding and task automation
- A plugin distribution system

## Quick Example

**routes/web.php**
```php
use Webrium\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::group(['prefix' => '/api', 'middleware' => 'AuthMiddleware@handle'], function () {
    Route::get('/users', 'UserController@index');
    Route::post('/users', 'UserController@store');
    Route::get('/users/{id}', 'UserController@show');
});
```

**app/Controllers/UserController.php**
```php
class UserController
{
    public function index()
    {
        $users = User::all();
        return view('users.index', compact('users'));
    }

    public function show($id)
    {
        $user = User::find($id);
        return view('users.show', compact('user'));
    }
}
```

## Key Features

| Feature | Description |
|---|---|
| **Routing** | GET, POST, PUT, DELETE, groups, middleware, named routes |
| **FoxDB** | Fluent query builder + Eloquent-style ORM |
| **View Engine** | DOM-less streaming compiler, layouts, components, hybrid caching |
| **Security** | JWT, bcrypt/argon2 hashing, form validation, CORS |
| **Console** | CLI scaffolding, DB management, plugin system |
| **HTTP Client** | Fluent HTTP client for outgoing requests |
| **Vite** | Built-in Vite integration for frontend assets |

## Requirements

- PHP **8.1** or higher
- Composer
- Node.js & npm (for frontend assets)

## Next Steps

- [Installation](/getting-started/installation) — set up a new project
- [Directory Structure](/getting-started/directory-structure) — understand the project layout
- [Configuration](/getting-started/configuration) — configure your environment
