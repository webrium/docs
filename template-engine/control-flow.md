# Control Flow

Webrium View places conditionals and loops as **attributes on HTML elements** rather than as block directives wrapping them. The result reads naturally as HTML and stays well-formed even when you stop looking at the template — your IDE, your linter, and your eye all treat it as a regular tag.

| Attribute | Purpose |
| --- | --- |
| `w-if="..."` | Show the element only if the expression is truthy |
| `w-else-if="..."` | Chained alternative condition |
| `w-else` | Fallback for the preceding `w-if` / `w-else-if` |
| `w-for="..."` | Repeat the element for each item in a collection |
| `w-skip` | Disable template processing for this element and its subtree |

All five compile to ordinary PHP `if` / `elseif` / `else` / `foreach` blocks. There is no virtual DOM, no diffing — just PHP control structures wrapping the relevant HTML.

## Conditionals — `w-if`, `w-else-if`, `w-else`

Put `w-if` directly on the element you want to show or hide:

```php
<p w-if="$user->isAdmin">
    You are an admin.
</p>
<p w-else-if="$user->isModerator">
    You are a moderator.
</p>
<p w-else>
    You are a regular user.
</p>
```

Compiles to:

```php
<?php if ($user->isAdmin): ?>
    <p>You are an admin.</p>
<?php elseif ($user->isModerator): ?>
    <p>You are a moderator.</p>
<?php else: ?>
    <p>You are a regular user.</p>
<?php endif; ?>
```

The expression inside `w-if` and `w-else-if` is any valid PHP boolean expression:

```php
<div w-if="$user->isActive && $user->emailVerified">…</div>
<div w-if="count($items) > 0">…</div>
<div w-if="in_array($user->role, ['admin', 'editor'])">…</div>
```

`w-else-if` and `w-else` must follow a matching `w-if` (or `w-else-if`) on a **sibling element**. Whitespace and comments between them are fine; another tag breaks the chain.

## Loops — `w-for`

Put `w-for` on the element you want to repeat. The syntax mirrors PHP's own `foreach`:

```php
<ul>
    <li w-for="$items as $item">
        @{{ $item['name'] }}
    </li>
</ul>
```

With a key:

```php
<ul>
    <li w-for="$items as $key => $item">
        @{{ $key }}: @{{ $item['name'] }}
    </li>
</ul>
```

Both forms compile to standard PHP `foreach` / `endforeach` blocks:

```php
<?php foreach ($items as $key => $item): ?>
    <li>...</li>
<?php endforeach; ?>
```

The collection on the left side can be any PHP expression that produces something iterable:

```php
<tr w-for="$user->orders() as $order">…</tr>
<tr w-for="array_slice($rows, 0, 10) as $row">…</tr>
<option w-for="range(1, 12) as $month">@{{ $month }}</option>
```

## Combining `w-if` and `w-for`

You can place both attributes on the same element. The `if` wraps the `foreach`, so the loop only runs when the condition is true:

```php
<li w-if="$showList" w-for="$items as $item">
    @{{ $item }}
</li>
```

Compiles to:

```php
<?php if ($showList): ?>
    <?php foreach ($items as $item): ?>
        <li>@{{ $item }}</li>
    <?php endforeach; ?>
<?php endif; ?>
```

If you need the opposite — a condition that filters each iteration — put the check inside the loop:

```php
<li w-for="$items as $item" w-if-each-removed>
    @{{ $item['name'] }}
</li>
```

…or, more idiomatically, filter the collection before passing it to the template:

```php
@php($visible = array_filter($items, fn($i) => $i['active']))

<li w-for="$visible as $item">@{{ $item['name'] }}</li>
```

## Disabling Processing — `w-skip`

`w-skip` turns off template processing for the element it appears on, and for **every descendant**. This is the escape hatch for when you're embedding another templating system inside your page and don't want Webrium View to touch it.

```php
<div w-skip>
    <!-- w-for and w-if inside here are NOT compiled — they are left as raw HTML attributes -->
    <span w-if="$cond">raw attribute, untouched</span>
</div>
```

What `w-skip` does:

- `w-if`, `w-else-if`, `w-else`, `w-for` inside the subtree are **not** converted to PHP — they remain as literal attributes in the rendered HTML
- The `w-skip` attribute itself is removed from the final output
- Inline directives — `@{{ }}`, `@raw()`, `@json()`, `@php()` — **still work** inside the subtree

The typical use is embedding another framework's syntax:

```php
<div w-skip>
    <button v-if="isAdmin" @click="doSomething">Vue button</button>
    <div x-data="{ open: false }">Alpine component</div>
    <li v-for="item in items">{{ item.name }}</li>
</div>
```

Because Webrium View parses HTML attributes streamingly — never building a DOM — none of the special characters in Vue/Alpine/Livewire syntax are mangled. You only need `w-skip` when there's an actual collision (an attribute literally named `w-if` or `w-for`), which is rare.

### `w-skip` on `<script>` and `<style>`

By default, the contents of `<script>` and `<style>` are treated as raw text — but inline directives like `@{{ }}` and `@json()` still work inside them. Adding `w-skip` to the tag itself emits the contents completely verbatim:

```php
<script>
    // directives work here
    const user = @json($user);
</script>

<script w-skip>
    // emitted exactly as-is
    const tpl = "@{{ this is not compiled }}";
</script>
```

See *Basic Syntax* for the full behaviour of `<script>` / `<style>` tags.

## Why Attributes, Not Block Directives?

A short note on the design choice, since it differs from Blade-style engines.

When conditionals and loops live as attributes on the elements they control, the template stays valid HTML at every stage:

- Your editor recognises tag boundaries correctly.
- HTML linters and prettifiers don't choke on `@if` / `@endif` pairs.
- The compiler can stream through the document with a simple state machine — no `DOMDocument`, no AST construction, no reformatting.
- Attributes from other frameworks (`v-if`, `:class`, `@click`, `x-data`, `wire:click`, `hx-get`) pass through untouched, since the parser never normalises attribute names or reorders them.

The trade-off is that you can't conditionally render a *fragment* of text without an enclosing element. For that, you have `@{{ }}` with a ternary, or an `@php(...)` directive:

```php
<p>@{{ $isAdmin ? 'Admin' : 'User' }}</p>

@php($greeting = $isLoggedIn ? "Welcome, {$user->name}" : 'Welcome, guest')
<p>@{{ $greeting }}</p>
```
