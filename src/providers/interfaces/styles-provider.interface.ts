/**
 * Represents an ANSI style code pair with application and reset codes
 *
 * @template code - The ANSI code to apply a style
 * @template reset - The ANSI code to reset the applied style
 *
 * @returns A tuple containing the application code and reset code
 *
 * @remarks
 * This type defines the structure for ANSI escape code pairs used for terminal styling.
 * The first element is the code that applies a style (color, format, etc.), while
 * the second element is the code that resets that specific style.
 *
 * @example
 * ```ts
 * // Bold style: apply code 1, reset code 22
 * const boldStyle: StyleCode = [1, 22];
 *
 * // Red foreground: apply code 31, reset code 39
 * const redForeground: StyleCode = [31, 39];
 * ```
 *
 * @since 1.0.0
 */

export type StyleCode = [ code: number | string, reset: number ];
