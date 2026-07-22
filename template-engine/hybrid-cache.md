# Hybrid Cache

The hybrid cache stores rendered HTML on disk and returns it directly on later requests. On a cache hit, the view is not rendered and a lazy data factory is not executed, so both template work and database queries can be skipped.

Hybrid caching is controlled from PHP rather than from template directives. This makes the cache boundary, key, TTL, queries, and user context visible in the controller or service that owns them.

## Choosing the Cache Boundary

Use the smallest boundary that contains the expensive, shared output:

| API | Cached output | Recommended use |
| --- | --- | --- |
| `hybrid()` | One complete view | Public pages or reusable view fragments |
| `hybridLayout()` | Child view plus layout | Fully public pages where the whole response is identical |
| `hybridSection()` | One named section | Expensive public content inside a dynamic layout |
| `hybridComponent()` | One component | Shared menus, footers, cards, and widgets |
| `remember()` | Arbitrary rendered string | Controller- or service-generated HTML |

Do not cache session-specific headers, profile controls, carts, CSRF tokens, permissions, or other personalized HTML under a shared key. For a page with a dynamic header and expensive public content, prefer `hybridSection()` and render the layout normally on every request.

## Method Signatures

```php
Engine::hybrid(
    string $view,
    string|array $key,
    array|callable|null $dataOrFactory = null,
    ?int $cacheTtl = null
): string|false;

Engine::hybridLayout(
    string $layoutView,
    string $view,
    string|array $key,
    array|callable|null $dataOrFactory = null,
    ?int $cacheTtl = null
): string|false;

Engine::hybridSection(
    string $view,
    string $section,
    string|array $key,
    array|callable|null $dataOrFactory = null,
    ?int $cacheTtl = null
): string|false;

Engine::hybridComponent(
    string $view,
    string|array $key,
    array|callable|null $dataOrFactory = null,
    ?int $cacheTtl = null
): string|false;

Engine::remember(
    string $namespace,
    string|array $key,
    callable $renderer,
    ?int $cacheTtl = null
): string;
```

The four view-based methods return `false` only in read-only mode when no fresh entry exists. `remember()` always renders on a miss and therefore returns a string.

## Common Data Modes

The view, layout, section, and component methods accept `array|callable|null` as their data argument.

### Lazy Factory — Recommended

A closure runs only when the cache is missing or expired:

```php
$html = Engine::hybrid(
    'pages/article',
    ['article', $locale, $slug],
    function () use ($slug) {
        return [
            'article' => Article::findBySlug($slug),
            'related' => Article::relatedTo($slug),
        ];
    },
    Engine::CACHE_A_DAY
);
```

The factory must return an array. On a cache hit it is not called, so its database queries are skipped.

### Direct Data — Force Refresh

Passing an array always renders the output and overwrites the cache:

```php
$html = Engine::hybrid(
    'pages/article',
    ['article', $locale, $slug],
    ['article' => $article],
    Engine::CACHE_A_DAY
);
```

Use this form when the caller has already decided that the cached value must be refreshed. It is not the normal high-traffic read path.

### Read-Only Lookup

Passing `null` reads an existing fresh entry and returns `false` on a miss:

```php
$html = Engine::hybrid('pages/article', ['article', $locale, $slug], null);

if ($html === false) {
    $html = Engine::render('pages/article', ['article' => $article]);
}
```

## Full Layout Cache

`hybridLayout()` caches the complete child and layout output:

```php
$html = Engine::hybridLayout(
    'layouts/site',
    'pages/article',
    ['article-page', $locale, $slug],
    fn () => ['article' => Article::findBySlug($slug)],
    Engine::CACHE_A_DAY
);
```

Only use this when every visitor sharing the key may receive exactly the same HTML. If authentication changes the header or footer, cache a section instead.

## Cached Section with a Dynamic Layout

`hybridSection()` renders and caches one named `@section`. On a hit, both the child view and its data factory are skipped. The cached section can then be inserted into a freshly rendered layout:

```php
$content = Engine::hybridSection(
    'pages/article',
    'content',
    ['article-content', $locale, $slug],
    function () use ($slug) {
        return [
            'article' => Article::findBySlug($slug),
            'related' => Article::relatedTo($slug),
        ];
    },
    Engine::CACHE_A_DAY
);

$html = Engine::renderLayoutWithSections(
    'layouts/site',
    [
        'seo' => $dynamicSeo,
        'content' => $content,
    ],
    [
        'currentUser' => $currentUser,
        'cartCount' => $cartCount,
    ]
);
```

This is the recommended pattern when the main content and its queries are cacheable but the surrounding shell must remain dynamic.

## Cached Components

```php
$footer = Engine::hybridComponent(
    'components/footer',
    ['footer', $locale, $settingsVersion],
    fn () => ['links' => FooterLink::published()->get()],
    Engine::CACHE_A_DAY
);
```

The cache key must include every value that changes the component output.

## Arbitrary Controller HTML

`remember()` caches a string produced by custom code. The renderer must return a string:

```php
$report = Engine::remember(
    'monthly-report',
    [$accountId, $month],
    fn () => $reportRenderer->render($accountId, $month),
    Engine::CACHE_AN_HOUR
);
```

The namespace prevents unrelated renderers from sharing an identity.

## TTL and Global Configuration

```php
Engine::CACHE_NONE;       // 0 — bypass and remove this cache entry
Engine::CACHE_A_MINUTE;   // 60
Engine::CACHE_AN_HOUR;    // 3600
Engine::CACHE_A_DAY;      // 86400
Engine::CACHE_A_WEEK;     // 604800

Engine::setDefaultHybridCacheTtl(Engine::CACHE_A_DAY);
Engine::enableHybridCache((bool) $config['hybrid_cache_enabled']);
```

The default TTL is one week. Set it to `null` to require an explicit TTL on every cache write:

```php
Engine::setDefaultHybridCacheTtl(null);
```

`isHybridCacheEnabled()` returns the current global state. When caching is disabled, reads and writes are bypassed and lazy renderers still run, so the response is generated normally.

`CACHE_NONE` bypasses caching and removes an existing entry for the same identity and key. Negative TTL values are invalid.

## Precise Expiration

New cache files contain an ISO-8601 timestamp with second-level precision:

```html
<!-- Automatically generated by webrium-view: [ex:2026-07-22T14:30:00+00:00] -->
```

An hourly TTL therefore expires after one hour, not at the end of the calendar day. Legacy date-only entries remain readable until the end of their recorded day.

## Cache Keys

Keys may be strings or arrays. Arrays are normalized and hashed deterministically, so associative key order does not change the cache identity:

```php
Engine::hybrid(
    'pages/listing',
    [
        'locale' => $locale,
        'theme' => $theme,
        'category' => $category,
        'page' => $page,
        'contentVersion' => $contentVersion,
    ],
    $factory,
    Engine::CACHE_AN_HOUR
);
```

Include every value that can change the HTML: locale, theme, slug, pagination, filters, authorization scope, and content version. Never include secrets in a human-readable string key; cache filenames contain sanitized identities and hashes.

## Concurrency and Writes

Cache misses are protected by a per-entry file lock. After one request acquires the lock, it checks the cache again before rendering, preventing multiple concurrent requests from rebuilding the same entry. Completed output is published with an atomic rename, so readers do not receive partially written HTML.

## Clearing Cache Files

```php
Engine::clearStatics();   // Hybrid HTML and lock files
Engine::clearCompiled();  // Compiled PHP and source-map metadata
```

Compiled templates are automatically refreshed when the source view is newer. Use `clearCompiled()` after deployments that change compiler behavior or when you intentionally want a full rebuild.

To read a pre-generated file without rendering or cache validation:

```php
$html = Engine::staticFile('marketing/about.html');
```

`staticFile()` returns the raw contents and rejects paths that escape the configured static directory.
