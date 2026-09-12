/**
 * The place a terminal reports its cursor to be.
 *
 * @remarks
 * The two numbers are read straight out of the cursor position report a terminal sends in answer to a device
 * status report, so they carry that reply's conventions rather than any of this library's own.
 * Both are 1-based, which matches every cursor sequence and makes a reported pair safe to hand back to
 * {@link moveCursor} unchanged.
 *
 * A report describes where the cursor was when the terminal answered.
 * Anything written between the query and the read has already moved it, so a position is worth treating as a
 * reading rather than as a value to hold on to.
 *
 * @example
 * ```ts
 * const position = await getCursorPosition();
 * position;                                    // { row: 12, column: 34 }
 * writeRaw(moveCursor(position.row, position.column));
 * ```
 *
 * @see getCursorPosition
 * @see https://en.wikipedia.org/wiki/ANSI_escape_code#CPR
 *
 * @since 2.0.0
 */

export interface CursorPositionInterface {
    /**
     * The 1-based row the cursor sits on.
     *
     * @remarks
     * Row 1 is the top line of the screen, not of the visible output, so a scrolled terminal still reports 1 for
     * its first line.
     * Origin mode is the exception - with it set, a terminal counts from the top of the scrolling region
     * instead, so a reserved band changes what row 1 is mean.
     *
     * @example
     * ```ts
     * const { row } = await getCursorPosition();
     * row; // 12
     * ```
     *
     * @see column
     * @since 2.0.0
     */

    row: number;

    /**
     * The 1-based column the cursor sits on.
     *
     * @remarks
     * Column 1 is the leftmost cell.
     * A terminal counts cells rather than characters, so a line of double-width text puts the cursor at twice
     * the column its character count suggests.
     *
     * @example
     * ```ts
     * const { column } = await getCursorPosition();
     * column; // 34
     * ```
     *
     * @see row
     * @since 2.0.0
     */

    column: number;
}
