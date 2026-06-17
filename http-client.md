# HTTP Client
Webrium's `HttpClient` provides a fluent, chainable API for making outgoing HTTP requests — useful for calling external APIs, webhooks, and third-party services.

## Basic Requests

```php
use Webrium\HttpClient;

$response = HttpClient::make()
    ->get('https://api.example.com/users');

if ($response->ok()) {
    $users = $response->json();
}
```

All HTTP verbs are supported:

```php
$client = HttpClient::make();

$client->get($url, $query = []);
$client->post($url, $data);
$client->put($url, $data);
$client->patch($url, $data);
$client->delete($url, $data);
```

## Base URL

Set a base URL once and reuse the client for multiple requests:

```php
$api = HttpClient::make('https://api.example.com');

$users = $api->get('/users')->json();
$posts = $api->get('/posts')->json();
```

## Query Parameters

```php
$response = HttpClient::make()
    ->withQuery(['page' => 2, 'limit' => 50])
    ->get('https://api.example.com/users');
```

## Sending Data

### JSON Body

```php
$response = HttpClient::make()
    ->withBody(['name' => 'Alice', 'email' => 'alice@example.com'])
    ->post('https://api.example.com/users');
```

### Explicit JSON Request

```php
$response = HttpClient::make()
    ->asJson('POST', 'https://api.example.com/users', [
        'name' => 'Alice',
    ]);
```

### Form-Encoded Data

```php
$response = HttpClient::make()
    ->asForm('https://api.example.com/login', [
        'username' => 'alice',
        'password' => 'secret',
    ]);
```

### Multipart (File Uploads)

```php
$response = HttpClient::make()
    ->asMultipart('https://api.example.com/upload', [
        'file'        => '@' . storage_path('app/document.pdf'),
        'description' => 'Q1 report',
    ]);
```

## Headers and Authentication

```php
HttpClient::make()
    ->withHeader('X-Custom-Header', 'value')
    ->withHeaders(['Accept' => 'application/json'])
    ->get($url);

// Bearer token
HttpClient::make()
    ->withToken($apiToken)
    ->get($url);

// Basic auth
HttpClient::make()
    ->withBasicAuth($username, $password)
    ->get($url);
```

## Timeouts, Redirects, and SSL

```php
HttpClient::make()
    ->timeout(10)                    // seconds
    ->withRedirects(true, 3)         // follow up to 3 redirects
    ->withoutVerifying()             // disable SSL verification (use with caution)
    ->withUserAgent('MyApp/1.0')
    ->get($url);
```

## Custom cURL Options

For anything not covered by the fluent API, pass raw cURL options:

```php
HttpClient::make()
    ->withOptions([CURLOPT_ENCODING => 'gzip'])
    ->get($url);
```

## Working with Responses

Every request returns an `HttpResponse` instance.

```php
$response = HttpClient::make()->get($url);

$response->status();        // int, e.g. 200
$response->ok();             // true if status === 200
$response->successful();     // true if 2xx
$response->redirect();       // true if 3xx
$response->clientError();    // true if 4xx
$response->serverError();    // true if 5xx
$response->failed();         // true if 4xx or 5xx

$response->body();           // raw response body as string
$response->json();           // decoded JSON (associative array by default)
$response->json(false);      // decoded JSON as object

$response->header('Content-Type');
$response->headers();         // all response headers

$response->info();            // cURL transfer info (timing, etc.)
$response->info('total_time');
```

### Throwing on Failure

```php
$response = HttpClient::make()
    ->get($url)
    ->throw(); // throws RuntimeException if the response is 4xx or 5xx
```

### Conditional Callbacks

```php
HttpClient::make()
    ->get($url)
    ->onSuccess(function ($response) {
        // handle success
    })
    ->onError(function ($response) {
        // handle failure
    });
```

## Example: Calling a Third-Party API

```php
namespace App\Controllers;

use Webrium\HttpClient;

class WeatherController
{
    public function show($city)
    {
        $response = HttpClient::make('https://api.weather.example.com')
            ->withToken(env('WEATHER_API_KEY'))
            ->get('/current', ['city' => $city]);

        if ($response->failed()) {
            return respond(['error' => 'Weather service unavailable'], 502);
        }

        return $response->json();
    }
}
```

## Next Steps

- [Hashing & Security](./04-hashing.md) — signing webhook payloads
- [Helper Functions Reference](../reference/helpers.md)