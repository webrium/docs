# Events
Webrium ships a simple publish/subscribe system, useful for decoupling parts of your application — for example, sending a welcome email when a user registers, without coupling the registration logic directly to the mailer.

## Registering Listeners

Use `Event::on()` to register a listener that runs **every time** an event is emitted:

```php
use Webrium\Event;

Event::on('user.registered', function ($user) {
    // send welcome email, log activity, etc.
});
```

## Emitting Events

```php
Event::emit('user.registered', $user);
```

Any number of arguments can be passed to `emit()` — they are forwarded to every listener in the same order:

```php
Event::emit('order.placed', $order, $user);

Event::on('order.placed', function ($order, $user) {
    // ...
});
```

## One-Time Listeners

`Event::once()` registers a listener that runs only the **first** time the event is emitted, and is then automatically removed:

```php
Event::once('app.booted', function () {
    // runs only on the first boot
});

Event::emit('app.booted'); // listener runs
Event::emit('app.booted'); // listener does NOT run again
```

This is useful for one-time setup tasks, initialization hooks, or guarding against duplicate processing. One-shot listeners are de-queued before they run, so even if the callback re-emits the same event, it will not fire itself a second time.

## Checking for Listeners

```php
if (Event::has('user.registered')) {
    // at least one listener (persistent or one-time) is registered
}
```

## Removing Listeners

```php
Event::remove('user.registered');
```

This removes **all** listeners — both persistent and one-time — registered for the event.

## Example: Decoupling Registration Logic

```php
// In a service provider or bootstrap file:
use Webrium\Event;

Event::on('user.registered', function ($user) {
    Mailer::send($user->email, 'welcome', ['name' => $user->name]);
});

Event::on('user.registered', function ($user) {
    Log::info("New user registered: {$user->email}");
});
```

```php
// In the controller:
namespace App\Controllers;

use Webrium\Event;

class AuthController
{
    public function register()
    {
        $user = User::create(input());

        Event::emit('user.registered', $user);

        return ['status' => 'registered'];
    }
}
```

The controller does not need to know about email or logging — it just announces that registration happened.

## Framework Events

Some framework subsystems emit events of their own that your application can listen for. The most useful one is `error`, emitted by the error handler every time an error is captured:

```php
Event::on('error', function ($data) {
    // $data: ['message', 'line', 'file', 'type', 'is_fatal']
});
```