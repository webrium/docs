# Diagnostics

Two commands help you reach into a running project without going through the HTTP layer:

| Command | Purpose |
| --- | --- |
| `call` | Invoke a method on a controller, model, or arbitrary class from the terminal |
| `log` | List, view, and clear log files from the storage directory |

These are debugging and operations tools — not the path you'd take from regular application code, but invaluable for one-off scripts, scheduled tasks, and post-mortem inspection.

## `call`

```bash
php webrium call <Class@Method> [--params=<JSON>] [--model] [--namespace=<Namespace>]
```

Calls a public method on a class directly, prints the return value, and exits. The class is instantiated with no constructor arguments, so it must either have no required constructor parameters or be designed to handle that.

### Arguments and options

| Argument / Option | Description |
| --- | --- |
| `Class@Method` | Class and method, separated by `@` (e.g. `UserController@index`) |
| `--params`, `-p` | JSON array of arguments passed to the method. Default: `[]` |
| `--model`, `-m` | Resolve the class as a model (default namespace `App\Models`) instead of a controller |
| `--namespace` | Custom namespace. Overrides the default for either mode |

### Examples

```bash
# Call a controller action
php webrium call UserController@index

# Pass arguments via JSON
php webrium call UserController@find --params='[42]'

# Call a model method (different default namespace)
php webrium call User@active --model

# Use a custom namespace (e.g. a service class)
php webrium call Report@generate \
    --params='["2024-01", true]' \
    --namespace="App\\Services"
```

### When to use it

- **Cron / scheduled jobs.** Wire a method into a system cron job: `php /path/to/project/webrium call NewsletterJob@dispatch --namespace="App\\Jobs"`.
- **One-off maintenance.** Run a cleanup, recompute aggregates, or import a CSV without writing a dedicated CLI command.
- **Debugging.** Reproduce an issue from the terminal where you can drop in `var_dump()` or attach a debugger, without round-tripping through HTTP.

### What it does not do

- **Doesn't bind route parameters.** `--params` is a flat JSON array passed positionally. It does not parse the route, resolve `int $id` from a URL, or perform any of the type-coercion that `Kernel::executeControllerMethod()` does during a real request.
- **Doesn't run middleware.** Controller methods invoked through `call` skip the route's middleware chain. If the method assumes the user is authenticated, you need to set that state up yourself (or refactor the method to take its dependencies as arguments).
- **Doesn't call `boot()` / `teardown()`.** The lifecycle hooks that fire during a real request are not invoked. If you rely on them, call them explicitly in your method.

For workflows that go beyond what `call` provides, write a dedicated CLI command — see *Introduction* for the Symfony Console base classes.

---

## `log`

```bash
php webrium log <action> [<name>]
```

Manages log files in the configured logs directory. By default — when `Debug` logging is enabled — Webrium writes one log file per day, named with the date.

### Actions

| Action | Effect |
| --- | --- |
| `list` | List all log files in the logs directory, most recent first |
| `latest` | Display the most recent log file's contents |
| `file <name>` | Display a specific log file by name |
| `clear` | Delete every log file in the directory |

### Examples

```bash
# What log files do we have?
php webrium log list

# Show today's (or the most recent) log file
php webrium log latest

# Show a specific file
php webrium log file 2024-01-15.log

# Wipe the logs (intentional — there is no undo)
php webrium log clear
```

### Notes

- The directory inspected is the one registered as `logs` via `Directory::initDefaultStructure()` — typically `storage/logs/`. Configure it with `Debug::setLogPath()` if you've moved it.
- `log clear` is destructive. There's no `--force` requirement and no confirmation prompt — the assumption is that you ran this command because you meant to.
- For piping into other tools, `log file` writes plain text to standard output: `php webrium log file 2024-01-15.log | grep ERROR`.

For more on how Webrium handles errors and writes log entries, see *Core → Error Handling*.
