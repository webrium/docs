# Webrium Url

A comprehensive URL utility class for the Webrium framework. This class provides powerful tools for URL generation, parsing, manipulation, and request information retrieval.

## Features

- **URL Generation**: Create absolute and relative URLs
- **URL Parsing**: Parse and build URLs from components
- **Query String Manipulation**: Add, update, or remove query parameters
- **Request Information**: Get method, IP addresses, user agent
- **Security Features**: Check HTTPS, validate origins, detect AJAX requests
- **URL Pattern Matching**: Match URLs against patterns with wildcard support
- **SEO Tools**: Automatic trailing slash management
- **Mobile Detection**: Detect mobile devices
- **CORS Support**: Handle origin and referer validation
- **No Installation Required**: Part of the Webrium framework

## Table of Contents

- [Basic URL Information](#basic-url-information)
- [URL Generation](#url-generation)
- [Request Information](#request-information)
- [URL Parsing and Building](#url-parsing-and-building)
- [Query String Operations](#query-string-operations)
- [URL Pattern Matching](#url-pattern-matching)
- [Origin and Referer](#origin-and-referer)
- [Security Features](#security-features)
- [Mobile and AJAX Detection](#mobile-and-ajax-detection)
- [SEO Features](#seo-features)

## Basic URL Information

### Get Current Domain

#### `domain(): string`

Get the current domain/host.

```php
use Webrium\Url;

$domain = Url::domain();
// Returns: example.com or www.example.com or localhost:8080
```

### Get Request Scheme

#### `scheme(bool $withSeparator = false): string`

Get the request scheme (http or https).

```php
// Without separator
$scheme = Url::scheme();
// Returns: "http" or "https"

// With separator
$scheme = Url::scheme(true);
// Returns: "http://" or "https://"
```

### Check HTTPS

#### `isSecure(): bool`

Check if the current request is using HTTPS.

```php
if (Url::isSecure()) {
    echo "Connection is secure";
} else {
    echo "Warning: Insecure connection";
}
```

**Detects HTTPS from:**
- `$_SERVER['HTTPS']`
- `$_SERVER['HTTP_X_FORWARDED_PROTO']` (for proxies/load balancers)
- `$_SERVER['HTTP_X_FORWARDED_SSL']`
- `$_SERVER['SERVER_PORT']` (port 443)

### Get Home URL

#### `home(): string`

Get the base URL with scheme and domain.

```php
$homeUrl = Url::home();
// Returns: https://example.com
```

### Get Base URL

#### `base(): string`

Get the application base URL (includes subdirectory if exists).

```php
$baseUrl = Url::base();
// Returns: https://example.com/myapp (if in subdirectory)
// Returns: https://example.com (if in root)
```

## URL Generation

### Generate URLs

#### `to(string $path = ''): string`

Generate a full URL from a relative path.

```php
// Basic usage
$url = Url::to('users');
// Returns: https://example.com/users

$url = Url::to('admin/dashboard');
// Returns: https://example.com/admin/dashboard

// With leading slash (automatically handled)
$url = Url::to('/products');
// Returns: https://example.com/products

// Empty path returns base URL
$url = Url::to();
// Returns: https://example.com
```

### Get Current URL

#### `current(bool $withQueryString = false): string`

Get the current full URL.

```php
// Without query string
$url = Url::current();
// Returns: https://example.com/products/view

// With query string
$url = Url::current(true);
// Returns: https://example.com/products/view?id=5&sort=name
```

#### `full(): string`

Get the current URL with query string (alias for `current(true)`).

```php
$fullUrl = Url::full();
// Returns: https://example.com/products?category=electronics&page=2
```

### Get URI Path

#### `uri(bool $withQueryString = false): string`

Get the current URI path (without domain).

```php
// Without query string
$uri = Url::uri();
// Returns: /products/view

// With query string
$uri = Url::uri(true);
// Returns: /products/view?id=5
```

## Request Information

### HTTP Method

#### `method(): string`

Get the HTTP request method.

```php
$method = Url::method();
// Returns: GET, POST, PUT, DELETE, PATCH, OPTIONS, etc.

// Usage in routing
if (Url::method() === 'POST') {
    // Handle form submission
}
```

### IP Addresses

#### `serverIp(): string`

Get the server's IP address.

```php
$serverIp = Url::serverIp();
// Returns: 192.168.1.1
```

#### `clientIp(): string`

Get the client's IP address (with proxy support).

```php
$clientIp = Url::clientIp();
// Returns: 123.45.67.89

// Automatically handles proxies
// Checks headers in order:
// - HTTP_CLIENT_IP
// - HTTP_X_FORWARDED_FOR
// - HTTP_X_FORWARDED
// - HTTP_X_CLUSTER_CLIENT_IP
// - HTTP_FORWARDED_FOR
// - HTTP_FORWARDED
// - REMOTE_ADDR
```

**IP Blocking Example:**

```php
$blockedIps = ['123.45.67.89', '98.76.54.32'];
$clientIp = Url::clientIp();

if (in_array($clientIp, $blockedIps)) {
    http_response_code(403);
    die('Access denied');
}
```

### User Agent

#### `userAgent(): string`

Get the user agent string.

```php
$userAgent = Url::userAgent();
// Returns: Mozilla/5.0 (Windows NT 10.0; Win64; x64) ...

// Check for specific browser
if (str_contains(Url::userAgent(), 'Chrome')) {
    echo "User is using Chrome";
}
```

### Server Variables

#### `server(?string $key = null, mixed $default = null): mixed`

Get `$_SERVER` variables safely.

```php
// Get all server variables
$allVars = Url::server();

// Get specific variable
$requestMethod = Url::server('REQUEST_METHOD');

// With default value
$customHeader = Url::server('HTTP_X_CUSTOM_HEADER', 'default');
```

## URL Parsing and Building

### Parse URL

#### `parse(?string $url = null): array`

Parse a URL into components.

```php
// Parse current URL
$parts = Url::parse();

// Parse specific URL
$parts = Url::parse('https://example.com:8080/path?key=value#section');

print_r($parts);
// Output:
// Array (
//     [scheme] => https
//     [host] => example.com
//     [port] => 8080
//     [path] => /path
//     [query] => key=value
//     [fragment] => section
// )
```

### Build URL

#### `build(array $components): string`

Build a URL from components.

```php
$url = Url::build([
    'scheme' => 'https',
    'host' => 'example.com',
    'port' => 8080,
    'path' => '/api/users',
    'query' => 'page=1&limit=10',
    'fragment' => 'top'
]);

// Returns: https://example.com:8080/api/users?page=1&limit=10#top
```

**URL Modification Example:**

```php
// Parse, modify, and rebuild URL
$parts = Url::parse('https://example.com/old-path');
$parts['path'] = '/new-path';
$parts['query'] = 'updated=true';

$newUrl = Url::build($parts);
// Returns: https://example.com/new-path?updated=true
```

## Query String Operations

### Get Query String

#### `queryString(): string`

Get the raw query string.

```php
$query = Url::queryString();
// Returns: category=electronics&page=2&sort=price
```

### Add/Update Query Parameters

#### `withQuery(array $params, ?string $url = null): string`

Add or update query parameters.

```php
// Add to current URL
$url = Url::withQuery(['page' => 2, 'sort' => 'name']);
// Current: https://example.com/products
// Returns: https://example.com/products?page=2&sort=name

// Update existing parameters
$url = Url::withQuery(['page' => 3]);
// Current: https://example.com/products?page=1&category=books
// Returns: https://example.com/products?page=3&category=books

// Add to specific URL
$url = Url::withQuery(
    ['utm_source' => 'email'],
    'https://example.com/landing'
);
```

### Remove Query Parameters

#### `withoutQuery(array $keys, ?string $url = null): string`

Remove specific query parameters.

```php
// Remove from current URL
$url = Url::withoutQuery(['page', 'sort']);
// Current: https://example.com/products?page=1&sort=name&category=books
// Returns: https://example.com/products?category=books

// Remove from specific URL
$cleanUrl = Url::withoutQuery(
    ['utm_source', 'utm_campaign'],
    'https://example.com/page?id=5&utm_source=email&utm_campaign=spring'
);
// Returns: https://example.com/page?id=5
```

**Pagination Example:**

```php
function generatePaginationLinks($currentPage, $totalPages) {
    $links = [];
    
    for ($i = 1; $i <= $totalPages; $i++) {
        $links[] = [
            'page' => $i,
            'url' => Url::withQuery(['page' => $i]),
            'active' => $i === $currentPage
        ];
    }
    
    return $links;
}
```

## URL Pattern Matching

### Match URL Pattern

#### `is(string $pattern): bool`

Check if current URL matches a pattern.

```php
// Exact match
if (Url::is('admin/dashboard')) {
    echo "On dashboard page";
}

// Wildcard match
if (Url::is('products/*')) {
    echo "On any products page";
}

// Root page
if (Url::is('')) {
    echo "On home page";
}
```

#### `isAny(array $patterns): bool`

Check if current URL matches any of the given patterns.

```php
if (Url::isAny(['admin/*', 'settings/*'])) {
    echo "In admin or settings section";
}

// Navigation active state
$adminActive = Url::isAny(['admin', 'admin/*']);
$profileActive = Url::isAny(['profile', 'profile/*', 'account/*']);
```

**Active Menu Example:**

```php
function isMenuActive($path) {
    return Url::is($path) ? 'active' : '';
}

<nav>
    <a href="<?= Url::to('home') ?>" class="<?= isMenuActive('') ?>">Home</a>
    <a href="<?= Url::to('products') ?>" class="<?= isMenuActive('products/*') ?>">Products</a>
    <a href="<?= Url::to('about') ?>" class="<?= isMenuActive('about') ?>">About</a>
</nav>
```

## URL Segments

### Get Segments

#### `segments(): array`

Get URL path segments as an array.

```php
// URL: https://example.com/admin/users/edit/123
$segments = Url::segments();
// Returns: ['admin', 'users', 'edit', '123']

// URL: https://example.com/
$segments = Url::segments();
// Returns: []
```

#### `segment(int $index, mixed $default = null): mixed`

Get a specific segment by index (0-based).

```php
// URL: https://example.com/products/view/42
$section = Url::segment(0);      // "products"
$action = Url::segment(1);       // "view"
$id = Url::segment(2);           // "42"
$notExist = Url::segment(3, 0);  // 0 (default value)
```

**Dynamic Routing Example:**

```php
function handleRequest() {
    $controller = Url::segment(0, 'home');
    $action = Url::segment(1, 'index');
    $id = Url::segment(2);
    
    $controllerClass = ucfirst($controller) . 'Controller';
    $actionMethod = $action . 'Action';
    
    if (class_exists($controllerClass)) {
        $instance = new $controllerClass();
        if (method_exists($instance, $actionMethod)) {
            $instance->$actionMethod($id);
        }
    }
}
```

## Origin and Referer

### Referer Information

#### `referer(?string $default = null): ?string`

Get the referer URL (the page that linked to the current page).

```php
$referer = Url::referer();
// Returns: https://google.com/search?q=example or null

// With default
$referer = Url::referer(Url::home());
```

#### `previous(?string $default = null): string`

Get the previous URL (alias for referer with default to base URL).

```php
$previousUrl = Url::previous();
// Use for "back" buttons

// Redirect back example
redirect(Url::previous());
```

#### `refererDomain(): ?string`

Get the referer domain without scheme and path.

```php
$domain = Url::refererDomain();
// Referer: https://google.com/search?q=example
// Returns: google.com
```

#### `isRefererFrom(string $domain): bool`

Check if referer matches a specific domain.

```php
if (Url::isRefererFrom('google.com')) {
    echo "User came from Google";
}

// Analytics example
$source = match(true) {
    Url::isRefererFrom('google.com') => 'Google',
    Url::isRefererFrom('facebook.com') => 'Facebook',
    Url::isRefererFrom('twitter.com') => 'Twitter',
    default => 'Direct'
};
```

#### `isInternalReferer(): bool`

Check if referer is from the same domain.

```php
if (Url::isInternalReferer()) {
    echo "User navigated from within the site";
} else {
    echo "User came from external source";
}

// Track external traffic
if (!Url::isInternalReferer()) {
    logExternalVisit(Url::referer());
}
```

### Origin Information (CORS)

#### `origin(?string $default = null): ?string`

Get the Origin header (used in CORS requests).

```php
$origin = Url::origin();
// Returns: https://api.example.com or null
```

#### `originDomain(): ?string`

Get the origin domain.

```php
$domain = Url::originDomain();
// Returns: api.example.com
```

#### `isOriginFrom(string $domain): bool`

Check if origin matches a specific domain.

```php
if (Url::isOriginFrom('api.example.com')) {
    echo "Request from authorized API domain";
}
```

#### `isSameOrigin(): bool`

Check if origin is from the current domain.

```php
if (!Url::isSameOrigin()) {
    echo "Cross-origin request detected";
}
```

### Source Information

#### `source(): ?string`

Get request source URL (tries origin first, then referer).

```php
$source = Url::source();
// Useful for logging where requests come from
```

#### `sourceDomain(): ?string`

Get request source domain.

```php
$domain = Url::sourceDomain();
```

#### `isFromAllowedDomain(array $allowedDomains): bool`

Check if request is from an allowed domain.

```php
$allowedDomains = ['example.com', 'api.example.com', 'partner.com'];

if (Url::isFromAllowedDomain($allowedDomains)) {
    // Process request
} else {
    http_response_code(403);
    die('Access denied');
}
```

## Security Features

### CORS Protection Example

```php
function checkCorsOrigin() {
    $allowedOrigins = [
        'https://app.example.com',
        'https://mobile.example.com'
    ];
    
    $origin = Url::origin();
    
    if ($origin && !in_array($origin, $allowedOrigins)) {
        http_response_code(403);
        die('CORS policy: Origin not allowed');
    }
}
```

### Hotlink Protection

```php
function protectImages() {
    if (!Url::isInternalReferer() && Url::referer() !== null) {
        // External site is linking to our images
        header('HTTP/1.1 403 Forbidden');
        exit('Hotlinking not allowed');
    }
}
```

### CSRF Token Validation

```php
function validateRequest() {
    // Only check CSRF for same-origin requests
    if (Url::isSameOrigin() && Url::method() === 'POST') {
        $token = $_POST['csrf_token'] ?? '';
        
        if (!validateCsrfToken($token)) {
            http_response_code(403);
            die('CSRF validation failed');
        }
    }
}
```

## Mobile and AJAX Detection

### Mobile Detection

#### `isMobile(): bool`

Detect if request is from a mobile device.

```php
if (Url::isMobile()) {
    // Serve mobile-optimized version
    include 'mobile/index.php';
} else {
    // Serve desktop version
    include 'desktop/index.php';
}

// Responsive image serving
$imageSize = Url::isMobile() ? 'small' : 'large';
$imagePath = "/images/banner-{$imageSize}.jpg";
```

**Detects:**
- Mobile
- Android
- iPhone/iPad/iPod
- BlackBerry
- Windows Mobile
- Opera Mini

### AJAX Detection

#### `isAjax(): bool`

Check if request is an AJAX request.

```php
if (Url::isAjax()) {
    // Return JSON response
    header('Content-Type: application/json');
    echo json_encode(['status' => 'success', 'data' => $data]);
} else {
    // Return HTML page
    include 'template.php';
}
```

**AJAX Handler Example:**

```php
function handleRequest() {
    $data = processRequest();
    
    if (Url::isAjax()) {
        // AJAX request - return JSON
        echo json_encode($data);
    } else {
        // Normal request - return HTML
        renderView('page', $data);
    }
}
```

## SEO Features

### Trailing Slash Management

#### `hasTrailingSlash(string $value): bool`

Check if a string has a trailing slash.

```php
$hasSlash = Url::hasTrailingSlash('/products/');  // true
$hasSlash = Url::hasTrailingSlash('/products');   // false
```

#### `addTrailingSlash(string $value): string`

Add trailing slash to a string.

```php
$url = Url::addTrailingSlash('/products');
// Returns: /products/
```

#### `removeTrailingSlash(string $value): string`

Remove trailing slash from a string.

```php
$url = Url::removeTrailingSlash('/products/');
// Returns: /products
```

#### `redirectWithoutTrailingSlash(int $statusCode = 301): void`

Redirect to URL without trailing slash (SEO friendly).

```php
// In your bootstrap/index.php
Url::redirectWithoutTrailingSlash(301);

// This will automatically redirect:
// /products/ -> /products
// /about/    -> /about
```

#### `enforce(): void`

Enforce URL standards (removes trailing slashes).

```php
// In App initialization
Url::enforce();

// This is called automatically by App::initialize()
```

**Why Remove Trailing Slashes?**
- Prevents duplicate content issues for SEO
- Ensures consistent URLs
- Better for analytics tracking

## Complete Examples

### Advanced Routing System

```php
class Router {
    public function route() {
        $path = Url::uri();
        $method = Url::method();
        
        // Match routes
        if (Url::is('api/*') && Url::isAjax()) {
            $this->handleApiRequest();
        } elseif (Url::is('admin/*')) {
            $this->handleAdminRequest();
        } else {
            $this->handlePublicRequest();
        }
    }
    
    private function handleApiRequest() {
        $endpoint = Url::segment(1);
        $id = Url::segment(2);
        
        // Validate origin for API
        if (!Url::isSameOrigin()) {
            http_response_code(403);
            echo json_encode(['error' => 'CORS not allowed']);
            return;
        }
        
        // Route to API controller
        $controller = "Api\\" . ucfirst($endpoint) . "Controller";
        // ... handle request
    }
}
```

### Analytics Tracker

```php
class Analytics {
    public function trackVisit() {
        $data = [
            'url' => Url::full(),
            'path' => Url::uri(),
            'method' => Url::method(),
            'referer' => Url::referer(),
            'source_domain' => Url::sourceDomain(),
            'is_internal' => Url::isInternalReferer(),
            'is_mobile' => Url::isMobile(),
            'is_ajax' => Url::isAjax(),
            'is_secure' => Url::isSecure(),
            'ip' => Url::clientIp(),
            'user_agent' => Url::userAgent(),
            'timestamp' => time()
        ];
        
        // Save to database or analytics service
        $this->saveAnalytics($data);
    }
    
    public function getTrafficSources() {
        $referer = Url::refererDomain();
        
        return match(true) {
            $referer === null => 'Direct',
            Url::isInternalReferer() => 'Internal',
            str_contains($referer, 'google') => 'Google',
            str_contains($referer, 'facebook') => 'Facebook',
            str_contains($referer, 'twitter') => 'Twitter',
            default => 'Other: ' . $referer
        };
    }
}
```

### URL Builder Helper

```php
class UrlBuilder {
    public static function pagination($page, $perPage = 10) {
        return Url::withQuery([
            'page' => $page,
            'per_page' => $perPage
        ]);
    }
    
    public static function filter(array $filters) {
        return Url::withQuery($filters);
    }
    
    public static function sort($field, $direction = 'asc') {
        return Url::withQuery([
            'sort' => $field,
            'order' => $direction
        ]);
    }
    
    public static function cleanUrl() {
        // Remove all tracking parameters
        return Url::withoutQuery([
            'utm_source',
            'utm_medium',
            'utm_campaign',
            'fbclid',
            'gclid'
        ]);
    }
    
    public static function canonical() {
        // Get clean URL for canonical tag
        $parts = Url::parse();
        unset($parts['query']);
        unset($parts['fragment']);
        
        return Url::build($parts);
    }
}
```

### Security Middleware

```php
class SecurityMiddleware {
    public function handle() {
        $this->enforceHttps();
        $this->validateOrigin();
        $this->blockIps();
        $this->preventHotlinking();
    }
    
    private function enforceHttps() {
        if (!Url::isSecure() && App::env('FORCE_HTTPS')) {
            $secureUrl = str_replace('http://', 'https://', Url::full());
            redirect($secureUrl, 301);
        }
    }
    
    private function validateOrigin() {
        $allowedDomains = ['example.com', 'api.example.com'];
        
        if (Url::isAjax() && !Url::isFromAllowedDomain($allowedDomains)) {
            http_response_code(403);
            die('Access denied');
        }
    }
    
    private function blockIps() {
        $blockedIps = ['123.45.67.89'];
        
        if (in_array(Url::clientIp(), $blockedIps)) {
            http_response_code(403);
            die('Your IP has been blocked');
        }
    }
    
    private function preventHotlinking() {
        $uri = Url::uri();
        
        if (preg_match('/\.(jpg|jpeg|png|gif)$/i', $uri)) {
            if (!Url::isInternalReferer() && Url::referer() !== null) {
                http_response_code(403);
                die('Hotlinking not allowed');
            }
        }
    }
}
```

### Breadcrumb Generator

```php
class Breadcrumb {
    public static function generate() {
        $segments = Url::segments();
        $breadcrumbs = [
            ['title' => 'Home', 'url' => Url::base()]
        ];
        
        $path = '';
        foreach ($segments as $segment) {
            $path .= '/' . $segment;
            $breadcrumbs[] = [
                'title' => ucfirst($segment),
                'url' => Url::to($path)
            ];
        }
        
        return $breadcrumbs;
    }
    
    public static function render() {
        $breadcrumbs = self::generate();
        $html = '<nav aria-label="breadcrumb"><ol class="breadcrumb">';
        
        foreach ($breadcrumbs as $i => $crumb) {
            $isLast = $i === count($breadcrumbs) - 1;
            
            if ($isLast) {
                $html .= '<li class="breadcrumb-item active">' . $crumb['title'] . '</li>';
            } else {
                $html .= '<li class="breadcrumb-item"><a href="' . $crumb['url'] . '">' . $crumb['title'] . '</a></li>';
            }
        }
        
        $html .= '</ol></nav>';
        return $html;
    }
}
```

## Best Practices

### 1. Always Use URL Helpers

```php
// ❌ BAD - Hardcoded URLs
<a href="https://example.com/products">Products</a>
<img src="https://example.com/images/logo.png">

// ✓ GOOD - Dynamic URLs
<a href="<?= Url::to('products') ?>">Products</a>
<img src="<?= Url::to('images/logo.png') ?>">
```

### 2. Check Request Type

```php
// ❌ BAD - Assuming POST
$data = $_POST['data'];

// ✓ GOOD - Verify method
if (Url::method() === 'POST') {
    $data = $_POST['data'];
}
```

### 3. Validate Origins

```php
// ❌ BAD - Trusting all requests
processApiRequest();

// ✓ GOOD - Validate origin
if (Url::isSameOrigin() || Url::isFromAllowedDomain($whitelist)) {
    processApiRequest();
}
```

### 4. Use Timing-Safe IP Checks

```php
// ✓ GOOD - Get real client IP (handles proxies)
$clientIp = Url::clientIp();
```

### 5. Clean URLs for Analytics

```php
// Remove tracking parameters for clean canonical URLs
$canonicalUrl = Url::withoutQuery([
    'utm_source', 'utm_medium', 'utm_campaign',
    'fbclid', 'gclid'
]);
```

## PHP Version Compatibility

The Url class is **fully compatible with PHP 8.0 and higher**, including:
- PHP 8.0+
- PHP 8.1+
- PHP 8.2+
- PHP 8.3+

**Uses PHP 8 features:**
- Match expressions
- Named parameters
- Null-safe operators

## Requirements

- Part of the Webrium framework
- PHP 8.0 or higher
- Webrium\App class for some methods

## Performance Notes

- Base URL is cached after first generation
- Parsed URLs are cached to avoid repeated parsing
- Use `Url::reset()` for testing to clear caches

## Security Considerations

1. **Always validate origins** for AJAX/API requests
2. **Use `clientIp()`** instead of direct `$_SERVER['REMOTE_ADDR']` to handle proxies
3. **Check `isSecure()`** before handling sensitive data
4. **Validate referer** for form submissions to prevent CSRF
5. **Never trust user input** from URL segments

## License

Part of the Webrium framework.

## Contributing

This is a framework component. For bug reports or feature requests, please contact the Webrium framework maintainers.