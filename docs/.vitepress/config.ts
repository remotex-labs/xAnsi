/**
 * Type-only imports erased during TypeScript compilation.
 */

import type { NavItemType, SidebarItemType } from '@viteplus/versions';

/**
 * Imports
 */

import { defineVersionedConfig } from '@viteplus/versions';

/**
 * One documentation page, in the form both the nav and the sidebar accept.
 */

interface PageInterface {
    text: string;
    link: string;
}

/**
 * The pages one version carries, grouped by the section they sit under.
 */

interface VersionPagesInterface {
    components: Array<PageInterface>;
}

/**
 * Every page any version has ever carried, named once so a version lists names rather than links.
 */

const Pages = {
    ansi: { text: 'ANSI', link: '/guide/ansi' },
    xterm: { text: 'xTerm', link: '/guide/xterm' },
    shadow: { text: 'Shadow', link: '/guide/shadow' }
} as const satisfies Record<string, PageInterface>;

/**
 * What each version carries, keyed by the directory it is archived under, `root` being the current line.
 *
 * @remarks
 * A version key does not inherit from `root` in `@viteplus/versions`, so each one states its whole set.
 * Stating it as pages rather than as two trees is what keeps that from being written twice per version.
 */

const VersionPages: Record<string, VersionPagesInterface> = {
    root: {
        components: [ Pages.ansi, Pages.xterm, Pages.shadow ]
    }
};

/**
 * Builds one version's top bar from the pages it carries.
 */

function navOf({ components }: VersionPagesInterface): Array<NavItemType> {
    return [
        { text: 'Home', link: '/' },
        { text: 'Guide', link: '/guide' },
        { text: 'Components', items: components },
        { component: 'VersionSwitcher' }
    ];
}

/**
 * Builds one version's sidebar from the pages it carries.
 */

function sidebarOf({ components }: VersionPagesInterface): Array<SidebarItemType> {
    return [
        { text: 'Getting Started', link: '/guide' },
        { text: 'Release Notes', link: '/release' },
        { text: 'Components', collapsed: false, items: components }
    ];
}

/**
 * Runs a builder over every version and keys the results the way the plugin expects.
 */

function perVersion<T>(build: (pages: VersionPagesInterface) => T): Record<string, T> {
    return Object.fromEntries(
        Object.entries(VersionPages).map(([ version, pages ]) => [ version, build(pages) ])
    );
}

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

        nav: perVersion(navOf),
        sidebar: perVersion(sidebarOf),

        socialLinks: [
            { icon: 'github', link: 'https://github.com/remotex-labs/xAnsi' },
            { icon: 'npm', link: 'https://www.npmjs.com/package/@remotex-labs/xansi' }
        ],

        docFooter: {
            prev: true,
            next: true
        },
        footer: {
            message: 'Released under the Mozilla Public License 2.0',
            copyright: `Copyright © ${ new Date().getFullYear() } @remotex-labs/xansi Contributors`
        }
    }
});
