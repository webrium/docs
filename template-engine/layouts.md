# Layouts

Layouts let you define a single base template — the surrounding HTML structure, navigation, footer, asset links — and then plug page-specific content into named **sections**. The layout decides where each section appears using `@yield`; the page decides what each section contains using `@section`.

Webrium View's layout system is built around three pieces:

| Directive | Where it goes | Purpose |
| --- | --- | --- |
| `@section('name') ... @endsection` | Child view | Declares a named block of content |
| `@yield('name', $default = '')` | Layout | Outputs the content of a named section |
| `Engine::renderLayout()` | PHP code | Renders a child view inside a layout |

## Basic Example

A layout file:

```php
{{-- views/layouts/main.php --}}
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>@{{ $title }}</title>
</head>
<body>
    <header>
        <h1>My Site</h1>
    </header>

    <main>
        @yield('content')
    </main>

    <footer>
        @yield('footer', '© ' . date('Y'))
    </footer>
</body>
</html>
```

A child view that fills in the `content` section:

```php
{{-- views/pages/home.php --}}
@section('content')
    <h2>Welcome, @{{ $userName }}</h2>
    <p>This is the home page.</p>
@endsection
```

Rendering them together:

```php
echo Engine::renderLayout(
    'layouts/main',
    'pages/home',
    [
        'title'    => 'Home',
        'userName' => 'Reza',
    ]
);
```

The data array is passed to **both** the layout and the child view, so `$title` (used in the layout) and `$userName` (used in the child) are both available in their respective files.

## How Sections Work

Behind the scenes, `Engine::renderLayout($layout, $view, $data)`:

1. Clears any leftover section state.
2. Renders the **child view first**. As it runs, every `@section ... @endsection` block captures its contents into a named buffer instead of writing to the output.
3. If the child view didn't explicitly declare a `content` section, its entire rendered output is used as the `content` section automatically.
4. Renders the **layout**. Each `@yield('name')` outputs the matching section.
5. Clears the section state again, so it doesn't leak into other renders.

The implicit `content` rule in step 3 is convenient for simple pages — you can write the child view with no `@section` directives at all, and its full output becomes the body:

```php
{{-- views/pages/about.php — no @section needed --}}
<h2>About</h2>
<p>We make things.</p>
```

```php
echo Engine::renderLayout('layouts/main', 'pages/about', [
    'title' => 'About',
]);
```

## Default Content with `@yield`

If a section isn't defined by the child view, `@yield` outputs its second argument as a fallback:

```php
<footer>
    @yield('footer', '© ' . date('Y') . ' My Site')
</footer>
```

The default can be any string — pass `''` (or just omit it) when you want the section to silently disappear if it isn't filled in.

## Multiple Sections

A child view can declare as many sections as it needs:

```php
{{-- views/pages/article.php --}}
@section('title') @{{ $article->title }} @endsection

@section('content')
    <article>
        <h1>@{{ $article->title }}</h1>
        @raw($article->body)
    </article>
@endsection

@section('sidebar')
    <aside>
        <h3>Related</h3>
        <ul>
            <li w-for="$related as $r">
                <a href="/articles/@{{ $r->slug }}">@{{ $r->title }}</a>
            </li>
        </ul>
    </aside>
@endsection
```

```php
{{-- layouts/main.php --}}
<title>@yield('title', 'My Site')</title>
…
<div class="grid">
    <main>@yield('content')</main>
    <div class="sidebar">@yield('sidebar')</div>
</div>
```

## The `layout()` Helper

For convenience, the same call can be made with the global helper function:

```php
echo layout('layouts/main', 'pages/home', [
    'title'    => 'Home',
    'userName' => 'Reza',
]);
```

`layout()` is a thin wrapper around `Engine::renderLayout()` — exactly equivalent, just shorter. It's loaded automatically with the `webrium/view` package.

## Programmatic Section API

For advanced cases — composing layouts dynamically, mixing programmatic rendering with templates — the `Webrium\View\View` class exposes the underlying section primitives:

```php
use Webrium\View\View;

View::startSection('title');
echo 'Custom title';
View::endSection();

echo View::yieldSection('title', 'Default');
View::clearSections();
```

| Method | Description |
| --- | --- |
| `View::startSection(string $name)` | Begin capturing output into a named buffer |
| `View::endSection()` | Close the current section and store its contents |
| `View::yieldSection(string $name, string $default = '')` | Return the captured content, or the default if the section is empty |
| `View::clearSections()` | Reset all sections and the open-section stack |
| `View::make(string $view, array $data = [])` | Alias for `Engine::render()` |
| `View::renderWithLayout(string $view, string $layout, array $data = [])` | The underlying implementation of `renderLayout()` (note the parameter order is `view, layout` — opposite of `renderLayout`) |

You'll rarely need any of these directly; they exist so that `@section` / `@endsection` / `@yield` have something to compile down to.

## Error Cases

A few situations raise `ViewException`:

- Ending a section when none is open (`@endsection` without a matching `@section`)
- Using an empty section name (`@section('')`)
- Calling `View::startSection()` or `View::yieldSection()` with whitespace-only names

These usually indicate a typo or a missing `@endsection` rather than a runtime problem.

## What About Nested Layouts?

Webrium View does not have a built-in "extends an extends" mechanism — each render either uses a single layout or no layout at all. If you need shared structure across multiple layouts (e.g. an `app` layout and an `admin` layout that share a common shell), the simplest pattern is to extract the shared parts into **components** and include them from each layout:

```php
{{-- layouts/admin.php --}}
@component('partials/head', ['title' => $title])

<body class="admin">
    @component('partials/admin-nav')
    <main>@yield('content')</main>
</body>
</html>
```

See *Components* for the full story.
