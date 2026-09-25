# Plugins

Webrium Console includes a full plugin system for distributing reusable components — admin panels, auth boilerplate, vendor integrations, anything you want to package and install across multiple projects. A plugin is a `.zip` file containing files to copy into a project, optional SQL to run, and lifecycle hooks. Installation is one command.

This page covers the CLI workflow for installing, updating, removing, listing, and creating plugins. For the underlying file format and the full lifecycle hook reference, see the **[Plugin System Wiki](https://github.com/webrium/console/wiki/webrium-plugin-system)**.

| Command | Purpose |
| --- | --- |
| `plugin:install` | Install a plugin from a local zip or URL |
| `plugin:update` | Update an installed plugin |
| `plugin:remove` | Uninstall a plugin |
| `plugin:list` | List installed plugins |
| `plugin:info` | Preview a plugin's metadata without installing |
| `plugin:new` | Create a new plugin definition file in your project |
| `plugin:export` | Package a plugin definition into a distributable zip |
| `plugin:config:compile` | Merge the installed registry with project overrides |

## Installing Plugins

### `plugin:install`

```bash
php webrium plugin:install <source> [--force] [--dry-run] [--no-backup]
```

| Option | Description |
| --- | --- |
| `--force`, `-f` | Overwrite existing files without prompting |
| `--dry-run` | Show what would be installed without changing anything |
| `--no-backup` | Skip creating a backup snapshot before installing |

The `source` is either a local `.zip` file path or an `https://` URL:

```bash
# From a local file
php webrium plugin:install ./my-plugin.zip

# From a direct URL
php webrium plugin:install https://example.com/releases/my-plugin.zip

# From a GitHub release
php webrium plugin:install https://github.com/user/repo/releases/download/v1.0.0/plugin.zip
```

Before applying changes, the installer creates a backup snapshot of any files it's about to overwrite — so if something goes wrong, you can restore the previous state. `--no-backup` skips this step (faster, but no safety net).

`--dry-run` is invaluable for inspecting an unfamiliar plugin: it walks through the whole install flow, prints what would happen, but doesn't write anything to disk.

### `plugin:info`

```bash
php webrium plugin:info <source>
```

Reads a plugin's metadata — name, version, author, description, list of files it will install, SQL it will run, hooks it defines — without touching the project. Useful as a sanity check before `plugin:install`.

```bash
php webrium plugin:info ./my-plugin.zip
php webrium plugin:info https://example.com/plugin.zip
```

## Post-Install Messages

The installer can only copy new files into a project — it can't run arbitrary shell commands or edit files the project already has (an `npm install`, wiring a new Vite entry into an existing `vite.config.js`, adding a route to an existing route file). When a plugin needs any of that finished manually, it can tell the user so right after installing, via one of two optional manifest fields:

- **`post_install_message`** — a literal string, shown verbatim.
- **`post_install_message_file`** — a `src` value that must match one of the plugin's own `files` entries. Its *installed* content (read fresh off disk, after copying) is shown instead of the literal message. Set both, and the file wins.

```json
{
    "post_install_message": null,
    "post_install_message_file": "docs/NEXT-STEPS.md"
}
```

A plugin that ships a whole markdown file this way (installed to the project root, or wherever makes sense) gets a second benefit for free: since the file is a real, ordinary project file, an AI coding assistant working in that project can read it and carry out the remaining steps itself — something a fixed set of install hooks can't do.

Neither field is required. If both are absent, `plugin:install` just prints its normal one-line success message, exactly as before this feature existed.

## Managing Installed Plugins

### `plugin:list`

```bash
php webrium plugin:list
```

Prints a table of every installed plugin with its name, version, install date, and the source it was installed from. Read-only.

### `plugin:update`

```bash
php webrium plugin:update <source> [--force] [--no-backup]
```

Updates an installed plugin to a newer version. The `source` is a new zip or URL — same format as `plugin:install`. The plugin name (from the new zip's metadata) must match an already-installed plugin, otherwise the command refuses to proceed.

```bash
php webrium plugin:update ./my-plugin-1.1.0.zip
php webrium plugin:update https://example.com/releases/my-plugin-1.1.0.zip
```

Like `plugin:install`, a backup is created by default; pass `--no-backup` to skip it.

On a successful update, package-owned fields (`name`, `version`, `description`,
`author`, `hash`, `files`, and `meta`) are refreshed from the new package.
Project/runtime fields (`status`, `active`, and `installed_at`) and unknown
extension fields are preserved. The plugin also keeps its existing position in
the registry.

### `plugin:remove`

```bash
php webrium plugin:remove <name> [--no-backup] [--keep-files]
```

| Option | Description |
| --- | --- |
| `--no-backup` | Don't snapshot files before removing |
| `--keep-files` | Unregister the plugin but leave its files in place |

```bash
php webrium plugin:remove my-plugin
```

By default, `plugin:remove` deletes the files the plugin installed and removes the plugin from the registry. `--keep-files` is the "soft uninstall" — useful when you want to detach the plugin from the management system but don't want to lose customisations you've made on top of its files.

---

## Creating Your Own Plugin

Two commands round out the workflow on the **producer** side — when you're building a plugin that you'll distribute to other Webrium projects.

### `plugin:new`

```bash
php webrium plugin:new <name> [--force]
```

Creates a new plugin definition file at `storage/app/plugins/definitions/<name>.json`. The name must be lowercase letters, numbers, hyphens, and underscores only:

```bash
php webrium plugin:new admin-panel
# Creates storage/app/plugins/definitions/admin-panel.json
```

The generated template:

```json
{
    "name": "admin-panel",
    "version": "1.0.0",
    "description": "",
    "author": "",
    "require": {
        "webrium": ">=1.0.0"
    },
    "export": [
        {
            "file": "app/Controllers/ExampleController.php",
            "dest": "controllers",
            "subpath": null,
            "overwrite": false
        }
    ],
    "sql": [],
    "hooks": {
        "before_install": [],
        "after_install": []
    },
    "meta": {},
    "post_install_message": null,
    "post_install_message_file": null
}
```

The fields:

- **`name`**, **`version`**, **`description`**, **`author`** — plugin metadata, shown by `plugin:list` and `plugin:info`.
- **`require`** — minimum versions of Webrium (and other plugins) the plugin depends on.
- **`export`** — the files in your project to bundle. Each entry has a source `file` path (relative to project root), a `dest` directory alias (where it goes on install), an optional `subpath` for nesting, and an `overwrite` flag.
- **`sql`** — SQL files to execute on install (typically migrations or seed data that should run as part of installation).
- **`hooks`** — arrays of script paths or shell commands to run before/after installation.
- **`meta`** — free-form metadata you can attach.
- **`post_install_message`** / **`post_install_message_file`** — shown to the user right after a successful `plugin:install` (see [Post-Install Messages](#post-install-messages) below).

Edit the file by hand to add the files, SQL, and hooks your plugin needs, then export it.

### `plugin:export`

```bash
php webrium plugin:export <name> <version> [--dry-run] [--force]
```

Packages the project's files into a distributable zip according to the definition file. The version is set on the resulting package (and written back into the definition file's metadata).

```bash
# Build a 1.2.0 release
php webrium plugin:export admin-panel 1.2.0

# Preview the package without writing the zip
php webrium plugin:export admin-panel 1.2.0 --dry-run

# Allow overwriting an existing zip for the same version
php webrium plugin:export admin-panel 1.2.0 --force
```

The resulting zip is what other projects pass to `plugin:install` or `plugin:update`. Distribute it the same way you'd distribute any release artefact — attach it to a GitHub release, upload it to a CDN, or share it directly.

---

## Configuring Plugin Paths

All plugin-system paths have conventional defaults and can be configured
independently in `.webrium.conf.json` at the project root:

```json
{
    "console": {
        "plugins": {
            "registry": "storage/app/plugins/plugins.json",
            "overrides": "storage/app/plugins/plugins.overrides.json",
            "compiled": "storage/framework/cache/plugins.compiled.json",
            "definitions": "storage/app/plugins/definitions",
            "dist": "storage/app/plugins/dist",
            "backups": "storage/app/plugins/backups"
        }
    }
}
```

Each key is optional; omitted keys retain their default. This allows a project
to keep its installed registry and overrides in the project repository while
placing definitions and exported packages in a separate authoring repository.

All configured paths must:

- Be relative to the project root.
- Stay inside the project root and contain no `..` traversal segments.
- Resolve to distinct locations.
- Use file paths for `registry`, `overrides`, and `compiled`.
- Use directory paths for `definitions`, `dist`, and `backups`.

`console.authoring_root` and the `--authoring-root` command option are not
supported. Configure `definitions` and `dist` explicitly.

## Project Overrides and Compiled Configuration

`plugins.json` is the base installed registry managed by `plugin:install`,
`plugin:update`, and `plugin:remove`. Projects can add an optional,
project-owned `plugins.overrides.json` without editing that base registry:

```json
{
    "plugins": {
        "example-plugin": {
            "status": "disabled",
            "meta": {
                "project_options": {
                    "compact_mode": true
                }
            }
        }
    }
}
```

Override entries are keyed by an installed plugin name. JSON objects merge
recursively. Numeric arrays and all scalar values replace the base value in
full; arrays are never merged by index.

The following package-owned fields cannot be overridden:

- `name`
- `version`
- `description`
- `author`
- `installed_at`
- `updated_at`
- `hash`
- `files`

An unknown plugin name, malformed JSON, an unknown overrides root key, or an
attempt to replace a protected field causes compilation to fail. The last valid
compiled file is left untouched.

### `plugin:config:compile`

```bash
php webrium plugin:config:compile [--dry-run]
```

The command validates the registry and optional overrides, merges them, and
writes the configured compiled file atomically. Use `--dry-run` to validate and
show the resolved paths without writing output:

```bash
php webrium plugin:config:compile --dry-run
php webrium plugin:config:compile
```

Installing, updating, or removing a plugin invalidates an existing compiled
file because the base registry changed. Compile again before a runtime consumer
uses the effective registry.

The compiled file is derived cache data. Console creates it but does not
automatically change application code to read it. Applications that need
override-aware behavior must explicitly consume the configured compiled file
and define an appropriate fallback when it is absent.

---

## Where Things Are Stored

- **Base registry.** `storage/app/plugins/plugins.json` by default. Lifecycle and read-only management commands use this file.
- **Project overrides.** `storage/app/plugins/plugins.overrides.json` by default. Optional and never overwritten by plugin lifecycle commands.
- **Compiled registry.** `storage/framework/cache/plugins.compiled.json` by default. Derived cache; normally ignored by version control.
- **Plugin definitions.** `storage/app/plugins/definitions/<name>.json` by default.
- **Exported zips.** Written to `storage/app/plugins/dist/` by default.
- **Backups.** Created in `storage/app/plugins/backups/` before destructive operations, unless `--no-backup` is passed.

Whether the registry and overrides are committed is a project policy. Backups
and compiled output should normally remain untracked.

For the full plugin specification — every key in the definition file, the lifecycle hook API, restrictions on file paths, and dependency resolution — see the **[Plugin System Wiki](https://github.com/webrium/console/wiki/webrium-plugin-system)**.
