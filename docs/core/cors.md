# CORS

Cross-Origin Resource Sharing (CORS) controls which external domains can make requests to your API. Webrium has a comprehensive CORS system built into the `App` class.

## Quick Setup

```php
// public/index.php
App::initialize(__DIR__ . '/..');

App::corsMiddleware([
    'https://myapp.com',
    'https://admin.myapp.com',
]);

Route::source(['web.php', 'api.php']);
App::run();
```

Call `corsMiddleware()` **before** `App::run()`.

## `App::corsMiddleware()`

The recommended CORS method. Validates the request origin and blocks unauthorized requests.

```php
App::corsMiddleware(
    array $origins,
    array $config = [],
    int $errorCode = 403
);
```

### Options

| Option | Type | Default | Description |
|---|---|---|---|
| `allowed_methods` | array | `['GET','POST','PUT','DELETE','PATCH','OPTIONS']` | Allowed HTTP methods |
| `allowed_headers` | array | `['Content-Type','Authorization',...]` | Allowed request headers |
| `allow_credentials` | bool | `false` | Allow cookies/auth headers |
| `max_age` | int | `86400` | Preflight cache duration (seconds) |
| `expose_headers` | array | `[]` | Headers exposed to the client |

## Common Scenarios

### SPA with Authentication

```php
App::corsMiddleware([
    'https://app.mysite.com',
], [
    'allow_credentials' => true,
    'allowed_methods'   => ['GET', 'POST', 'PUT', 'DELETE'],
    'allowed_headers'   => ['Content-Type', 'Authorization'],
]);
```

### Multiple Frontend Apps

```php
App::corsMiddleware([
    'https://mysite.com',
    'https://admin.mysite.com',
    'https://mobile.mysite.com',
], [
    'allow_credentials' => true,
    'expose_headers'    => ['X-Total-Count'],
]);
```

### Environment-Based Config

```php
$origins = App::env('APP_ENV') === 'production'
    ? ['https://myapp.com', 'https://admin.myapp.com']
    : ['http://localhost:3000', 'http://localhost:8080'];

App::corsMiddleware($origins, [
    'allow_credentials' => true,
]);
```

### Wildcard Subdomains (SaaS)

```php
App::corsMiddleware([
    'https://*.myapp.com',
], [
    'allow_credentials' => true,
    'allowed_headers'   => ['Content-Type', 'Authorization', 'X-Tenant-ID'],
]);
```

### Public API

```php
// ⚠️ Only use wildcard for truly public APIs with no sensitive data
App::corsMiddleware(['*']);
```

::: warning
Never use `*` with `allow_credentials: true` — browsers block this combination.
:::

## Security Best Practices

**Do:**
- Use explicit origin whitelists in production
- Enable credentials only for trusted origins
- Limit allowed HTTP methods to what you actually use
- Use environment variables for origin lists

**Don't:**
- Use wildcard (`*`) in production with sensitive data
- Include `http://localhost` origins in production config
- Trust CORS alone for security — always validate authentication

## Other CORS Methods

| Method | Description |
|---|---|
| `App::enableCors($origins, $config)` | Enable CORS headers without blocking |
| `App::configureCors($config)` | Set CORS configuration options |
| `App::setCorsOrigins($origins)` | Set allowed origins |
| `App::addCorsOrigin($origin)` | Add one origin to the whitelist |
| `App::isOriginAllowed($origin)` | Check if an origin is allowed |
| `App::getAllowedOrigins()` | Get the list of allowed origins |
| `App::isCorsEnabled()` | Check if CORS is active |
