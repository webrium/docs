# Filesystem
Core ships two static utility classes for working with the filesystem:

- **`Webrium\File`** — byte-level file I/O: reading, writing, copying, moving, deleting, streaming, downloading, and querying metadata.
- **`Webrium\Directory`** — a registry-based directory manager: register named directories relative to the application root, then create, inspect, copy, and delete them safely.

Both are entirely static; you never instantiate them.

---

## File

`Webrium\File` is a focused file I/O helper. It deliberately does **not** include PHP execution (`include`/`require`) or controller dispatch — those belong to the framework's `Kernel`. Every method is static and takes a filesystem path.

### Existence & Type Checks

| Method | Description |
| --- | --- |
| `exists(string $path): bool` | Whether a file or directory exists at the path |
| `isFile(string $path): bool` | Whether the path is a file (not a directory) |
| `isDirectory(string $path): bool` | Whether the path is a directory |
| `isReadable(string $path): bool` | Whether the file is readable |
| `isWritable(string $path): bool` | Whether the file is writable |

```php
use Webrium\File;

if (File::exists('/var/data/report.csv') && File::isReadable('/var/data/report.csv')) {
    // safe to read
}
```

### Path & Metadata

| Method | Returns |
| --- | --- |
| `size(string $path)` | Size in bytes, or `false` if the file is missing |
| `humanSize(string $path, int $precision = 2)` | Human-readable size (e.g. `"1.5 MB"`), or `false` |
| `lastModified(string $path)` | Unix timestamp of last modification, or `false` |
| `extension(string $path): string` | Lower-cased extension, without the dot |
| `name(string $path): string` | Filename without extension |
| `basename(string $path): string` | Filename with extension |
| `dirname(string $path): string` | Containing directory path |
| `mimeType(string $path)` | Real MIME type via `finfo`, or `false` |
| `permissions(string $path)` | File permissions, or `false` |
| `owner(string $path)` | Owner user ID, or `false` |

```php
File::extension('/uploads/photo.JPG'); // "jpg"
File::name('/uploads/photo.jpg');      // "photo"
File::humanSize('/uploads/photo.jpg'); // "248.31 KB"
File::mimeType('/uploads/photo.jpg');  // "image/jpeg"
```

### Reading

| Method | Description |
| --- | --- |
| `read(string $path)` | Full contents as a string, or `false` if missing |
| `getContent(string $path)` | Alias of `read()` |
| `lines(string $path)` | Array of lines (empty lines and trailing newlines skipped), or `false` |

```php
$config = File::read('/etc/app/config.json');

foreach (File::lines('/var/log/access.log') ?: [] as $line) {
    // process each line
}
```

### Writing

| Method | Description |
| --- | --- |
| `write(string $path, string $content, bool $append = false)` | Write content; returns bytes written or `false` |
| `putContent(string $path, string $content)` | Alias of `write()` (no append) |
| `append(string $path, string $content)` | Append to the end of the file |
| `prepend(string $path, string $content)` | Prepend to the start, using an exclusive lock to avoid concurrent-write data loss |

```php
File::write('/tmp/out.txt', "first line\n");
File::append('/tmp/out.txt', "second line\n");
File::prepend('/tmp/out.txt', "header\n");
```

> `prepend()` reads the whole file into memory and rewrites it under `LOCK_EX`. For very large files prefer a streaming approach. If the file does not exist yet, it is created with the given content.

### Copy, Move, Delete

| Method | Description |
| --- | --- |
| `copy(string $source, string $destination): bool` | Copy a file; `false` if the source is missing |
| `move(string $source, string $destination): bool` | Move/rename a file; `false` if the source is missing |
| `delete(string $path): bool` | Delete a file; `false` if it does not exist |
| `deleteMultiple(array $paths): int` | Delete several files; returns the count actually deleted |

```php
File::copy('/tmp/a.txt', '/backup/a.txt');
File::move('/tmp/a.txt', '/archive/a.txt');
File::delete('/archive/a.txt');
$removed = File::deleteMultiple(['/tmp/1.tmp', '/tmp/2.tmp']);
```

### Directory Listing (within File)

These convenience listers exist on `File`; for richer directory management use the `Directory` class.

| Method | Description |
| --- | --- |
| `getFiles(string $path, array $exclude = ['.', '..', '.gitignore'])` | Names of entries directly inside a directory |
| `getFilesRecursive(string $path, array $exclude = …)` | Full paths of all files in the tree |
| `glob(string $pattern, int $flags = 0)` | Files matching a glob pattern |
| `matches(string $path, string $pattern): bool` | Whether a path matches a glob pattern (`fnmatch`) |

```php
$names = File::getFiles('/uploads');                 // ['a.jpg', 'b.png', ...]
$all   = File::getFilesRecursive('/uploads');        // ['/uploads/2024/a.jpg', ...]
$imgs  = File::glob('/uploads/*.jpg');
```

> `getFiles()` returns the entry **names** directly inside the directory (both files and sub-directory names), while `getFilesRecursive()` walks the tree and returns the **full paths** of files only.

> `File::makeDirectory()` also exists but is **deprecated** — use `Directory::make()` instead.

### Serving Files Over HTTP

These methods send headers and file content directly to the client, then call `exit`. Use them inside a controller action that is responsible for the response.

#### `stream(string $filePath, ?string $downloadName = null): void`

Streams a file inline with HTTP range support — ideal for video and audio, since it lets the browser seek. Responds with `206 Partial Content` for range requests and `416` for invalid ranges. A missing file returns `404`. The download name is sanitized for the `Content-Disposition` header.

```php
File::stream('/media/lecture.mp4');
```

#### `download(string $filePath, ?string $downloadName = null): void`

Sends the file as an attachment (forces a download dialog) with the correct length and MIME type. A missing file returns `404`. The download name is sanitized to prevent header injection.

```php
File::download('/invoices/2024-01.pdf', 'invoice.pdf');
```

#### `showImage(string $path): void`

Serves an image inline. It first verifies the file's **real** MIME type begins with `image/`; non-image files are rejected with `403`. This prevents this method from being abused to disclose sensitive files such as `.php` or `.env`. Missing files return `404`.

```php
File::showImage('/uploads/avatars/user_42.png');
```

> `stream()` and `download()` sanitize the outgoing filename (stripping path separators, null bytes, and control characters, and escaping quotes) before writing the `Content-Disposition` header. `showImage()` serves inline without a `Content-Disposition` filename.

### Hashing

| Method | Description |
| --- | --- |
| `hash(string $path)` | MD5 hash of the file, or `false` |
| `sha1(string $path)` | SHA-1 hash, or `false` |
| `hashFile(string $path, string $algorithm = 'md5')` | Hash using any algorithm supported by `hash_file()` |

```php
File::hash('/downloads/setup.bin');                  // md5
File::hashFile('/downloads/setup.bin', 'sha256');    // sha256
```

### Permissions

| Method | Description |
| --- | --- |
| `chmod(string $path, int $mode): bool` | Change permissions; `false` if the file is missing |
| `permissions(string $path)` | Read current permissions, or `false` |
| `owner(string $path)` | Owner user ID, or `false` |

```php
File::chmod('/uploads/private.txt', 0600);
```

---

## Directory

`Webrium\Directory` manages directories by **registered name** rather than raw paths. You register a logical name (e.g. `uploads`) mapped to a path relative to the application root, then refer to it by name everywhere. Path resolution is cached and guarded against directory traversal.

Most methods accept either a registered **name** or, where noted, an absolute path.

### Registering Directories

| Method | Description |
| --- | --- |
| `set(string $name, string $path): void` | Register one directory (path relative to root) |
| `setMultiple(array $directories): void` | Register many from a `name => path` map |
| `get(string $name): ?string` | The registered relative path, or `null` |
| `path(string $name, string $append = ''): ?string` | The absolute path, optionally with a sanitized sub-path appended |
| `all(): array` | All registered `name => relative path` pairs |
| `allPaths(): array` | All registered `name => absolute path` pairs |
| `has(string $name): bool` | Whether a name is registered |
| `forget(string $name): bool` | Unregister a name (does not touch the filesystem) |
| `clear(): void` | Unregister everything |

```php
use Webrium\Directory;

Directory::set('uploads', 'public/uploads');
Directory::set('logs', 'storage/logs');

Directory::path('uploads');                   // /var/www/app/public/uploads
Directory::path('uploads', 'avatars/42.png'); // .../public/uploads/avatars/42.png
```

> When you append a sub-path via `path()`, the result is sanitized: `..` and `.` segments are resolved without touching the filesystem, and an `InvalidArgumentException` is thrown if the path would escape the application root.

### Default Framework Structure

#### `initDefaultStructure(): void`

Registers a complete conventional layout in one call — application directories (`app`, `controllers`, `models`, `views`, `routes`, `config`, `middleware`, `helpers`, `services`), storage (`storage`, `storage_app`, `sessions`, `cache`, rendered/static views), `logs`, `langs`, and public directories (`public`, `assets`, `uploads`). Application sub-paths follow PSR-4 PascalCase (e.g. `app/Controllers`, `app/Models`).

```php
Directory::initDefaultStructure();
Directory::makeAll(); // create them all on disk
```

### Creating Directories

| Method | Description |
| --- | --- |
| `make(string $path, int $permissions = 0755, bool $recursive = true): bool` | Create a directory (accepts a registered name or absolute path); returns `true` if it already exists |
| `makeAll(int $permissions = 0755): array` | Create all registered directories; returns the names created |
| `makes(): array` | Alias of `makeAll()` |

```php
Directory::make('uploads');           // by registered name
Directory::make('/var/www/cache');    // by absolute path
$created = Directory::makeAll();
```

### Validation & Health Checks

| Method | Description |
| --- | --- |
| `exists(string $name): bool` | Whether a registered directory exists on disk |
| `validate(): bool` | Whether **all** registered directories exist |
| `getMissing(): array` | Names that are registered but missing on disk |
| `getExisting(): array` | Names that exist on disk |
| `isReadable(string $name): bool` | Whether the directory is readable |
| `isWritable(string $name): bool` | Whether the directory is writable |

```php
if (!Directory::validate()) {
    $missing = Directory::getMissing();
    Directory::makeAll();
}
```

### Size & Statistics

| Method | Description |
| --- | --- |
| `size(string $name)` | Total size in bytes (recursive), or `false` |
| `humanSize(string $name, int $precision = 2)` | Human-readable total size, or `false` |
| `fileCount(string $name, bool $recursive = false)` | Number of files (optionally recursive), or `false` |
| `stats(string $name)` | Rich stats array, or `false` |

`stats()` returns: `path`, `exists`, `readable`, `writable`, `files`, `directories`, `total_items`, `size_bytes`, `size_human`, and `permissions` (the last as a four-digit octal string such as `"0755"`).

```php
Directory::humanSize('uploads');     // "12.4 MB"
Directory::fileCount('uploads', true);

$info = Directory::stats('uploads');
// ['files' => 128, 'directories' => 6, 'size_human' => '12.4 MB', ...]
```

### Copy, Delete, Empty

| Method | Description |
| --- | --- |
| `copy(string $source, string $destination, bool $overwrite = false): bool` | Recursively copy a directory (source by name or path; destination is an absolute path) |
| `delete(string $name): bool` | Recursively delete a directory and its contents (by name or absolute path) |
| `empty(string $name): bool` | Delete the contents but keep the directory itself |

```php
Directory::copy('uploads', '/backup/uploads');
Directory::empty('cache');   // clear cache but keep the folder
Directory::delete('temp');   // remove the folder entirely
```

> **Safety guarantees.** `delete()` and `empty()` only operate on paths **inside the application root** — an attempt to remove a path outside it returns `false`. Symlinks are unlinked directly and never followed, so a symlink pointing outside the tree cannot cause collateral deletion.

### Traversal & Tree

#### `tree(string $name, int $maxDepth = -1): array`

Returns a nested array representing the directory structure. Sub-directories become nested arrays keyed by name; files appear as values. Use `$maxDepth` to limit recursion (`-1` = unlimited).

```php
$tree = Directory::tree('app', 2);
/*
[
  'Controllers' => ['HomeController.php', 'UserController.php'],
  'Models'      => ['User.php'],
  'routes.php',
]
*/
```

### Permissions

| Method | Description |
| --- | --- |
| `permissions(string $name)` | Read directory permissions, or `false` |
| `chmod(string $name, int $permissions): bool` | Change directory permissions |

```php
Directory::chmod('uploads', 0775);
```

---

## File vs Directory — Which to Use

Reach for **`File`** when you have a concrete path and need to read, write, hash, or serve a single file. Reach for **`Directory`** when you want to manage your application's folder layout by logical name — registering the structure once, creating it, checking its health, and performing safe recursive operations within the application root.