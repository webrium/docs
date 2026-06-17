# Error Handling & Debugging
Webrium's `Debug` class manages how errors and exceptions are displayed, logged, and rendered — for both development and production environments.

## Basic Configuration

By default, errors are displayed and logging is enabled. Configure this **before** `App::initialize()` is called:

```php
use Webrium\Debug;
use Webrium\App;

if (env('APP_DEBUG', false)) {
    Debug::enableErrorDisplay(true);
} else {
    Debug::enableErrorDisplay(false);
    Debug::enableErrorLogging(true);
    Debug::setLogPath(storage_path('logs'));
}

App::initialize(__DIR__ . '/..');
```

| Method | Description |
|---|---|
| `enableErrorDisplay(bool)` | Show errors directly in the response (development) |
| `enableErrorLogging(bool)` | Write errors to a log file |
| `setLogPath(string)` | Directory where error logs are stored |
| `isDisplayingErrors()` | Check the current display setting |

## JSON Error Responses

For API-only applications, force errors to be returned as JSON instead of HTML:

```php
Debug::forceJsonResponse(true);
```

```json
{
    "error": "Class App\\Controllers\\UserController not found",
    "status": 500
}
```

## Triggering Errors Manually

`Debug::triggerError()` lets you raise an application-level error with full control over its status code and behavior:

```php
Debug::triggerError(
    message: 'Invalid API key',
    statusCode: 401
);
```

### Full Signature

```php
Debug::triggerError(
    string $message,
    string|false $file = false,
    int|false $line = false,
    int $statusCode = 500,
    bool $isFatal = false,
    string $errorType = 'Error'
): void;
```

- **Non-fatal errors** (`$isFatal = false`, the default) are logged and displayed, but execution continues.
- **Fatal errors** (`$isFatal = true`) stop further error processing — only the first fatal error in a request is handled.

### Triggering a 404

```php
Debug::notFound('User not found');
```

This is a shortcut for `triggerError($message, ..., 404, false, 'Not Found')`.

## Custom Error Pages

By default, errors render a built-in HTML page (or JSON, if `forceJsonResponse` is enabled). To use your own templates — for example, with `webrium/view` — register a custom renderer:

```php
use Webrium\Debug;

Debug::setErrorRenderer(function (array $data): string {
    // $data contains: error_message, error_line, error_file,
    // error_backtrace, error_type, status_code
    return view('errors.debug', $data);
});
```

This must be set before `App::initialize()` as well.

## Listening for Errors

Every error triggered through `Debug` also emits an `error` event, which you can hook into for logging, monitoring, or notifications:

```php
use Webrium\Event;

Event::on('error', function ($data) {
    // $data: ['message', 'line', 'file', 'type', 'is_fatal']

    if ($data['is_fatal']) {
        // notify via Slack, email, error tracker, etc.
    }
});
```

## Inspecting the Current Error State

```php
Debug::hasError();        // bool
Debug::getErrorString();   // error message
Debug::getErrorFile();     // file where the error occurred
Debug::getErrorLine();     // line number
Debug::getHtmlOutput();    // rendered error HTML, if any
```

## Recommended Setup by Environment

### Development

```php
Debug::enableErrorDisplay(true);
Debug::enableErrorLogging(false);
```

### Production (Web Application)

```php
Debug::enableErrorDisplay(false);
Debug::enableErrorLogging(true);
Debug::setLogPath(storage_path('logs'));
Debug::setErrorRenderer(fn ($data) => view('errors.500', $data));
```

### Production (API)

```php
Debug::enableErrorDisplay(false);
Debug::enableErrorLogging(true);
Debug::setLogPath(storage_path('logs'));
Debug::forceJsonResponse(true);
```

## Next Steps

- [Configuration](../getting-started/04-configuration.md) — `.env` and bootstrap order
- [Events](./05-events.md) — listening for the `error` event