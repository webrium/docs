# Installation

## Requirements

- PHP **8.1** or higher
- [Composer](https://getcomposer.org/)
- Node.js & npm (for frontend assets with Vite)

## Create a New Project

Create a new Webrium project using Composer's `create-project` command:

```bash
composer create-project webrium/webrium my-app
```

Move into your new project directory:

```bash
cd my-app
```

## Install Frontend Dependencies

Webrium ships with Vite and TailwindCSS pre-configured. Install the Node.js dependencies:

```bash
npm install
```

## Start the Development Server

Start the PHP development server and the Vite dev server:

```bash
# In one terminal — PHP server
php -S localhost:8000 -t public

# In another terminal — Vite dev server
npm run dev
```

Open your browser at `http://localhost:8000`.

## Using the Console

After installation, the `php webrium` console tool is available for scaffolding:

```bash
# Initialize project directories (run once after install)
php webrium init

# Generate a new controller
php webrium make:controller User

# Generate a new model with DB table
php webrium make:model User --table=users

# Generate a route file
php webrium make:route Api
```

## Environment Configuration

Copy `.env.example` to `.env` and update your settings:

```bash
cp .env.example .env
```

Edit `.env` with your database and app settings:

```
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=my_app
DB_USERNAME=root
DB_PASSWORD=
```

## Verify Installation

If the welcome page loads at `http://localhost:8000`, the installation was successful.

## Next Steps

- [Directory Structure](/getting-started/directory-structure) — understand the project layout
- [Configuration](/getting-started/configuration) — detailed environment configuration
- [Routing](/core/routing) — start defining your routes
