# JWT In Webrium Core

A lightweight, framework-integrated JSON Web Token (JWT) utility designed for secure token generation and verification using HMAC-based algorithms. This component is intended to be used internally within the framework and provides a clean, minimal API with a strong focus on correctness and security.

## Overview

The `Jwt` class enables:

- Generation of signed JWT tokens
- Verification and validation of JWT tokens
- Safe extraction of payload data
- Support for standard HMAC-based JWT algorithms

It is implemented with strict typing, timing-attack safe comparisons, and Base64Url encoding compliant with the JWT specification (RFC 7519).

## Supported Algorithms

The component currently supports the following JWT algorithms:

- `HS256` (HMAC using SHA-256)
- `HS384` (HMAC using SHA-384)
- `HS512` (HMAC using SHA-512)

If an unsupported algorithm is provided, the constructor will throw an `InvalidArgumentException`.

## Basic Usage

### Creating an Instance

```php
use webrium\Jwt;

$jwt = new Jwt('your-secret-key'); // Default algorithm: HS256
```

You may explicitly specify the algorithm:

```php
$jwt = new Jwt('your-secret-key', 'HS512');
```

## Generating a Token

To generate a JWT token, pass an associative array as the payload:

```php
$payload = [
    'user_id' => 123,
    'role' => 'admin',
    'iat' => time()
];

$token = $jwt->generateToken($payload);
```

The generated token consists of:

- A standard JWT header (`typ`, `alg`)
- A Base64Url-encoded JSON payload
- A cryptographically secure HMAC signature

## Verifying a Token

To verify a token and retrieve its payload:

```php
$data = $jwt->verifyToken($token);

if ($data === null) {
    // Token is invalid or signature verification failed
}
```

Verification includes:

- Structural validation (three JWT segments)
- Recalculation of the signature
- Timing-attack safe signature comparison using `hash_equals`

If verification fails, `null` is returned.

## Accessing Payload Without Verification

If you need to read the payload **without validating the signature** (use with caution):

```php
$payload = Jwt::getPayload($token);
```

This method:

- Does not verify the token signature
- Should only be used for non-security-critical operations

## Payload Decoding Behavior

- Payloads are decoded into associative arrays
- Invalid or malformed JSON payloads return `null`

## Security Considerations

- All signatures are generated using `hash_hmac` with raw binary output
- Signature comparison is resistant to timing attacks
- Only explicitly supported algorithms can be used
- No implicit algorithm negotiation is performed

This component does **not**:

- Enforce standard JWT claims (`exp`, `nbf`, `aud`, etc.)
- Automatically validate token expiration or issuer

Such validations should be implemented at the application or middleware level as needed.


