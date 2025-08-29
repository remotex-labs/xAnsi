/**
 * Maps ANSI styling codes to their corresponding reset codes
 *
 * @remarks
 * This mapping defines the relationship between ANSI control codes and the codes needed to reset each style.
 * The map is organized into text styling codes, foreground
 * colors, background colors, and reset codes. For reset codes, the value is null as they
 * don't require a specific reset code themselves.
 *
 * Text styles (1-9) map to their specific reset codes, while foreground colors (30-37)
 * all reset with code 39, and background colors (40-47) all reset with code 49.
 *
 * @example
 * ```ts
 * // Get the reset code for bold text (code 1)
 * const boldResetCode = ANSI_RESET_MAP['1']; // Returns '22'
 *
 * // Check if a code is a reset code itself
 * const isResetCode = ANSI_RESET_MAP['0'] === null; // Returns true
 * ```
 *
 * @since 1.0.0
 */

const ANSI_RESET_MAP: Record<string, string | null> = {
    // Text styles
    '1': '22',
    '3': '23',
    '4': '24',
    '5': '25',
    '7': '27',
    '8': '28',
    '9': '29',

    // Foreground colors
    '30': '39',
    '31': '39',
    '32': '39',
    '33': '39',
    '34': '39',
    '35': '39',
    '36': '39',
    '37': '39',
    '90': '39',
    '91': '39',
    '92': '39',
    '93': '39',
    '94': '39',
    '95': '39',
    '96': '39',
    '97': '39',

    // Background colors
    '40': '49',
    '41': '49',
    '42': '49',
    '43': '49',
    '44': '49',
    '45': '49',
    '46': '49',
    '47': '49',
    '100': '49',
    '101': '49',
    '102': '49',
    '103': '49',
    '104': '49',
    '105': '49',
    '106': '49',
    '107': '49',

    // Resets
    '0': null,
    '22': null,
    '23': null,
    '24': null,
    '25': null,
    '27': null,
    '28': null,
    '29': null,
    '39': null,
    '49': null
};

/**
 * Processes ANSI escape codes and updates the active styles map
 *
 * @param code - The ANSI code to process
 * @param index - Current index in the codes array
 * @param codes - Array of all ANSI codes in the sequence
 * @param active - Map of active styles to be updated
 * @returns The new index position after processing
 *
 * @throws InvalidCodeError - When an unsupported ANSI code is encountered
 *
 * @example
 * ```ts
 * const active = new Map<string, string>();
 * const codes = ['1', '31'];
 * const newIndex = processAnsiCode('1', 0, codes, active);
 * ```
 *
 * @since 1.0.0
 */

export function processAnsiCode(code: string, index: number, codes: Array<string>, active: Map<string, string>): number {
    const next = codes[index + 1];
    const afterNext = codes[index + 2];

    // For extended color codes (38/48), pre-calculate the reset code
    const resetCode = (code === '38' || code === '48') ? (code === '38' ? '39' : '49') : null;

    // Handle truecolor: 38;2;r;g;b or 48;2;r;g;b
    if (resetCode && next === '2') {
        const rgb = codes.slice(index + 2, index + 5);
        if (rgb.length === 3) {
            active.set(`${ code };2;${ rgb.join(';') }`, resetCode);

            return index + 4;
        }
    }

    // Handle 256-color: 38;5;n or 48;5;n
    if (resetCode && next === '5' && afterNext !== undefined) {
        active.set(`${ code };5;${ afterNext }`, resetCode);

        return index + 2;
    }

    // Handle reset mappings
    const reset = ANSI_RESET_MAP[code];
    if (reset !== undefined) {
        if (reset === null) {
            if (code === '0') {
                active.clear(); // Full reset
            } else {
                // Remove any matching key or reset
                for (const [ k, v ] of active) {
                    if (k === code || v === code) {
                        active.delete(k);
                        break;
                    }
                }
            }
        } else {
            active.set(code, reset);
        }
    }

    return index;
}

/**
 * Splits an ANSI-styled string into individual characters, each wrapped with current active ANSI codes and their resets
 *
 * @param str - The ANSI-styled string to process
 * @returns An array of strings where each element is a character with its complete ANSI styling context
 *
 * @throws Error - If the ANSI sequence contains invalid codes
 *
 * @remarks
 * This function maintains the styling context for each character by tracking active ANSI codes
 * as it processes the input string. It reconstructs each visible character with its full styling
 * information, ensuring that each character in the returned array has the proper ANSI codes
 * prefixed and the corresponding reset codes suffixed.
 *
 * The function handles:
 * - Plain text characters
 * - ANSI escape sequences for styling
 * - Multiple active styles simultaneously
 *
 * @example
 * ```ts
 * // Split a string with bold and colored text
 * const input = "\x1b[1m\x1b[31mBold Red\x1b[0m";
 * const chars = splitWithAnsiContext(input);
 * // Result: Each character will be individually styled with bold and red
 * // e.g., ["\x1b[1m\x1b[31mB\x1b[22m\x1b[39m", "\x1b[1m\x1b[31mo\x1b[22m\x1b[39m", ...]
 * ```
 *
 * @see processAnsiCode - For details on how individual ANSI codes are processed
 * @since 1.0.0
 */

export function splitWithAnsiContext(str: string): Array<string> {
    const ansiRegex = /\x1b\[[0-9;]*m/g;
    const tokens = str.match(new RegExp(`${ ansiRegex.source }|.`, 'g')) || [];

    const active = new Map<string, string>();
    const result: Array<string> = [];

    for (const token of tokens) {
        if (!token.startsWith('\x1b[')) {
            // Wrap visible character with current styles and resets
            const prefix = [ ...active.keys() ].map(k => `\x1b[${ k }m`).join('');
            const suffix = [ ...new Set(active.values()) ].map(k => `\x1b[${ k }m`).join('');
            result.push(`${ prefix }${ token }${ suffix }`);
            continue;
        }

        // Handle ANSI escape codes
        const codes = token.slice(2, -1).split(';');
        for (let i = 0; i < codes.length; i++) {
            i = processAnsiCode(codes[i], i, codes, active);
        }
    }

    return result;
}
