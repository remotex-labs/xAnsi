/**
 * Type-only imports erased during TypeScript compilation.
 */

import type { ColorInterface } from '@components/interfaces/ansi-component.interface';

/**
 * Holds a color component inside the byte range a sequence accepts.
 *
 * @param value - The component to bring into range
 * @returns The component rounded to a whole number between `0` and `255`
 *
 * @remarks
 * A terminal reads each component as one byte, so a computed value has to land in that range before it reaches a
 * sequence.
 * Rounding runs first, and the clamp then holds anything past an end at that end,
 * which turns a fractional or out-of-range component into a color the terminal can draw rather than into an error.
 *
 * A value that is not a number comes back unchanged,
 * so a caller that takes arbitrary input runs its own finite check first.
 *
 * @example
 * ```ts
 * channel(127.6); // 128
 * channel(-20);   // 0
 * channel(300);   // 255
 * ```
 *
 * @see hex
 * @see parseHex
 *
 * @since 2.0.0
 */

export function channel(value: number): number {
    return Math.min(255, Math.max(0, Math.round(value)));
}

/**
 * Packs a color into the six digit hexadecimal form a terminal command expects.
 *
 * @param color - The color to pack
 * @returns The six hexadecimal digits of the color, without a leading `#`
 *
 * @remarks
 * Adding `1 << 24` puts a seventh digit in front, so dropping the first character leaves exactly six digits even
 * where the red component is small.
 * Each component goes through {@link channel} on the way in, which keeps a computed color from spilling into the
 * digits of the component above it.
 *
 * @example
 * ```ts
 * hex({ red: 255, green: 85, blue: 0 }); // 'ff5500'
 * hex({ red: 0, green: 8, blue: 0 });    // '000800'
 * ```
 *
 * @see channel
 * @see parseHex
 *
 * @since 2.0.0
 */

export function hex({ red, green, blue }: ColorInterface): string {
    return ((1 << 24) + (channel(red) << 16) + (channel(green) << 8) + channel(blue)).toString(16).slice(1);
}

/**
 * Reads a hexadecimal color into its three components.
 *
 * @param color - A 3 or 6 digit hexadecimal color, with or without the leading `#`
 * @returns The red, green, and blue components of the color
 * @throws Error - When the string is not 3 or 6 hexadecimal digits
 *
 * @remarks
 * The digits may be upper or lower case, and the short form doubles each one,
 * so `#f50` and `#ff5500` name the same color.
 * The check runs before the parse, so a typo reports where the color was written instead of drawing a color nobody
 * asked for.
 *
 * @example
 * ```ts
 * parseHex('#f50');   // { red: 255, green: 85, blue: 0 }
 * parseHex('00ff00'); // { red: 0, green: 255, blue: 0 }
 * ```
 *
 * @see hex
 * @since 2.0.0
 */

export function parseHex(color: string): ColorInterface {
    const digits = color.charCodeAt(0) === 35 ? color.slice(1) : color;
    if (!/^(?:[\da-f]{3}|[\da-f]{6})$/i.test(digits))
        throw new Error(`Invalid hex color format: "${ color }". Expected 3 or 6 hex digits.`);

    const value = parseInt(digits.length === 3 ? digits.replace(/./g, '$&$&') : digits, 16);

    return { red: value >>> 16 & 255, green: value >>> 8 & 255, blue: value & 255 };
}
