
A lightweight, fluent PHP class for handling single and multiple file uploads securely.

---

## Requirements

- PHP **8.1** or higher
- `fileinfo` extension (enabled by default in most PHP builds)

---

## Installation

Copy `Upload.php` into your project and include or autoload it via your framework or Composer.

```php
use Webrium\Upload;
```

---

## Basic Usage

### Single File Upload

```html
<form method="POST" enctype="multipart/form-data">
    <input type="file" name="avatar">
    <button type="submit">Upload</button>
</form>
```

```php
$upload = Upload::fromInput('avatar');

if ($upload === null) {
    echo 'No file was submitted.';
    exit;
}

$result = $upload
    ->maxMB(2)
    ->allowExtension('jpg, png, webp')
    ->allowMimeType('image/jpeg, image/png, image/webp')
    ->to('/var/www/uploads/avatars')
    ->useRandomName()
    ->save();

if ($result === false) {
    echo $upload->getFirstError();
} else {
    echo "Saved as: $result";
}
```

---

## Multiple File Upload

```html
<input type="file" name="photos[]" multiple>
```

```php
$uploads = Upload::fromInput('photos');

if ($uploads === null) {
    exit('No files uploaded.');
}

// fromInput() returns an array when the input name ends with []
foreach ($uploads as $upload) {
    $result = $upload
        ->maxMB(5)
        ->allowExtension(['jpg', 'png'])
        ->to('/var/www/uploads/photos')
        ->useRandomName()
        ->save();

    if ($result === false) {
        echo "Failed: " . $upload->getFirstError() . "\n";
    } else {
        echo "Saved: $result\n";
    }
}
```

---

## API Reference

### `Upload::fromInput(string $inputName): Upload|array|null`

Creates one or more `Upload` instances from `$_FILES`.

| Return value | Meaning |
|---|---|
| `Upload` | A single file input was submitted |
| `Upload[]` | A multiple file input (`name[]`) was submitted |
| `null` | The input was missing or empty |

---

### Configuration Methods

All configuration methods return `$this`, so they can be **chained**.

#### `->maxKB(int $kb): self`
Set the maximum allowed file size in kilobytes.

```php
$upload->maxKB(512); // 512 KB
```

#### `->maxMB(int $mb): self`
Set the maximum allowed file size in megabytes.

```php
$upload->maxMB(10); // 10 MB
```

#### `->allowExtension(array|string $extensions): self`
Restrict uploads to specific file extensions. Accepts a comma-separated string or an array. Leading dots and letter case are normalized automatically.

```php
$upload->allowExtension('jpg, png, gif');
$upload->allowExtension(['.JPG', 'PNG', 'gif']);
```

#### `->allowMimeType(array|string $types): self`
Restrict uploads by **real MIME type**, detected by reading the file's binary content — not the browser-reported value. This prevents MIME-spoofing attacks.

```php
$upload->allowMimeType('image/jpeg, image/png');
$upload->allowMimeType(['application/pdf']);
```

> **Tip:** Use both `allowExtension()` and `allowMimeType()` together for the strongest validation.

#### `->to(string $path): self`
Set the destination directory. The directory is created automatically (recursively) if it does not exist.

```php
$upload->to('/var/www/storage/uploads');
```

#### `->asName(string $name): self`
Save the file with a custom base name. The original file's extension is always preserved regardless of what extension is passed in `$name`, preventing extension spoofing.

```php
$upload->asName('profile-picture');
// Result: profile-picture.jpg  (extension taken from the uploaded file)
```

#### `->useRandomName(): self`
Generate a cryptographically random hex filename.

```php
$upload->useRandomName();
// Result: a3f8c21d...b92e.png
```

#### `->allowOverwrite(bool $allow = true): self`
By default, if a file with the same name already exists, a numeric suffix is appended (`file-1.jpg`, `file-2.jpg`, …). Call this method to allow overwriting instead.

```php
$upload->allowOverwrite();       // allow overwriting
$upload->allowOverwrite(false);  // back to default (prevent overwrite)
```

---

### Action Methods

#### `->validate(): bool`
Run all configured validation rules without saving the file. Returns `true` if the file passes all checks.

```php
if (!$upload->validate()) {
    print_r($upload->getErrors());
}
```

#### `->save(bool $throwOnError = false): bool|string`
Validate and move the uploaded file to the destination directory.

- Returns the **final filename** (string) on success.
- Returns `false` on failure and populates the error list.
- If `$throwOnError` is `true`, throws an `Exception` on the first failure instead.

```php
// Default — check return value
$filename = $upload->save();

// Exception mode
try {
    $filename = $upload->save(throwOnError: true);
} catch (Exception $e) {
    echo $e->getMessage();
}
```

---

### Getter Methods

| Method | Return type | Description |
|---|---|---|
| `getOriginalName()` | `string` | The original filename as submitted by the browser |
| `getExtension()` | `string` | Lowercase extension extracted from the original name |
| `getSize()` | `int` | File size in bytes |
| `getMimeType()` | `string` | Real MIME type detected from file contents |
| `getErrors()` | `array` | All validation/save error messages |
| `getFirstError()` | `string` | The first error message, or an empty string |

---

## Security Features

| Feature | Details |
|---|---|
| **Path traversal prevention** | `sanitizeFileName()` applies `basename()` and strips all characters except alphanumerics, dots, hyphens, and underscores |
| **Double extension blocking** | `image.php.jpg` becomes `image-php.jpg` |
| **MIME spoofing prevention** | MIME type is read from the file's binary content using `finfo`, not the browser header |
| **Custom name extension lock** | `asName()` always uses the real extension from the uploaded file — callers cannot inject a different one |
| **`is_uploaded_file()` check** | Confirms the file went through PHP's upload mechanism before any processing |
| **File permissions** | Saved files are set to `0644`; directories are created as `0755` |
| **Overwrite protection** | Enabled by default; conflicts are resolved with auto-incrementing suffixes |

---

## Error Handling

Errors from both validation and save operations are collected in an internal list.

```php
$result = $upload->maxMB(1)->to('/uploads')->save();

if ($result === false) {
    // Single error
    echo $upload->getFirstError();

    // All errors
    foreach ($upload->getErrors() as $error) {
        echo "- $error\n";
    }
}
```

---

## Examples

### Image-Only Upload with Strict Validation

```php
$upload = Upload::fromInput('cover_image');

if (!$upload) {
    exit('Please select an image.');
}

$filename = $upload
    ->maxMB(4)
    ->allowExtension('jpg, jpeg, png, webp')
    ->allowMimeType('image/jpeg, image/png, image/webp')
    ->to(BASE_PATH . '/public/images/covers')
    ->useRandomName()
    ->save();

if ($filename) {
    $imageUrl = '/images/covers/' . $filename;
}
```

### PDF Upload with Custom Name

```php
$upload = Upload::fromInput('resume');

$saved = $upload
    ->maxMB(8)
    ->allowExtension('pdf')
    ->allowMimeType('application/pdf')
    ->to('/private/storage/resumes')
    ->asName('resume_' . $userId)
    ->save();
```

### Bulk Upload with Per-File Error Reporting

```php
$uploads = Upload::fromInput('gallery[]') ?? [];
$saved   = [];
$errors  = [];

foreach ($uploads as $upload) {
    $result = $upload
        ->maxMB(5)
        ->allowExtension('jpg, png')
        ->allowMimeType('image/jpeg, image/png')
        ->to('/uploads/gallery')
        ->useRandomName()
        ->save();

    if ($result) {
        $saved[] = $result;
    } else {
        $errors[$upload->getOriginalName()] = $upload->getFirstError();
    }
}

echo count($saved) . " file(s) uploaded successfully.\n";

foreach ($errors as $name => $error) {
    echo "[$name] $error\n";
}
```

### Exception Mode

```php
try {
    $filename = Upload::fromInput('document')
        ?->maxMB(20)
        ->allowExtension('pdf, docx')
        ->to('/storage/docs')
        ->useRandomName()
        ->save(throwOnError: true);
} catch (Exception $e) {
    // Log or display the error
    error_log($e->getMessage());
}
```


