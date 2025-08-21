/**
 * Import will remove at compile time
 */

import type { StyleCodeType } from '@providers/interfaces/styles-provider.interface';
import type { AnsiChainableBuilderType } from '@components/interfaces/xterm-component.interface';

/**
 * Imports
 */

import { ansiBackgroundColors, ansiForegroundColors, ansiModifiers } from '@providers/styles.provider';

/**
 * Unified collection of all ANSI style codes for efficient lookup
 *
 * @returns A merged record of all style codes including modifiers, foreground and background colors
 *
 * @remarks
 * This constant combines all style types (modifiers, foreground colors, and background colors)
 * into a single lookup object for improved performance when accessing style codes.
 * It's particularly useful in hot paths where style code lookups happen frequently.
 *
 * @example
 * ```ts
 * // Get the style code for bold text
 * const boldCode = styles.bold;
 *
 * // Get the style code for red foreground
 * const redCode = styles.red;
 *
 * // Get the style code for a blue background
 * const bgBlueCode = styles.bgBlue;
 * ```
 *
 * @see ansiModifiers
 * @see ansiForegroundColors
 * @see ansiBackgroundColors
 * @see StyleCodeType
 * @since 1.0.0
 */

const styles: Record<string, StyleCodeType> = {
    ...ansiModifiers,
    ...ansiForegroundColors,
    ...ansiBackgroundColors
};

/**
 * ANSI escape sequence prefix for terminal control codes
 *
 * @remarks
 * This constant defines the standard ANSI escape sequence prefix used to start
 * a terminal control code. Using a constant improves performance by avoiding
 * string recreation in performance-critical code paths.
 *
 * @see ESC_END
 * @since 1.0.0
 */

const ESC = '\x1b[';

/**
 * ANSI escape sequence suffix for terminal style codes
 *
 * @remarks
 * This constant defines the standard ANSI escape sequence suffix that completes
 * a terminal style control code. Used in conjunction with ESC and style codes
 * to form complete ANSI styling sequences.
 *
 * @see ESC
 * @since 1.0.0
 */

const ESC_END = 'm';

/**
 * Wraps text with ANSI escape sequences to apply terminal styling
 *
 * @param codes - Array of StyleCodeType tuples to apply to the text
 * @param text - The string to be styled with ANSI codes
 * @returns The input text wrapped with appropriate ANSI escape sequences
 *
 * @remarks
 * This function efficiently applies multiple style codes to a text string by
 * wrapping it with the appropriate ANSI escape sequences. It handles proper nesting
 * of styles by ensuring that reset codes are applied in reverse order.
 *
 * The function has three optimized code paths:
 * - For an empty codes array, it returns the original text without modification
 * - For a single code, it directly concatenates without using arrays
 * - For multiple codes, it pre-allocates arrays for improved performance
 *
 * @example
 * ```ts
 * // Apply a single style (bold)
 * const boldText = wrapWithAnsi([styles.bold], "Hello World");
 *
 * // Apply multiple styles (bold and red)
 * const boldRedText = wrapWithAnsi([styles.bold, styles.red], "Hello World");
 * ```
 *
 * @see StyleCodeType
 * @see ESC
 * @see ESC_END
 * @since 1.0.0
 */

function wrapWithAnsi(codes: Array<StyleCodeType>, text: string): string {
    if (globalThis.NO_COLOR) return text;
    const codesLength = codes.length;

    if (codesLength === 0) return text;
    if (codesLength === 1) {
        return `${ ESC }${ codes[0][0] }${ ESC_END }${ text }${ ESC }${ codes[0][1] }${ ESC_END }`;
    }

    const endCodes = new Array<string>(codesLength);
    const startCodes = new Array<string>(codesLength);

    for (let i = 0; i < codesLength; i++) {
        startCodes[i] = `${ ESC }${ codes[i][0] }${ ESC_END }`;
        // Build end codes in reverse order for proper nesting
        endCodes[codesLength - i - 1] = `${ ESC }${ codes[i][1] }${ ESC_END }`;
    }

    return startCodes.concat(text, endCodes).join('');
}

/**
 * Generates ANSI RGB color code for terminal foreground or background styling
 *
 * @param type - Color application type: 'fg' for foreground or 'bg' for background
 * @param r - Red color component (0-255)
 * @param g - Green color component (0-255)
 * @param b - Blue color component (0-255)
 * @returns A StyleCodeType tuple containing the RGB color code and its reset code
 *
 * @throws Error - When any of the RGB values are not numbers
 *
 * @remarks
 * This function creates ANSI 24-bit color codes (true color) for terminals that support them.
 * It generates the appropriate code based on whether the color should be applied to
 * the foreground (text color) or background.
 *
 * The function performs type checking on RGB values to ensure they are numbers
 * before generating the style code.
 *
 * @example
 * ```ts
 * // Create a foreground RGB color (red)
 * const redFg = rgbCode('fg', 255, 0, 0);
 *
 * // Create a background RGB color (blue)
 * const blueBg = rgbCode('bg', 0, 0, 255);
 *
 * // Apply the RGB color to text
 * const coloredText = wrapWithAnsi([redFg], "This text is custom red");
 * ```
 *
 * @see StyleCodeType
 * @see wrapWithAnsi
 *
 * @since 1.0.0
 */

function rgbCode(type: 'fg', r: number, g: number, b: number): StyleCodeType;
function rgbCode(type: 'bg', r: number, g: number, b: number): StyleCodeType;
function rgbCode(type: 'fg' | 'bg', r: number | unknown, g: number | unknown, b: number | unknown): StyleCodeType {
    if (typeof r !== 'number' || typeof g !== 'number' || typeof b !== 'number') {
        throw new Error(`RGB values must be numbers, received: r=${ typeof r }, g=${ typeof g }, b=${ typeof b }`);
    }

    const code = type === 'fg' ? 38 : 48;
    const reset = type === 'fg' ? 39 : 49;

    return [ `${ code };2;${ r };${ g };${ b }`, reset ];
}

/**
 * Converts a hexadecimal color string to RGB components
 *
 * @param hex - Hexadecimal color string (with or without leading #)
 * @returns Tuple of [red, green, blue] values as numbers in the range 0-255
 *
 * @throws Error - When the provided hex string is not a valid 3 or 6 digit hex color
 *
 * @remarks
 * This utility function parses both 3-digit shorthand (#RGB) and 6-digit standard (#RRGGBB)
 * hexadecimal color formats into their corresponding RGB numeric values.
 *
 * For 3-digit hex values, each digit is duplicated to create the equivalent 6-digit value
 * (e.g., #F00 becomes #FF0000).
 *
 * @example
 * ```ts
 * // 6-digit hex
 * const [r, g, b] = hexToRgb('#FF5500');
 * console.log(r, g, b); // 255, 85, 0
 *
 * // 3-digit hex
 * const [r, g, b] = hexToRgb('#F50');
 * console.log(r, g, b); // 255, 85, 0
 *
 * // Without # prefix
 * const [r, g, b] = hexToRgb('00FF00');
 * console.log(r, g, b); // 0, 255, 0
 * ```
 *
 * @see rgbCode - Function that uses RGB values to create ANSI color codes
 * @since 1.0.0
 */

function hexToRgb(hex: `#${ string }` | string): [ number, number, number ] {
    // Remove leading # if present
    const cleanHex = hex.replace(/^#/, '').toLowerCase();

    // Validate hex format
    if (!/^([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(cleanHex)) {
        throw new Error(`Invalid hex color format: "${ hex }". Expected 3 or 6 hex digits.`);
    }

    // Parse 3-digit hex
    if (cleanHex.length === 3) {
        const r = parseInt(cleanHex[0] + cleanHex[0], 16);
        const g = parseInt(cleanHex[1] + cleanHex[1], 16);
        const b = parseInt(cleanHex[2] + cleanHex[2], 16);

        return [ r, g, b ];
    }

    // Parse 6-digit hex
    const r = parseInt(cleanHex.slice(0, 2), 16);
    const g = parseInt(cleanHex.slice(2, 4), 16);
    const b = parseInt(cleanHex.slice(4, 6), 16);

    return [ r, g, b ];
}

/**
 * Creates a chainable builder for styling text with ANSI escape sequences
 *
 * @param codes - Initial style codes to apply (empty by default)
 * @returns A chainable builder object that acts as both a function and a proxy for style methods
 *
 * @remarks
 * This function creates a chainable API for terminal text styling that supports both
 * function call and property access patterns. The returned object is both callable
 * (to format text) and provides property access for style chaining.
 *
 * The implementation uses a JavaScript Proxy to intercept property access and dynamically
 * create new chain instances with additional style codes. The formatter function handles
 * both regular arguments and tagged template literals.
 *
 * The builder supports:
 * - Basic styles (bold, dim, italic, etc.) via property access
 * - RGB colors via .rgb() and .bgRgb() methods
 * - Hex colors via .hex() and .bgHex() methods
 * - Function call with strings or template literals to apply styles
 *
 * @example
 * ```ts
 * // Basic usage
 * const colorizer = createXtermChain();
 * console.log(colorizer.bold.red("This is bold and red"));
 *
 * // Chaining multiple styles
 * console.log(colorizer.bold.underline.hex('#3498db')("Styled text"));
 *
 * // Using template literals
 * const name = "World";
 * console.log(colorizer.green`Hello ${name}!`);
 *
 * // Starting with initial styles
 * const warningStyle = createXtermChain([styles.yellow, styles.bold]);
 * console.log(warningStyle("Warning message"));
 * ```
 *
 * @see styles
 * @see rgbCode
 * @see hexToRgb
 * @see wrapWithAnsi
 * @see AnsiChainableBuilderType
 *
 * @since 1.0.0
 */

function createXtermChain(codes: Array<StyleCodeType> = []): AnsiChainableBuilderType {
    const formatter = (...args: Array<unknown>): string => {
        if (Array.isArray(args[0]) && 'raw' in args[0]) {
            const [ strings, ...values ] = args as [ TemplateStringsArray, ...Array<unknown> ];

            const combined = strings.reduce(
                (acc, str, i) => acc + str + (i < values.length ? String(values[i] ?? '') : ''),
                ''
            );

            return wrapWithAnsi(codes, combined);
        }

        // Handle regular arguments
        return wrapWithAnsi(codes, args.join(' '));
    };

    // Define color method handlers for reuse
    const colorHandlers = {
        // RGB foreground color
        rgb: (r: number, g: number, b: number): AnsiChainableBuilderType =>
            createXtermChain([ ...codes, rgbCode('fg', r, g, b) ]),

        bgRgb: (r: number, g: number, b: number): AnsiChainableBuilderType =>
            createXtermChain([ ...codes, rgbCode('bg', r, g, b) ]),

        hex: (hex: string): AnsiChainableBuilderType =>
            createXtermChain([ ...codes, rgbCode('fg', ...hexToRgb(hex)) ]),

        bgHex: (hex: string): AnsiChainableBuilderType =>
            createXtermChain([ ...codes, rgbCode('bg', ...hexToRgb(hex)) ])
    };

    // Create a proxy to handle property access for chaining
    return <AnsiChainableBuilderType>new Proxy(formatter, {
        get(target, prop: string | symbol): unknown {
            if (typeof prop !== 'string') {
                throw new Error(`Invalid property: ${ String(prop) }`);
            }

            // Handle standard styles from the styles object
            if (prop in styles) {
                return createXtermChain([ ...codes, styles[prop] ]);
            }

            // Handle color methods
            if (prop in colorHandlers) {
                return colorHandlers[prop as keyof typeof colorHandlers];
            }

            // Fall back to the target's own properties
            return Reflect.get(target, prop);
        }
    });
}

/**
 * Pre-configured ANSI terminal styling utility with chainable methods
 *
 * @example
 * ```ts
 * // Basic styling
 * console.log(xterm.bold("This is bold text"));
 * console.log(xterm.red("This is red text"));
 *
 * // Chain multiple styles
 * console.log(xterm.bold.red("This is bold and red"));
 * console.log(xterm.green("This is green"));
 *
 * // Use with template literals
 * const name = "World";
 * console.log(xterm.cyan`Hello ${name}!`);
 *
 * // RGB and Hex colors
 * console.log(xterm.rgb(255, 136, 0)("Custom orange text"));
 * console.log(xterm.hex("#FF8800")("Hex orange text"));
 *
 * // Background colors
 * console.log(xterm.bgGreen("Text with green background"));
 * console.log(xterm.bgHex("#333333")("Text with a dark background"));
 * ```
 *
 * @remarks
 * The `xterm` export provides a convenient, ready-to-use instance of the chainable
 * styling builder. It supports all standard ANSI styles, RGB colors, and hexadecimal
 * color definitions for both foreground and background.
 *
 * This is the recommended entry point for using the styling functionality in most cases.
 * For custom styling chains with pre-applied styles, use `createXtermChain()` directly.
 *
 * @see createXtermChain
 * @see AnsiChainableBuilderType
 *
 * @since 1.0.0
 */

export const xterm = createXtermChain();
