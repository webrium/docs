# Header Class Documentation

The `Header` class provides comprehensive HTTP header management for reading request headers, setting response headers, and handling CORS, security, caching, and authentication headers in the Webrium framework.

## Table of Contents

- [Installation](#installation)
- [Basic Usage](#basic-usage)
- [Reading Request Headers](#reading-request-headers)
- [Setting Response Headers](#setting-response-headers)
- [Authentication Headers](#authentication-headers)
- [CORS Headers](#cors-headers)
- [Security Headers](#security-headers)
- [Cache Control](#cache-control)
- [Content Type Headers](#content-type-headers)
- [File Downloads](#file-downloads)
- [Redirects](#redirects)
- [API Reference](#api-reference)

## Installation

The `Header` class is included in the Webrium framework. No additional installation is required.

```php
use Webrium\Header;
```

## Basic Usage

```php
// Get a request header
$userAgent = Header::get('User-Agent');

// Set a response header
Header::set('X-Custom-Header', 'value');

// Set multiple headers
Header::setMultiple([
    'X-API-Version' => '1.0',
    'X-Request-ID' => uniqid()
]);
```

## Reading Request Headers

### Get All Headers

```php
$headers = Header::all();
// Returns: ['Content-Type' => 'application/json', 'User-Agent' => '...', ...]
```

### Get Specific Header

```php
// Get header (case-insensitive)
$contentType = Header::get('Content-Type');
$contentType = Header::get('content-type'); // Same result

// With default value
$customHeader = Header::get('X-Custom-Header', 'default-value');
```

### Check Header Existence

```php
if (Header::has('Authorization')) {
    // Authorization header exists
}
```

### Common Request Headers

```php
// Get User-Agent
$userAgent = Header::getUserAgent();

// Get Referer
$referer = Header::getReferer();

// Get Content-Type
$contentType = Header::getContentType();

// Check if client expects JSON
if (Header::expectsJson()) {
    // Return JSON response
}
```

## Setting Response Headers

### Set Single Header

```php
// Set header
Header::set('X-API-Version', '2.0');

// Replace existing header (default: true)
Header::set('X-Custom-Header', 'new-value', true);

// Add without replacing
Header::set('Set-Cookie', 'token=abc123', false);
```

### Set Multiple Headers

```php
Header::setMultiple([
    'X-API-Version' => '1.0',
    'X-Powered-By' => 'Webrium',
    'X-Request-ID' => uniqid()
]);
```

### Remove Header

```php
Header::remove('X-Powered-By');
```

### Check if Headers Sent

```php
if (Header::sent($file, $line)) {
    // Headers already sent
    echo "Headers were sent in {$file} on line {$line}";
}
```

## Authentication Headers

### Authorization Header

```php
// Get Authorization header
$auth = Header::getAuthorization();
// Returns: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Bearer Token

```php
// Extract Bearer token
$token = Header::getBearerToken();
// Returns: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." or null

// Usage in API
if (!$token = Header::getBearerToken()) {
    http_response_code(401);
    die(json_encode(['error' => 'Unauthorized']));
}

// Validate token
if (!validateToken($token)) {
    http_response_code(403);
    die(json_encode(['error' => 'Invalid token']));
}
```

### Basic Authentication

```php
// Get Basic Auth credentials
$credentials = Header::getBasicAuth();
// Returns: ['username' => 'user', 'password' => 'pass'] or null

// Usage
if ($credentials = Header::getBasicAuth()) {
    if (authenticate($credentials['username'], $credentials['password'])) {
        // Authenticated
    }
}
```

### API Key

```php
// Get API key from custom header
$apiKey = Header::getApiKey(); // Default: X-API-Key
$apiKey = Header::getApiKey('X-Custom-API-Key');

// Validate API key
if ($apiKey !== 'expected-key') {
    http_response_code(403);
    die('Invalid API key');
}
```

## CORS Headers

> **Note:** For high-level CORS management, use `App::corsMiddleware()`. The `Header::cors()` method is a low-level tool.

### Basic CORS

```php
// Set CORS headers (low-level)
Header::cors([
    'allowed_origins' => ['https://example.com'],
    'allowed_methods' => ['GET', 'POST'],
    'allowed_headers' => ['Content-Type', 'Authorization'],
    'allow_credentials' => true,
    'max_age' => 3600
]);
```

### Handle Preflight Requests

```php
// Handle OPTIONS requests
Header::handlePreflight([
    'allowed_origins' => ['https://example.com']
]);
```

### CORS Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `allowed_origins` | array | `[]` | List of allowed origin URLs |
| `allowed_methods` | array | `['GET', 'POST', ...]` | HTTP methods allowed |
| `allowed_headers` | array | `['Content-Type', ...]` | Headers allowed in request |
| `allow_credentials` | bool | `false` | Allow cookies/credentials |
| `max_age` | int | `86400` | Preflight cache duration (seconds) |
| `expose_headers` | array | `[]` | Headers exposed to client |

## Security Headers

### Apply All Security Headers

```php
Header::security();
// Sets HSTS, X-Content-Type-Options, X-XSS-Protection, X-Frame-Options, etc.
```

### Custom Security Configuration

```php
Header::security([
    'hsts' => true,
    'hsts_max_age' => 31536000,        // 1 year
    'hsts_subdomains' => true,
    'hsts_preload' => false,
    'nosniff' => true,
    'xss_protection' => true,
    'frame_options' => 'SAMEORIGIN',   // DENY, SAMEORIGIN, or false
    'csp' => "default-src 'self'",     // Content Security Policy
    'referrer_policy' => 'strict-origin-when-cross-origin'
]);
```

### Individual Security Headers

```php
// HTTP Strict Transport Security
Header::set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

// Prevent MIME sniffing
Header::set('X-Content-Type-Options', 'nosniff');

// XSS Protection
Header::set('X-XSS-Protection', '1; mode=block');

// Clickjacking protection
Header::set('X-Frame-Options', 'DENY');

// Content Security Policy
Header::set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'");

// Referrer Policy
Header::set('Referrer-Policy', 'strict-origin-when-cross-origin');
```

## Cache Control

### Enable Caching

```php
// Cache for 1 hour (3600 seconds)
Header::cache(3600);

// With options
Header::cache(3600, [
    'public' => true,              // Public cache
    'must_revalidate' => true,
    'no_transform' => false,
    's_maxage' => 7200             // Shared cache max age
]);

// Custom cache directive
Header::cache('public, max-age=3600, immutable');
```

### Disable Caching

```php
Header::noCache();
// Sets: Cache-Control: no-store, no-cache, must-revalidate, max-age=0
//       Pragma: no-cache
//       Expires: Thu, 01 Jan 1970 00:00:00 GMT
```

## Content Type Headers

### Set Content Type

```php
// Generic content type
Header::contentType('application/json');
Header::contentType('text/html', 'utf-8');

// Predefined shortcuts
Header::json();    // application/json
Header::html();    // text/html
Header::xml();     // application/xml
Header::text();    // text/plain
```

### Content Type Examples

```php
// JSON API response
Header::json();
echo json_encode(['status' => 'success']);

// HTML page
Header::html();
echo '<h1>Welcome</h1>';

// XML feed
Header::xml();
echo '<?xml version="1.0"?><feed>...</feed>';

// Plain text
Header::text();
echo 'Plain text response';
```

## File Downloads

### Trigger File Download

```php
// Basic download
Header::download('report.pdf');

// With content type
Header::download('data.csv', 'text/csv');

// With size
Header::download('file.zip', 'application/zip', 1048576); // 1 MB
```

### Download Example

```php
$filename = 'report.pdf';
$filepath = '/path/to/report.pdf';

Header::download($filename, 'application/pdf', filesize($filepath));
readfile($filepath);
exit;
```

## Redirects

### Redirect to URL

```php
// Temporary redirect (302)
Header::redirect('https://example.com/new-page');

// Permanent redirect (301)
Header::redirect('https://example.com/new-page', 301);
```

### Set HTTP Status Code

```php
// Set custom status code
Header::status(201); // Created
Header::status(404); // Not Found
Header::status(500); // Internal Server Error
```

## Advanced Usage

### API Response Headers

```php
// Set API version and rate limit headers
Header::setMultiple([
    'X-API-Version' => '2.0',
    'X-Rate-Limit' => '1000',
    'X-Rate-Limit-Remaining' => '950',
    'X-Rate-Limit-Reset' => time() + 3600
]);
```

### Security Headers for Production

```php
// Comprehensive security setup
Header::security([
    'hsts' => true,
    'hsts_max_age' => 63072000, // 2 years
    'hsts_subdomains' => true,
    'hsts_preload' => true,
    'nosniff' => true,
    'xss_protection' => true,
    'frame_options' => 'DENY',
    'csp' => implode('; ', [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' https://cdn.example.com",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "font-src 'self' data:",
        "connect-src 'self' https://api.example.com",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'"
    ]),
    'referrer_policy' => 'strict-origin-when-cross-origin'
]);
```

### Custom Authentication Scheme

```php
// Set custom authentication header
Header::set('WWW-Authenticate', 'Custom realm="API"');
Header::status(401);
```

### Clear Header Cache

```php
// Clear cached headers (useful in testing)
Header::clearCache();
```

## API Reference

### Reading Headers

| Method | Description | Returns |
|--------|-------------|---------|
| `all()` | Get all request headers | array |
| `get($name, $default)` | Get specific header | mixed |
| `has($name)` | Check if header exists | bool |
| `getUserAgent()` | Get User-Agent | string\|null |
| `getReferer()` | Get Referer | string\|null |
| `getContentType()` | Get Content-Type | string\|null |
| `expectsJson()` | Check if expects JSON | bool |

### Authentication

| Method | Description | Returns |
|--------|-------------|---------|
| `getAuthorization()` | Get Authorization header | string\|null |
| `getBearerToken()` | Extract Bearer token | string\|null |
| `getBasicAuth()` | Extract Basic auth credentials | array\|null |
| `getApiKey($headerName)` | Get API key | string\|null |

### Setting Headers

| Method | Description | Returns |
|--------|-------------|---------|
| `set($name, $value, $replace)` | Set header | void |
| `setMultiple($headers, $replace)` | Set multiple headers | void |
| `remove($name)` | Remove header | void |

### CORS

| Method | Description | Returns |
|--------|-------------|---------|
| `cors($config)` | Set CORS headers | bool |
| `handlePreflight($config, $terminate)` | Handle OPTIONS request | void |

### Security

| Method | Description | Returns |
|--------|-------------|---------|
| `security($options)` | Set security headers | void |

### Cache

| Method | Description | Returns |
|--------|-------------|---------|
| `cache($value, $options)` | Enable caching | void |
| `noCache()` | Disable caching | void |

### Content Type

| Method | Description | Returns |
|--------|-------------|---------|
| `contentType($type, $charset)` | Set content type | void |
| `json()` | Set JSON content type | void |
| `html()` | Set HTML content type | void |
| `xml()` | Set XML content type | void |
| `text()` | Set text content type | void |

### Downloads & Redirects

| Method | Description | Returns |
|--------|-------------|---------|
| `download($filename, $type, $size)` | Set download headers | void |
| `redirect($url, $code)` | Redirect to URL | void |
| `status($code)` | Set status code | void |

### Utilities

| Method | Description | Returns |
|--------|-------------|---------|
| `sent(&$file, &$line)` | Check if headers sent | bool |
| `clearCache()` | Clear header cache | void |

## Examples

### Example 1: Protected API Endpoint

```php
use Webrium\Header;

// Check authentication
$token = Header::getBearerToken();
if (!$token || !isValidToken($token)) {
    Header::status(401);
    Header::json();
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

// Set response headers
Header::json();
Header::setMultiple([
    'X-API-Version' => '1.0',
    'X-Request-ID' => uniqid()
]);

echo json_encode(['data' => 'success']);
```

### Example 2: File Download

```php
$file = '/path/to/report.pdf';

if (!file_exists($file)) {
    Header::status(404);
    die('File not found');
}

Header::download('Monthly-Report.pdf', 'application/pdf', filesize($file));
readfile($file);
exit;
```

### Example 3: Secure Web Application

```php
// Apply security headers
Header::security([
    'hsts' => true,
    'frame_options' => 'DENY',
    'csp' => "default-src 'self'; script-src 'self' 'unsafe-inline'"
]);

// Disable caching for sensitive pages
Header::noCache();
```

### Example 4: API with Rate Limiting

```php
// Check rate limit
$remaining = getRateLimitRemaining($userId);

Header::setMultiple([
    'X-Rate-Limit' => '100',
    'X-Rate-Limit-Remaining' => (string)$remaining,
    'X-Rate-Limit-Reset' => (string)(time() + 3600)
]);

if ($remaining <= 0) {
    Header::status(429); // Too Many Requests
    Header::json();
    echo json_encode(['error' => 'Rate limit exceeded']);
    exit;
}
```

## Best Practices

1. **Always validate authentication headers** before processing sensitive requests
2. **Use security headers** in production for all web applications
3. **Set appropriate cache headers** based on content type
4. **Use CORS with App class** (`App::corsMiddleware()`) for better integration
5. **Check `Header::sent()`** before setting headers to avoid errors
6. **Set Content-Type** before outputting response body
7. **Use `noCache()`** for dynamic/sensitive content
8. **Clear header cache** in tests to avoid pollution

## Security Considerations

- Never trust client headers completely (can be spoofed)
- Always validate authentication tokens server-side
- Use HTTPS in production (enforce with HSTS)
- Set restrictive CSP policies
- Validate and sanitize all header values before using them
- Use `X-Frame-Options` to prevent clickjacking
- Enable `X-Content-Type-Options: nosniff` to prevent MIME sniffing
