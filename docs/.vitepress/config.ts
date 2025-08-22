/**
 * Import will remove at compile time
 */

import type { UserConfig } from 'vitepress';

/**
 * Imports
 */

import defineVersionedConfig from 'vitepress-versioning-plugin';

/**
 * Doc config
 */

export default defineVersionedConfig({
    title: 'xAnsi',
    base: '/xAnsi/',
    srcDir: 'src',
    description: 'A lightweight ANSI utility library for styling terminal output',
    head: [
        [ 'link', { rel: 'icon', type: 'image/png', href: '/xAnsi/xansi.png' }],
        [ 'meta', { name: 'theme-color', content: '#ff7e17' }],
        [ 'script', { async: '', src: 'https://www.googletagmanager.com/gtag/js?id=G-ZL5X4BWS6C' }],
        [
            'script', {},
            'window.dataLayer = window.dataLayer || [];function gtag(){ dataLayer.push(arguments); }gtag(\'js\', new Date());gtag(\'config\', \'G-ZL5X4BWS6C\');'
        ]
    ],
    themeConfig: {
        logo: '/xansi.png',
        versionSwitcher: false,

        search: {
            provider: 'local'
        },

        nav: [
            { text: 'Home', link: '.' },
            {
                component: 'VersionSwitcher'
            }
        ],

        sidebar: {
            '/': [
                { text: 'Guide', link: '.' },
                { text: 'Ansi', link: './ansi' },
                { text: 'xTerm', link: './xterm' },
                { text: 'Shadow', link: './shadow' }
            ]
        },

        socialLinks: [
            { icon: 'github', link: 'https://github.com/remotex-labs/xAnsi' },
            { icon: 'npm', link: 'https://www.npmjs.com/package/@remotex-labs/xansi' }
        ],

        docFooter: {
            prev: false,
            next: false
        }
    },
    versioning: {
        latestVersion: 'v1.0.x'
    }
}, __dirname) as UserConfig;
