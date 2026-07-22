# View Error Handling

`webrium/view` identifies template failures and attaches the original view path and source line. In a full Webrium application, `webrium/core` is responsible for displaying or logging that exception. Keeping these responsibilities separate lets the view engine provide accurate diagnostics without deciding how an HTTP error page should look.

## Exception Types

```php
use Webrium\View\Engine;
use Webrium\View\ViewException;
use Webrium\View\ViewTemplateException;

try {
    echo Engine::render('pages/home', ['user' => $user]);
} catch (ViewTemplateException $exception) {
    // Parser or template-compilation failure.
} catch (ViewException $exception) {
    // Missing view, I/O failure, warning, or runtime rendering failure.
}
```

`ViewTemplateException` extends `ViewException`, so catch it first when compilation errors need separate handling.

Missing views include a direct message such as `View file does not exist: ...`. Application-level error handlers should preserve the full message rather than keeping only the text after its final colon.

## Original View and Line

Mapped template failures expose structured diagnostics:

```php
$path = $exception->getOriginalView();
$line = $exception->getOriginalLine();
$compiledPath = $exception->getCompiledView();
```

- `getOriginalView()` returns the source template path.
- `getOriginalLine()` returns its one-based source line.
- `getCompiledView()` returns the generated PHP path for runtime rendering failures.

For errors unrelated to a compiled template, the source fields may be an empty string or `0`.

The immediate previous exception also uses the original view path and line. This preserves compatibility with error handlers that already inspect `getPrevious()->getFile()` and `getPrevious()->getLine()`.

## Source Maps

Compiled templates begin with generated metadata and directives may expand, collapse, or move PHP code. Subtracting a fixed number of header lines is therefore not reliable for multiline directives or attributes.

The compiler creates a generated-line to source-line table and stores it in a `.map.json` file beside the compiled PHP file. The map covers:

- Normal views and raw PHP
- Inline and multiline directives
- `w-if`, `w-else-if`, and `w-for` attributes
- Layouts and named sections
- Components
- All hybrid-cache render methods
- Parser failures where a source position is available

Source markers used during compilation are removed before the generated PHP is written and never appear in rendered HTML. Source maps are loaded only when an error must be translated, so successful rendering does not add a map-file read.

Compiled files created by older versions remain compatible through the legacy header-offset fallback. When no source-map file exists, the engine recompiles the view on its next render.

## Advanced Compilation API

Most applications should call `Engine::render()`. Tools that compile template strings directly can request the generated code and its line map:

```php
use Webrium\View\Parser;

$compiled = Parser::compileWithSourceMap($template);

$php = $compiled->getCode();
$lineMap = $compiled->getLineMap(); // generated line => source line
```

`Parser::compile($template)` remains compatible and returns only the generated PHP string.

## Output Buffer Cleanup

Rendering uses output buffers, and named sections open nested buffers. If a warning, runtime error, component failure, or section failure interrupts rendering, the engine unwinds every buffer created by that render and clears incomplete section state before rethrowing the mapped exception. The caller's pre-existing buffers are left intact.

## Production Guidance

In development, show the original view and line. In production, log the structured details but return a generic response to the visitor:

```php
catch (ViewException $exception) {
    error_log(sprintf(
        '%s:%d %s',
        $exception->getOriginalView(),
        $exception->getOriginalLine(),
        $exception->getMessage()
    ));

    http_response_code(500);
    echo 'An unexpected error occurred.';
}
```

The application or Core debug layer owns response formatting, status codes, logging policy, and protection of filesystem paths. The view package owns detection, source mapping, and cleanup of rendering state.
