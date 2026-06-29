# Basic Syntax

Webrium View's template syntax is intentionally small. Five directives cover the day-to-day work of outputting values and dropping into PHP when you need to.

| Directive | Purpose |
| --- | --- |
| `@{{ ... }}` | Escaped output (the default) |
| `@raw(...)` | Raw, unescaped output |
| `@json(...)` / `@tojs(...)` | `json_encode`d output, safe for embedding in JavaScript |
| `@php(...)` | Single-line inline PHP |
| `@php ... @endphp` | Multi-line PHP block |

Every directive compiles to ordinary PHP. There is no special runtime — once a template has been compiled, rendering it is just `require`-ing a PHP file.

## Escaped Output — `@{{ ... }}`

Escaped output is the default and the one you'll use most often. The `$` sign is required to mark a PHP expression:

```php
<p>@{{ $user->name }}</p>
<p>@{{ $item['price'] * $qty }}</p>
```

Compiles to:

```php
<?php echo htmlspecialchars($user->name, ENT_QUOTES, 'UTF-8'); ?>
```

This means `<script>alert(1)</script>` in your data ends up as literal text in the page — there is no way for user-supplied content to inject HTML through `@{{ ... }}`.

It also works inside HTML attributes:

```php
<a href="/users/@{{ $user->id }}">@{{ $user->name }}</a>
```

The expression inside `@{{ }}` can be any valid PHP expression — property accesses, array lookups, arithmetic, function calls — as long as it produces a single scalar value. If you need conditionals or loops, see *Control Flow*.

## Raw Output — `@raw(...)`

Sometimes you genuinely want to render HTML that's already been generated — a rich text body, a Markdown-rendered article, output from the Editor.js parser. For that, use `@raw()`:

```php
<article>@raw($htmlContent)</article>
```

Compiles to:

```php
<?php echo $htmlContent; ?>
```

> **Use `@raw()` only on content you trust.** If `$htmlContent` came from user input without being sanitized, you've just opened the door to XSS. The default `@{{ }}` exists precisely so that you never have to think about this for normal output.

## JSON / JavaScript Output — `@json(...)` and `@tojs(...)`

`@json()` and `@tojs()` are aliases — they do the same thing. Both produce `json_encode`d output, useful for safely embedding PHP data into JavaScript:

```php
<script>
    const items = @json($items);
    const user  = @tojs($user);
</script>
```

Compiles to:

```php
const items = <?php echo json_encode($items); ?>;
```

They also work inside attributes — handy for passing config to Alpine or Vue components:

```php
<div data-config="@json($config)"></div>

<div x-data="@json(['count' => 0, 'open' => false])"></div>
```

## Inline PHP — `@php(...)`

For short, single-line expressions — usually variable assignments or function calls whose return value you don't need:

```php
@php($count = count($items))
@php($user = Auth::user())
@php($greeting = $isLoggedIn ? "Welcome back, {$user->name}" : "Hello, guest")
```

Compiles to:

```php
<?php $count = count($items) ?>
```

The expression inside `@php()` must be a single PHP statement. Use the block form below for anything longer.

## PHP Blocks — `@php ... @endphp`

For multi-line code, use the block form. The `@php` and `@endphp` tokens must each appear alone on their line:

```php
@php
$active  = array_filter($products, fn($p) => $p['stock'] > 0);
$total   = array_sum(array_column($active, 'price'));
$taxRate = 0.09;
@endphp

<p>Total: @{{ $total }}</p>
<p>Tax: @{{ $total * $taxRate }}</p>
```

Compiles to:

```php
<?php
$active  = array_filter($products, fn($p) => $p['stock'] > 0);
$total   = array_sum(array_column($active, 'price'));
$taxRate = 0.09;
?>
```

Both `@php(...)` and `@php ... @endphp` can appear in the same template.

### Disabling `@php` Globally

If you don't want templates to be able to execute arbitrary PHP — for example, when templates come from a less-trusted source — disable the directive at the engine level:

```php
Engine::allowRawPhpDirective(false);
```

After this, any use of `@php(...)` or `@php ... @endphp` raises a `ViewTemplateException` at compile time. `@{{ }}`, `@raw()`, `@json()`, and `w-*` attributes continue to work normally.

You can check the current policy:

```php
if (Engine::isRawPhpDirectiveAllowed()) {
    // ...
}
```

## Inside `<script>` and `<style>` Tags

By default, the contents of `<script>` and `<style>` tags are treated as raw text — they are *not* parsed as nested HTML — but inline directives **do** still work inside them. This is the behaviour you almost always want:

```php
<script>
    const user = @json($user);
    const csrf = "@{{ $csrfToken }}";
</script>
```

If you need to emit the contents completely verbatim — for example, when you have something inside the script that looks like a directive but isn't — add `w-skip` to the tag itself:

```php
<script w-skip>
    const tpl = "@{{ this is not compiled }}";
</script>
```

See *Control Flow* for more on `w-skip`.

## Variables in Templates

Every key in the data array passed to `render()` becomes a variable inside the template:

```php
Engine::render('hello', [
    'name'   => 'Reza',
    'items'  => $items,
    'config' => $config,
]);
```

Inside `hello.php`, you can reference `$name`, `$items`, and `$config` directly.

The same data is also available as `$zogData`, a complete associative array — useful when you need to iterate over the data passed in, or pass everything along to a partial:

```php
@component('partials/debug', $zogData)
```
