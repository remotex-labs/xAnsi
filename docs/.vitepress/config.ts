/**
 * Imports
 */

import { defineVersionedConfig } from '@viteplus/versions';

/**
 * Doc config
 */

export default defineVersionedConfig({
    title: 'xAnsi',
    base: '/xAnsi/',
    description: 'A lightweight ANSI utility library for styling terminal output',
    head: [
        [ 'link', { rel: 'icon', type: 'image/png', href: '/xAnsi/logo.png' }],
        [ 'meta', { name: 'theme-color', content: '#ff7e17' }],
        [ 'script', { async: '', src: 'https://www.googletagmanager.com/gtag/js?id=G-ZL5X4BWS6C' }],
        [
            'script', {},
            'window.dataLayer = window.dataLayer || [];function gtag(){ dataLayer.push(arguments); }gtag(\'js\', new Date());gtag(\'config\', \'G-ZL5X4BWS6C\');'
        ]
    ],
    versionsConfig: {
        current: 'v1.3.x',
        versionSwitcher: false
    },
    themeConfig: {
        logo: '/logo.png',

        search: {
            provider: 'local'
        },

        nav: [
            { text: 'Home', link: '/' },
            { text: 'Guide', link: '/guide' },
            { component: 'VersionSwitcher' }
        ],

        sidebar: [
            {
                base: 'guide',
                items: [
                    { text: 'Ansi', link: '/ansi' },
                    { text: 'xTerm', link: '/xterm' },
                    { text: 'Shadow', link: '/shadow' }
                ]
            }
        ],

        socialLinks: [
            { icon: 'github', link: 'https://github.com/remotex-labs/xAnsi' },
            { icon: 'npm', link: 'https://www.npmjs.com/package/@remotex-labs/xansi' }
        ],

        docFooter: {
            prev: false,
            next: false
        },

        footer: {
            message: 'Released under the Mozilla Public License 2.0',
            copyright: `Copyright © ${ new Date().getFullYear() } @remotex-labs/xansi Contributors`
        }
    }
});
