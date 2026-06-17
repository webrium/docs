# JSON Web Tokens (JWT)
The `Jwt` class issues and verifies signed JSON Web Tokens. It is the standard way to implement stateless authentication in Webrium: a token is signed when a user logs in, sent back on every request, and verified on the server without needing to store session state.

A token carries a **payload** of claims (such as the user's ID), a **header** describing how it was signed, and a **signature** that proves the payload has not been altered. Webrium signs tokens with HMAC-SHA and verifies both the signature and the standard time-based claims for you.

## Getting Started

Create an instance with your application secret, then generate and verify tokens:

```php
use Webrium\Jwt;

$jwt = new Jwt(env('JWT_SECRET'));

// Issue a token that expires in one hour
$token = $jwt->generateToken(['user_id' => $user->id], 3600);

// Later, on an incoming request
$payload = $jwt->verifyToken($token);

if ($payload === null) {
    return respond(['error' => 'Invalid or expired token'], 401);
}

$userId = $payload['user_id'];
```

That is the whole lifecycle. If `verifyToken()` returns an array, the token is authentic and still valid — you can trust its claims. If it returns `null`, the token was tampered with, signed with a different secret, malformed, or expired.

## The Secret Key

The secret key is what makes a token trustworthy: only someone holding it can produce a valid signature. Keep it out of your codebase and load it from the environment:

```php
$jwt = new Jwt(env('JWT_SECRET'));
```

The key must be **at least 32 bytes** long. A short or guessable key undermines every token your application issues, so generate a strong random value once and store it as `JWT_SECRET`:

```php
$secret = Webrium\Hash::token(64); // generate once, then save to your .env
```

## Issuing Tokens

`generateToken()` takes your claims and an optional lifetime in seconds:

```php
// Token valid for 15 minutes
$token = $jwt->generateToken(['user_id' => 1, 'role' => 'admin'], 900);

// Token without a built-in expiration
$token = $jwt->generateToken(['user_id' => 1]);
```

An `iat` (issued-at) claim is added automatically so you always know when a token was created. When you pass a lifetime, an `exp` (expiration) claim is set for you. Choose a lifetime that fits the token's purpose — short for access tokens, longer for tokens that are harder to reissue.

The payload is yours to shape. Store whatever your application needs to identify the request, but keep it small and avoid putting sensitive data in it, since the payload is readable by anyone holding the token.

### Standard Claims

A few claim names have built-in meaning and are validated automatically during verification:

| Claim | Meaning | Behaviour |
|-------|---------|-----------|
| `exp` | Expiration time | Token is rejected once this time has passed. |
| `nbf` | Not-before time | Token is rejected until this time is reached. |
| `iat` | Issued-at time | Added automatically; tokens dated in the future are rejected. |

You can set `nbf` yourself to issue a token that only becomes active later:

```php
$token = $jwt->generateToken([
    'user_id' => 1,
    'nbf'     => time() + 60, // usable starting one minute from now
], 3600);
```

## Verifying Tokens

`verifyToken()` performs every check needed to trust a token in one call: it confirms the structure is well-formed, recomputes the signature and compares it in constant time, and validates the `exp`, `nbf`, and `iat` claims.

```php
$payload = $jwt->verifyToken($token);

if ($payload === null) {
    // not authentic, or no longer valid
    return respond(['error' => 'Unauthorized'], 401);
}

// safe to use
$userId = $payload['user_id'];
```

Because expiration is handled inside `verifyToken()`, a non-null result means the token is both authentic and currently valid — there is no separate expiry check to remember.

### Clock Skew

When tokens are issued and verified on different machines, small differences between their clocks can cause a token to look expired or not-yet-valid by a second or two. Allow a tolerance by passing a leeway, in seconds, to the constructor:

```php
$jwt = new Jwt(env('JWT_SECRET'), 'HS256', 30); // tolerate 30s of clock drift
```

The leeway applies to all time-based claims. The default is `0`, which enforces times exactly.

## Choosing an Algorithm

Tokens are signed with HMAC-SHA256 by default. You can choose a stronger digest by passing the algorithm as the second argument:

```php
$jwt = new Jwt(env('JWT_SECRET'), 'HS512'); // HS256 (default), HS384, or HS512
```

The algorithm is fixed for the lifetime of the instance and is used for both signing and verifying, so a token must be verified with the same algorithm it was issued under. The algorithm written in a token's header is never used to decide how to verify it, which keeps verification predictable and tamper-proof.

## Reading a Token Without Verifying

Sometimes you want to peek at a token's claims without checking its signature — for logging, debugging, or routing on a non-sensitive claim. `getUnverifiedPayload()` decodes the payload directly:

```php
$claims = Jwt::getUnverifiedPayload($token);
```

The returned data is **not** verified: it may be forged, expired, or altered. Use it only for informational purposes, and always call `verifyToken()` before making any authentication or authorization decision.

## Middleware Example

A typical authentication middleware pulls the bearer token from the request, verifies it, and lets the request through when the payload is valid:

```php
namespace App\Middlewares;

use Webrium\Jwt;
use Webrium\Header;

class AuthMiddleware
{
    public function handle()
    {
        $token = Header::getBearerToken();

        if ($token === null) {
            return false;
        }

        $jwt     = new Jwt(env('JWT_SECRET'));
        $payload = $jwt->verifyToken($token);

        if ($payload === null) {
            return false;
        }

        // the authenticated user is available to the request
        request()->setUser($payload['user_id']);

        return true;
    }
}
```

Because `verifyToken()` already enforces expiration, the middleware only needs to check that a payload came back.

## Error Handling

The constructor and `generateToken()` throw `InvalidArgumentException` when given invalid input — an unsupported algorithm, a key shorter than 32 bytes, a negative leeway, or a non-positive token lifetime. These represent configuration mistakes, so they surface as exceptions rather than silent failures:

```php
use InvalidArgumentException;

try {
    $jwt = new Jwt(env('JWT_SECRET'));
} catch (InvalidArgumentException $e) {
    // misconfigured secret or algorithm
}
```

Verification never throws for an untrusted token. Any token that fails a check — bad signature, wrong format, expired, or not yet valid — simply returns `null`, so request handling stays on a single code path.

## Next Steps

- [Hashing](./02-hashing.md) — password hashing, HMACs, tokens, and UUIDs
- [Middleware](../routing/02-middleware.md) — protecting routes with JWT-based auth
- [Validation](./01-validation.md)