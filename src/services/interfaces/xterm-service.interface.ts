/**
 * The names of the text modifiers a chain accepts.
 *
 * @remarks
 * A modifier changes how the text is drawn without touching its color, and a chain takes each one at most once.
 *
 * @see AnsiChainableBuilderType
 * @since 2.0.0
 */

type AnsiModifiersType = 'dim' | 'bold' | 'reset' | 'hidden' | 'inverse';

/**
 * The eight standard color names plus `gray`.
 *
 * @remarks
 * Every terminal renders these, which is what makes them the base the bright and background names derive from.
 *
 * @see AnsiBrightColorsType
 * @since 2.0.0
 */

type AnsiBaseColorsType = 'red' | 'gray' | 'blue' | 'cyan' | 'black' | 'white' | 'green' | 'yellow' | 'magenta';

/**
 * The high-intensity variant of each base color.
 *
 * @remarks
 * `gray` is excluded because it is already the bright form of black, so no `grayBright` name exists.
 *
 * @see AnsiBaseColorsType
 * @since 2.0.0
 */

type AnsiBrightColorsType = `${ Exclude<AnsiBaseColorsType, 'gray'> }Bright`;

/**
 * The named 256-color shades.
 *
 * @remarks
 * These sit outside the 16-color range, so a terminal without the 256-color palette approximates them.
 * They are foreground only, since no background name maps to a shade.
 *
 * @see AnsiForegroundColorsType
 * @since 2.0.0
 */

type AnsiShadeColorsType = 'darkGray' | 'lightGray' | 'lightCyan' | 'lightCoral' | 'oliveGreen' | 'deepOrange'
    | 'brightPink' | 'lightOrange' | 'burntOrange' | 'lightYellow' | 'canaryYellow' | 'lightGoldenrodYellow';

/**
 * Every foreground color name a chain accepts.
 *
 * @see AnsiBackgroundColorsType
 * @since 2.0.0
 */

type AnsiForegroundColorsType = AnsiBaseColorsType | AnsiBrightColorsType | AnsiShadeColorsType;

/**
 * Every background color name a chain accepts.
 *
 * @remarks
 * The names derive from the base and bright colors rather than repeating them, so the two sets cannot drift
 * apart.
 * The shades are left out, since the 256-color palette is offered on the foreground only.
 *
 * @see AnsiForegroundColorsType
 * @since 2.0.0
 */

type AnsiBackgroundColorsType = `bg${ Capitalize<AnsiBaseColorsType | AnsiBrightColorsType> }`;

/**
 * The callable half of a chain.
 *
 * @remarks
 * The two signatures are what let one value serve both an ordinary call and a tagged template.
 * They live on an interface rather than in the intersection, so the checker builds them once instead of once
 * per chain state.
 *
 * @since 2.0.0
 */

interface AnsiFormatterInterface {
    /**
     * Joins the arguments with a single space and wraps them in the sequences the chain carries.
     *
     * @param text - The segments to style
     * @returns The joined text wrapped in the chain's sequences
     *
     * @example
     * ```ts
     * xterm.cyan('Hello', 'world'); // '\x1b[36mHello world\x1b[39m'
     * ```
     *
     * @since 2.0.0
     */

    (...text: Array<string>): string;

    /**
     * Renders a tagged template and wraps it in the sequences the chain carries.
     *
     * @param strings - The literal segments of the template
     * @param values - The interpolated values, in order
     * @returns The rendered template wrapped in the chain's sequences
     *
     * @remarks
     * A `null` or an `undefined` value contributes an empty string rather than its own name.
     *
     * @example
     * ```ts
     * xterm.green`Done in ${ 412 }ms`; // '\x1b[32mDone in 412ms\x1b[39m'
     * ```
     *
     * @since 2.0.0
     */

    (strings: TemplateStringsArray, ...values: Array<unknown>): string;
}

/**
 * One color group of a chain - the named colors and the two methods that take a color instead of naming one.
 *
 * @typeParam Names - The color names this group offers
 * @typeParam Hex - The name of the hexadecimal method, `hex` or `bgHex`
 * @typeParam Rgb - The name of the 24-bit method, `rgb` or `bgRgb`
 * @typeParam Next - The chain every member of the group returns
 *
 * @remarks
 * The foreground and background groups differ only in their names and in which flag the next chain sets, so both
 * come from this one type rather than from two handwritten blocks.
 *
 * @example
 * ```ts
 * type Fg = AnsiColorPropsType<'red' | 'blue', 'hex', 'rgb', AnsiFgChainType>;
 * // { red: AnsiFgChainType; blue: AnsiFgChainType; hex(color): ...; rgb(r, g, b): ... }
 * ```
 *
 * @see AnsiChainableBuilderType
 * @since 2.0.0
 */

type AnsiColorPropsType<Names extends string, Hex extends string, Rgb extends string, Next> =
    & { [K in Names]: Next }
    & { [K in Hex]: (color: string) => Next }
    & { [K in Rgb]: (r: number, g: number, b: number) => Next };

/**
 * A chain, offering only the styles it may still take.
 *
 * @typeParam Fg - Whether the chain already carries a foreground color
 * @typeParam Bg - Whether the chain already carries a background color
 * @typeParam Mod - The modifiers the chain already carries
 *
 * @remarks
 * The three type parameters turn a combination that would only overwrite itself into a compile-time error
 * rather than a garbled line.
 * A color group disappears once its flag is set, and a modifier drops out of the mapped type once the chain
 * carries it.
 *
 * The constraint costs nothing at run time, and it does not reach a chain assembled through `any`.
 *
 * @example
 * ```ts
 * xterm.red.bold('Hello world');
 * xterm.green.bgBlack`Success: ${ 200 }`;
 * xterm.rgb(255, 100, 50).bgHex('#003366')('Custom colored text');
 *
 * xterm.red.green;      // rejected - a second foreground color
 * xterm.bgBlue.bgRed;   // rejected - a second background color
 * xterm.bold.bold;      // rejected - the same modifier twice
 * ```
 *
 * @see AnsiFgChainType
 * @see AnsiColorPropsType
 * @see AnsiFormatterInterface
 *
 * @since 2.0.0
 */

export type AnsiChainableBuilderType<Fg extends boolean = false, Bg extends boolean = false, Mod extends string = never> =
    & AnsiFormatterInterface
    & { [K in AnsiModifiersType as K extends Mod ? never : K]: AnsiChainableBuilderType<Fg, Bg, Mod | K> }
    & (Fg extends true ? unknown : AnsiColorPropsType<AnsiForegroundColorsType, 'hex', 'rgb', AnsiChainableBuilderType<true, Bg, Mod>>)
    & (Bg extends true ? unknown : AnsiColorPropsType<AnsiBackgroundColorsType, 'bgHex', 'bgRgb', AnsiChainableBuilderType<Fg, true, Mod>>);

/**
 * A chain carrying a background color and nothing else.
 *
 * @remarks
 * The return type of every background accessor on the entry point, and of its two background color methods.
 *
 * @example
 * ```ts
 * const cell: AnsiBgChainType = xterm.bgBlue;
 * cell.red.bold('Ready'); // the foreground and the modifiers are still open
 * ```
 *
 * @see AnsiFgChainType
 * @since 2.0.0
 */

export type AnsiBgChainType = AnsiChainableBuilderType<false, true>;

/**
 * A chain carrying a foreground color and nothing else.
 *
 * @remarks
 * The return type of every foreground accessor on the entry point, and of its two foreground color methods.
 *
 * @example
 * ```ts
 * const error: AnsiFgChainType = xterm.red;
 * error.bold('Build failed'); // the background and the modifiers are still open
 * ```
 *
 * @see AnsiBgChainType
 * @since 2.0.0
 */

export type AnsiFgChainType = AnsiChainableBuilderType<true>;

/**
 * A chain carrying one modifier and nothing else.
 *
 * @typeParam Mod - The modifier the chain just took
 *
 * @remarks
 * The return type of every modifier accessor on the entry point, which drops that one modifier and leaves both
 * colors open.
 *
 * @example
 * ```ts
 * const strong: AnsiModChainType<'bold'> = xterm.bold;
 * strong.red('Warning'); // 'bold' is gone from the type, the colors remain
 * ```
 *
 * @see AnsiFgChainType
 * @since 2.0.0
 */

export type AnsiModChainType<Mod extends AnsiModifiersType> = AnsiChainableBuilderType<false, false, Mod>;

/**
 * The run-time shape of a chain.
 *
 * @remarks
 * A chain is a function carrying the two finished strings a call concatenates around its text.
 * {@link AnsiChainableBuilderType} leaves both off, so a caller never sees them, and the derived step reads them
 * back through this shape to extend the chain.
 *
 * @example
 * ```ts
 * const state: ChainInterface = <ChainInterface> <unknown> xterm.red;
 * state.open;  // '\x1b[31m'
 * state.close; // '\x1b[39m'
 * ```
 *
 * @see AnsiChainableBuilderType
 * @since 2.0.0
 */

export interface ChainInterface {
    /**
     * Wraps the joined arguments in the sequences the chain carries.
     *
     * @param args - The segments to style, or a template and its values
     * @returns The styled text
     *
     * @example
     * ```ts
     * const state: ChainInterface = <ChainInterface> <unknown> xterm.red;
     * state('stop'); // '\x1b[31mstop\x1b[39m'
     * ```
     *
     * @since 2.0.0
     */

    (...args: Array<unknown>): string;

    /**
     * The sequences that precede the text in the order the chain applied them.
     *
     * @remarks
     * Absent on the entry point, which carries no style of its own.
     *
     * @example
     * ```ts
     * const state: ChainInterface = <ChainInterface> <unknown> xterm.bold.red;
     * state.open; // '\x1b[1m\x1b[31m'
     * ```
     *
     * @since 2.0.0
     */

    open?: string;

    /**
     * The sequences that follow the text in reverse order.
     *
     * @remarks
     * Reversed so the styles close in the order proper nesting requires.
     *
     * @example
     * ```ts
     * const state: ChainInterface = <ChainInterface> <unknown> xterm.bold.red;
     * state.close; // '\x1b[39m\x1b[22m'
     * ```
     *
     * @since 2.0.0
     */

    close?: string;
}
