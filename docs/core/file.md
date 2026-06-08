# File

The `File` class provides a comprehensive set of file and directory utilities for Webrium applications. It covers reading and writing files, serving and streaming media, directory management, file metadata, and hashing.

---

## Table of Contents

- [Checking Files](#checking-files)
- [Reading Files](#reading-files)
- [Writing Files](#writing-files)
- [Copying, Moving & Deleting](#copying-moving--deleting)
- [Serving Files to the Browser](#serving-files-to-the-browser)
  - [download()](#download)
  - [stream()](#stream)
  - [showImage()](#showimage)
- [Directory Operations](#directory-operations)
- [File Metadata](#file-metadata)
- [File Hashing](#file-hashing)
- [Advanced / Internal Use](#advanced--internal-use)
  - [PHP File Execution](#php-file-execution)
  - [source()](#source)
  - [executeControllerMethod()](#executecontrollermethod)
  - [Glob & Pattern Matching](#glob--pattern-matching)
  - [Permissions & Ownership](#permissions--ownership)
- [API Reference](#api-reference)

---

## Checking Files

```php
use Webrium\File;

File::exists('/path/to/file.txt');       // true if file or directory exists
File::isFile('/path/to/file.txt');       // true only for files (not directories)
File::isDirectory('/path/to/dir');       // true only for directories
File::isReadable('/path/to/file.txt');   // true if readable
File::isWritable('/path/to/file.txt');   // true if writable
```

---

## Reading Files

```php
// Read entire file as a string
$content = File::read('/path/to/file.txt');
// false if file does not exist

// Alias
$content = File::getContent('/path/to/file.txt');

// Read as an array of lines (empty lines skipped)
$lines = File::lines('/path/to/file.txt');
// ['line one', 'line two', ...]
// false if file does not exist
```

---

## Writing Files

```php
// Write (overwrites existing content)
File::write('/path/to/file.txt', 'Hello, World!');

// Alias
File::putContent('/path/to/file.txt', 'Hello, World!');

// Append to a file
File::append('/path/to/log.txt', "New log entry\n");

// Prepend to a file
File::prepend('/path/to/file.txt', "First line\n");
```

All write methods return the number of bytes written, or `false` on failure.

---

## Copying, Moving & Deleting

```php
// Copy
File::copy('/source/file.txt', '/destination/file.txt');

// Move / rename
File::move('/old/path/file.txt', '/new/path/file.txt');

// Delete a single file
File::delete('/path/to/file.txt');

// Delete multiple files at once
$deleted = File::deleteMultiple([
    '/path/file1.txt',
    '/path/file2.txt',
]);
// Returns count of successfully deleted files
```

---

## Serving Files to the Browser

### download()

Trigger a file download in the browser. Sets the correct headers so the browser presents a Save As dialog.

```php
// Download with original filename
File::download('/storage/reports/q3.pdf');

// Download with a custom filename
File::download('/storage/reports/q3.pdf', 'Q3-Report-2024.pdf');
```

### stream()

Stream a file directly to the browser with support for HTTP range requests. This is the correct method for serving **audio and video** files, as it allows the browser to seek to any position.

```php
// Stream a video
File::stream('/storage/videos/intro.mp4');

// Stream with a custom filename hint
File::stream('/storage/videos/intro.mp4', 'welcome.mp4');
```

How range requests work automatically:
- If the browser sends an `HTTP_RANGE` header (e.g. when seeking in a video), a `206 Partial Content` response is returned with only the requested byte range.
- Otherwise, the full file is sent with a `200 OK` response.

### showImage()

Serve an image file inline with the correct `Content-Type` header. Supports jpg, jpeg, png, gif, svg, webp, bmp, and ico.

```php
File::showImage('/storage/images/avatar.png');
```

Returns a 404 response if the file does not exist.

---

## Directory Operations

```php
// Create a directory (recursive by default)
File::makeDirectory('/storage/uploads/avatars');
File::makeDirectory('/storage/cache', mode: 0755, recursive: false);

// List files in a directory (excludes . .. .gitignore by default)
$files = File::getFiles('/storage/uploads');
// ['file1.jpg', 'file2.png', 'subdir']

// List files with a custom exclusion list
$files = File::getFiles('/storage/uploads', ['.', '..', 'tmp']);

// List all files recursively (returns full paths)
$all = File::getFilesRecursive('/storage/uploads');
// ['/storage/uploads/a.jpg', '/storage/uploads/sub/b.png', ...]

// Delete a directory and all its contents
File::deleteDirectory('/storage/cache');

// Alias
File::delete_dir('/storage/cache');
```

---

## File Metadata

```php
$path = '/storage/uploads/report.pdf';

File::size($path);            // size in bytes (int), or false
File::humanSize($path);       // human-readable: "1.23 MB"
File::humanSize($path, 0);    // "1 MB" (0 decimal places)

File::lastModified($path);    // Unix timestamp, or false

File::extension($path);       // 'pdf'
File::name($path);            // 'report' (no extension)
File::basename($path);        // 'report.pdf'
File::dirname($path);         // '/storage/uploads'

File::mimeType($path);        // 'application/pdf', or false
```

---

## File Hashing

Useful for verifying file integrity or detecting duplicate files.

```php
$path = '/storage/uploads/archive.zip';

File::hash($path);                      // MD5 hash
File::sha1($path);                      // SHA-1 hash
File::hashFile($path, 'sha256');        // any supported algorithm
File::hashFile($path, 'md5');           // equivalent to hash()
```

All methods return `false` if the file does not exist.

---

## Advanced / Internal Use

The methods below are primarily used by the framework itself. You may encounter them when building low-level tooling, but most applications will not need them directly.

---

### PHP File Execution

Include or require PHP files at runtime:

```php
// Include (re-includable)
File::run('/path/to/file.php');

// Include once
File::runOnce('/path/to/file.php');

// Require (same as include but triggers a fatal error on failure at PHP level)
File::requireFile('/path/to/file.php');

// Require once
File::requireOnce('/path/to/file.php');
```

All methods return `true` on success and `false` if the file does not exist.

---

### source()

Include multiple PHP files from a named directory in one call. Used internally by `Route::source()`.

```php
$count = File::source('routes', ['web.php', 'api.php']);
// Returns the number of files successfully included
```

The directory name is resolved through `Directory::path()`.

---

### executeControllerMethod()

Instantiate a controller class and call one of its methods. Used internally by the router when handling `"Controller@method"` strings.

```php
File::executeControllerMethod('controllers', 'UserController', 'show', [$id]);
```

Lifecycle hooks are called automatically if they exist on the controller:
- `__init()` — called before the target method
- `__end()` — called after the target method

---

### Glob & Pattern Matching

```php
// Find files matching a glob pattern
$files = File::glob('/storage/uploads/*.jpg');

// Check if a single path matches a pattern
$match = File::matches('/storage/uploads/photo.jpg', '*.jpg'); // true
```

---

### Permissions & Ownership

```php
// Get permissions as an integer
$perms = File::permissions('/path/to/file.txt');

// Set permissions
File::chmod('/path/to/file.txt', 0644);

// Get owner (returns user ID)
$uid = File::owner('/path/to/file.txt');
```

---

## API Reference

### Common Methods

| Method | Description |
|---|---|
| `File::exists($path)` | Check if a file or directory exists |
| `File::isFile($path)` | Check if path is a file |
| `File::isDirectory($path)` | Check if path is a directory |
| `File::isReadable($path)` | Check if file is readable |
| `File::isWritable($path)` | Check if file is writable |
| `File::read($path)` | Read file contents as string |
| `File::getContent($path)` | Alias for `read()` |
| `File::lines($path)` | Read file as array of lines |
| `File::write($path, $content, $append)` | Write content to a file |
| `File::putContent($path, $content)` | Alias for `write()` |
| `File::append($path, $content)` | Append content to a file |
| `File::prepend($path, $content)` | Prepend content to a file |
| `File::copy($source, $destination)` | Copy a file |
| `File::move($source, $destination)` | Move or rename a file |
| `File::delete($path)` | Delete a file |
| `File::deleteMultiple($paths)` | Delete multiple files |
| `File::download($path, $name)` | Serve a file as a browser download |
| `File::stream($path, $name)` | Stream a file with range support |
| `File::showImage($path)` | Serve an image inline |
| `File::makeDirectory($path, $mode, $recursive)` | Create a directory |
| `File::getFiles($path, $exclude)` | List files in a directory |
| `File::getFilesRecursive($path, $exclude)` | List all files recursively |
| `File::deleteDirectory($dir)` | Delete a directory recursively |
| `File::delete_dir($dir)` | Alias for `deleteDirectory()` |
| `File::size($path)` | Get file size in bytes |
| `File::humanSize($path, $precision)` | Get human-readable file size |
| `File::lastModified($path)` | Get last modified timestamp |
| `File::extension($path)` | Get file extension |
| `File::name($path)` | Get filename without extension |
| `File::basename($path)` | Get filename with extension |
| `File::dirname($path)` | Get directory portion of path |
| `File::mimeType($path)` | Get MIME type |
| `File::hash($path)` | Get MD5 hash of file |
| `File::sha1($path)` | Get SHA-1 hash of file |
| `File::hashFile($path, $algorithm)` | Get hash using any algorithm |

### Internal / Advanced Methods

| Method | Description |
|---|---|
| `File::run($path)` | Include a PHP file |
| `File::runOnce($path)` | Include a PHP file once |
| `File::requireFile($path)` | Require a PHP file |
| `File::requireOnce($path)` | Require a PHP file once |
| `File::source($dirName, $files)` | Include multiple files from a directory |
| `File::executeControllerMethod(...)` | Instantiate a controller and call a method |
| `File::glob($pattern, $flags)` | Find files matching a glob pattern |
| `File::matches($path, $pattern)` | Check if a path matches a pattern |
| `File::permissions($path)` | Get file permissions |
| `File::chmod($path, $mode)` | Set file permissions |
| `File::owner($path)` | Get file owner user ID |