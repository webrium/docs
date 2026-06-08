# Hash

The `Hash` class provides a comprehensive set of hashing utilities for Webrium applications. It covers secure password hashing and verification, general-purpose data hashing, HMAC generation, token and UUID generation, and data integrity checksums.

---

## Table of Contents

- [Password Hashing](#password-hashing)
  - [make()](#make)
  - [check()](#check)
  - [checkAndRehash()](#checkandrehash)
  - [needsRehash()](#needsrehash)
  - [info() & getAlgorithm()](#info--getalgorithm)
- [Algorithm Shortcuts](#algorithm-shortcuts)
  - [bcrypt()](#bcrypt)
  - [argon2i()](#argon2i)
  - [argon2id()](#argon2id)
- [General-Purpose Hashing](#general-purpose-hashing)
  - [digest()](#digest)
  - [md5, sha1, sha256, sha512](#md5-sha1-sha256-sha512)
- [HMAC](#hmac)
- [Timing-Safe Comparison](#timing-safe-comparison)
- [Tokens & Random Values](#tokens--random-values)
  - [token()](#token)
  - [random()](#random)
  - [unique()](#unique)
  - [uuid()](#uuid)
- [File Hashing](#file-hashing)
- [Salted & Peppered Hashing](#salted--peppered-hashing)
- [Checksums](#checksums)
- [Algorithm Support](#algorithm-support)
- [API Reference](#api-reference)

---

## Password Hashing

These methods use PHP's built-in `password_hash` / `password_verify` functions and are designed for safely storing user passwords.

### make()

Hash a password using a secure algorithm. Defaults to `PASSWORD_DEFAULT` (currently bcrypt).

```php
use Webrium\Hash;

$hash = Hash::make('my-secret-password');
// "$2y$10$..."
```

**Using bcrypt with a custom cost:**
```php
$hash = Hash::make('my-secret-password', PASSWORD_BCRYPT, ['cost' => 12]);
```

**Using Argon2id:**
```php
$hash = Hash::make('my-secret-password', PASSWORD_ARGON2ID);
```

> Defaults per algorithm:
> - **bcrypt** — cost: `10`
> - **argon2i / argon2id** — memory: `65536 KiB`, time: `4`, threads: `1`

---

### check()

Verify a plain-text password against a stored hash.

```php
$valid = Hash::check('my-secret-password', $hash);

if ($valid) {
    // Password is correct
}
```

Returns `false` immediately if the hash string is empty.

---

### checkAndRehash()

Verify a password and, if the stored hash uses outdated settings, return a fresh hash in one step. Useful during login flows when you want to transparently upgrade stored hashes.

```php
$result = Hash::checkAndRehash('my-secret-password', $storedHash);

if ($result['verified']) {
    // Password is correct

    if ($result['hash'] !== null) {
        // Hash was outdated — save the new hash to the database
        $user->password = $result['hash'];
        $user->save();
    }
}
```

**Return value:**

| Key | Type | Description |
|---|---|---|
| `verified` | `bool` | Whether the password matched |
| `hash` | `string\|null` | New hash if rehashing was needed, otherwise `null` |

---

### needsRehash()

Check whether a stored hash needs to be upgraded (e.g. cost factor changed).

```php
if (Hash::needsRehash($storedHash)) {
    $newHash = Hash::make($plainPassword);
    // save $newHash
}
```

---

### info() & getAlgorithm()

Inspect a stored hash to find out which algorithm and options were used.

```php
$info = Hash::info($hash);
// [
//   'algo'     => 1,
//   'algoName' => 'bcrypt',
//   'options'  => ['cost' => 10],
// ]

$algoName = Hash::getAlgorithm($hash);
// 'bcrypt' | 'argon2i' | 'argon2id' | 'unknown'
```

---

## Algorithm Shortcuts

Convenience wrappers when you need a specific algorithm or want to set custom parameters explicitly.

### bcrypt()

```php
$hash = Hash::bcrypt('my-password');

// With custom cost (4–31)
$hash = Hash::bcrypt('my-password', cost: 12);
```

### argon2i()

```php
$hash = Hash::argon2i('my-password');

// With custom parameters
$hash = Hash::argon2i(
    password: 'my-password',
    memoryCost: 131072, // KiB
    timeCost: 6,
    threads: 2
);
```

### argon2id()

```php
$hash = Hash::argon2id('my-password');

// With custom parameters
$hash = Hash::argon2id('my-password', memoryCost: 131072, timeCost: 6);
```

> `argon2id` is the recommended Argon2 variant for most use cases as it provides resistance against both side-channel and GPU attacks.

---

## General-Purpose Hashing

These methods hash arbitrary data (strings, tokens, identifiers) — **not** passwords. Do not use them to store passwords.

### digest()

Hash any string with a specified algorithm:

```php
$hash = Hash::digest('some data');                  // sha256 by default
$hash = Hash::digest('some data', 'sha512');
$hash = Hash::digest('some data', 'sha256', true);  // binary output
```

### md5, sha1, sha256, sha512

Shorthand methods for common algorithms:

```php
$hash = Hash::md5('data');
$hash = Hash::sha1('data');
$hash = Hash::sha256('data');
$hash = Hash::sha512('data');

// Binary output
$hash = Hash::sha256('data', binary: true);
```

> **Security note:** MD5 and SHA-1 are cryptographically broken and should not be used for security-sensitive operations. Prefer SHA-256 or SHA-512 for integrity checks, and `Hash::make()` for passwords.

---

## HMAC

An HMAC (Hash-based Message Authentication Code) ties a hash to a secret key, allowing you to verify both data integrity and authenticity.

**Generate an HMAC:**
```php
$hmac = Hash::hmac('message data', 'secret-key');

// Custom algorithm
$hmac = Hash::hmac('message data', 'secret-key', 'sha512');
```

**Verify an HMAC:**
```php
$valid = Hash::verifyHmac('message data', $receivedHmac, 'secret-key');

if ($valid) {
    // Data is authentic and unmodified
}
```

Verification uses timing-safe comparison internally to prevent timing attacks.

---

## Timing-Safe Comparison

When comparing hashes or tokens, always use `Hash::equals()` instead of `===` to prevent timing-based attacks:

```php
$valid = Hash::equals($knownHash, $userProvidedHash);
```

This wraps PHP's `hash_equals()`.

---

## Tokens & Random Values

### token()

Generate a cryptographically secure, URL-safe hex token. Suitable for password reset links, API keys, and CSRF tokens.

```php
$token = Hash::token();       // 32 characters by default
$token = Hash::token(64);     // 64 characters
```

### random()

Generate a random hash of a specific length using any algorithm:

```php
$hash = Hash::random();       // 32-char sha256-based hash
$hash = Hash::random(16);
$hash = Hash::random(64, 'sha512');
```

### unique()

Generate a unique hash based on the current timestamp and random bytes. Useful as a unique identifier or temporary key:

```php
$id = Hash::unique();
$id = Hash::unique('user_');  // with a prefix
$id = Hash::unique('', 'sha512');
```

### uuid()

Generate a standard UUID v4 string:

```php
$uuid = Hash::uuid();
// e.g. "550e8400-e29b-41d4-a716-446655440000"
```

---

## File Hashing

Generate a hash of a file's contents for integrity verification:

```php
$hash = Hash::file('/path/to/file.zip');
// false if the file does not exist

// Custom algorithm
$hash = Hash::file('/path/to/file.zip', 'sha512');
```

**Typical use — verify a downloaded file:**
```php
$expected = 'abc123...';
$actual   = Hash::file('/tmp/downloaded.zip');

if (Hash::equals($expected, $actual)) {
    // File is intact
}
```

---

## Salted & Peppered Hashing

### salted()

Append a salt to the data before hashing. Useful when you manage salt storage yourself:

```php
$hash = Hash::salted('data', 'my-salt');
$hash = Hash::salted('data', 'my-salt', 'sha512');
```

### peppered()

Apply an application-wide secret (pepper) using HMAC. Unlike a salt, the pepper is never stored in the database — it lives in your application config:

```php
$hash = Hash::peppered('data', env('APP_PEPPER'));
```

> A peppered hash is equivalent to `Hash::hmac($data, $pepper)`.

---

## Checksums

Generate and verify checksums for data integrity checks:

```php
// Generate
$checksum = Hash::checksum('file contents or payload');

// Verify
$valid = Hash::verifyChecksum('file contents or payload', $checksum);
```

Custom algorithm:
```php
$checksum = Hash::checksum('data', 'sha512');
$valid    = Hash::verifyChecksum('data', $checksum, 'sha512');
```

---

## Algorithm Support

List all hash algorithms available on the current server:

```php
$algos = Hash::algorithms();
// ['md5', 'sha1', 'sha256', 'sha512', 'ripemd160', ...]
```

Check if a specific algorithm is supported:

```php
if (Hash::isAlgorithmSupported('sha3-256')) {
    $hash = Hash::digest('data', 'sha3-256');
}
```

---

## API Reference

### Password Methods

| Method | Description |
|---|---|
| `Hash::make($password, $algorithm, $options)` | Hash a password |
| `Hash::check($password, $hash)` | Verify a password against a hash |
| `Hash::checkAndRehash($password, $hash, $algorithm, $options)` | Verify and rehash if needed |
| `Hash::needsRehash($hash, $algorithm, $options)` | Check if a hash needs upgrading |
| `Hash::info($hash)` | Get algorithm and options from a hash |
| `Hash::getAlgorithm($hash)` | Get algorithm name from a hash |
| `Hash::bcrypt($password, $cost)` | Hash with bcrypt |
| `Hash::argon2i($password, $memoryCost, $timeCost, $threads)` | Hash with Argon2i |
| `Hash::argon2id($password, $memoryCost, $timeCost, $threads)` | Hash with Argon2id |

### Data Hashing Methods

| Method | Description |
|---|---|
| `Hash::digest($data, $algorithm, $binary)` | Hash data with any algorithm |
| `Hash::md5($data, $binary)` | MD5 hash |
| `Hash::sha1($data, $binary)` | SHA-1 hash |
| `Hash::sha256($data, $binary)` | SHA-256 hash |
| `Hash::sha512($data, $binary)` | SHA-512 hash |
| `Hash::file($filepath, $algorithm, $binary)` | Hash a file |
| `Hash::salted($data, $salt, $algorithm)` | Hash data with a salt |
| `Hash::peppered($data, $pepper, $algorithm)` | Hash data with a pepper (HMAC-based) |
| `Hash::checksum($data, $algorithm)` | Generate a checksum |
| `Hash::verifyChecksum($data, $checksum, $algorithm)` | Verify a checksum |

### HMAC & Comparison Methods

| Method | Description |
|---|---|
| `Hash::hmac($data, $key, $algorithm, $binary)` | Generate an HMAC |
| `Hash::verifyHmac($data, $hmac, $key, $algorithm)` | Verify an HMAC |
| `Hash::equals($known, $user)` | Timing-safe string comparison |

### Token & ID Methods

| Method | Description |
|---|---|
| `Hash::token($length)` | Generate a secure URL-safe hex token |
| `Hash::random($length, $algorithm)` | Generate a random hash |
| `Hash::unique($prefix, $algorithm)` | Generate a unique time-based hash |
| `Hash::uuid()` | Generate a UUID v4 |

### Utility Methods

| Method | Description |
|---|---|
| `Hash::algorithms()` | List all available hash algorithms |
| `Hash::isAlgorithmSupported($algorithm)` | Check if an algorithm is supported |