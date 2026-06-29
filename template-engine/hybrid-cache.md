# Hybrid Cache

The hybrid cache is the view engine's static-rendering layer. The idea is simple: for pages that don't change very often — a homepage, an article, a product page, a landing page — render them once, save the output as a static HTML file with a TTL, and serve that file directly on subsequent requests. When the TTL expires, fall back to a fresh render.

Unlike traditional "full-page caching" (where you set up reverse-proxy rules outside the application), the hybrid cache lives inside your render code. The same call site decides whether to use the cache, when to refresh it, and what data to render with — and it's a single function call.

## When to Use It

Hybrid caching is a good fit for:

- Pages that are expensive to render but change rarely (article pages, product detail pages)
- Public pages that look the same for every visitor
- Landing pages and marketing pages
- Documentation and content sites

It is **not** a good fit for:

- Pages that depend on the current user (dashboards, authenticated views)
- Pages with frequently-changing data (live feeds, order status, prices that update in real time)
- Pages with personalization that varies per request

For per-user content, stick with `Engine::render()`.

## Signature

```php
Engine::hybrid(
    string $view,
    string|array $key,
    array|callable|null $dataOrFactory = null,
    ?int $cacheTtl = null
);
```

| Parameter | Type | Purpose |
| --- | --- | --- |
| `$view` | `string` | The view to render, same as `Engine::render()` |
| `$key` | `string \| array` | Cache key — identifies this specific rendering. An array is hashed into a single key. |
| `$dataOrFactory` | `array \| callable \| null` | Data for the view, a factory closure, or `null` for read-only access |
| `$cacheTtl` | `?int` | Cache lifetime in seconds, or `null` to use the default |

The third parameter has three distinct modes — described below.

## Cache TTL Constants

For readability, use the constants on `Engine`:

```php
Engine::CACHE_NONE;       // 0       — no cache, every call re-renders
Engine::CACHE_A_MINUTE;   // 60
Engine::CACHE_AN_HOUR;    // 3600
Engine::CACHE_A_DAY;      // 86400
Engine::CACHE_A_WEEK;     // 604800
```

You can also override the default TTL used when none is passed to `hybrid()`:

```php
Engine::setDefaultHybridCacheTtl(Engine::CACHE_A_DAY);

// Or disable the default, forcing every hybrid() call to specify a TTL:
Engine::setDefaultHybridCacheTtl(null);
```

The factory-shipped default is one week.

## Mode 1 — Direct Data

Pass a data array as the third argument and the cache is **always re-rendered and overwritten**. Use this when you want the convenience of a single API but have already decided when to refresh the page (for example, after a content update):

```php
$html = Engine::hybrid(
    'pages/home',
    'home',
    [
        'title' => 'Home',
        'user'  => $user,
    ],
    Engine::CACHE_AN_HOUR
);
```

This mode is rarely what you want for high-traffic caching — it does the expensive work on every request. It exists as the "force refresh" form, and as a backward-compatible default.

## Mode 2 — Lazy Factory

Pass a closure as the third argument and the data is computed **only when the cache is missing or expired**. This is the form you'll use most often:

```php
$html = Engine::hybrid(
    'pages/article',
    'article-' . $slug,
    function () use ($db, $slug) {
        $article = $db->articles->findBySlug($slug);
        return [
            'title'   => $article->title,
            'article' => $article,
            'related' => $db->articles->relatedTo($article),
        ];
    },
    Engine::CACHE_A_DAY
);
```

On a cache hit, the closure never runs — you skip the database query entirely, and the cached HTML is returned directly from disk.

The factory **must** return an array. Returning anything else raises a `ViewException`.

## Mode 3 — Read-Only

Pass `null` as the third argument and `hybrid()` becomes a pure lookup — it returns the cached HTML if available, or `false` if no valid cache exists. Use this when you want explicit control over the fallback:

```php
$content = Engine::hybrid('pages/home', 'home', null);

if ($content === false) {
    // No cache — render fresh, do whatever fallback you want
    $content = Engine::render('pages/home', [
        'title' => 'Home',
        'user'  => $user,
    ]);
}

echo $content;
```

The read-only mode is useful when:

- You want to log cache misses separately from rendering
- The fallback path needs to do extra work (auth check, metric, redirect)
- You want to render and store the cache yourself with a different TTL based on what the data looks like

## Cache Keys

The key identifies a specific rendering of a view. A view rendered with different data — different slug, different language, different filters — needs different keys, or the cache will serve the wrong content.

A string key is taken at face value:

```php
Engine::hybrid('pages/article', 'article-' . $slug, $factory);
Engine::hybrid('pages/home', 'home-' . $locale, $factory);
```

An array key is hashed into a single deterministic value — convenient when the key naturally has multiple parts:

```php
Engine::hybrid(
    'pages/listing',
    ['products', $category, $sort, $page],
    $factory,
    Engine::CACHE_AN_HOUR
);
```

The two forms are interchangeable; pick whichever reads more clearly at the call site.

## How Expiry Works

When `hybrid()` writes a static file, it embeds a comment marking the expiration date:

```html
<!-- Automatically generated by webrium-view: [ex:2026-07-15] -->
```

On every read, the engine looks for this comment and compares the date against today. If the file's expiration date is today or later, the cache is fresh. If it's already past, the cache is expired and the next call re-renders.

The granularity is **one day**. A TTL of `CACHE_AN_HOUR` and `CACHE_A_DAY` both pin the expiration to the same calendar date; the comment doesn't store the time of day. This is a deliberate simplification — it keeps the format human-readable and the comparison cheap.

If you need finer-grained invalidation, call `Engine::clearStatics()` explicitly from your write paths (after a content update, for example).

## Reading Static Files Directly

If you have a pre-generated HTML file in the static directory and want to read it without involving the view engine at all, use `Engine::staticFile()`:

```php
$html = Engine::staticFile('marketing/about.html');
```

It reads the raw file contents from the configured static directory. The path is checked against directory traversal (`..` segments that try to escape the static dir are rejected), but no parsing or processing is performed — you get back exactly what's on disk.

A magic shortcut exists for the same call:

```php
$html = Engine::static('marketing/about.html');  // same thing
```

Both raise `ViewException` if the file doesn't exist or isn't readable.

## Clearing Caches

Two methods let you drop the disk caches:

```php
Engine::clearStatics();    // Remove all hybrid-cache static HTML files
Engine::clearCompiled();   // Remove all compiled template files
```

Both only delete *files* in the configured directories — the directories themselves stay in place.

Typical usage:

- Run `clearStatics()` after deploying a content change you want to take effect immediately
- Run `clearCompiled()` after deploying a change to a template file (though the engine also detects template mtime changes automatically and re-compiles, so this is mostly a belt-and-braces step)

## A Realistic Example

Here's an article page with a lazy factory and a per-slug cache:

```php
use Webrium\View\Engine;

function renderArticle(string $slug): string
{
    return Engine::hybrid(
        'pages/article',
        ['article', $slug],
        function () use ($slug) {
            $article = Article::findBySlug($slug);
            if (!$article) {
                throw new NotFoundException();
            }
            return [
                'title'   => $article->title,
                'article' => $article,
                'related' => Article::relatedTo($article, limit: 5),
            ];
        },
        Engine::CACHE_A_DAY
    );
}
```

The factory only runs on cache miss, the database stays quiet on a hot article, and the only thing the request actually does is `file_get_contents()` on the static file. When the article is edited, your editor controller calls `Engine::clearStatics()` and the next request rebuilds.
