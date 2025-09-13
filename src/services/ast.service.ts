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
    '2': '22',
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
    '38': '39',
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
    '48': '49',
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
 * Splits a string containing ANSI escape codes into individual characters,
 * preserving all active styling for each character.
 *
 * @param str - The ANSI-styled string to process.
 *
 * @returns An array of strings, where each element represents a single character
 *          wrapped with its full active ANSI codes and corresponding reset codes.
 *
 * @remarks
 * This function handles ANSI escape sequences in a string and ensures that each
 * visible character retains the correct styling context.
 *
 * Behavior:
 * - Handles plain text characters and surrogate pairs correctly.
 * - Maintains multiple simultaneous ANSI styles.
 * - Resets styles when encountering `\x1b[0m`.
 * - Supports one-time ANSI codes that affect only the next character.
 *
 * Implementation details:
 * - Tracks active ANSI codes in `prefix` and `suffix` arrays.
 * - Builds `currPrefixStr` and `currSuffixStr` for efficient string reconstruction.
 * - Uses `Array.from` to handle Unicode surrogate pairs.
 *
 * Example usage:
 * ```ts
 * const input = "\x1b[1m\x1b[31mBold Red\x1b[0m";
 * const chars = splitWithAnsiContext(input);
 * // chars[0] = "'\x1B[1;31mB\x1B[22;39m"
 * // chars[1] = "\x1B[1;31mo\x1B[22;39m"
 * ```
 *
 * @since 1.0.0
 */

export function splitWithAnsiContext(str: string): Array<string> {
    if (!str) return [ '' ];

    const result: Array<string> = [];
    const prefix: Array<string> = [];
    const suffix: Array<string> = [];

    let oneTimePrefix = '';
    let currPrefixStr = '';
    let currSuffixStr = '';

    const ansiRe = /\x1b\[[0-9;]*m/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = ansiRe.exec(str))) {
        const chunk = str.slice(lastIndex, match.index);

        // Use Array.from to handle surrogate pairs correctly
        for (const char of Array.from(chunk)) {
            result.push(oneTimePrefix + currPrefixStr + char + currSuffixStr);
            oneTimePrefix = '';
        }

        const token = match[0];
        const codeSeq = token.slice(2, -1);
        const semi = codeSeq.indexOf(';');
        const code = semi < 0 ? codeSeq : codeSeq.slice(0, semi);
        const resetCode = ANSI_RESET_MAP[code];

        if(code === '0') {
            prefix.length = 0;
            suffix.length = 0;
            currPrefixStr = '';
            currSuffixStr = '';
            oneTimePrefix += token;
        } else {
            if (resetCode && prefix[prefix.length - 1] !== codeSeq) {
                prefix.push(codeSeq);
                suffix.push(resetCode);
                currPrefixStr = `\x1b[${ prefix.join(';') }m`;
                currSuffixStr = `\x1b[${ suffix.join(';') }m`;
            } else if (suffix[suffix.length - 1] === codeSeq) {
                prefix.pop();
                suffix.pop();
                currPrefixStr = prefix.length ? `\x1b[${ prefix.join(';') }m` : '';
                currSuffixStr = suffix.length ? `\x1b[${ suffix.join(';') }m` : '';
            } else {
                oneTimePrefix += token;
            }
        }

        lastIndex = ansiRe.lastIndex;
    }

    const remaining = str.slice(lastIndex);
    for (const char of Array.from(remaining)) {
        result.push(oneTimePrefix + currPrefixStr + char + currSuffixStr);
        oneTimePrefix = '';
    }

    return result;
}
