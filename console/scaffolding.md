# Scaffolding

The scaffolding commands generate the boilerplate files you'd otherwise create by hand: models, controllers, route files, migrations, seeders, and the standard project directory layout. Every command supports `--force` / `-f` to overwrite an existing file.

| Command | Generates |
| --- | --- |
| `init` | The standard Webrium directory structure |
| `make:model` | A model class in the models directory |
| `make:controller` | A controller class in the controllers directory |
| `make:route` | A route file in the routes directory |
| `make:migration` | A timestamped migration file in `database/migrations` |
| `make:seeder` | A seeder class in `database/seeders` |

## `init`

Creates all standard Webrium project directories. Useful when bootstrapping a project that wasn't created from the `webrium/webrium` skeleton, or after a partial deletion.

```bash
php webrium init
```

The command creates the conventional folders — `app/Controllers`, `app/Models`, `app/Routes`, `app/Views`, `app/Config`, `database/Migrations`, `database/Seeders`, `storage/`, `public/`, and so on — if they don't already exist. Existing directories are left untouched.

---

## `make:model`

Generates a model class in the models directory.

```bash
php webrium make:model <Name> [--table=<table>] [--no-plural] [--force]
```

| Argument / Option | Description |
| --- | --- |
| `Name` | Model class name (e.g. `User`) |
| `--table`, `-t` | Database table name. If omitted, the name is auto-converted to `snake_case` and pluralised |
| `--no-plural` | Prevent automatic pluralisation of the table name |
| `--force`, `-f` | Overwrite if the file already exists |

There are **two stubs** the command can produce:

- Without `--table`: a simple model with no database wiring — useful for service classes or value objects that share the `app/Models` directory.
- With `--table`: a FoxDB-connected model extending `Foxdb\Eloquent\Model`, with the `$table` property pre-filled.

```bash
# DB-connected model with explicit table name
php webrium make:model User --table=users

# DB-connected model — table name auto-generated as "users"
php webrium make:model User -t

# Simple model (no DB wiring)
php webrium make:model UserHelper

# DB model — table stays "status" instead of "statuses"
php webrium make:model Status -t --no-plural
```

### Auto-pluralisation rules

The default behaviour matches FoxDB's own table-name inference: the class name is converted to `snake_case` and a plural `s` is appended. So `UserProfile` becomes `user_profiles`. Pass `--no-plural` when your table already has an irregular plural or you specifically don't want one (the `Status` example above is the canonical case).

---

## `make:controller`

Generates a controller class in the controllers directory. The command automatically appends `Controller` to the class name if you didn't include it yourself.

```bash
php webrium make:controller <Name> [--namespace=<Namespace>] [--force]
```

| Argument / Option | Description |
| --- | --- |
| `Name` | Controller name (e.g. `User` → `UserController`) |
| `--namespace` | Custom namespace (default: `App\Controllers`) |
| `--force`, `-f` | Overwrite if the file already exists |

```bash
php webrium make:controller User
# Creates app/Controllers/UserController.php

php webrium make:controller Admin --namespace="App\Controllers\Admin"
# Creates app/Controllers/Admin/AdminController.php
```

The generated controller is a plain class with no required base class to extend — Webrium's `Kernel` instantiates any class and calls the method directly. See *Core → Controllers* for the dispatch model.

---

## `make:route`

Generates a route file in the routes directory.

```bash
php webrium make:route <Name> [--force]
```

| Argument / Option | Description |
| --- | --- |
| `Name` | Route file name (e.g. `Api` → `Api.php`) |
| `--force`, `-f` | Overwrite if the file already exists |

```bash
php webrium make:route Api
# Creates app/Routes/Api.php

php webrium make:route Web --force
# Overwrites app/Routes/Web.php
```

To load the new file at boot, add it to `Route::source()` in `public/index.php`:

```php
Route::source(['Web.php', 'Api.php']);
```

---

## `make:migration`

Generates a timestamped migration file in `database/migrations`. Built on top of [`webrium/foxdb`](https://github.com/webrium/foxdb)'s migration system.

```bash
php webrium make:migration <name> [--table=<table>] [--force]
```

| Argument / Option | Description |
| --- | --- |
| `name` | Migration name in snake_case (e.g. `create_posts_table`) |
| `--table`, `-t` | Explicit table name. If omitted, it's inferred from the migration name |
| `--force`, `-f` | Allow generating another migration with the same descriptive name |

The generated file follows the convention `YYYY_MM_DD_HHMMSS_<name>.php`. The timestamp prefix determines run order — never edit it after the fact, or migrations may run out of order on other developers' machines.

### Stub selection

The command picks one of two stubs based on the migration name:

| Pattern | Stub |
| --- | --- |
| `create_..._table` | **Create stub** — `Schema::create()` is pre-filled with `id()` and `timestamps()`, ready for you to add columns |
| `add_..._to_..._table` / `remove_..._from_..._table` | **Update stub** — empty `Schema::table()` blocks in both `up()` and `down()` |
| Anything else | Falls back to the create stub |

The table name is inferred from the migration name in every case, unless `--table` is given explicitly.

```bash
# Create stub — Schema::create('posts', ...) is pre-filled
php webrium make:migration create_posts_table

# Update stub — Schema::table('posts', ...) with an empty body
php webrium make:migration add_status_to_posts_table
php webrium make:migration remove_legacy_id_from_posts_table

# Explicit table name, useful when the migration name doesn't follow either convention
php webrium make:migration setup_indexes --table=posts

# Allow a second migration with the same descriptive name
# (a different timestamp prefix is generated)
php webrium make:migration create_posts_table --force
```

For details on writing migrations and the underlying `Migrator` API, see *Database → Migrations, Schema & Seeders*.

---

## `make:seeder`

Generates a seeder class in `database/seeders`. Built on top of FoxDB's `Foxdb\Seeders\Seeder` base class.

```bash
php webrium make:seeder <Name> [--force]
```

| Argument / Option | Description |
| --- | --- |
| `Name` | Seeder class name (e.g. `UsersSeeder`). Auto-converted to PascalCase if given in snake_case |
| `--force`, `-f` | Overwrite if the file already exists |

```bash
php webrium make:seeder UsersSeeder
php webrium make:seeder roles_seeder        # generated as RolesSeeder.php
php webrium make:seeder UsersSeeder --force
```

The generated stub:

```php
<?php

use Foxdb\DB;
use Foxdb\Seeders\Seeder;

class UsersSeeder extends Seeder
{
    public function run(): void
    {
        // DB::table('users')->insert([
        //     'name'  => 'Admin',
        //     'email' => 'admin@example.com',
        // ]);

        // To call other seeders:
        // $this->call(RolesSeeder::class);
    }
}
```

Inside a seeder, you can chain to other seeders with `$this->call(ClassName::class)`, which accepts a class name or an array of class names. The common pattern is a top-level `DatabaseSeeder` that orchestrates the rest — see *Database → Migrations, Schema & Seeders*.
