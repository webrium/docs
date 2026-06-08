# Webrium Plugin System

The Webrium plugin system allows you to package and distribute reusable components — controllers, models, views, assets, and more — as installable `.zip` archives. Plugins are managed entirely through the Webrium Console.

---

## Table of Contents

- [How It Works](#how-it-works)
- [Plugin Structure](#plugin-structure)
- [plugin.json Reference](#pluginjson-reference)
  - [Required Fields](#required-fields)
  - [File Entries](#file-entries)
  - [Destination Keys](#destination-keys)
  - [Hooks](#hooks)
- [Exporting a Plugin](#exporting-a-plugin)
  - [Definition File Reference](#definition-file-reference)
- [Installing a Plugin](#installing-a-plugin)
- [Commands](#commands)
  - [plugin:new](#pluginnew)
  - [plugin:export](#pluginexport)
  - [plugin:install](#plugininstall)
  - [plugin:update](#pluginupdate)
  - [plugin:remove](#pluginremove)
  - [plugin:list](#pluginlist)
  - [plugin:info](#plugininfo)
- [Security](#security)
- [Registry](#registry)
- [Backups](#backups)

---

## How It Works

A plugin is a `.zip` file containing a `plugin.json` manifest and a `src/` directory with the files to be installed. When you run `plugin:install`, the installer reads the manifest, validates all paths, runs any defined hooks, copies the files to their designated locations inside your Webrium project, and records the installation in a local registry.

To create a plugin from an existing Webrium project, you use `plugin:new` to create a definition file, then `plugin:export` to build the zip automatically.

---

## Plugin Structure

Every plugin zip must follow this layout:

```
my-plugin.zip
├── plugin.json
└── src/
    ├── FileManagerController.php
    ├── FileModel.php
    ├── file-manager.html
    └── file-manager.css
```

**Rules:**
- `plugin.json` must be in the **root** of the zip (not inside a subdirectory).
- All installable files must be inside the `src/` directory, flat (no subdirectories).
- The manifest maps each file to its destination individually via `dest` and `subpath`.

---

## plugin.json Reference

### Required Fields

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "A brief description of what this plugin does",
  "author": "Your Name",
  "require": {
    "webrium": ">=1.0.0"
  },
  "files": [],
  "hooks": {
    "before_install": [],
    "after_install": []
  }
}
```

| Field         | Required | Description                                                      |
|---------------|----------|------------------------------------------------------------------|
| `name`        | Yes      | Unique plugin identifier. Lowercase letters, numbers, `-`, `_` only. |
| `version`     | Yes      | Semantic version string (e.g. `1.0.0`, `2.1.4`).               |
| `description` | No       | Short human-readable description.                                |
| `author`      | No       | Author name or contact.                                          |
| `require`     | No       | Minimum framework version requirements.                          |
| `files`       | Yes      | Array of file entries defining what gets installed and where.    |
| `hooks`       | No       | Console commands to run before or after installation.            |

---

### File Entries

Each object in the `files` array describes one file to install:

```json
{
  "src": "FileManagerController.php",
  "dest": "controllers",
  "subpath": "Plugins",
  "overwrite": false
}
```

| Field       | Required | Description                                                                                 |
|-------------|----------|---------------------------------------------------------------------------------------------|
| `src`       | Yes      | Filename of the file inside `src/` in the zip archive.                                      |
| `dest`      | Yes      | Destination directory key (see [Destination Keys](#destination-keys)).                       |
| `subpath`   | No       | Optional subdirectory to create inside the destination. `null` to install directly.          |
| `overwrite` | No       | Whether to overwrite if the file already exists. Defaults to `false`.                        |

**Example result:** with `dest: "controllers"` and `subpath: "Plugins"`, the file will be installed at:
```
app/Controllers/Plugins/FileManagerController.php
```

---

### Destination Keys

The `dest` field must be one of the following keys, which map to the standard Webrium directory structure:

| Key              | Resolves To                            |
|------------------|----------------------------------------|
| `app`            | `app/`                                 |
| `controllers`    | `app/Controllers/`                     |
| `models`         | `app/Models/`                          |
| `views`          | `app/Views/`                           |
| `routes`         | `app/Routes/`                          |
| `config`         | `app/Config/`                          |
| `middleware`     | `app/Middleware/`                      |
| `helpers`        | `app/Helpers/`                         |
| `services`       | `app/Services/`                        |
| `storage`        | `storage/`                             |
| `storage_app`    | `storage/App/`                         |
| `sessions`       | `storage/Framework/Sessions/`          |
| `cache`          | `storage/Framework/Cache/`             |
| `logs`           | `storage/Logs/`                        |
| `langs`          | `storage/Langs/`                       |
| `public`         | `public/`                              |
| `assets`         | `public/assets/`                       |
| `uploads`        | `public/uploads/`                      |

Using an unrecognized key will cause the installation to fail with a clear error message.

---

### Hooks

Hooks let you run Webrium Console commands automatically at two points in the installation lifecycle.

```json
"hooks": {
  "before_install": [
    "make:model File --table=files"
  ],
  "after_install": [
    "make:controller FileManager",
    "make:route Files"
  ]
}
```

Each hook entry is a console command string — exactly what you would type after `php webrium`. The installer runs them internally through the Symfony Console Application, not through the system shell.

**Allowed hook commands:**

| Command           | Description                        |
|-------------------|------------------------------------|
| `make:model`      | Generate a model file              |
| `make:controller` | Generate a controller file         |
| `make:route`      | Generate a route file              |
| `init`            | Initialize the project structure   |

Any command outside this list will cause the installation to abort immediately. This is intentional — hooks cannot run arbitrary shell commands, access the filesystem directly, or execute system utilities.

**Execution order:**

```
before_install hooks
       ↓
   file copy
       ↓
after_install hooks
```

If any hook command fails, the installation stops and reports the error.

---

## Exporting a Plugin

The export workflow lets you take files from an existing Webrium project and package them into an installable plugin zip automatically.

### Step 1 — Create a definition file

```bash
php webrium plugin:new my-plugin
```

This creates a definition file at:
```
storage/App/plugins/definitions/my-plugin.json
```

### Step 2 — Edit the definition file

Open the generated file and fill in the `export` array. Each entry points to a file in your project and declares where it should be installed on the target project:

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "My reusable plugin",
  "author": "Your Name",
  "require": {
    "webrium": ">=1.0.0"
  },
  "export": [
    {
      "file": "app/Controllers/FileManagerController.php",
      "dest": "controllers",
      "subpath": "Plugins",
      "overwrite": false
    },
    {
      "file": "app/Models/FileModel.php",
      "dest": "models",
      "subpath": null,
      "overwrite": false
    },
    {
      "file": "app/Views/file-manager.html",
      "dest": "views",
      "subpath": "plugins",
      "overwrite": true
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

### Step 3 — Export the zip

```bash
php webrium plugin:export my-plugin 1.0.0
```

The zip will be created at:
```
storage/App/plugins/dist/my-plugin-v1.0.0.zip
```

The version in the definition file is also updated automatically to match.

### Step 4 — Preview before exporting (optional)

```bash
php webrium plugin:export my-plugin 1.0.0 --dry-run
```

This validates all files exist and shows the output path without writing anything.

---

### Definition File Reference

The definition file (used for export) is separate from `plugin.json` (used for installation). The key difference is the `export` array, which references files by their path in **your project**:

| Field       | Required | Description                                                                 |
|-------------|----------|-----------------------------------------------------------------------------|
| `name`      | Yes      | Plugin name. Must be lowercase, numbers, hyphens, underscores only.         |
| `version`   | Yes      | Starting version. Updated automatically after each export.                  |
| `export`    | Yes      | Array of file entries to include in the plugin.                             |
| `sql`       | No       | List of SQL files (relative to project root) to include and run on install. |
| `hooks`     | No       | Console commands to run before/after installation on the target project.    |
| `meta`      | No       | Arbitrary metadata for your own use.                                        |

**Export entry fields:**

| Field       | Required | Description                                                                 |
|-------------|----------|-----------------------------------------------------------------------------|
| `file`      | Yes      | Path to the file relative to the project root (e.g. `app/Controllers/Foo.php`). |
| `dest`      | Yes      | Destination key on the target project (see [Destination Keys](#destination-keys)). |
| `subpath`   | No       | Subdirectory inside the destination. `null` to install directly.            |
| `overwrite` | No       | Whether to overwrite on the target if the file exists. Defaults to `false`. |

---

## Installing a Plugin

```bash
php webrium plugin:install ./my-plugin-v1.0.0.zip
```

See [plugin:install](#plugininstall) for all options.

---

## Commands

### plugin:new

Create a new plugin definition file to use with `plugin:export`.

```bash
php webrium plugin:new <name> [options]
```

| Argument/Option | Description                                      |
|-----------------|--------------------------------------------------|
| `name`          | Plugin name (lowercase, numbers, hyphens, underscores). |
| `--force, -f`   | Overwrite if a definition with this name already exists. |

The definition file is created at `storage/App/plugins/definitions/<name>.json`.

---

### plugin:export

Build a plugin zip from a definition file.

```bash
php webrium plugin:export <name> <version> [options]
```

| Argument/Option | Description                                                       |
|-----------------|-------------------------------------------------------------------|
| `name`          | Name of the definition file (without `.json`).                    |
| `version`       | Semantic version for this release (e.g. `1.2.0`).                |
| `--dry-run`     | Validate files and show the output path without creating the zip. |
| `--force, -f`   | Overwrite the zip if this version was already exported.           |

The output zip is saved to `storage/App/plugins/dist/<name>-v<version>.zip`.

The version field in the definition file is updated automatically after a successful export.

---

### plugin:install

Install a plugin from a local zip file or a remote URL.

```bash
php webrium plugin:install <source> [options]
```

**Source formats:**

```bash
# Local file
php webrium plugin:install ./my-plugin.zip

# Direct HTTPS URL
php webrium plugin:install https://example.com/releases/my-plugin.zip

# GitHub release asset
php webrium plugin:install https://github.com/user/repo/releases/download/v1.0.0/my-plugin.zip
```

**Options:**

| Option        | Description                                             |
|---------------|---------------------------------------------------------|
| `--force, -f` | Overwrite existing files without asking.                |
| `--dry-run`   | Preview the full install plan without writing anything. |
| `--no-backup` | Skip automatic backup of files that would be overwritten. |

The SHA-256 checksum of the zip is always displayed before any files are written.

If a file already exists and `overwrite` is `false` in the manifest, installation will stop and list the conflicts unless `--force` is passed.

---

### plugin:update

Update an already-installed plugin to a newer version.

```bash
php webrium plugin:update <source> [options]
```

The source format is identical to `plugin:install`.

**Options:**

| Option        | Description                                                     |
|---------------|-----------------------------------------------------------------|
| `--force, -f` | Update even if the new version is the same as or older than the installed one. |
| `--no-backup` | Skip backup of the current version before updating.             |

The update process:
1. Compares the zip SHA-256 against the stored hash — warns if the zip is identical.
2. Compares version strings — warns if the new version is not newer.
3. Backs up all currently installed files for this plugin.
4. Removes files that exist in the old version but not in the new manifest.
5. Copies all new files to their destinations.
6. Updates the registry with the new version and file list.

---

### plugin:remove

Remove an installed plugin and delete its files from the project.

```bash
php webrium plugin:remove <name> [options]
```

**Options:**

| Option          | Description                                             |
|-----------------|---------------------------------------------------------|
| `--no-backup`   | Skip backup before deleting files.                      |
| `--keep-files`  | Remove the plugin from the registry only; do not delete files from disk. |

A confirmation prompt is shown before any files are deleted.

---

### plugin:list

Display a table of all installed plugins.

```bash
php webrium plugin:list
```

Output columns: Name, Version, Author, Files (count), Installed At, Updated At.

---

### plugin:info

Preview a plugin's details and full install plan without installing it.

```bash
php webrium plugin:info <source>
```

Displays:
- Plugin name, version, description, author.
- Installation status (whether it is already installed and at which version).
- A table showing each file, its resolved destination path, and whether a conflict exists.
- All `before_install` and `after_install` hook commands.
- SHA-256 checksum of the zip.

---

## Security

The installer enforces the following constraints on every plugin, regardless of its source:

**Path traversal prevention**
All `src` paths and `subpath` values are resolved with `realpath()` and verified to remain inside the project root. A value like `../../etc/passwd` or `../bootstrap/app.php` will cause the installation to abort immediately.

**Allowed file extensions**
Only the following extensions may be installed: `php`, `html`, `htm`, `js`, `css`, `json`, `md`, `txt`, `svg`, `xml`. Any other extension causes an error.

**Destination key whitelist**
The `dest` field must be one of the recognized directory keys listed in [Destination Keys](#destination-keys). Arbitrary paths are not accepted.

**Plugin name validation**
Plugin names must match `^[a-z0-9\-_]+$`. Names with special characters, slashes, or uppercase letters are rejected.

**Archive limits**
- Maximum zip size: **100 MB**
- Maximum number of files inside the zip: **1,000**

**Hook command sandbox**
Hook commands are limited to a fixed set of allowed Webrium Console commands. They are executed through the application's own command dispatcher — not through `exec`, `shell_exec`, or any other system call.

**HTTPS only for remote sources**
Remote URLs must use `https://`. Plain `http://` URLs are rejected.

---

## Registry

After installation, the plugin is recorded in:

```
storage/App/plugins/plugins.json
```

This file tracks every installed plugin and is used by `plugin:update`, `plugin:remove`, and `plugin:list`. Do not edit it manually unless you know what you are doing.

Example entry:

```json
{
  "installed": [
    {
      "name": "file-manager",
      "version": "1.0.0",
      "description": "File manager component for Webrium",
      "author": "Your Name",
      "installed_at": "2025-01-01 12:00:00",
      "updated_at": null,
      "hash": "a3f1c2d4e5b6...",
      "files": [
        "app/Controllers/Plugins/FileManagerController.php",
        "app/Models/FileModel.php",
        "app/Views/plugins/file-manager.html"
      ]
    }
  ]
}
```

---

## Backups

Before overwriting existing files (during install or update) and before deleting files (during remove), the installer automatically creates a backup unless `--no-backup` is passed.

Backups are stored in:

```
storage/App/plugins/backups/<plugin-name>_<tag>_<timestamp>/
```

Each backed-up file has a `.bak` extension appended to its original filename. Backups are never deleted automatically.