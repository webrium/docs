# Hashing
Webrium's `Hash` class provides password hashing, HMACs, checksums, tokens, and UUIDs through a single static API. It covers the common security primitives an application needs, with safe defaults.

## Password Hashing

Use `Hash::make()` to hash passwords before storing them, and `Hash::check()` to verify a password against a stored hash. Both are built on PHP's native `password_hash()` / `password_verify()`.

```php
use Webrium\Hash;

$hashed = Hash::make('user-password');

// Verify
if (Hash::check('user-password', $hashed)) {
    // password is correct
}
```

### Choosing an Algorithm

By default, `Hash::make()` uses `PASSWORD_DEFAULT` (currently bcrypt). You can specify Argon2 explicitly:

```php
Hash::make($password, PASSWORD_ARGON2ID);

// Shortcuts
Hash::bcrypt($password);
Hash::argon2i($password);
Hash::argon2id($password);
```

Each shortcut also accepts tuning parameters. `bcrypt()` takes a `$cost` (default 10), while `argon2i()` and `argon2id()` take `$memoryCost` (KiB), `$timeCost`, and `$threads`:

```php
Hash::bcrypt($password, 12);
Hash::argon2id($password, 65536, 4, 1);
```

### Inspecting a Hash

You can read back the algorithm and parameters baked into a stored hash:

```php
Hash::info($hash);          // ['algo' => ..., 'algoName' => 'bcrypt', 'options' => [...]]
Hash::getAlgorithm($hash);  // 'bcrypt', 'argon2i', 'argon2id', or null
```

### Rehashing on Login

If your application's hashing settings change over time (e.g. increasing bcrypt cost), use `checkAndRehash()` to verify and get a new hash in one step:

```php
$result = Hash::checkAndRehash($password, $user->password);

if ($result['verified']) {
    if ($result['hash'] !== null) {
        // settings have changed — update the stored hash
        $user->password = $result['hash'];
        $user->save();
    }
} else {
    // invalid password
}
```

You can also check independently:

```php
Hash::needsRehash($hash); // true if the hash should be regenerated
```

## Generating Tokens and Identifiers

```php
Hash::random(32);      // random hex string, exactly 32 chars
Hash::token(32);       // secure random hex token, exactly 32 chars (URL-safe)
Hash::unique('user_'); // unique hash derived from prefix + time + random bytes
Hash::uuid();          // RFC 4122 UUID v4
```

`random()` and `token()` draw from a cryptographically secure source and return exactly the requested number of hexadecimal characters, for any positive length. They are well suited to password reset tokens, API keys, file names, and similar identifiers. Both throw an `InvalidArgumentException` if the requested length is not a positive integer.

`unique()` returns a fixed-length digest (sha256 by default) computed from the prefix, the current time, and random bytes; you may pass a different algorithm as the second argument. The prefix is mixed into the hash, not prepended to the output.

## Hashing Data

For non-password data — checksums, cache keys, fingerprints — use the digest methods:

```php
Hash::sha256($data);
Hash::sha512($data);

Hash::digest($data, 'sha256');          // generic, any supported algorithm
Hash::digest($data, 'sha256', true);    // raw binary output
```

```php
Hash::algorithms();                     // list of supported algorithms
Hash::isAlgorithmSupported('sha256');   // bool
```

`Hash::md5()` and `Hash::sha1()` are also available, but only for checksums and non-security identifiers. Use SHA-256 or stronger when integrity matters, `make()` for passwords, and `hmac()` for signatures.

```php
Hash::md5($data);
Hash::sha1($data);
Hash::md5($data, true); // raw binary output
```

### File Hashing

```php
Hash::file($path);              // sha256 of file contents
Hash::file($path, 'md5');
```

`file()` returns `false` if the path does not exist.

## HMAC

For data that needs to be signed with a shared secret (e.g. webhook payloads):

```php
$signature = Hash::hmac($data, $secretKey);

if (Hash::verifyHmac($data, $signature, $secretKey)) {
    // signature is valid
}
```

## Timing-Safe Comparison

Use `Hash::equals()` instead of `===` when comparing secrets, tokens, or signatures, to avoid timing attacks:

```php
if (Hash::equals($storedToken, $providedToken)) {
    // tokens match
}
```

## Checksums

```php
$checksum = Hash::checksum($data);

if (Hash::verifyChecksum($data, $checksum)) {
    // data is unmodified
}
```

## Salted and Peppered Hashes

Both methods derive a keyed hash using HMAC, so the secret and the data stay cleanly separated:

```php
Hash::salted($data, $salt);              // keyed with a per-record salt
Hash::peppered($data, $appSecretPepper); // keyed with an application-wide secret
```

Use `salted()` with a value stored alongside each record, and `peppered()` with a single secret kept in your application configuration. For user passwords, prefer `make()`, which manages salting for you.

## Next Steps

- [JSON Web Tokens (JWT)](./jwt.md) — signing and verifying tokens for API authentication
- [Validation](./01-validation.md)
