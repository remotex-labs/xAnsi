/**
 * Writes raw data directly to the standard output stream without any processing
 *
 * @param data - The string or Buffer to write to stdout
 *
 * @returns Nothing
 *
 * @example
 * ```ts
 * // Write an ANSI escape sequence followed by text
 * writeRaw('\x1b[31mThis text is red\x1b[0m');
 * ```
 *
 * @since 1.0.0
 */

export function writeRaw(data: string | Buffer): void {
    if(process.stdout.write)
        process.stdout.write(data);
    else
        console.log(data);
}

/**
 * Generates an ANSI escape sequence to move the terminal cursor to the specified position
 *
 * @param row - The row (line) number to move the cursor to (1-based index)
 * @param column - The column position to move the cursor to (1-based index)
 *
 * @returns ANSI escape sequence string that moves the cursor when written to the terminal
 *
 * @example
 * ```ts
 * // Move cursor to the beginning of line 5
 * const escapeSequence = moveCursor(5, 1);
 * process.stdout.write(escapeSequence);
 * ```
 *
 * @since 1.0.0
 */

export function moveCursor(row: number, column: number = 0): string {
    return `\x1b[${ row };${ column }H`;
}

/**
 * Removes ANSI escape sequences from a string
 *
 * @param str - The input string containing ANSI escape sequences
 * @returns A plain string with all ANSI escape sequences removed
 *
 * @remarks
 * This function uses a regular expression to match and remove ANSI escape sequences
 * that control text styling in terminal output. These sequences typically start with
 * the escape character (x1b) followed by square brackets and control codes.
 *
 * The function is useful for:
 * - Getting accurate string length measurements without styling codes
 * - Preparing terminal output for non-terminal destinations (files, logs)
 * - Normalizing text for comparison or processing
 *
 * @example
 * ```ts
 * import { xterm, stripAnsi } from '@remotex-labs/xansi';
 *
 * const coloredText = xterm.red('Error!');
 * console.log(stripAnsi(coloredText)); // "Error!" (without ANSI codes)
 * ```
 *
 * @since 1.0.0
 */

export function stripAnsi(str: string): string {
    // Matches ANSI escape sequences like \x1b[31m or \x1b[0m etc.
    return str.replace(/\x1b\[[0-9;]*m/g, '');
}

/**
 * Contains ANSI escape sequence constants for terminal control operations
 *
 * @remarks
 * These ANSI escape codes are used to control terminal output behavior such as
 * cursor movement, screen clearing, and visibility. The enum provides a type-safe
 * way to access these constants without having to remember the raw escape sequences.
 *
 * Each constant is an escape sequence that can be written directly to the terminal
 * to achieve the described effect.
 *
 * @see ShadowRenderer
 * @see https://en.wikipedia.org/wiki/ANSI_escape_code
 *
 * @since 1.0.0
 */

export const ANSI = {
    /**
     * Clears from the cursor to the end of the line
     *
     * @see https://en.wikipedia.org/wiki/ANSI_escape_code#CSI_sequences
     * @since 1.0.0
     */

    CLEAR_LINE: '\x1B[K',

    /**
     * Hides the cursor
     *
     * @see https://en.wikipedia.org/wiki/ANSI_escape_code#CSI_sequences
     * @since 1.0.0
     */

    HIDE_CURSOR: '\x1B[?25l',

    /**
     * Shows the cursor
     *
     * @see https://en.wikipedia.org/wiki/ANSI_escape_code#CSI_sequences
     * @since 1.0.0
     */

    SHOW_CURSOR: '\x1B[?25h',

    /**
     * Saves the current cursor position
     *
     * @see https://en.wikipedia.org/wiki/ANSI_escape_code#CSI_sequences
     * @since 1.0.0
     */

    SAVE_CURSOR: '\x1B[s',

    /**
     * Clears the entire screen and moves the cursor to home position (top-left)
     *
     * @see https://en.wikipedia.org/wiki/ANSI_escape_code#CSI_sequences
     * @since 1.0.0
     */

    CLEAR_SCREEN: '\x1b[2J\x1b[H',

    /**
     * Restores the cursor to the previously saved position
     *
     * @see https://en.wikipedia.org/wiki/ANSI_escape_code#CSI_sequences
     * @since 1.0.0
     */

    RESTORE_CURSOR: '\x1B[u',

    /**
     * Clears the screen from the cursor position down
     *
     * @see https://en.wikipedia.org/wiki/ANSI_escape_code#CSI_sequences
     * @since 1.0.0
     */

    CLEAR_SCREEN_DOWN: '\x1b[J',

    /**
     * Resets the terminal to its initial state (RIS - Reset to Initial State).
     * Clears screen, scrollback buffer, and most settings.
     * This is a "hard reset" escape code.
     *
     * @see https://en.wikipedia.org/wiki/ANSI_escape_code#Reset_(RIS)
     * @since 1.0.0
     */
    RESET_TERMINAL: '\x1bc'
} as const;
