# Installation
## Requirements

- PHP 8.1 or higher
- Composer
- Node.js & npm (for Vite and frontend assets)

## Create a New Project

Create a new Webrium project using Composer:

```bash
composer create-project webrium/webrium my-app
```

This downloads the framework along with its core dependencies (`webrium/core`, `webrium/foxdb`, `webrium/view`, `webrium/console`) and sets up your project structure.

## Install Frontend Dependencies

Webrium ships with Vite and TailwindCSS configured out of the box. Install the frontend dependencies:

```bash
cd my-app
npm install
```

## Run the Development Server

Start both the PHP server and the Vite dev server:

```bash
npm run dev
```

Then open your browser at:

```
http://localhost:8000
```

## Environment File

On installation, Composer automatically copies `.env.example` to `.env`. This file holds your environment-specific configuration — database credentials, app settings, and other variables accessible via the `env()` helper.

If for any reason `.env` was not created automatically, copy it manually:

```bash
cp .env.example .env
```

## The `webrium` CLI Binary

After installation, a `webrium` executable is placed in your project root. This is the Webrium Console — used for running CLI commands, generators, and other development tasks. Run it with:

```bash
./webrium
```

## Next Steps

- [Directory Structure](./02-directory-structure.md) — understand how a Webrium project is organized
- [Request Lifecycle](./03-lifecycle.md) — see how a request flows through the framework
- [Configuration](./04-configuration.md) — environment variables and application config