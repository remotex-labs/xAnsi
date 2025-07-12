/**
 * Import will remove at compile time
 */

import type { StyleCodeType } from '@providers/interfaces/styles-provider.interface';

/**
 * Collection of ANSI text modifier codes for terminal styling
 *
 * @returns An object mapping modifier names to their corresponding ANSI style codes
 *
 * @remarks
 * Provides commonly used text modifiers like bold, dim, etc. Each entry contains
 * a pair of codes: the first to apply the style and the second to reset it.
 * These modifiers change the appearance of text without affecting its color.
 *
 * @example
 * ```ts
 * // Apply bold styling to text
 * const boldCode = ansiModifiers.bold;
 * console.log(`\x1b[${boldCode[0]}mBold Text\x1b[${boldCode[1]}m`);
 * ```
 *
 * @see StyleCodeType
 * @since 1.0.0
 */

export const ansiModifiers = {
    dim: [ 2, 22 ],
    bold: [ 1, 22 ],
    reset: [ 0, 0 ],
    hidden: [ 8, 28 ],
    inverse: [ 7, 27 ]
} satisfies Record<string, StyleCodeType>;

/**
 * Collection of ANSI foreground color codes for terminal text coloring
 *
 * @returns An object mapping color names to their corresponding ANSI foreground style codes
 *
 * @remarks
 * Provides standard and bright variants of terminal foreground colors.
 * Each entry contains a pair of codes: the first to apply the color and
 * the second (39) to reset to the default foreground color.
 *
 * @example
 * ```ts
 * // Apply red foreground color to text
 * const redCode = ansiForegroundColors.red;
 * console.log(`\x1b[${redCode[0]}mRed Text\x1b[${redCode[1]}m`);
 *
 * // Apply bright blue color
 * const brightBlueCode = ansiForegroundColors.blueBright;
 * console.log(`\x1b[${brightBlueCode[0]}mBright Blue\x1b[${brightBlueCode[1]}m`);
 * ```
 *
 * @see StyleCodeType
 * @since 1.0.0
 */

export const ansiForegroundColors = {
    red: [ 31, 39 ],
    gray: [ 90, 39 ],
    blue: [ 34, 39 ],
    cyan: [ 36, 39 ],
    black: [ 30, 39 ],
    white: [ 37, 39 ],
    green: [ 32, 39 ],
    yellow: [ 33, 39 ],
    magenta: [ 35, 39 ],
    redBright: [ 91, 39 ],
    blueBright: [ 94, 39 ],
    cyanBright: [ 96, 39 ],
    whiteBright: [ 97, 39 ],
    greenBright: [ 92, 39 ],
    blackBright: [ 90, 39 ],
    yellowBright: [ 93, 39 ],
    magentaBright: [ 95, 39 ],
    darkGray: [ '38;5;238', 39 ],
    lightGray: [ '38;5;252', 39 ],
    lightCyan: [ '38;5;81', 39 ],
    lightCoral: [ '38;5;203', 39 ],
    oliveGreen: [ '38;5;149', 39 ],
    deepOrange: [ '38;5;166', 39 ],
    brightPink: [ '38;5;197', 39 ],
    lightOrange: [ '38;5;215', 39 ],
    burntOrange: [ '38;5;208', 39 ],
    lightYellow: [ '38;5;230', 39 ],
    canaryYellow: [ '38;5;227', 39 ],
    lightGoldenrodYellow: [ '38;5;221', 39 ]
} satisfies Record<string, StyleCodeType>;

/**
 * Collection of ANSI background color codes for terminal text backgrounds
 *
 * @returns An object mapping color names to their corresponding ANSI background style codes
 *
 * @remarks
 * Provides standard and bright variants of terminal background colors.
 * Each entry contains a pair of codes: the first to apply the background color and
 * the second (49) to reset to the default background.
 * All background color names are prefixed with 'bg' to distinguish them from foreground colors.
 *
 * @example
 * ```ts
 * // Apply red background to text
 * const bgRedCode = ansiBackgroundColors.bgRed;
 * console.log(`\x1b[${bgRedCode[0]}mText with Red Background\x1b[${bgRedCode[1]}m`);
 *
 * // Apply bright cyan background
 * const bgCyanBrightCode = ansiBackgroundColors.bgCyanBright;
 * console.log(`\x1b[${bgCyanBrightCode[0]}mBright Cyan Background\x1b[${bgCyanBrightCode[1]}m`);
 * ```
 *
 * @see StyleCodeType
 * @since 1.0.0
 */

export const ansiBackgroundColors = {
    bgRed: [ 41, 49 ],
    bgBlue: [ 44, 49 ],
    bgCyan: [ 46, 49 ],
    bgGray: [ 100, 49 ],
    bgBlack: [ 40, 49 ],
    bgGreen: [ 42, 49 ],
    bgWhite: [ 47, 49 ],
    bgYellow: [ 43, 49 ],
    bgMagenta: [ 45, 49 ],
    bgRedBright: [ 101, 49 ],
    bgBlueBright: [ 104, 49 ],
    bgCyanBright: [ 106, 49 ],
    bgBlackBright: [ 100, 49 ],
    bgWhiteBright: [ 107, 49 ],
    bgGreenBright: [ 102, 49 ],
    bgYellowBright: [ 103, 49 ],
    bgMagentaBright: [ 105, 49 ]
} satisfies Record<string, StyleCodeType>;
