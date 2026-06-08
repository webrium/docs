# HttpClient

The `HttpClient` class provides a fluent, chainable API for making HTTP requests using cURL. It supports all common HTTP methods, authentication, JSON, form data, file uploads, middleware, and more.

> **Requires:** PHP 8.0+, cURL extension enabled

---

## Table of Contents

- [Installation & Basic Usage](#installation--basic-usage)
- [Creating an Instance](#creating-an-instance)
- [Making Requests](#making-requests)
  - [GET](#get)
  - [POST](#post)
  - [PUT](#put)
  - [PATCH](#patch)
  - [DELETE](#delete)
- [Request Configuration](#request-configuration)
  - [Headers](#headers)
  - [Authentication](#authentication)
  - [Query Parameters](#query-parameters)
  - [Request Body](#request-body)
  - [Content Types](#content-types)
  - [Timeout](#timeout)
  - [SSL Verification](#ssl-verification)
  - [Redirects](#redirects)
  - [User Agent](#user-agent)
  - [Custom cURL Options](#custom-curl-options)
  - [Middleware](#middleware)
- [Working with Responses](#working-with-responses)
  - [Status Checks](#status-checks)
  - [Reading the Body](#reading-the-body)
  - [Headers](#response-headers)
  - [Error Handling](#error-handling)
  - [Callbacks](#callbacks)
- [Reusing a Client Instance](#reusing-a-client-instance)
- [API Reference](#api-reference)

---

## Installation & Basic Usage

```php
use Webrium\HttpClient;

$response = HttpClient::make()
    ->get('https://api.example.com/users');

echo $response->body();
```

---

## Creating an Instance

You can create an `HttpClient` instance in two ways:

**Using the static factory (recommended):**
```php
$client = HttpClient::make();

// With a base URL
$client = HttpClient::make('https://api.example.com');
```

**Using the constructor:**
```php
$client = new HttpClient();

// With a base URL
$client = new HttpClient('https://api.example.com');
```

When a base URL is provided, subsequent requests can use relative or absolute paths.

---

## Making Requests

### GET

```php
$response = HttpClient::make()->get('https://api.example.com/users');

// With query parameters
$response = HttpClient::make()->get('https://api.example.com/users', [
    'page' => 1,
    'limit' => 20,
]);
```

### POST

```php
$response = HttpClient::make()->post('https://api.example.com/users', $data);
```

### PUT

```php
$response = HttpClient::make()->put('https://api.example.com/users/1', $data);
```

### PATCH

```php
$response = HttpClient::make()->patch('https://api.example.com/users/1', $data);
```

### DELETE

```php
$response = HttpClient::make()->delete('https://api.example.com/users/1');
```

---

## Request Configuration

All configuration methods return `$this`, so they can be chained freely.

### Headers

**Set multiple headers at once:**
```php
$response = HttpClient::make()
    ->withHeaders([
        'Accept' => 'application/json',
        'X-Custom-Header' => 'value',
    ])
    ->get('https://api.example.com/data');
```

**Set a single header:**
```php
$response = HttpClient::make()
    ->withHeader('Accept', 'application/json')
    ->get('https://api.example.com/data');
```

### Authentication

**Bearer token:**
```php
$response = HttpClient::make()
    ->withToken('your-api-token')
    ->get('https://api.example.com/protected');
```

**Basic auth:**
```php
$response = HttpClient::make()
    ->withBasicAuth('username', 'password')
    ->get('https://api.example.com/protected');
```

### Query Parameters

```php
$response = HttpClient::make()
    ->withQuery(['search' => 'webrium', 'page' => 2])
    ->get('https://api.example.com/posts');

// Equivalent URL: https://api.example.com/posts?search=webrium&page=2
```

### Request Body

```php
$response = HttpClient::make()
    ->withBody('raw body content')
    ->post('https://api.example.com/data');
```

### Content Types

**JSON request:**
```php
$response = HttpClient::make()
    ->asJson('POST', 'https://api.example.com/users', [
        'name' => 'John Doe',
        'email' => 'john@example.com',
    ]);
```
This automatically sets `Content-Type: application/json` and `Accept: application/json`.

**URL-encoded form data:**
```php
$response = HttpClient::make()
    ->asForm('https://api.example.com/login', [
        'username' => 'john',
        'password' => 'secret',
    ]);
```

**Multipart form data (file upload):**
```php
$response = HttpClient::make()
    ->asMultipart('https://api.example.com/upload', [
        'file' => new \CURLFile('/path/to/file.jpg'),
        'title' => 'My Photo',
    ]);
```

### Timeout

```php
$response = HttpClient::make()
    ->timeout(10) // 10 seconds
    ->get('https://api.example.com/slow-endpoint');
```

Default timeout is **30 seconds**.

### SSL Verification

```php
// Disable SSL verification (not recommended in production)
$response = HttpClient::make()
    ->withoutVerifying()
    ->get('https://self-signed.example.com');
```

### Redirects

```php
// Follow redirects (enabled by default, max 5)
$response = HttpClient::make()
    ->withRedirects(true, 10)
    ->get('https://api.example.com/redirect');

// Disable redirect following
$response = HttpClient::make()
    ->withRedirects(false)
    ->get('https://api.example.com/redirect');
```

### User Agent

```php
$response = HttpClient::make()
    ->withUserAgent('MyApp/2.0')
    ->get('https://api.example.com/data');
```

Default user agent is `Webrium-HttpClient/1.0`.

### Custom cURL Options

For advanced use cases, you can pass raw cURL options directly:

```php
$response = HttpClient::make()
    ->withOptions([
        CURLOPT_INTERFACE => 'eth0',
        CURLOPT_DNS_SERVERS => '8.8.8.8',
    ])
    ->get('https://api.example.com/data');
```

### Middleware

Middleware lets you modify the cURL handle before the request is sent. This is useful for logging, adding dynamic headers, or instrumenting requests.

```php
$response = HttpClient::make()
    ->middleware(function ($ch, $client) {
        // $ch is the cURL handle
        // $client is the HttpClient instance
        curl_setopt($ch, CURLOPT_VERBOSE, true);
        return $ch;
    })
    ->get('https://api.example.com/data');
```

Multiple middleware can be chained; they execute in the order they were added.

---

## Working with Responses

All request methods return an `HttpResponse` instance.

### Status Checks

```php
$response = HttpClient::make()->get('https://api.example.com/users');

$response->ok();           // true if status is 200
$response->successful();   // true if status is 2xx
$response->redirect();     // true if status is 3xx
$response->clientError();  // true if status is 4xx
$response->serverError();  // true if status is 5xx
$response->failed();       // true if status is 4xx or 5xx

$response->status();       // returns the integer status code (e.g. 200)
```

### Reading the Body

```php
// Raw body as string
$body = $response->body();

// Also works via string casting
echo $response;

// Parsed as JSON (returns associative array by default)
$data = $response->json();

// Parsed as JSON object
$data = $response->json(false);
```

### Response Headers

```php
// Get a specific header
$contentType = $response->header('Content-Type');

// With a default fallback
$value = $response->header('X-Missing', 'default');

// Get all headers as an array
$allHeaders = $response->headers();
```

### Error Handling

**Throw an exception if the request failed:**
```php
try {
    $response = HttpClient::make()
        ->get('https://api.example.com/data')
        ->throw();

    // Only reached if 2xx
    $data = $response->json();

} catch (\RuntimeException $e) {
    echo $e->getMessage();
}
```

**cURL errors** (network failures, DNS errors, etc.) also throw a `\RuntimeException` automatically.

### Callbacks

```php
HttpClient::make()
    ->get('https://api.example.com/users')
    ->onSuccess(function ($response) {
        $users = $response->json();
        // handle success
    })
    ->onError(function ($response) {
        echo 'Failed with status: ' . $response->status();
    });
```

Callbacks can be chained after `throw()` as well.

---

## Reusing a Client Instance

You can reuse a client with a shared base URL or shared configuration, then reset per-request state between calls:

```php
$client = HttpClient::make('https://api.example.com')
    ->withToken('shared-api-token')
    ->withHeader('Accept', 'application/json');

$users = $client->get('/users')->json();

$client->reset(); // clears method, headers, body, query, middleware

$posts = $client->get('/posts')->json();
```

> **Note:** `reset()` does **not** clear the base URL or timeout — only per-request state (headers, body, query params, middleware).

---

## API Reference

### HttpClient Methods

| Method | Description |
|---|---|
| `make(?string $baseUrl)` | Static factory to create a new instance |
| `url(string $url)` | Set the request URL |
| `withQuery(array $params)` | Add query string parameters |
| `withHeaders(array $headers)` | Set multiple request headers |
| `withHeader(string $key, string $value)` | Set a single request header |
| `withToken(string $token)` | Set Bearer token authorization |
| `withBasicAuth(string $user, string $pass)` | Set Basic authorization |
| `withBody(mixed $body)` | Set the raw request body |
| `timeout(int $seconds)` | Set request timeout in seconds |
| `withoutVerifying()` | Disable SSL certificate verification |
| `withRedirects(bool $follow, int $max)` | Configure redirect behavior |
| `withUserAgent(string $userAgent)` | Set the User-Agent header |
| `withOptions(array $options)` | Set raw cURL options |
| `middleware(callable $callback)` | Add a middleware callback |
| `get(?string $url, array $query)` | Send a GET request |
| `post(?string $url, mixed $data)` | Send a POST request |
| `put(?string $url, mixed $data)` | Send a PUT request |
| `patch(?string $url, mixed $data)` | Send a PATCH request |
| `delete(?string $url, mixed $data)` | Send a DELETE request |
| `asJson(string $method, ?string $url, array $data)` | Send a JSON request |
| `asForm(?string $url, array $data)` | Send a URL-encoded form request |
| `asMultipart(?string $url, array $data)` | Send a multipart form request |
| `reset()` | Reset per-request state for reuse |

### HttpResponse Methods

| Method | Return | Description |
|---|---|---|
| `status()` | `int` | HTTP status code |
| `ok()` | `bool` | True if status is 200 |
| `successful()` | `bool` | True if status is 2xx |
| `redirect()` | `bool` | True if status is 3xx |
| `clientError()` | `bool` | True if status is 4xx |
| `serverError()` | `bool` | True if status is 5xx |
| `failed()` | `bool` | True if status is 4xx or 5xx |
| `body()` | `string` | Raw response body |
| `json(bool $assoc)` | `mixed` | Body decoded as JSON |
| `header(string $key, mixed $default)` | `mixed` | A single response header |
| `headers()` | `array` | All response headers |
| `throw()` | `self` | Throws `RuntimeException` if failed |
| `onSuccess(callable $callback)` | `self` | Runs callback if successful |
| `onError(callable $callback)` | `self` | Runs callback if failed |
| `info(?string $key)` | `mixed` | Raw cURL info data |
| `__toString()` | `string` | Returns the response body |