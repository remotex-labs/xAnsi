/**
 * Type-only imports erased during TypeScript compilation.
 */

import type { xBuildConfig } from '@remotex-labs/xbuild';

/**
 * Imports
 */

import { version } from 'process';
import pkg from './package.json' with { type: 'json' };

/**
 * Config build
 */

export const config: xBuildConfig = {
    common: {
        declaration: {
            outDir: 'dist'
        },
        esbuild: {
            bundle: true,
            minify: false,
            target: [ `node${ version.slice(1) }` ],
            platform: 'node',
            packages: 'external',
            sourcemap: 'linked',
            minifySyntax: true,
            minifyIdentifiers: true,
            sourceRoot: `https://github.com/remotex-labs/xAnsi/tree/v${ pkg.version }/`,
            entryPoints: {
                'index': 'src/index.ts'
            }
        }
    },
    variants: {
        esm: {
            esbuild: {
                format: 'esm',
                outdir: 'dist/esm'
            }
        },
        cjs: {
            declaration: false,
            esbuild: {
                format: 'cjs',
                outdir: 'dist/cjs'
            }
        }
    }
};
