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
    CLEAR_LINE: '\x1B[K',

    /**
     * Hides the cursor
     * @since 1.0.0
     */

    HIDE_CURSOR: '\x1B[?25l',

    /**
     * Shows the cursor
     * @since 1.0.0
     */

    SHOW_CURSOR: '\x1B[?25h',

    /**
     * Saves the current cursor position
     * @since 1.0.0
     */

    SAVE_CURSOR: '\x1B[s',

    /**
     * Clears the entire screen and moves cursor to home position
     * @since 1.0.0
     */

    CLEAR_SCREEN: '\x1b[2J\x1b[H',

    /**
     * Restores the cursor to the previously saved position
     * @since 1.0.0
     */

    RESTORE_CURSOR: '\x1B[u',

    /**
     * Clears the screen from the cursor position down and moves cursor to home position
     * @since 1.0.0
     */

    CLEAR_SCREEN_DOWN: '\x1b[J'
} as const;
