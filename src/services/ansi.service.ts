/**
 * Type-only imports erased during TypeScript compilation.
 */

import type { CursorPositionInterface } from '@services/interfaces/ansi-service.interface';

/**
 * Imports
 */

import { ClearView, CSI, EraseScrollback } from '@constants/ansi.constant';

/**
 * Writes data to standard output exactly as given.
 *
 * @param data - The string or buffer to write
 *
 * @remarks
 * Nothing is appended and nothing is formatted, which is what an escape sequence needs - a trailing newline
 * would move the cursor and undo the positioning the sequence just performed.
 * That is the difference from `console.log`, which is why every sequence in this module goes out through here.
 *
 * The fallback exists for a host that replaces the standard output stream with an object that cannot write.
 * It appends a newline, so a sequence sent that way is no longer raw.
 *
 * @example
 * ```ts
 * writeRaw(`${ moveCursor(3, 1) }${ ClearLine }row three`);
 * ```
 *
 * @see moveCursor
 * @since 1.0.0
 */

export function writeRaw(data: string | Buffer): void {
    if(process.stdout.write) process.stdout.write(data);
    else console.log(data);
}

/**
 * Generates an escape sequence that moves the cursor to a row and column.
 *
 * @param row - The 1-based row to move to
 * @param column - The 1-based column to move to
 *
 * @returns The escape sequence, which does nothing until it is written
 *
 * @remarks
 * `CSI n ; m H` is CUP, Cursor Position, and both coordinates are 1-based.
 * The position is absolute inside the current scrolling region, so a shrunken region moves what row 1 are mean.
 *
 * The column defaults to 0, which a terminal reads as 1 because a parameter of 0 stands for the default.
 *
 * @example
 * ```ts
 * moveCursor(5, 1);  // '\x1b[5;1H'
 * moveCursor(5);     // '\x1b[5;0H' - a terminal reads column 0 as column 1
 * ```
 *
 * @see CursorHome
 * @see https://en.wikipedia.org/wiki/ANSI_escape_code#CUP
 *
 * @since 1.0.0
 */

export function moveCursor(row: number, column: number = 0): string {
    return CSI + `${ row };${ column }H`;
}

/**
 * Generates an escape sequence that scrolls the terminal up by whole rows.
 *
 * @param rows - The number of rows to scroll, defaulting to 1
 *
 * @returns The escape sequence, or an empty string when there is nothing to scroll
 *
 * @remarks
 * `CSI n S` is SU, Scroll Up.
 * The content moves up, and the same number of blank rows opens at the bottom, so the rows that pass the top
 * edge are the ones lost.
 * The cursor stays on its own row rather than traveling with the content.
 *
 * A terminal reads a parameter of 0 as 1, so a count below 1 returns an empty string rather than a sequence.
 * That keeps a computed delta of nothing from scrolling by a row.
 * A fractional count is truncated, since a partial parameter is not a valid sequence.
 *
 * @example
 * ```ts
 * scrollUp();    // '\x1b[1S'
 * scrollUp(3);   // '\x1b[3S'
 * scrollUp(2.9); // '\x1b[2S'
 * scrollUp(0);   // '' - no sequence at all
 * ```
 *
 * @see scrollDown
 * @see https://en.wikipedia.org/wiki/ANSI_escape_code#SU
 *
 * @since 2.0.0
 */

export function scrollUp(rows: number = 1): string {
    const count = Math.trunc(rows);

    return count < 1 ? '' : CSI + `${ count }S`;
}

/**
 * Generates an escape sequence that scrolls the terminal down by whole rows.
 *
 * @param rows - The number of rows to scroll, defaulting to 1
 *
 * @returns The escape sequence, or an empty string when there is nothing to scroll
 *
 * @remarks
 * `CSI n T` is SD, Scroll Down.
 * The content moves down, and the same number of blank rows opens at the top, so the rows pushed past the bottom
 * edge are the ones lost.
 * A terminal does not pull its saved history back into view this way, which makes the sequence useful for
 * opening room rather than for revisiting output.
 *
 * A terminal reads a parameter of 0 as 1, so a count below 1 returns an empty string rather than a sequence.
 *
 * @example
 * ```ts
 * scrollDown();  // '\x1b[1T'
 * scrollDown(3); // '\x1b[3T'
 * scrollDown(0); // '' - no sequence at all
 * ```
 *
 * @see scrollUp
 * @see https://en.wikipedia.org/wiki/ANSI_escape_code#SD
 *
 * @since 2.0.0
 */

export function scrollDown(rows: number = 1): string {
    const count = Math.trunc(rows);

    return count < 1 ? '' : CSI + `${ count }T`;
}

/**
 * Asks the terminal where its cursor is and waits for the answer.
 *
 * @param timeout - How long to wait for the report, in milliseconds
 *
 * @returns The 1-based row and column the cursor sits on
 *
 * @throws Error - When either stream is not a terminal, or the report does not arrive in time
 *
 * @remarks
 * `CSI 6 n` is DSR, Device Status Report, and the terminal answers with `CSI row ; column R`, which is CPR.
 * The answer arrives on the input stream rather than as a return value, so the read has to be asynchronous.
 *
 * Both streams are checked first, since a redirected output never reaches a terminal and a redirected input
 * never carries the answer back.
 * Raw mode is turned on for the duration and put back afterward, and the stream is paused again only when
 * nothing else was listening to it.
 *
 * Anything the terminal sent that was not the report is pushed back onto the input stream, so a keystroke typed
 * while the query was in flight still reaches the program.
 *
 * @example
 * ```ts
 * const { row, column } = await getCursorPosition();
 * row;    // 12
 * column; // 34
 * ```
 *
 * @see moveCursor
 * @see https://en.wikipedia.org/wiki/ANSI_escape_code#DSR
 *
 * @since 2.0.0
 */

export function getCursorPosition(timeout: number = 200): Promise<CursorPositionInterface> {
    const { stdin, stdout } = process;

    return new Promise((resolve, reject) => {
        if (!stdin.isTTY || !stdout.isTTY)
            return reject(new Error('The cursor position can only be read from a terminal'));

        let buffer = '';
        const wasRaw = stdin.isRaw;
        const wasListening = stdin.listenerCount('data') > 0;

        const settle = (error: Error | null, position?: CursorPositionInterface): void => {
            clearTimeout(timer);
            stdin.off('data', onData);
            stdin.setRawMode(wasRaw);
            if (!wasListening) stdin.pause();
            if (buffer) stdin.unshift(Buffer.from(buffer, 'utf8'));

            if (error) reject(error);
            else resolve(<CursorPositionInterface> position);
        };

        const onData = (chunk: Buffer): void => {
            buffer += chunk.toString('utf8');
            const match = /\x1b\[(\d+);(\d+)R/.exec(buffer);
            if (!match) return;

            buffer = buffer.slice(0, match.index) + buffer.slice(match.index + match[0].length);
            settle(null, { row: Number(match[1]), column: Number(match[2]) });
        };

        const timer = setTimeout(() => settle(
            new Error('Timed out waiting for cursor position report')), timeout
        );

        stdin.setRawMode(true);
        stdin.resume();
        stdin.on('data', onData);
        writeRaw(CSI + '6n');
    });
}

/**
 * Scrolls the visible screen out of sight and moves the cursor home.
 *
 * @remarks
 * `CSI 2 J` is ED, Erase in Display, with a parameter of 2, preceded by CUP so the cursor lands at the top left.
 * A terminal pushes the rows it clears into the scrollback instead of dropping them,
 * so the screen comes up blank while every earlier line is still there to scroll back to.
 * {@link clearAll} is the call that throws that history away, since its `CSI 3 J` erases the saved lines as well.
 *
 * @example
 * ```ts
 * clearView(); // blank screen, earlier output still reachable by scrolling up
 * ```
 *
 * @see clearAll
 * @see https://en.wikipedia.org/wiki/ANSI_escape_code#ED
 *
 * @since 2.0.0
 */

export function clearView(): void {
    writeRaw(ClearView);
}

/**
 * Erases the visible screen and the saved scrollback.
 *
 * @remarks
 * {@link EraseScrollback} follows {@link ClearView} here, and its `CSI 3 J` erases the saved lines, which is what
 * separates this from {@link clearView}.
 * A terminal without that extension ignores the third sequence and clears only the view.
 *
 * @example
 * ```ts
 * clearAll(); // blank screen, nothing left to scroll back to
 * ```
 *
 * @see clearView
 * @see EraseScrollback
 * @see https://en.wikipedia.org/wiki/ANSI_escape_code#ED
 *
 * @since 2.0.0
 */

export function clearAll(): void {
    writeRaw(ClearView + EraseScrollback);
}

/**
 * Generates an escape sequence that moves the cursor down to the start of a later line.
 *
 * @param rows - The number of lines to move down, defaulting to 1
 *
 * @returns The escape sequence, or an empty string when there is nowhere to move
 *
 * @remarks
 * `CSI n E` is CNL, Cursor Next Line, which moves down and returns to column 1 in one sequence.
 * A cursor movement clamps at the last line rather than scrolling, which is what separates it from a newline and
 * makes it safe to send from the bottom row.
 *
 * A count of zero would be read as one, so anything below 1 returns an empty string instead.
 * That keeps a computed delta of nothing from moving the cursor a row.
 *
 * @example
 * ```ts
 * cursorNextLine();  // '\x1b[1E'
 * cursorNextLine(3); // '\x1b[3E'
 * cursorNextLine(0); // '' - no sequence at all
 * ```
 *
 * @see cursorPrevLine
 * @see CursorNextLine
 * @see https://en.wikipedia.org/wiki/ANSI_escape_code#CNL
 *
 * @since 2.0.0
 */

export function cursorNextLine(rows: number = 1): string {
    const count = Math.trunc(rows);

    return count < 1 ? '' : CSI + `${ count }E`;
}

/**
 * Generates an escape sequence that moves the cursor up to the start of an earlier line.
 *
 * @param rows - The number of lines to move up, defaulting to 1
 *
 * @returns The escape sequence, or an empty string when there is nowhere to move
 *
 * @remarks
 * `CSI n F` is CPL, Cursor Previous Line, and it is the counterpart of {@link cursorNextLine}.
 * The move is relative, so it finds the same rows however far the screen has scrolled since they were written -
 * which is what an inline renderer needs and what an absolute {@link moveCursor} cannot give it.
 *
 * The cursor clamps at the first line rather than scrolling the screen backward.
 *
 * @example
 * ```ts
 * cursorPrevLine();  // '\x1b[1F'
 * cursorPrevLine(4); // '\x1b[4F' - back to the top of a five row block
 * cursorPrevLine(0); // '' - already there
 * ```
 *
 * @see cursorNextLine
 * @see https://en.wikipedia.org/wiki/ANSI_escape_code#CPL
 *
 * @since 2.0.0
 */

export function cursorPrevLine(rows: number = 1): string {
    const count = Math.trunc(rows);

    return count < 1 ? '' : CSI + `${ count }F`;
}
