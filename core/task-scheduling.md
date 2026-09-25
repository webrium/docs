# Task Scheduling

Webrium's scheduler lets you define recurring tasks in code — "send this report every day at 1am", "clean up temp files every five minutes" — instead of hand-editing crontab entries for each one. Only a single cron entry is needed on the server; Webrium itself decides, each time that entry fires, which of your tasks are actually due.

- [Defining Tasks](#defining-tasks)
- [Frequency Options](#frequency-options)
- [Naming Tasks](#naming-tasks)
- [Task Files & Discovery](#task-files--discovery)
- [Running Tasks](#running-tasks)

---

## Defining Tasks

Tasks are registered with the static `Schedule` class. You can register them anywhere — but see [Task Files & Discovery](#task-files--discovery) for where they conventionally live in the full framework.

```php
use Webrium\Schedule;

Schedule::call(function () {
    // send the daily report
})->dailyAt('01:00');
```

`Schedule::call()` accepts anything callable:

```php
// Closure
Schedule::call(function () {
    Report::generate();
})->dailyAt('01:00');

// Array syntax — [object or class name, method]
Schedule::call([ReportService::class, 'generateDaily'])->dailyAt('01:00');

// 'Class@method' string — the class name must be fully qualified
Schedule::call('App\Services\ReportService@generateDaily')->dailyAt('01:00');

// A global function name
Schedule::call('send_daily_report')->dailyAt('01:00');
```

Unlike route handlers, the `'Class@method'` string form here is **not** prefixed with any namespace — give the fully-qualified class name, since scheduled tasks are just as likely to call a service or a model as a controller.

Both the array form and the `'Class@method'` string form work whether `method` is static or not — the class is instantiated for you with `new ClassName()` either way. There is no dependency container behind this, though, so it only works for a class with a **no-argument constructor**. If your service needs dependencies, construct it yourself and register the instance directly instead:

```php
$reportService = new ReportService($mailer, $renderer);
Schedule::call([$reportService, 'generateDaily'])->dailyAt('01:00');
```

A class-name callback that needs constructor arguments fails fast with a clear `RuntimeException` pointing at this workaround, rather than a raw `ArgumentCountError`.

## Frequency Options

`Schedule::call()` returns a `ScheduleEvent`, which exposes a fluent interval API:

| Method | Runs |
| --- | --- |
| `->everyMinute()` | Every minute |
| `->everyFiveMinutes()` | Every 5 minutes |
| `->everyTenMinutes()` | Every 10 minutes |
| `->everyFifteenMinutes()` | Every 15 minutes |
| `->everyThirtyMinutes()` | At :00 and :30 past the hour |
| `->hourly()` | At the top of every hour |
| `->hourlyAt(int $minute)` | At `$minute` past every hour |
| `->daily()` | At midnight every day |
| `->dailyAt(string $time)` | At `$time` (`'HH:MM'` or just `'HH'`) every day |
| `->weekly()` | Midnight every Sunday |
| `->weeklyOn(int $dayOfWeek, string $time = '00:00')` | `$time` on the given day (`0` = Sunday … `6` = Saturday) |
| `->monthly()` | Midnight on the 1st of every month |

For anything the fluent methods don't cover, pass a raw 5-field cron expression directly:

```php
Schedule::call($callback)->cron('*/15 9-17 * * 1-5'); // every 15 minutes, 9am-5pm, weekdays
```

The supported syntax per field (`minute hour day-of-month month day-of-week`, same order as standard cron) is `*`, `*/n` (step), `a-b` (range), `a-b/n` (stepped range), and `a,b,c` (list), in any combination. Day-of-week accepts both `0` and `7` for Sunday.

**Day-of-month and day-of-week combine with OR when both are restricted** — matching standard cron. If you restrict only one of them (leave the other as `*`), it behaves as you'd expect on its own. But restrict *both* at once and the task is due when *either* matches, not only when both do:

```php
// Standard cron semantics: 9am on the 1st of the month, OR every Monday —
// not only on the rare day that happens to be both at once.
Schedule::call($callback)->cron('0 9 1 * 1');
```

## Naming Tasks

Give a task an explicit name with `->name()`:

```php
Schedule::call($callback)->name('reports.daily')->dailyAt('01:00');
```

The name is used to:

- **Prevent overlapping runs.** Each task gets its own lock, keyed by name (see [Running Tasks](#running-tasks)).
- **Identify it in reports and tooling** — `webrium schedule:list` and `webrium schedule:test <name>` (see *Console → Task Scheduling*) both work by name.

If you don't call `->name()`, one is inferred: the class/method or string callback is used verbatim (e.g. `App\Services\ReportService::generateDaily`), and a closure falls back to its file path and line number. The inferred name for a `'Class@method'` string or array callback is stable across runs (same class and method every time), so overlap prevention works correctly even without an explicit name — but a closure's inferred name, while also stable per file/line, is far less readable in a report. Naming closures explicitly is recommended.

## Task Files & Discovery

In the full framework, tasks live in `app/Schedules/` — one task (or a few related ones) per file:

```php
// app/Schedules/SendReports.php
use Webrium\Schedule;

Schedule::call('App\Services\ReportService@generateDaily')
    ->name('reports.daily')
    ->dailyAt('01:00');
```

`Schedule::loadDefault()` requires every `*.php` file under this directory **recursively** and returns any load errors instead of throwing:

```php
$errors = Schedule::loadDefault();
// [['file' => '/path/to/BrokenFile.php', 'error' => 'Parse error: ...'], ...]
```

A file that fails to load (a syntax error, an exception thrown while registering) is reported but never prevents the other files from loading — each file is required in its own `try`/`catch`.

**Why recursive, and why per-file at all — not one shared file?** A plugin that wants to add a scheduled task of its own can drop a file straight into a subdirectory (e.g. `app/Schedules/my-plugin/SendWelcomeEmail.php`) without touching anyone else's file or a shared central registry, and without any risk of a filename collision with another plugin. `webrium/console`'s plugin installer can place a file there like any other plugin file — no scheduler-specific installation step is needed.

To load from a different directory, call `Schedule::loadFromDirectory($path)` directly with an absolute path.

## Running Tasks

`Schedule::runDue()` runs every registered task that is due right now:

```php
$report = Schedule::runDue();
// [['name' => 'reports.daily', 'status' => 'ran', 'error' => null], ...]
```

Each entry's `status` is one of:

| Status | Meaning |
| --- | --- |
| `ran` | The task executed successfully |
| `skipped` | The task's lock was already held — see below |
| `failed` | The task threw; `error` holds the exception message |

**A failing task never stops the others.** Each task runs inside its own `try`/`catch`; a thrown exception is caught, reported via `Debug::triggerError()` (so it lands in the normal log alongside every other framework error), and recorded in the report with `status => 'failed'` — `runDue()` moves on to the next due task regardless.

**Overlap prevention.** Before running, each task acquires a file-based lock (via `flock()`) keyed by its name. If the same task is already running — e.g. a slow task is still going when the next scheduler tick fires — the second attempt is skipped rather than run concurrently. This lock is **single-server only**: two separate application servers with separate filesystems will each acquire their own lock independently and could still run the same task concurrently across servers. There is currently no built-in cross-server coordination (no shared-cache-backed lock, unlike `->onOneServer()` in some other frameworks' schedulers) — if you run a horizontally-scaled deployment, either designate one server to run the scheduler, or make your tasks themselves safe to run more than once concurrently.

Two more entry points support on-demand tooling (used by `webrium/console`'s `schedule:list` and `schedule:test` — see *Console → Task Scheduling*):

```php
use Webrium\Schedule;

Schedule::find('reports.daily');       // the registered ScheduleEvent, or null
Schedule::run($event);                 // run one task immediately, ignoring whether it's due —
                                        // still goes through the same lock and error isolation
```

And on `ScheduleEvent` itself:

```php
$event->isDue($someDateTime);          // bool
$event->nextRunDate($someDateTime);    // the next DateTimeImmutable it's due at or after
                                        // $someDateTime (defaults to now); null if none found
                                        // within a ~2 year lookahead
```

For how tasks actually get invoked on a schedule in production (the cron entry, `schedule:run`, `schedule:work` for local development, `schedule:list`/`schedule:test` for inspecting and debugging), see *Console → Task Scheduling*.
