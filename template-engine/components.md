# Components

A **component** is a view that's rendered inside another view — a partial, a card, a form field, a navigation bar. Components let you keep the templates that are duplicated across pages in one place, and pass data into them as ordinary PHP arrays.

Webrium View has no special component class or registration step. A component is just a regular `.php` view file rendered with the `@component` directive (or the equivalent PHP method).

## The `@component` Directive

Inside a template, render a partial with `@component`:

```php
<div class="user-list">
    @component('components/user-card', ['user' => $user])
</div>
```

The first argument is the view path, resolved the same way as `Engine::render()` — relative to the configured views directory, with the `.php` extension optional. The second argument is the data passed into the component as variables.

`components/user-card.php` is then a normal template:

```php
{{-- views/components/user-card.php --}}
<div class="card">
    <img src="@{{ $user->avatar }}" alt="">
    <div>
        <h3>@{{ $user->name }}</h3>
        <p>@{{ $user->email }}</p>
    </div>
</div>
```

## Inside Loops

The most common use is repeating a component inside a loop:

```php
<div class="user-grid">
    <div w-for="$users as $user">
        @component('components/user-card', ['user' => $user])
    </div>
</div>
```

Each iteration re-renders the component with the current `$user`.

## Passing Multiple Values

The data argument is a regular PHP array — pass as many keys as the component needs:

```php
@component('components/button', [
    'label' => 'Save',
    'type'  => 'submit',
    'class' => 'btn-primary',
    'icon'  => 'check',
])
```

Inside `button.php`, all four keys are available as variables (`$label`, `$type`, `$class`, `$icon`).

To pass the entire surrounding scope into a component — every variable available to the parent template — use `$zogData`:

```php
@component('partials/debug', $zogData)
```

`$zogData` is the original data array passed to `render()`, available as a single variable in every template.

## Calling Components from PHP

`@component` is a thin wrapper around `Engine::component()`. You can call the same thing directly from PHP — useful when you're building a string of HTML programmatically:

```php
use Webrium\View\Engine;

$cardHtml = Engine::component('components/user-card', [
    'user' => $user,
]);
```

The return value is the rendered HTML as a string.

A `View::component()` alias is also available:

```php
use Webrium\View\View;

$html = View::component('components/user-card', ['user' => $user]);
```

Both forms produce identical output — they're aliases for `Engine::render()` with a name that signals intent.

## Components vs. Layouts vs. Partials

Webrium View doesn't draw a hard distinction between these — every "component", "partial", or "layout" is just a `.php` view file. The directive you use depends on the relationship:

| If you want to… | Use… |
| --- | --- |
| Wrap a page in a shared structure (header, footer, layout) | `Engine::renderLayout()` with `@section` / `@yield` |
| Drop a reusable piece of HTML into a template | `@component` |
| Include a fragment without passing data | `@component('partials/header', $zogData)` (passes the parent scope through) |

You can mix them freely — a layout can include components, a component can be rendered inside another component, and so on.

## Scope and Isolation

Each `@component` call gets a fresh variable scope. Variables defined in the parent template are **not** automatically visible inside the component — you have to pass them in explicitly through the second argument. This is intentional: it makes components easy to reason about, since you can see exactly what data they depend on.

If you want all parent variables to be visible inside the child, pass `$zogData`:

```php
@component('partials/header', $zogData)
```

If a component needs the parent's data plus a few extras, merge them:

```php
@component('partials/sidebar', array_merge($zogData, ['active' => 'home']))
```
