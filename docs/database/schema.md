# `Schema` Class Documentation

The `Schema` class in the `Foxdb` namespace provides a simple and intuitive interface for creating and modifying database tables. It offers various methods for defining different types of table columns, indices and constraints. Here is the documentation for the available public methods:

## `__construct($table)`

The constructor method accepts a single argument `$table`, which is the name of the database table to create or modify.

```php
// ...
use Foxdb\Schema;
// ...
```

```PHP
$schema = new Schema('users');
```

<br>

## Numeric

### `id($name='id')` or `bigId($name='id')`

This method adds an auto-incrementing integer column with the specified name `$name`, defaulting to `'id'`. It also declares the column as the primary key of the table.

```php
$schema->id(); // creates an 'id' column
// OR
$schema->bigId();
```

### `tinyInt($name)`
This method adds an tiny integer column with the specified name `$name`.

### `smallInt($name)`
This method adds an small integer column with the specified name `$name`.

### `mediumInt($name)`
This method adds an medium integer column with the specified name `$name`.


### `integer($name)`

This method adds an integer column with the specified name `$name`.

```php
$schema->integer('age');
```

### `bigInt($name)`

This method adds an big integer column with the specified name `$name`.

```php
$schema->bigInt('age');
```

### `boolean($name)`

This method adds a boolean column with the specified name `$name`.

```php
$schema->boolean('is_active');
```


### `float($name, $length='10,2')`

This method adds a float column with the specified name `$name` and length `$length`, defaulting to `'10, 2'`.

```php
$schema->float('price', '8,2');
```

### `double($name, $length='10,2')`

This method adds a double-precision float column with the specified name `$name` and length `$length`, defaulting to `'10, 2'`.

```php
$schema->double('salary', '15, 2');
```


<br>

## String

### `string($name, $length=255)`

This method adds a string column with the specified name `$name` and length `$length`, defaulting to `255`.

```php
$schema->string('name');
$schema->string('email', 100);
```

### `tinyText($name)`
This method adds a tiny text column with the specified name `$name`.

### `mediumText($name)`
This method adds a medium text column with the specified name `$name`.

### `text($name)`

This method adds a text column with the specified name `$name`.

```php
$schema->text('bio');
```

### `longText($name)`
This method adds a long text column with the specified name `$name`.

```php
$schema->longText('description');
```

### `json($name)`

This method adds a JSON column with the specified name `$name`.

```php
$schema->json('data');
```


## `enum($name, array $values)`

This method adds an enumeration column named `$name` with the allowed values specified in the `$values` array.

```php
$schema->enum('gender', ['male', 'female', 'other']);
```


<br>

## Date and time

### `timestamps()`

This method adds two timestamp columns named `'created_at'` and `'updated_at'` to the table.

```php
$schema->timestamps();
```

### `time($name)`

This method adds a time column with the specified name `$name`.

```php
$schema->time('duration');
```

### `date($name)`

This method adds a date column with the specified name `$name`.

```php
$schema->date('birthday');
```


### `year($name)`

This method adds a year column with the specified name `$name`.

```php
$schema->year('born_year');
```

<br>

## Properties

### `default($value)`

This method sets the default value of the last column added to `$value`.

```php
$schema->string('name')->default('John Doe');
```

### `nullable()`

This method sets the nullable property of the last added column to `true`.

```php
$schema->string('phone')->nullable();
```

### `utf8mb4($collation='utf8mb4_unicode_ci')`

This method sets the collation of the last added column to `utf8mb4` and the specified `$collation`.

```php
$schema->string('name')->utf8mb4();
```

### `utf8($collation='utf8_unicode_ci')`

This method sets the collation of the last added column to `utf8` and the specified `$collation`.

```php
$schema->string('email')->utf8();
```


<br>

## Column methods

### `addColumn()`

This method adds a new column

```php
$schema->addColumn()->text('description')->change();
```

### `renameColumn($name, $new_name, $type)`

This method renames the column with the specified name `$name` to `$new_name` and changes its SQL data type to `$type`.

```php
$schema->renameColumn('old_name')->string('new_name')->change();
```

### `modifyColumn()`

This method modifies the SQL data type of the column with the specified name `$name` to `$type`.

```php
$schema->modifyColumn()->string('field_name')->change();
```

### `dropColumn($name)`

This method drops the column with the specified name `$name`.

```php
$schema->dropColumn('phone')->change();
```





<br>

## Index methods

### `addIndex($name, $columns, $type='INDEX')`

This method adds an index with the specified name `$name` on the columns specified in the `$columns` array. The optional parameter `$type` specifies the type of index, defaulting to `INDEX`.

```php
$schema->addIndex('age_index', ['age', 'created_at'], 'UNIQUE')->change();
```

### `dropIndex($name)`

This method drops the index with the specified name `$name`.

```php
$schema->dropIndex('email_index')->change();
```


<br>

## Table methods

### `create($engine='InnoDB', $charset='utf8mb4', $collate='utf8mb4_unicode_ci')`

This method generates and executes an SQL query to create the table using the columns and constraints defined previously.

```php
$sql = $schema->create();
```

### `drop()`

This method generates and executes an SQL query to drop the table if it exists.

```php
$sql = $schema->drop();
```

<br>

## Examples

Here are some usage examples for the `Schema` class:

```php
// create a table with id, name, email and password columns
$schema = new Foxdb\Schema('users');
$schema->id()
       ->string('name')
       ->string('email')
       ->string('password')
       ->create();

// add an age column to the table
$schema->addColumn()->integer('age')->after('name')->nullable()->default(18)->change();

// rename the email column to login_email
$schema->renameColumn('mail')->string('email')->change();

// drop the password column from the table
$schema->dropColumn('password')->change();

// add an index on the name column
$schema->addIndex('name_index', ['username'])->change();

// drop the users table
$sql = $schema->drop();
```
