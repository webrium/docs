# Introduction

**`webrium/view`** is the templating engine that ships with the Webrium framework — and also a standalone PHP library you can drop into any project. It compiles your templates to plain PHP files (no `eval`, no `DOMDocument`) and is designed to coexist peacefully with modern frontend frameworks like Vue, Alpine, Livewire, and htmx.

You can use the view engine in two ways:

- **As part of the full Webrium framework** — already wired in `public/index.php`. The `view()` and `layout()` helpers are available everywhere, and templates live in `app/Views/`.
- **Standalone, in any PHP project** — installed by itself, configured by hand. This page covers that path.

The APIs documented in the rest of this section are identical in both cases.

## Design Goals

A few principles shape every part of the view engine:

- **No `eval`.** Templates are compiled to ordinary PHP files that are then `require`d. Anything you can debug with a stack trace is something you can debug here.
- **No `DOMDocument`.** A custom streaming HTML parser scans your templates byte by byte. This means attributes like `@click`, `:class`, `x-data`, `wire:click`, and `hx-get` are preserved exactly as written — no normalisation, no quoting tricks, no surprises.
- **Compile once, render many.** A template is compiled the first time it is rendered, and the compiled output is cached on disk. Subsequent renders just `require` a PHP file.
- **Safe by default.** `@{{ ... }}` always escapes its output. Raw HTML output and inline PHP are opt-in directives you can audit.
- **Hybrid static caching.** Pages can be rendered once and stored as static HTML with a TTL, then served as static files on subsequent requests — without giving up the ability to fall back to a fresh render when the cache expires.

## Standalone Installation

Require the package:

```bash
composer require webrium/view
```

Make sure Composer's autoloader is included in your entry point:

```php
require_once __DIR__ . '/vendor/autoload.php';
```

Requirements: **PHP 8.1 or newer**. No additional extensions are needed — the engine relies only on PHP core functions.

## Minimal Bootstrap

Tell the engine where to find your views and where to write its caches:

```php
<?php

use Webrium\View\Engine;

Engine::setViewDir(__DIR__ . '/views');                      // your .php templates
Engine::setCompiledDir(__DIR__ . '/storage/view_compiled');  // compiled PHP files
Engine::setStaticDir(__DIR__ . '/storage/static');           // hybrid cache output
```

All three directories are created automatically if they don't exist. Only `setViewDir()` is strictly required — the other two have sensible defaults relative to the current working directory (`storage/view_compiled` and `static`), but in any real project you should set them explicitly.

> **In the full framework:** All three directories are configured in `public/index.php`, pointing at `app/Views/`, `storage/framework/views/`, and `storage/framework/static/`. You don't need to do anything yourself — just call `view()` or `layout()`.

## Quick Start

A template:

```php
{{-- views/hello.php --}}
<h1>Hello @{{ $name }}!</h1>
<p>Today is @{{ $today }}.</p>
```

Rendered from PHP:

```php
echo Engine::render('hello', [
    'name'  => 'Reza',
    'today' => date('Y-m-d'),
]);
```

That's the whole loop. The `.php` extension is optional when referencing a view — `'hello'` and `'hello.php'` resolve to the same file.

## Global Helpers

Two global helper functions are loaded automatically when `webrium/view` is installed:

```php
view('hello', ['name' => 'Reza']);                 // → Engine::render('hello', [...])
layout('layouts/main', 'pages/home', $data);       // → Engine::renderLayout('layouts/main', 'pages/home', $data)
```

Both are available whether you use the engine standalone or as part of the full framework.

## What's in `webrium/view`

| Topic | Class / Helper | Page |
| --- | --- | --- |
| Output, escaping, JSON, inline PHP | `@{{ }}`, `@raw`, `@json`, `@tojs`, `@php` | *Basic Syntax* |
| Conditionals and loops on HTML elements | `w-if`, `w-else-if`, `w-else`, `w-for`, `w-skip` | *Control Flow* |
| Template inheritance | `@section`, `@yield`, `Engine::renderLayout()`, `View` class | *Layouts* |
| Reusable partials | `@component`, `Engine::component()` | *Components* |
| Pre-rendered static cache | `Engine::hybrid()`, TTL constants | *Hybrid Cache* |
| JSON-to-HTML conversion | `EditorJsParser` | *Editor.js Integration* |

## Where to Go Next

- **Basic Syntax** — the four directives you'll use in nearly every template
- **Control Flow** — branching and looping with attributes on HTML elements
- **Layouts** — building a base layout and extending it from child views
- **Components** — pulling reusable pieces into your templates
- **Hybrid Cache** — the static-rendering layer for high-traffic pages
- **Editor.js Integration** — turning Editor.js JSON output into clean HTML
