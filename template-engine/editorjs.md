# Editor.js Integration

Webrium View ships with a parser that converts [Editor.js](https://editorjs.io/) JSON output into clean HTML. Editor.js is a popular block-based editor for rich text content — articles, posts, knowledge bases — and it stores its output as structured JSON instead of HTML. The `EditorJsParser` turns that JSON into renderable HTML you can drop into a template.

The parser is independent of the rest of the view engine. You can use it on its own, paired with `Engine::render()`, or in any other PHP application that needs to render Editor.js content.

## Basic Usage

```php
use Webrium\View\EditorJs\EditorJsParser;

$parser = new EditorJsParser();
$html   = $parser->parse($json); // accepts a JSON string OR a pre-decoded array
```

The output is a string of HTML, ready to render. In a template, output it with `@raw()`:

```php
<article>
    @raw($content)
</article>
```

A full example reading from a database:

```php
use Webrium\View\Engine;
use Webrium\View\EditorJs\EditorJsParser;

Engine::setViewDir(__DIR__ . '/views');

$parser  = new EditorJsParser();
$content = $parser->parse($jsonFromDatabase);

echo Engine::render('pages/article', compact('content'));
```

## Supported Block Types

All standard Editor.js block types are recognised out of the box:

| Block type | HTML output |
| --- | --- |
| `paragraph` | `<p>` |
| `header` | `<h1>`–`<h6>` (level from `data.level`) |
| `list` | `<ul>` or `<ol>` |
| `nestedList` | Nested `<ul>` / `<ol>` |
| `image` | `<figure>` with `<img>` and optional caption |
| `quote` | `<blockquote>` with optional caption |
| `code` | `<pre><code>` |
| `table` | `<table>` with optional `<thead>` |
| `delimiter` | `<hr>` |
| `embed` | `<iframe>` wrapped in a container |
| `warning` | An alert `<div>` with title and message |
| `raw` | Verbatim HTML pass-through |
| `checklist` | `<ul>` of checkboxes |
| `linkTool` | An anchor card with optional preview image |
| `attaches` | Download link with file size |
| `personality` | Author / personality card |

Unrecognised block types are skipped silently. If you need a custom block — your own Editor.js plugin, or a variant of an existing one — register a handler (see below).

## Custom CSS Classes

Each block type renders with sensible default class names. You can override them by passing a config array to the constructor:

```php
$parser = new EditorJsParser([
    'paragraph' => ['class' => 'prose-p'],
    'header'    => ['class' => 'article-heading'],
    'image'     => [
        'figureClass'     => 'image-wrap',
        'class'           => 'article-img',
        'captionClass'    => 'image-caption',
        'borderClass'     => 'image--bordered',
        'stretchedClass'  => 'image--stretched',
        'backgroundClass' => 'image--background',
    ],
    'quote' => [
        'class'        => 'pullquote',
        'captionClass' => 'pullquote__author',
    ],
    'code' => [
        'class'     => 'code-block',
        'codeClass' => 'language-php',
    ],
]);
```

Only the block types you mention are overridden; the rest keep their defaults. The config is merged recursively, so you can override a single key on a block type without restating the others.

The class keys recognised by each block roughly mirror its HTML structure — `class` for the outer element, plus suffixed keys (`figureClass`, `captionClass`, `codeClass`) for nested elements where they exist. The full set is visible in `EditorJsParser::defaultConfig()`.

## Registering Custom Block Handlers

If your Editor.js setup uses a non-standard block — your own plugin, or one of the many community plugins — register a handler with `registerBlock()`:

```php
$parser->registerBlock('alert', function (array $data, array $config): string {
    $type    = htmlspecialchars($data['type'] ?? 'info', ENT_QUOTES, 'UTF-8');
    $message = htmlspecialchars($data['message'] ?? '', ENT_QUOTES, 'UTF-8');
    return "<div class=\"alert alert--{$type}\">{$message}</div>\n";
});
```

The handler receives:

- **`$data`** — the contents of the block's `data` key, as a plain array
- **`$config`** — the per-block config from the constructor (empty array if none was provided for this type)

It must return a string of HTML. Always escape values you didn't generate yourself — Editor.js content is user input.

Custom handlers can also **override** built-in types — register a handler with the same name (`paragraph`, `header`, etc.) and yours takes precedence.

`registerBlock()` returns the parser, so calls can be chained:

```php
$parser
    ->registerBlock('alert',    $alertHandler)
    ->registerBlock('callout',  $calloutHandler)
    ->registerBlock('youtube',  $youtubeHandler);
```

## Inline HTML Sanitisation

Editor.js stores inline formatting (bold, italic, links, etc.) as HTML inside text blocks like `paragraph` and `header`. By default, the parser allows a small set of safe inline tags — `b`, `strong`, `i`, `em`, `u`, `a`, `mark`, `code`, `s`, `br`, `span` — and strips everything else. This is the recommended setting for any content that comes from user input.

To disable sanitisation entirely (only do this for fully trusted content):

```php
$parser = new EditorJsParser(config: [], sanitize: false);
```

The `raw` block type always passes its HTML through unchanged, *regardless of the `sanitize` flag*. This is intentional — `raw` is the explicit opt-out. If you don't want raw blocks at all, don't allow them in your Editor.js configuration, or register a handler that ignores them.

## Input Validation

`parse()` accepts either a JSON string or a pre-decoded array. Either way, it expects an object with a `blocks` key whose value is an array. If the input doesn't match — bad JSON, missing `blocks` key, `blocks` isn't an array — `parse()` throws `\InvalidArgumentException` with a descriptive message.

A defensive pattern when reading from external data:

```php
try {
    $content = $parser->parse($jsonFromDatabase);
} catch (\InvalidArgumentException $e) {
    $content = '<p class="error">Content unavailable.</p>';
    // Optionally: log the failure
}
```
