# Upload
`Webrium\Upload` is a secure file-upload handler with a fluent API. It reads files from `$_FILES`, validates them against size, extension, and MIME-type rules, and moves them safely to a destination directory.

Its design goal is to be **safe by default**: it detects the real content type of every file, refuses to trust the extension alone, blocks files that could be executed by a web server, and sanitizes file names against traversal and spoofing tricks.

---

## Quick start

```php
use Webrium\Upload;

$upload = Upload::fromInput('avatar');

if ($upload === null) {
    // No file was submitted under the "avatar" field.
}

$savedName = $upload
    ->allowExtension(['jpg', 'png', 'webp'])
    ->maxMB(5)
    ->to('/var/www/uploads/avatars')
    ->useRandomName()
    ->save();

if ($savedName === false) {
    $errors = $upload->getErrors();
} else {
    // $savedName is the final file name written to disk.
}
```

---

## Creating an instance

`Upload` has no public constructor. Instances are created from a file input field through `fromInput()`.

### `Upload::fromInput(string $inputName): Upload|array|null`

Reads `$_FILES[$inputName]` and returns:

| Situation | Return value |
| --- | --- |
| Field is absent or no file was submitted | `null` |
| Single-file input (`<input name="avatar">`) | a single `Upload` instance |
| Multi-file input (`<input name="files[]" multiple>`) | an array of `Upload` instances |

Empty slots in a multi-file input are skipped. If every slot is empty, the method returns `null`.

```php
// Single file
$one = Upload::fromInput('avatar');

// Multiple files
$many = Upload::fromInput('photos'); // array<Upload> or null
foreach ($many ?? [] as $file) {
    $file->allowExtension(['jpg', 'png'])->to('/uploads')->save();
}
```

---

## Configuration methods

All configuration methods return `$this`, so they can be chained in any order before calling `save()`.

### `maxKB(int $kb): self` / `maxMB(int $mb): self`

Sets the maximum allowed file size. The last call wins.

```php
$upload->maxMB(10);   // 10 MB
$upload->maxKB(500);  // 500 KB
```

### `allowExtension(array|string $extensions): self`

Restricts uploads to the listed extensions. Accepts an array or a comma-separated string. Leading dots and case are normalized, so `'.PNG'`, `'png'`, and `' png '` are equivalent.

```php
$upload->allowExtension(['jpg', 'png']);
$upload->allowExtension('jpg, png, webp');
```

> When an extension allow-list is set, the **MIME consistency check** is also enforced by default (see [Security model](#security-model)).

### `allowMimeType(array|string $types): self`

Restricts uploads to the listed MIME types. The check is performed against the **real content type** detected from the file's bytes, never the browser-reported type.

```php
$upload->allowMimeType(['image/jpeg', 'image/png']);
```

### `to(string $path): self`

Sets the destination directory. The directory is created (recursively, mode `0755`) on `save()` if it does not exist.

```php
$upload->to('/var/www/uploads/avatars');
```

### `asName(string $name): self`

Sets a custom base name for the saved file. **The real extension of the uploaded file is always preserved**, regardless of any extension included in `$name`. This prevents spoofing the stored name (e.g. passing `"avatar.php"` for a PNG upload still produces `avatar.png`). The base name is sanitized.

```php
$upload->asName('profile-picture'); // -> profile-picture.<real-ext>
```

### `useRandomName(): self`

Replaces the file name with a cryptographically random hex string, keeping the real extension. Recommended for user uploads to avoid name collisions and information disclosure.

```php
$upload->useRandomName(); // -> 3f8a...c1.png
```

### `allowOverwrite(bool $allow = true): self`

By default, if a file with the same name already exists, a numeric suffix is appended (`photo.png` → `photo-1.png`). Call `allowOverwrite(true)` to overwrite instead.

```php
$upload->allowOverwrite();       // overwrite existing files
$upload->allowOverwrite(false);  // keep default: never overwrite
```

### `enforceMimeConsistency(bool $enforce = true): self`

Toggles the requirement that the real MIME type match the claimed extension. **On by default.** Disabling it reopens the door to extension-spoofing attacks, so only do so when you fully control the upload source.

```php
$upload->enforceMimeConsistency(false); // not recommended
```

### `allowDangerousExtensions(bool $allow = true): self`

By default, extensions that a web server can execute or interpret (`php`, `phtml`, `svg`, `exe`, `html`, `js`, …) are rejected even if they appear in your allow-list. This method explicitly disables that protection. The name is intentionally alarming: enabling it on a web-accessible directory can lead to remote code execution or stored XSS.

```php
$upload->allowDangerousExtensions(); // dangerous — opt in knowingly
```

### `disallowEmpty(bool $disallow = true): self`

By default, zero-byte uploads are rejected. Call `disallowEmpty(false)` to allow them.

```php
$upload->disallowEmpty(false);
```

---

## Action methods

### `validate(): bool`

Runs all configured checks and returns `true` if the file passes. Validation errors are collected and retrievable via `getErrors()`. `save()` calls this internally, so you usually do not need to call it directly.

Checks are applied in this order:

1. PHP upload error code is `UPLOAD_ERR_OK`.
2. The temporary file is a genuine HTTP upload.
3. The file is not empty (unless `disallowEmpty(false)`).
4. The extension is not on the dangerous blacklist (unless opted out).
5. The size is within the configured limit.
6. The extension is in the allow-list (if one is set).
7. The real MIME type is consistent with the extension (if an allow-list is set and consistency is enforced).
8. The real MIME type is in the allowed MIME list (if one is set).

### `save(bool $throwOnError = false): bool|string`

Validates and moves the file to the destination. Returns the **final file name** on success, or `false` on failure. Pass `true` to throw an `Exception` instead of returning `false`.

```php
$name = $upload->to('/uploads')->allowExtension(['png'])->save();

// Exception style
try {
    $name = $upload->to('/uploads')->allowExtension(['png'])->save(true);
} catch (\Exception $e) {
    // handle $e->getMessage()
}
```

On success the file is written with permission `0644`.

---

## Getter methods

| Method | Returns |
| --- | --- |
| `getExtension(): string` | Lower-cased extension from the submitted name |
| `getOriginalName(): string` | The original submitted file name |
| `getSize(): int` | Raw file size in bytes |
| `getMimeType(): string` | Real MIME type detected from file contents (`finfo`); empty string if undetectable |
| `getErrors(): array` | All validation error messages |
| `getFirstError(): string` | First validation error, or empty string |

---

## Security model

`Upload` defends against the common file-upload attack classes:

**Content-based type detection.** The real MIME type is read from the file's bytes with `finfo`, never from the browser-supplied `type`. A request can claim `image/jpeg` while carrying PHP code; that lie is ignored.

**Extension/MIME consistency (anti-spoofing).** When an extension allow-list is active, the detected MIME type must match the claimed extension. A PHP web shell renamed to `evil.jpg`, or a real PNG renamed to `photo.jpg`, is rejected. This is the primary defence and is enabled by default.

**Dangerous-extension blacklist.** Extensions that a server can execute or that run in a browser (`php`, `phtml`, `phar`, `asp`, `jsp`, `exe`, `sh`, `bat`, `svg`, `html`, `js`, `htaccess`, and more) are blocked outright — even if a developer mistakenly adds them to the allow-list. SVG is included because it can carry inline JavaScript.

**Genuine-upload check.** Only files actually delivered by PHP's upload handler (`is_uploaded_file` / `move_uploaded_file`) are accepted, preventing local-file-path injection.

**File-name sanitization.** Saved names are stripped of directory components, null bytes, and control characters; reduced to `[A-Za-z0-9.\-_]`; collapsed to prevent double extensions (`file.php.jpg` → `file-php.jpg`); and cleared of leading dots (hidden files) and trailing dots/spaces (a Windows trick that can re-expose an extension). A random hex name is used as a fallback.

**Empty-file rejection** and **collision-safe naming** round out the defaults.

> The blacklist beats the allow-list. If `allowExtension(['php'])` and the default protections are on, `.php` files are still rejected. You must call `allowDangerousExtensions()` to override.

---

## Full example

```php
use Webrium\Upload;

$files = Upload::fromInput('documents');

foreach ($files ?? [] as $file) {
    $name = $file
        ->allowExtension(['pdf', 'docx'])
        ->maxMB(25)
        ->to(__DIR__ . '/storage/docs')
        ->useRandomName()
        ->save();

    if ($name === false) {
        echo $file->getFirstError();
        continue;
    }

    echo "Saved as {$name}";
}
```

---

# UploadHelper

`Webrium\Helpers\UploadHelper` is a thin convenience layer over `Upload`. Instead of manually listing the correct extensions, MIME types, and a sensible size cap for a category such as "images", you call one factory method and receive a fully configured `Upload` instance.

It contains **no security logic of its own** — it only wires up the same `Upload` validation any manual caller would use, drawing its extension and MIME data from a single source (`Webrium\Helpers\MimeMap`). The MIME-consistency check and dangerous-extension blacklist stay enabled on everything it produces.

## Factory methods

Each factory takes the input field name and returns an `Upload`, an array of `Upload` instances, or `null` — exactly like `Upload::fromInput()`.

| Method | Category | Default size cap |
| --- | --- | --- |
| `UploadHelper::image($input)` | Images | 5 MB |
| `UploadHelper::video($input)` | Video | 200 MB |
| `UploadHelper::audio($input)` | Audio | 50 MB |
| `UploadHelper::pdf($input)` | PDF only | 20 MB |
| `UploadHelper::document($input)` | Documents | 25 MB |
| `UploadHelper::archive($input)` | Archives | 100 MB |

### Allowed extensions per category

| Category | Extensions |
| --- | --- |
| `image` | jpg, jpeg, png, gif, webp, bmp, tiff, tif, avif, heic, heif |
| `video` | mp4, m4v, mov, webm, avi, mkv, mpeg, mpg, 3gp |
| `audio` | mp3, wav, ogg, oga, m4a, aac, flac, weba |
| `pdf` | pdf |
| `document` | pdf, doc, docx, xls, xlsx, ppt, pptx, odt, ods, odp, rtf, txt, csv |
| `archive` | zip, rar, 7z, tar, gz |

> **SVG is deliberately excluded from `image()`** because it can execute JavaScript. Accepting it would require an explicit, knowing opt-out on a plain `Upload`.

## Usage

```php
use Webrium\Helpers\UploadHelper;

$name = UploadHelper::image('avatar')
    ->to('/var/www/uploads/avatars')
    ->useRandomName()
    ->save();
```

Because each factory returns a normal `Upload`, the fluent API is still available and **every default can be overridden**:

```php
// Raise the default 200 MB video cap to 500 MB
UploadHelper::video('clip')
    ->maxMB(500)
    ->to('/clips')
    ->save();

// Narrow the image extensions to just PNG
UploadHelper::image('logo')
    ->allowExtension(['png'])
    ->to('/logos')
    ->save();
```

Multiple-file inputs return an array, with each instance independently configured:

```php
$gallery = UploadHelper::image('gallery'); // array<Upload>|null

foreach ($gallery ?? [] as $image) {
    $image->to('/uploads/gallery')->useRandomName()->save();
}
```

## When to use which

Use **`UploadHelper`** for the common cases — it picks safe extensions, MIME types, and size caps for you. Drop down to **`Upload`** directly when you need a custom mix of types, an unusual size policy, or one of the explicit security opt-outs.