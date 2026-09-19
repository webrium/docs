# Task Scheduling

Five CLI commands drive Webrium's task scheduler:

- **`make:schedule`** — scaffold a new task file in `app/Schedules`
- **`schedule:run`** — run every task that is due right now, then exit (what a real cron entry calls)
- **`schedule:list`** — list every registered task with its next due time
- **`schedule:test`** — run a single task immediately, ignoring its schedule
- **`schedule:work`** — run the scheduler in the foreground for local development, without a system cron entry

Defining tasks themselves — `Schedule::call()`, the frequency methods, naming, file discovery — is documented in *Core → Task Scheduling*. This page focuses on the CLI surface and deployment.

## `make:schedule`

```bash
php webrium make:schedule <name> [--force]
```

Creates `app/Schedules/<name>.php` from a template. Creates the `app/Schedules` directory first if it doesn't exist yet — useful when upgrading a project created before the scheduler existed.

### Examples

```bash
# Create app/Schedules/SendReports.php
php webrium make:schedule SendReports

# Overwrite an existing file
php webrium make:schedule SendReports --force
```

## `schedule:run`

```bash
php webrium schedule:run
```

Loads every task file under `app/Schedules` and runs whichever tasks are due at this exact moment, then exits. This is the command a real system cron entry should call, once a minute:

```cron
* * * * * cd /path/to/your/project && php webrium schedule:run >> /dev/null 2>&1
```

Webrium itself decides which tasks are actually due each time this fires — you never need a separate crontab line per task.

### Output & Exit Code

Each due task prints one line reporting whether it ran, was skipped (its lock was already held), or failed:

```
✔ reports.daily
⚠ cleanup.temp skipped (already running)
✘ newsletter.weekly failed: Connection timed out
```

A load error (a broken task file) is reported the same way, before the task list:

```
✘ Failed to load /path/to/app/Schedules/Broken.php: syntax error, unexpected...
```

**Nothing here stops the batch.** A broken file doesn't prevent other files from loading, and a failed task doesn't prevent other due tasks from running — see *Core → Task Scheduling → Running Tasks* for why. The command's **exit code** does reflect whether anything went wrong (`0` if every load and every due task succeeded, `1` otherwise), so cron's own failure notifications (mail-on-error, monitoring) still work — this is checked only after everything that was going to run has run.

## `schedule:list`

```bash
php webrium schedule:list
```

Lists every registered task with its cron expression and next due time — read-only, runs nothing:

```
+---------------+-------------+------------------+
| Task          | Expression  | Next Due         |
+---------------+-------------+------------------+
| cleanup.temp  | */5 * * * * | 2026-09-19 12:05 |
| reports.daily | 0 1 * * *   | 2026-09-20 01:00 |
+---------------+-------------+------------------+
```

Useful for confirming a new task registered correctly, and for sanity-checking *when* it will actually next fire before you go looking for it in a log.

## `schedule:test`

```bash
php webrium schedule:test [<name>]
```

Runs one task immediately, regardless of its schedule — for verifying a task works without waiting for (or temporarily changing) its due time. Still goes through the same overlap lock and error isolation as `schedule:run`.

### Argument

| Argument | Description |
| --- | --- |
| `name` | Optional. The task's name (see *Core → Task Scheduling → Naming Tasks*, and `schedule:list` to see what's registered). Prompts you to choose one from a list if omitted |

### Examples

```bash
# Run a specific task by name
php webrium schedule:test reports.daily

# No name given — pick one interactively
php webrium schedule:test
```

```
Which scheduled task would you like to run?:
  [0] cleanup.temp
  [1] reports.daily
 > 1
Running 'reports.daily'...
✔ reports.daily
```

## `schedule:work`

```bash
php webrium schedule:work
```

Runs the scheduler in the foreground: wakes up at the start of every minute, reloads `app/Schedules` from scratch, and runs whatever is due — the same load/run isolation as `schedule:run`, just looped, so you don't need a real cron entry configured on your development machine.

Stop it with `Ctrl+C` (or `SIGTERM`). Where the `pcntl` PHP extension is available, this is graceful — the current tick finishes before the process exits and prints `Schedule worker stopped.`; without `pcntl` the process simply ends immediately, like any other command would.

> **Not a production substitute for real cron.** `schedule:work` is one long-lived process: if it crashes or the server reboots, nothing restarts it on its own, unlike a cron entry (which the OS re-evaluates independently every minute regardless of what happened the minute before). Use `schedule:run` behind real cron in production; reach for `schedule:work` for local development only.

## A Typical Workflow

Local development — no crontab needed:

```bash
php webrium make:schedule SendReports
# ... write the task, using Schedule::call() as documented in Core → Task Scheduling ...
php webrium schedule:list             # confirm it registered, check next due time
php webrium schedule:test reports.daily  # run it once, right now, to verify it works
php webrium schedule:work             # leave it running while you iterate
```

Production — one cron entry, forever:

```cron
* * * * * cd /var/www/your-app && php webrium schedule:run >> /dev/null 2>&1
```

New tasks added later don't need a new crontab line — `schedule:run` already picks up anything registered under `app/Schedules` on its next run.
