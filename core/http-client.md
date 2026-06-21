# HTTP Client

Webrium ships with an HTTP client for talking to external APIs, webhooks, and third-party services. It is built on cURL but presents a fluent, chainable API that handles the awkward parts — base URLs, JSON, multipart uploads, authentication, redirects, and response inspection — for you.

A request is built up by chaining methods on the client, then dispatched with a verb call (`get`, `post`, `put`, `patch`, `delete`). The verb call returns an `HttpResponse` you can inspect, decode, and act on.

```php
use Webrium\HttpClient;

$response = HttpClient::make('https://api.example.com')
    ->withToken($apiToken)
    ->withQuery(['page' => 2])
    ->get('/users');

if ($response->ok()) {
    $users = $response->json();
}
```

- [Creating a Client](#creating-a-client)
- [Making Requests](#making-requests)
- [Request Bodies](#request-bodies)
- [Headers & Authentication](#headers--authentication)
- [Transport Options](#transport-options)
- [Middleware](#middleware)
- [Working with Responses](#working-with-responses)
- [Reusing a Client](#reusing-a-client)

---

## Creating a Client

```php
use Webrium\HttpClient;

$client = HttpClient::make();                          // no base URL
$client = HttpClient::make('https://api.example.com'); // with base URL
```

`HttpClient::make()` and `new HttpClient(...)` are equivalent — the static factory is offered for fluent style.

### Base URLs

When a client is created with a base URL, every relative path you pass to a verb method is appended to it. Absolute URLs (anything starting with `http://` or `https://`) are used as-is, ignoring the base:

```php
$api = HttpClient::make('https://api.example.com');

$api->get('/users');                              // → https://api.example.com/users
$api->get('https://other.example.com/health');    // → https://other.example.com/health
```

The base URL persists for the lifetime of the client, even across multiple requests.

---

## Making Requests

Five verb methods are available, each returning an `HttpResponse`:

```php
$client->get($url, $query = []);
$client->post($url, $data = null);
$client->put($url, $data = null);
$client->patch($url, $data = null);
$client->delete($url, $data = null);
```

Every argument is optional. Anything you do not pass to the verb call can be configured beforehand using the chainable methods below.

```php
HttpClient::make()->get('https://api.example.com/users');

HttpClient::make()
    ->withQuery(['q' => 'webrium'])
    ->get('https://api.example.com/search');
```

### Query Parameters

```php
HttpClient::make()
    ->withQuery(['page' => 2, 'limit' => 50])
    ->get('https://api.example.com/users');

// Or as the second argument to get()
HttpClient::make()->get('https://api.example.com/users', ['page' => 2]);
```

`withQuery()` merges parameters — calling it twice combines both sets. Query parameters apply to the next request only; they are cleared after the response is received.

---

## Request Bodies

You have four ways to attach a body to a request, depending on the content type you want to send.

### Raw Body

The lowest-level option — pass whatever you have:

```php
HttpClient::make()
    ->withHeader('Content-Type', 'text/csv')
    ->withBody($csvString)
    ->post('https://api.example.com/import');
```

### JSON

`asJson()` encodes the payload, sets `Content-Type: application/json` and `Accept: application/json`, and dispatches the request in a single call:

```php
$response = HttpClient::make()->asJson('POST', 'https://api.example.com/users', [
    'name'  => 'Alice',
    'email' => 'alice@example.com',
]);
```

If the data cannot be encoded as JSON (for example, invalid UTF-8 bytes), the client throws a `RuntimeException` with the encoder's error message. Errors are surfaced rather than silently dropped.

### Form-Encoded

`asForm()` URL-encodes the data and sets `Content-Type: application/x-www-form-urlencoded`:

```php
HttpClient::make()->asForm('https://api.example.com/login', [
    'username' => 'alice',
    'password' => 'secret',
]);
```

### Multipart (File Uploads)

`asMultipart()` builds a `multipart/form-data` request. To attach a file, pass either a `CURLFile` instance or the legacy `'@/path/to/file'` shorthand — the client converts it to a `CURLFile` for you:

```php
HttpClient::make()->asMultipart('https://api.example.com/upload', [
    'description' => 'Q1 report',
    'file'        => '@' . storage_path('app/document.pdf'),
]);

// Equivalent, more explicit:
HttpClient::make()->asMultipart('https://api.example.com/upload', [
    'description' => 'Q1 report',
    'file'        => new \CURLFile(storage_path('app/document.pdf')),
]);
```

The path must exist; non-file values with a leading `@` are passed through unchanged.

---

## Headers & Authentication

### Custom Headers

```php
HttpClient::make()
    ->withHeader('X-Request-Id', $requestId)
    ->withHeaders([
        'Accept'   => 'application/json',
        'X-Source' => 'webrium',
    ])
    ->get($url);
```

Header names and values are validated against CR/LF injection. Passing a value that contains `\r`, `\n`, or `\0` raises an `InvalidArgumentException`, so untrusted input cannot smuggle in additional headers.

### Bearer Token

```php
HttpClient::make()
    ->withToken($apiToken)
    ->get($url);
```

Equivalent to `withHeader('Authorization', 'Bearer ' . $apiToken)`.

### Basic Authentication

```php
HttpClient::make()
    ->withBasicAuth($username, $password)
    ->get($url);
```

### User Agent

The default user agent is `Webrium-HttpClient/1.0`. Override it with:

```php
HttpClient::make()->withUserAgent('MyApp/2.0')->get($url);
```

---

## Transport Options

### Timeout

```php
HttpClient::make()->timeout(10)->get($url); // 10 seconds for both connect and total time
```

The default is 30 seconds.

### Redirects

By default the client follows up to 5 redirects:

```php
HttpClient::make()
    ->withRedirects(true, 3)   // follow up to 3
    ->get($url);

HttpClient::make()
    ->withRedirects(false)     // do not follow
    ->get($url);
```

### SSL Verification

SSL certificate verification is on by default. To disable it (for local development or self-signed certificates):

```php
HttpClient::make()->withoutVerifying()->get($url);
```

Do not disable verification in production unless you control the endpoint.

### Custom cURL Options

For anything not covered by the fluent API, supply raw cURL options:

```php
HttpClient::make()
    ->withOptions([
        CURLOPT_ENCODING => 'gzip',
        CURLOPT_PROXY    => 'http://localhost:8888',
    ])
    ->get($url);
```

These options are merged with the ones the client sets internally, with yours taking precedence.

---

## Middleware

Register callbacks that run just before the request is dispatched. Each callback receives the cURL handle and the client instance, so it can inspect or further configure the transfer — useful for adding signed headers, custom logging, or applying cross-cutting policies:

```php
HttpClient::make('https://api.example.com')
    ->middleware(function ($ch, $client) {
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'X-Signature: ' . sign_request($client),
        ]);
    })
    ->get('/data');
```

Multiple middlewares are applied in the order they were registered.

---

## Working with Responses

Every request returns an `HttpResponse`.

### Status Codes

```php
$response->status();       // int, e.g. 200
$response->ok();           // strictly 200
$response->successful();   // 2xx
$response->redirect();     // 3xx
$response->clientError();  // 4xx
$response->serverError();  // 5xx
$response->failed();       // 4xx or 5xx
```

### Body

```php
$response->body();         // raw body as string
(string) $response;        // same — HttpResponse is stringable
$response->json();         // decoded JSON as an associative array
$response->json(false);    // decoded JSON as objects
```

### Headers

Header lookup is **case-insensitive** — `header('Content-Type')`, `header('content-type')`, and `header('CONTENT-TYPE')` all return the same value:

```php
$response->header('Content-Type');             // string
$response->header('X-Missing', 'fallback');    // default if absent
$response->headers();                          // all headers as an array
```

When a header appears more than once in the response (most commonly `Set-Cookie`), the value is exposed as an array containing every occurrence, so nothing is silently lost:

```php
$cookies = $response->header('Set-Cookie');
// ['session=abc; Path=/', 'theme=dark; Path=/']
```

### Transfer Info

```php
$response->info();                 // full cURL transfer info as an array
$response->info('total_time');     // single field, or null if missing
```

### Throwing on Failure

```php
$response = HttpClient::make()->get($url)->throw();
// Throws RuntimeException if the response was 4xx or 5xx; otherwise returns the response.
```

### Conditional Callbacks

```php
HttpClient::make()
    ->get($url)
    ->onSuccess(function ($response) {
        // 2xx handler
    })
    ->onError(function ($response) {
        // 4xx/5xx handler
    });
```

Both callbacks return the response, so you can keep chaining.

---

## Reusing a Client

You can issue many requests through a single client. Persistent settings — the base URL, custom headers, authentication, timeouts, the user agent, and middleware — stay configured across calls. Per-request data — the query string, the body, and the URL — is cleared after each response, so unrelated requests cannot accidentally share state:

```php
$api = HttpClient::make('https://api.example.com')->withToken($token);

$users = $api->get('/users')->json();              // Authorization header sent
$posts = $api->get('/posts')->json();              // same auth, no leftover query string
$api->withBody(['name' => 'New'])->post('/items'); // body sent only on this call
```

To return the client to a completely fresh state — clearing custom headers, restoring the default timeout, redirects, SSL, user agent, and so on — call `reset()`:

```php
$api->reset();
```

The configured base URL is preserved across `reset()`, so the client remains usable.

---

## Example: Calling a Third-Party API

```php
namespace App\Controllers;

use Webrium\HttpClient;

class WeatherController
{
    public function show(string $city)
    {
        $response = HttpClient::make('https://api.weather.example.com')
            ->withToken(env('WEATHER_API_KEY'))
            ->timeout(5)
            ->get('/current', ['city' => $city]);

        if ($response->failed()) {
            return respond(['error' => 'Weather service unavailable'], 502);
        }

        return $response->json();
    }
}
```