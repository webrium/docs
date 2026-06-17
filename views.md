# Views
## Overview

Views handle rendering HTML templates, typically returned from controllers in response to a request. Webrium's view layer is provided by the **[webrium/view](https://github.com/webrium/view)** package, a Blade-compatible templating engine that is included by default in new Webrium projects.

This page covers how views fit into the request/response flow described in [Controllers](./05-controllers.md) and the [Request Lifecycle](../getting-started/03-lifecycle.md). For the full templating syntax — loops, conditionals, layouts, components, and more — see the [webrium/view documentation](https://github.com/webrium/view).

## Returning a View

The `view()` helper renders a template and returns its output as a string, which is then sent to the client by `Header::respond()`:

```php
namespace App\Controllers;

class UserController
{
    public function index()
    {
        return view('users.index');
    }
}
```

Template files are resolved from `app/Views`, using dot notation to represent subdirectories:

```
app/Views/users/index.blade.php  →  view('users.index')
app/Views/errors/404.blade.php   →  view('errors.404')
```

## Passing Data to Views

Pass an associative array as the second argument. Each key becomes a variable available inside the template:

```php
public function show($id)
{
    $user = User::find($id);

    return view('users.show', ['user' => $user]);
}
```

```blade
{{-- app/Views/users/show.blade.php --}}
<h1>{{ $user->name }}</h1>
<p>{{ $user->email }}</p>
```

## Views and the Frontend

If your application uses Vue (as configured by default with Vite), server-rendered views and frontend components can coexist:

- `app/Views` — server-rendered templates (Blade-compatible syntax)
- `resources/js` — Vue components and frontend logic
- `resources/css` — stylesheets

A common pattern is to use a single server-rendered "shell" view that mounts a Vue application, while page-specific logic lives entirely on the frontend.

## Next Steps

- [webrium/view documentation](https://github.com/webrium/view) — full templating syntax
- [Responses](./04-responses.md) — how view output is sent to the client