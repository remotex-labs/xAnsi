/**
 * Import will remove at compile time
 */

import type { ansiBackgroundColors, ansiForegroundColors, ansiModifiers } from '@providers/styles.provider';

/**
 * Represents valid ANSI modifier keys for text styling.
 *
 * @remarks
 * This type extracts the keys from the ansiModifiers object, allowing for
 * type-safe access to text modifiers like bold, inverse, etc.
 *
 * @see ansiModifiers
 * @since 1.0.0
 */

type AnsiModifiersType = keyof typeof ansiModifiers;

/**
 * Represents valid ANSI foreground color keys.
 *
 * @remarks
 * This type extracts the keys from the ansiForegroundColors object, providing
 * type-safe access to standard terminal foreground colors.
 *
 * @see ansiForegroundColors
 * @since 1.0.0
 */

type AnsiForegroundColorsType = keyof typeof ansiForegroundColors;

/**
 * Represents valid ANSI background color keys.
 *
 * @remarks
 * This type extracts the keys from the ansiBackgroundColors object, providing
 * type-safe access to standard terminal background colors.
 *
 * @see ansiBackgroundColors
 * @since 1.0.0
 */

type AnsiBackgroundColorsType = keyof typeof ansiBackgroundColors;

/**
 * Represents a function that formats text with ANSI escape codes.
 *
 * @param text - Array of string segments to be formatted
 * @returns Formatted string with ANSI escape codes
 *
 * @remarks
 * This type defines the basic formatter function signature that
 * accepts multiple string arguments and joins them with ANSI styling.
 *
 * @since 1.0.0
 */

type AnsiFunctionType = AnsiFormatterType & AnsiTaggedFormatterType;

/**
 * Represents a tagged template function for ANSI formatting.
 *
 * @param strings - Template string segments
 * @param values - Values to be interpolated between string segments
 * @returns Formatted string with ANSI escape codes
 *
 * @remarks
 * This type enables the use of template literals with ANSI styling,
 * allowing for more readable inline styling of dynamic content.
 *
 * @since 1.0.0
 */

type AnsiFormatterType = (...text: Array<string>) => string;

/**
 * Combined type supporting both regular function calls and tagged templates.
 *
 * @remarks
 * This intersection type unifies the two different ways to apply ANSI formatting:
 * regular function calls with multiple arguments and tagged template literals.
 *
 * @example
 * ```ts
 * // Both of these would be supported:
 * formatter('Hello', 'World');
 * formatter`Hello ${'World'}`;
 * ```
 *
 * @see AnsiFormatterType
 * @see AnsiTaggedFormatterType
 * @since 1.0.0
 */

type AnsiTaggedFormatterType = (strings: TemplateStringsArray, ...values: Array<unknown>) => string;

/**
 * Defines properties for text modifiers available based on already applied modifiers
 *
 * @template UsedFg - Indicates whether a foreground color has already been applied
 * @template UsedBg - Indicates whether a background color has already been applied
 * @template UsedModifiers - String literal union of already applied text modifiers
 *
 * @returns A mapped type containing modifier properties not yet applied
 *
 * @remarks
 * This type creates properties for each available text modifier (bold, inverse, etc.)
 * while excluding modifiers that have already been applied. Each property returns a new
 * chainable builder with the applied modifier added to the type tracking.
 *
 * @since 1.0.0
 */

type ModifierPropsType<
    UsedFg extends boolean,
    UsedBg extends boolean,
    UsedModifiers extends string
> = {
    [K in AnsiModifiersType as K extends UsedModifiers ? never : K]: AnsiChainableBuilderType<
        UsedFg, UsedBg, UsedModifiers | K
    >;
};

/**
 * Defines foreground color properties available when no foreground color has been applied
 *
 * @template UsedFg - Indicates whether a foreground color has already been applied
 * @template UsedBg - Indicates whether a background color has already been applied
 * @template UsedModifiers - String literal union of already applied text modifiers
 *
 * @returns A mapped type containing foreground color properties or unknown if a foreground color is already applied
 *
 * @remarks
 * This type conditionally creates properties for each available foreground color,
 * but only if no foreground color has been applied yet. This prevents applying multiple
 * foreground colors to the same text string.
 *
 * @since 1.0.0
 */

type FgColorPropsType<
    UsedFg extends boolean,
    UsedBg extends boolean,
    UsedModifiers extends string
> = UsedFg extends true ? unknown : {
    [K in AnsiForegroundColorsType]: AnsiChainableBuilderType<true, UsedBg, UsedModifiers>;
};

/**
 * Defines background color properties available when no background color has been applied
 *
 * @template UsedFg - Indicates whether a foreground color has already been applied
 * @template UsedBg - Indicates whether a background color has already been applied
 * @template UsedModifiers - String literal union of already applied text modifiers
 *
 * @returns A mapped type containing background color properties or unknown if a background color is already applied
 *
 * @remarks
 * This type conditionally creates properties for each available background color,
 * but only if no background color has been applied yet. This prevents applying multiple
 * background colors to the same text string.
 *
 * @since 1.0.0
 */

type BgColorPropsType<
    UsedFg extends boolean,
    UsedBg extends boolean,
    UsedModifiers extends string
> = UsedBg extends true ? unknown : {
    [K in AnsiBackgroundColorsType]: AnsiChainableBuilderType<UsedFg, true, UsedModifiers>;
};

/**
 * Defines RGB and hexadecimal foreground color methods
 *
 * @template UsedFg - Indicates whether a foreground color has already been applied
 * @template UsedBg - Indicates whether a background color has already been applied
 * @template UsedModifiers - String literal union of already applied text modifiers
 *
 * @remarks
 * This interface provides methods for applying RGB and hex colors to text as foreground colors.
 *
 * @since 1.0.0
 */

interface RgbMethodsInterface<
    UsedFg extends boolean,
    UsedBg extends boolean,
    UsedModifiers extends string
> {
    /**
     * Applies a hexadecimal color as the foreground color
     *
     * @param color - Hexadecimal color string (e.g., "#ff0000" or "f00")
     * @returns A chainable builder with the foreground color applied
     *
     * @since 1.0.0
     */

    hex: (color: string) => AnsiChainableBuilderType<UsedFg, UsedBg, UsedModifiers>;

    /**
     * Applies an RGB color as the foreground color
     *
     * @param r - Red component (0-255)
     * @param g - Green component (0-255)
     * @param b - Blue component (0-255)
     * @returns A chainable builder with the foreground color applied
     *
     * @since 1.0.0
     */

    rgb: (r: number, g: number, b: number) => AnsiChainableBuilderType<UsedFg, UsedBg, UsedModifiers>;
}

/**
 * Defines RGB and hexadecimal background color methods
 *
 * @template UsedFg - Indicates whether a foreground color has already been applied
 * @template UsedBg - Indicates whether a background color has already been applied
 * @template UsedModifiers - String literal union of already applied text modifiers
 *
 * @remarks
 * This interface provides methods for applying RGB and hex colors to text as background colors.
 *
 * @since 1.0.0
 */

interface BgRgbMethodsInterface<
    UsedFg extends boolean,
    UsedBg extends boolean,
    UsedModifiers extends string
> {
    /**
     * Applies a hexadecimal color as the background color
     *
     * @param color - Hexadecimal color string (e.g., "#ff0000" or "f00")
     * @returns A chainable builder with the background color applied
     *
     * @since 1.0.0
     */

    bgHex: (color: string) => AnsiChainableBuilderType<UsedFg, UsedBg, UsedModifiers>;

    /**
     * Applies an RGB color as the background color
     *
     * @param r - Red component (0-255)
     * @param g - Green component (0-255)
     * @param b - Blue component (0-255)
     * @returns A chainable builder with the background color applied
     *
     * @since 1.0.0
     */

    bgRgb: (r: number, g: number, b: number) => AnsiChainableBuilderType<UsedFg, UsedBg, UsedModifiers>;
}

/**
 * Conditional type that provides RGB foreground color methods when no foreground color has been applied
 *
 * @template UsedFg - Indicates whether a foreground color has already been applied
 * @template UsedBg - Indicates whether a background color has already been applied
 * @template UsedModifiers - String literal union of already applied text modifiers
 *
 * @returns RGB method interface or unknown if a foreground color is already applied
 *
 * @remarks
 * This type conditionally includes RGB color methods only if no foreground color has been applied yet.
 *
 * @see RgbMethodsInterface
 * @since 1.0.0
 */

type RgbMethodsType<
    UsedFg extends boolean,
    UsedBg extends boolean,
    UsedModifiers extends string
> = UsedFg extends true ? unknown : RgbMethodsInterface<true, UsedBg, UsedModifiers>;

/**
 * Conditional type that provides RGB background color methods when no background color has been applied
 *
 * @template UsedFg - Indicates whether a foreground color has already been applied
 * @template UsedBg - Indicates whether a background color has already been applied
 * @template UsedModifiers - String literal union of already applied text modifiers
 *
 * @returns RGB background method interface or unknown if a background color is already applied
 *
 * @remarks
 * This type conditionally includes RGB background color methods only if no background color has been applied yet.
 *
 * @see BgRgbMethodsInterface
 * @since 1.0.0
 */

type BgRgbMethodsType<
    UsedFg extends boolean,
    UsedBg extends boolean,
    UsedModifiers extends string
> = UsedBg extends true ? unknown : BgRgbMethodsInterface<UsedFg, true, UsedModifiers>;

/**
 * Represents a chainable builder for ANSI text styling with strong typing for colors and modifiers
 *
 * @template UsedFg - Indicates whether a foreground color has already been applied
 * @template UsedBg - Indicates whether a background color has already been applied
 * @template UsedModifiers - String literal union of already applied text modifiers
 *
 * @returns A function that can be called with text to format or used as a tagged template literal
 *
 * @remarks
 * This type enables chainable styling API with TypeScript constraints to prevent applying the same
 * category of styles multiple times. It combines function behavior with property access for intuitive
 * styling composition.
 *
 * @example
 * ```ts
 * // Basic usage
 * xterm.red.bold('Hello world');
 *
 * // As tagged template
 * xterm.green.bgBlack`Success: ${data}`;
 *
 * // Chaining multiple styles
 * xterm.yellow.bold.inverse('Warning');
 *
 * // RGB and hex colors
 * xterm.rgb(255, 100, 50).bgHex('#003366')('Custom colored text');
 * ```
 *
 * @see ansiModifiers
 * @see ansiForegroundColors
 * @see ansiBackgroundColors
 *
 * @since 1.0.0
 */

export type AnsiChainableBuilderType<
    UsedFg extends boolean = false,
    UsedBg extends boolean = false,
    UsedModifiers extends string = never
> = AnsiFunctionType
    & ModifierPropsType<UsedFg, UsedBg, UsedModifiers>
    & FgColorPropsType<UsedFg, UsedBg, UsedModifiers>
    & BgColorPropsType<UsedFg, UsedBg, UsedModifiers>
    & BgRgbMethodsType<UsedFg, UsedBg, UsedModifiers>
    & RgbMethodsType<UsedFg, UsedBg, UsedModifiers>;
