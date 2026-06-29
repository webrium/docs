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
    "meta": {}
}
```

The fields:

- **`name`**, **`version`**, **`description`**, **`author`** — plugin metadata, shown by `plugin:list` and `plugin:info`.
- **`require`** — minimum versions of Webrium (and other plugins) the plugin depends on.
- **`export`** — the files in your project to bundle. Each entry has a source `file` path (relative to project root), a `dest` directory alias (where it goes on install), an optional `subpath` for nesting, and an `overwrite` flag.
- **`sql`** — SQL files to execute on install (typically migrations or seed data that should run as part of installation).
- **`hooks`** — arrays of script paths or shell commands to run before/after installation.
- **`meta`** — free-form metadata you can attach.

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

## Where Things Are Stored

- **Plugin registry & metadata.** Tracked in the project's `storage/app/plugins/` directory. `plugin:list` reads this.
- **Plugin definitions** (when you're authoring a plugin). `storage/app/plugins/definitions/<name>.json`.
- **Exported zips.** Written to `storage/app/plugins/exports/` by default.
- **Backups.** Created in `storage/app/plugins/backups/` before destructive operations, unless `--no-backup` is passed.

For the full plugin specification — every key in the definition file, the lifecycle hook API, restrictions on file paths, and dependency resolution — see the **[Plugin System Wiki](https://github.com/webrium/console/wiki/webrium-plugin-system)**.
