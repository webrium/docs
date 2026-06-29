# Error Handling
Core provides a unified error and exception handler — the `Debug` class — that controls how problems are displayed, logged, and rendered for both development and production environments. It catches PHP errors, warnings, notices, exceptions, and fatal shutdown errors through a single pipeline.

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

If no log path is set, Webrium falls back to the directory registered as `logs` (via `Directory::path('logs')`), creating it if it does not exist.

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

- **Non-fatal errors** (`$isFatal = false`, the default) are reported, and execution continues. If a non-fatal error has already been handled in the current request, any further non-fatal errors are still logged but are not re-rendered.
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

Every error handled by Webrium is also broadcast as an `error` event, which you can hook into for logging, monitoring, or notifications:

```php
use Webrium\Event;

Event::on('error', function ($data) {
    // $data: ['message', 'line', 'file', 'type', 'is_fatal']

    if ($data['is_fatal']) {
        // notify via Slack, email, error tracker, etc.
    }
});
```

The event is emitted internally through `Event::emit('error', ...)` and is dispatched before the error is logged or rendered, so listeners can observe every error — fatal or not.

## Inspecting the Current Error State

```php
Debug::hasError();         // bool
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