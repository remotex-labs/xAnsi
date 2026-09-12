/**
 * Type-only imports erased during TypeScript compilation.
 */

import type { AnsiChainableBuilderType } from '@services/interfaces/xterm-service.interface';
import type { AnsiBgChainType, ChainInterface } from '@services/interfaces/xterm-service.interface';
import type { AnsiFgChainType, AnsiModChainType } from '@services/interfaces/xterm-service.interface';

/**
 * Imports
 */

import { CSI } from '@constants/ansi.constant';

/**
 * Exports
 */

export type * from '@services/interfaces/xterm-service.interface';

/**
 * Rewrites every closing sequence a chain owns back into the opening one it closed.
 *
 * @param text - The text to scan, already known to hold an escape
 * @param open - The opening sequences the chain carries, in order
 * @param close - The closing sequences the chain carries, in reverse order
 * @returns The text with each of the chain's own resets turned back into the style it closed
 *
 * @remarks
 * A nested chain ends its styles with a reset, and that reset would otherwise run to the end of the outer text.
 * Reading `close` forward and `open` backward pairs each sequence with its partner, so the outer style is put
 * back wherever an inner one closed it.
 *
 * Only a sequence the chain itself owns is rewritten, which leaves an inner style the chain never applied to
 * reset the way its own author wrote it.
 *
 * @example
 * ```ts
 * restore('\x1b[32mHello\x1b[39m World', '\x1b[31m', '\x1b[39m');
 * // '\x1b[32mHello\x1b[31m World' - the reset became the outer red
 * ```
 *
 * @see derive
 * @since 2.0.0
 */

export function restore(text: string, open: string, close: string): string {
    let end = open.length;
    let start = 0;

    while (start < close.length) {
        const next = close.indexOf(CSI, start + 2);
        const stop = next < 0 ? close.length : next;
        const prev = open.lastIndexOf(CSI, end - 1);

        text = text.replaceAll(close.slice(start, stop), open.slice(prev, end));
        start = stop;
        end = prev;
    }

    return text;
}

/**
 * Derives a chain that adds one style to what its parent already carries.
 *
 * @typeParam T - The chain type the caller declares, narrowed by what the new style rules out
 * @param parent - The chain the style extends, or {@link xterm} for the first step
 * @param styleOpen - The opening sequence this step contributes
 * @param styleClose - The closing sequence this step contributes
 * @returns A callable chain that also offers every style it may still take
 *
 * @remarks
 * A chain holds its state as two finished strings rather than as a list of codes, so a call concatenates three
 * strings and builds no escape of its own.
 * Its prototype is {@link xterm}, which puts every style one ordinary property lookup away and leaves the
 * function and its two strings as the whole cost of a step.
 *
 * A call whose text already holds an escape goes through {@link restore} first.
 * That check runs only when an escape is present, so plain text stays on the three-string path, as does a lone
 * string argument, which is passed through rather than joined.
 *
 * @example
 * ```ts
 * const red = derive(xterm, '\x1b[31m', '\x1b[39m');
 * red('error');      // '\x1b[31merror\x1b[39m'
 * red.bold('error'); // '\x1b[31m\x1b[1merror\x1b[22m\x1b[39m'
 * ```
 *
 * @see fg
 * @see xterm
 * @see restore
 *
 * @since 2.0.0
 */

export function derive<T = AnsiChainableBuilderType>(parent: unknown, styleOpen: string, styleClose: string): T {
    const state = <ChainInterface> parent;
    const open = (state.open ?? '') + styleOpen;
    const close = styleClose + (state.close ?? '');

    const chain = <ChainInterface> function (...args: Array<unknown>): string {
        const head = args[0];
        let text: string;

        if (Array.isArray(head)) {
            text = <string> head[0];
            for (let i = 1; i < args.length; i++) text += String(args[i] ?? '') + <string> head[i];
        } else text = args.length === 1 ? <string> head : args.join(' ');

        if (globalThis.NO_COLOR) return text;
        if (text.includes(CSI)) text = restore(text, open, close);

        return open + text + close;
    };

    Object.setPrototypeOf(chain, xterm);
    chain.open = open;
    chain.close = close;

    return <T> <unknown> chain;
}

/**
 * Derives a chain carrying a foreground color.
 *
 * @typeParam T - The chain type the caller declares, narrowed by what the color rules out
 * @param parent - The chain the color extends
 * @param open - The opening sequence for the color
 * @returns A chain carrying the color on top of what it already held
 *
 * @remarks
 * Every foreground color closes through the same sequence, so naming it once here keeps it off the accessors
 * that read it.
 *
 * @example
 * ```ts
 * fg(xterm, '\x1b[31m')('stop'); // '\x1b[31mstop\x1b[39m'
 * ```
 *
 * @see bg
 * @see derive
 *
 * @since 2.0.0
 */

export function fg<T>(parent: unknown, open: string): T {
    return derive<T>(parent, open, CSI + '39m');
}

/**
 * Derives a chain carrying a background color.
 *
 * @typeParam T - The chain type the caller declares, narrowed by what the color rules out
 * @param parent - The chain the color extends
 * @param open - The opening sequence for the color
 * @returns A chain carrying the color on top of what it already held
 *
 * @remarks
 * Every background color closes through the same sequence, so naming it once here keeps it off the accessors
 * that read it.
 *
 * @example
 * ```ts
 * bg(xterm, '\x1b[41m')('stop'); // '\x1b[41mstop\x1b[49m'
 * ```
 *
 * @see fg
 * @see derive
 *
 * @since 2.0.0
 */

export function bg<T>(parent: unknown, open: string): T {
    return derive<T>(parent, open, CSI + '49m');
}

/**
 * Derives a chain carrying a 24-bit color.
 *
 * @typeParam T - The chain type the caller declares, narrowed by what the color rules out
 * @param parent - The chain the color extends
 * @param code - `38` for a foreground color, `48` for a background one
 * @param r - The red component, `0`-`255`
 * @param g - The green component, `0`-`255`
 * @param b - The blue component, `0`-`255`
 * @returns A chain carrying the color on top of what it already held
 * @throws Error - When a component is not a finite number
 *
 * @remarks
 * The check runs where the chain is built rather than where it is called, so a bad component reports at its own
 * call site instead of surfacing as a garbled line further down.
 *
 * @example
 * ```ts
 * rgbChain(xterm, 38, 255, 100, 50)('hot'); // '\x1b[38;2;255;100;50mhot\x1b[39m'
 * ```
 *
 * @see hexChain
 * @since 2.0.0
 */

export function rgbChain<T>(parent: unknown, code: 38 | 48, r: number, g: number, b: number): T {
    if (!Number.isFinite(r) || !Number.isFinite(g) || !Number.isFinite(b))
        throw new Error(`RGB values must be numbers, received: r=${ r }, g=${ g }, b=${ b }`);

    return derive<T>(parent, CSI + `${ code };2;${ r };${ g };${ b }m`, code === 38 ? CSI + '39m' : CSI + '49m');
}

/**
 * Derives a chain carrying a hexadecimal color.
 *
 * @typeParam T - The chain type the caller declares, narrowed by what the color rules out
 * @param parent - The chain the color extends
 * @param code - `38` for a foreground color, `48` for a background one
 * @param hex - A 3 or 6 digit hexadecimal color, with or without the leading `#`
 * @returns A chain carrying the color on top of what it already held
 * @throws Error - When the string is not 3 or 6 hexadecimal digits
 *
 * @remarks
 * A 3 digit color doubles each digit first, so `#f50` and `#ff5500` parse alike.
 * One parse over the whole string and three shifts read the components out, which spares the two extra parses a
 * component-at-a-time reading would cost.
 *
 * @example
 * ```ts
 * hexChain(xterm, 38, '#f50')('warm'); // '\x1b[38;2;255;85;0mwarm\x1b[39m'
 * ```
 *
 * @see rgbChain
 * @since 2.0.0
 */

export function hexChain<T>(parent: unknown, code: 38 | 48, hex: string): T {
    const digits = hex.charCodeAt(0) === 35 ? hex.slice(1) : hex;
    if (!/^(?:[\da-f]{3}|[\da-f]{6})$/i.test(digits))
        throw new Error(`Invalid hex color format: "${ hex }". Expected 3 or 6 hex digits.`);

    const value = parseInt(digits.length === 3 ? digits.replace(/./g, '$&$&') : digits, 16);

    return rgbChain<T>(parent, code, value >>> 16 & 255, value >>> 8 & 255, value & 255);
}

/**
 * The chainable entry point for styling terminal text.
 *
 * @remarks
 * Every accessor returns a new chain and calling one wraps its argument, so a chain is a value worth naming and
 * reusing rather than rebuilding at each call site.
 * A chain is also a tag function, which lets an interpolated string carry the styling inline.
 *
 * Every chain takes this object as its prototype, so one set of accessors serves the first step of a chain and
 * every step after it alike.
 * The escape sequences are literals inside the accessors, which keeps a lookup table out of the bundle.
 *
 * The type tracks which foreground color, which background color, and which modifiers a chain already carries,
 * and drops whatever would only repeat one.
 * That constraint lives entirely in the type and costs nothing at run time.
 *
 * A chain nests. Where its text already holds styling, the chain puts its own styles back after the inner reset
 * rather than letting that reset run to the end of the line.
 *
 * With `globalThis.NO_COLOR` set, a call returns its argument unchanged and leaves the escape sequences out.
 *
 * @example
 * ```ts
 * xterm.red('This text is red');    // '\x1b[31mThis text is red\x1b[39m'
 * xterm.bold.yellow('Bold yellow'); // '\x1b[1m\x1b[33mBold yellow\x1b[39m\x1b[22m'
 * xterm.cyan('Hello', 'world');     // '\x1b[36mHello world\x1b[39m'
 * xterm.green`Done in ${ 412 }ms`;  // '\x1b[32mDone in 412ms\x1b[39m'
 * xterm.rgb(255, 100, 50)('Warm');  // '\x1b[38;2;255;100;50mWarm\x1b[39m'
 *
 * // The inner reset turns back into the outer red rather than to the default
 * xterm.bgBlue.red.bold(`${ xterm.green('Hello') } World`);
 * ```
 *
 * @see derive
 * @see AnsiChainableBuilderType
 *
 * @since 2.0.0
 */

export const xterm = {
    /* Modifiers */

    /** The dim modifier. */
    get dim(): AnsiModChainType<'dim'> { return derive(this, CSI + '2m', CSI + '22m'); },
    /** The bold modifier. */
    get bold(): AnsiModChainType<'bold'> { return derive(this, CSI + '1m', CSI + '22m'); },
    /** A full reset around the text. */
    get reset(): AnsiModChainType<'reset'> { return derive(this, CSI + '0m', CSI + '0m'); },
    /** The hidden modifier. */
    get hidden(): AnsiModChainType<'hidden'> { return derive(this, CSI + '8m', CSI + '28m'); },
    /** The inverse modifier. */
    get inverse(): AnsiModChainType<'inverse'> { return derive(this, CSI + '7m', CSI + '27m'); },

    /* Foreground colors */

    /** The red foreground color. */
    get red(): AnsiFgChainType { return fg(this, CSI + '31m'); },
    /** The gray foreground color. */
    get gray(): AnsiFgChainType { return fg(this, CSI + '90m'); },
    /** The blue foreground color. */
    get blue(): AnsiFgChainType { return fg(this, CSI + '34m'); },
    /** The cyan foreground color. */
    get cyan(): AnsiFgChainType { return fg(this, CSI + '36m'); },
    /** The black foreground color. */
    get black(): AnsiFgChainType { return fg(this, CSI + '30m'); },
    /** The white foreground color. */
    get white(): AnsiFgChainType { return fg(this, CSI + '37m'); },
    /** The green foreground color. */
    get green(): AnsiFgChainType { return fg(this, CSI + '32m'); },
    /** The yellow foreground color. */
    get yellow(): AnsiFgChainType { return fg(this, CSI + '33m'); },
    /** The magenta foreground color. */
    get magenta(): AnsiFgChainType { return fg(this, CSI + '35m'); },
    /** The bright red foreground color. */
    get redBright(): AnsiFgChainType { return fg(this, CSI + '91m'); },
    /** The bright blue foreground color. */
    get blueBright(): AnsiFgChainType { return fg(this, CSI + '94m'); },
    /** The bright cyan foreground color. */
    get cyanBright(): AnsiFgChainType { return fg(this, CSI + '96m'); },
    /** The bright white foreground color. */
    get whiteBright(): AnsiFgChainType { return fg(this, CSI + '97m'); },
    /** The bright green foreground color. */
    get greenBright(): AnsiFgChainType { return fg(this, CSI + '92m'); },
    /** The bright black foreground color. */
    get blackBright(): AnsiFgChainType { return fg(this, CSI + '90m'); },
    /** The bright yellow foreground color. */
    get yellowBright(): AnsiFgChainType { return fg(this, CSI + '93m'); },
    /** The bright magenta foreground color. */
    get magentaBright(): AnsiFgChainType { return fg(this, CSI + '95m'); },
    /** The dark gray foreground color. */
    get darkGray(): AnsiFgChainType { return fg(this, CSI + '38;5;238m'); },
    /** The light gray foreground color. */
    get lightGray(): AnsiFgChainType { return fg(this, CSI + '38;5;252m'); },
    /** The light cyan foreground color. */
    get lightCyan(): AnsiFgChainType { return fg(this, CSI + '38;5;81m'); },
    /** The light coral foreground color. */
    get lightCoral(): AnsiFgChainType { return fg(this, CSI + '38;5;203m'); },
    /** The olive green foreground color. */
    get oliveGreen(): AnsiFgChainType { return fg(this, CSI + '38;5;149m'); },
    /** The deep orange foreground color. */
    get deepOrange(): AnsiFgChainType { return fg(this, CSI + '38;5;166m'); },
    /** The bright pink foreground color. */
    get brightPink(): AnsiFgChainType { return fg(this, CSI + '38;5;197m'); },
    /** The light orange foreground color. */
    get lightOrange(): AnsiFgChainType { return fg(this, CSI + '38;5;215m'); },
    /** The burnt orange foreground color. */
    get burntOrange(): AnsiFgChainType { return fg(this, CSI + '38;5;208m'); },
    /** The light yellow foreground color. */
    get lightYellow(): AnsiFgChainType { return fg(this, CSI + '38;5;230m'); },
    /** The canary yellow foreground color. */
    get canaryYellow(): AnsiFgChainType { return fg(this, CSI + '38;5;227m'); },
    /** The light goldenrod yellow foreground color. */
    get lightGoldenrodYellow(): AnsiFgChainType { return fg(this, CSI + '38;5;221m'); },

    /* Background colors */

    /** The red background color. */
    get bgRed(): AnsiBgChainType { return bg(this, CSI + '41m'); },
    /** The blue background color. */
    get bgBlue(): AnsiBgChainType { return bg(this, CSI + '44m'); },
    /** The cyan background color. */
    get bgCyan(): AnsiBgChainType { return bg(this, CSI + '46m'); },
    /** The gray background color. */
    get bgGray(): AnsiBgChainType { return bg(this, CSI + '100m'); },
    /** The black background color. */
    get bgBlack(): AnsiBgChainType { return bg(this, CSI + '40m'); },
    /** The green background color. */
    get bgGreen(): AnsiBgChainType { return bg(this, CSI + '42m'); },
    /** The white background color. */
    get bgWhite(): AnsiBgChainType { return bg(this, CSI + '47m'); },
    /** The yellow background color. */
    get bgYellow(): AnsiBgChainType { return bg(this, CSI + '43m'); },
    /** The magenta background color. */
    get bgMagenta(): AnsiBgChainType { return bg(this, CSI + '45m'); },
    /** The bright red background color. */
    get bgRedBright(): AnsiBgChainType { return bg(this, CSI + '101m'); },
    /** The bright blue background color. */
    get bgBlueBright(): AnsiBgChainType { return bg(this, CSI + '104m'); },
    /** The bright cyan background color. */
    get bgCyanBright(): AnsiBgChainType { return bg(this, CSI + '106m'); },
    /** The bright black background color. */
    get bgBlackBright(): AnsiBgChainType { return bg(this, CSI + '100m'); },
    /** The bright white background color. */
    get bgWhiteBright(): AnsiBgChainType { return bg(this, CSI + '107m'); },
    /** The bright green background color. */
    get bgGreenBright(): AnsiBgChainType { return bg(this, CSI + '102m'); },
    /** The bright yellow background color. */
    get bgYellowBright(): AnsiBgChainType { return bg(this, CSI + '103m'); },
    /** The bright magenta background color. */
    get bgMagentaBright(): AnsiBgChainType { return bg(this, CSI + '105m'); },

    /* True color */

    /**
     * Applies a hexadecimal foreground color.
     *
     * @param color - A 3 or 6 digit hexadecimal color, with or without the leading `#`
     * @returns A chain carrying the color
     * @throws Error - When the string is not 3 or 6 hexadecimal digits
     *
     * @example
     * ```ts
     * xterm.hex('#ff5500')('Warm'); // '\x1b[38;2;255;85;0mWarm\x1b[39m'
     * ```
     *
     * @see bgHex
     * @since 2.0.0
     */

    hex(color: string): AnsiFgChainType { return hexChain(this, 38, color); },

    /**
     * Applies a hexadecimal background color.
     *
     * @param color - A 3 or 6 digit hexadecimal color, with or without the leading `#`
     * @returns A chain carrying the color
     * @throws Error - When the string is not 3 or 6 hexadecimal digits
     *
     * @example
     * ```ts
     * xterm.bgHex('#003366')('Cool'); // '\x1b[48;2;0;51;102mCool\x1b[49m'
     * ```
     *
     * @see hex
     * @since 2.0.0
     */

    bgHex(color: string): AnsiBgChainType { return hexChain(this, 48, color); },

    /**
     * Applies a 24-bit foreground color.
     *
     * @param r - The red component, `0`-`255`
     * @param g - The green component, `0`-`255`
     * @param b - The blue component, `0`-`255`
     * @returns A chain carrying the color
     * @throws Error - When a component is not a finite number
     *
     * @example
     * ```ts
     * xterm.rgb(255, 100, 50)('Warm'); // '\x1b[38;2;255;100;50mWarm\x1b[39m'
     * ```
     *
     * @see bgRgb
     * @since 2.0.0
     */

    rgb(r: number, g: number, b: number): AnsiFgChainType { return rgbChain(this, 38, r, g, b); },

    /**
     * Applies a 24-bit background color.
     *
     * @param r - The red component, `0`-`255`
     * @param g - The green component, `0`-`255`
     * @param b - The blue component, `0`-`255`
     * @returns A chain carrying the color
     * @throws Error - When a component is not a finite number
     *
     * @example
     * ```ts
     * xterm.bgRgb(0, 51, 102)('Cool'); // '\x1b[48;2;0;51;102mCool\x1b[49m'
     * ```
     *
     * @see rgb
     * @since 2.0.0
     */

    bgRgb(r: number, g: number, b: number): AnsiBgChainType { return rgbChain(this, 48, r, g, b); }
} as const;
