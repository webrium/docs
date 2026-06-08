import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Webrium',
  description: 'Fast, Lightweight PHP Framework for Modern Web Applications',
  lang: 'en-US',

  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'theme-color', content: '#3b82f6' }],
    ['meta', { name: 'og:type', content: 'website' }],
    ['meta', { name: 'og:locale', content: 'en' }],
    ['meta', { name: 'og:site_name', content: 'Webrium Docs' }],
  ],

  themeConfig: {
    logo: '/logo.svg',
    siteTitle: 'Webrium',

    nav: [
      { text: 'Guide', link: '/getting-started/introduction' },
      { text: 'Core', link: '/core/routing' },
      { text: 'Database', link: '/database/query-builder' },
      {
        text: 'Packages',
        items: [
          { text: 'View (Template Engine)', link: '/packages/view' },
          { text: 'Console (CLI)', link: '/packages/console' },
          { text: 'Sitemap', link: '/packages/sitemap' },
        ]
      },
      {
        text: 'GitHub',
        link: 'https://github.com/webrium/webrium',
        target: '_blank'
      }
    ],

    sidebar: {
      '/getting-started/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Introduction', link: '/getting-started/introduction' },
            { text: 'Installation', link: '/getting-started/installation' },
            { text: 'Directory Structure', link: '/getting-started/directory-structure' },
            { text: 'Configuration', link: '/getting-started/configuration' },
          ]
        }
      ],

      '/core/': [
        {
          text: 'Core',
          items: [
            { text: 'App (Bootstrap)', link: '/core/app' },
            { text: 'Routing', link: '/core/routing' },
            { text: 'Controllers', link: '/core/controllers' },
            { text: 'Middleware', link: '/core/middleware' },
            { text: 'Helper Functions', link: '/core/helpers' },
          ]
        },
        {
          text: 'Request & Response',
          items: [
            { text: 'URL Utilities', link: '/core/url' },
            { text: 'HTTP Headers', link: '/core/headers' },
            { text: 'HTTP Client', link: '/core/http-client' },
          ]
        },
        {
          text: 'Data & Storage',
          items: [
            { text: 'Session', link: '/core/session' },
            { text: 'Flash Messages', link: '/core/flash' },
            { text: 'File Management', link: '/core/file' },
            { text: 'File Upload', link: '/core/upload' },
          ]
        },
        {
          text: 'Security',
          items: [
            { text: 'Hash & Passwords', link: '/core/hash' },
            { text: 'JWT', link: '/core/jwt' },
            { text: 'Form Validation', link: '/core/validation' },
            { text: 'CORS', link: '/core/cors' },
          ]
        },
        {
          text: 'Utilities',
          items: [
            { text: 'Email', link: '/core/email' },
            { text: 'Vite Integration', link: '/core/vite' },
            { text: 'Localization', link: '/core/localization' },
          ]
        }
      ],

      '/database/': [
        {
          text: 'FoxDB',
          items: [
            { text: 'Introduction', link: '/database/introduction' },
            { text: 'Configuration', link: '/database/configuration' },
            { text: 'Query Builder', link: '/database/query-builder' },
            { text: 'Eloquent ORM', link: '/database/eloquent' },
            { text: 'Schema Builder', link: '/database/schema' },
          ]
        }
      ],

      '/packages/': [
        {
          text: 'Packages',
          items: [
            { text: 'View (Template Engine)', link: '/packages/view' },
            { text: 'Console (CLI)', link: '/packages/console' },
            { text: 'Plugin System', link: '/packages/plugins' },
            { text: 'Sitemap', link: '/packages/sitemap' },
          ]
        }
      ]
    },

    editLink: {
      pattern: 'https://github.com/webrium/webrium/edit/main/docs/:path',
      text: 'Edit this page on GitHub'
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/webrium/webrium' }
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © Webrium'
    },

    search: {
      provider: 'local'
    },

    outline: {
      level: [2, 3],
      label: 'On this page'
    }
  },

  markdown: {
    lineNumbers: true
  }
})
