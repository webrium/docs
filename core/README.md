# Core Documentation

This folder contains the documentation for the features provided by Webrium's core. Each document describes a part of the framework available out of the box — routing, request and response handling, sessions, validation, security primitives, and the framework's internal architecture.

## Architecture

- [Request Lifecycle](./request-lifecycle.md) — how a request flows from `public/index.php` through the framework to a response.
- [Architecture: The Kernel](./architecture-the-kernel.md) — the execution core that loads PHP files and dispatches controllers, including scalar type coercion for route parameters.

## HTTP

- [Routing](./routing.md) — defining routes, route groups, and middleware (all in one place).
- [Controllers](./controllers.md) — controller classes, `boot()` / `teardown()` hooks, and typed parameter binding.
- [Requests & Responses](./requests-and-responses.md) — reading input, headers, and URLs; sending JSON, redirects, security headers, and CORS.
- [HTTP Client](./http-client.md) — making outgoing HTTP requests with a fluent, chainable API.

## Data & State

- [Validation](./validation.md) — fluent input validation with translatable error messages.
- [Upload](./upload.md) — secure file uploads with safe defaults and category-based factories.
- [Sessions](./sessions.md) — session handling, flash messages, validation errors, and old input.

## Security

- [Hashing](./hashing.md) — passwords, HMACs, checksums, tokens, and UUIDs.
- [JSON Web Tokens (JWT)](./json-web-tokens-jwt.md) — issuing and verifying signed tokens for stateless authentication.

## Framework Services

- [Events](./events.md) — a simple publish/subscribe system, including the built-in `error` event.
- [Error Handling & Debugging](./error-handling-debugging.md) — unified handling of errors, exceptions, and fatal shutdowns, with custom renderers and JSON mode.
- [File & Directory](./file-directory.md) — filesystem I/O and registry-based directory management.
- [Localization](./localization.md) — file-based translations, default locales, and `App::setLocale()` / `lang()`.

## Reference

- [Helper Functions Reference](./helper-functions-reference.md) — all global helpers (`url()`, `route()`, `redirect()`, `input()`, `respond()`, path helpers, `env()`, `lang()`, `vite_assets()`, and more).
