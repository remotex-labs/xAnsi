/**
 * The escape byte that opens every sequence.
 *
 * @remarks
 * `0x1b` is the ASCII escape character, and a terminal reads what follows it as a command rather than as text.
 * On its own the byte does nothing, so it is the piece that {@link CSI} and the two-byte `ESC 7` forms are built
 * from.
 *
 * @example
 * ```ts
 * ESC.charCodeAt(0); // 27
 * ```
 *
 * @see CSI
 * @see https://en.wikipedia.org/wiki/ANSI_escape_code#Escape_sequences
 *
 * @since 2.0.0
 */

export const ESC = '\x1b';

/**
 * The Control Sequence Introducer that opens a parameterized sequence.
 *
 * @remarks
 * `ESC [` is CSI, and a terminal reads the bytes after it as parameters up to the final letter that names the
 * command.
 * Every sequence in this module is built from this prefix rather than from a written out escape byte,
 * so the two-character opener has a single definition.
 *
 * @example
 * ```ts
 * `${ CSI }2J`; // '\x1b[2J' - erase the display
 * ```
 *
 * @see ESC
 * @see https://en.wikipedia.org/wiki/ANSI_escape_code#CSIsection
 *
 * @since 2.0.0
 */

export const CSI = ESC + '[';

/**
 * Erases the saved scrollback.
 *
 * @remarks
 * `CSI 3 J` is ED, Erase in Display, with a parameter of 3, and it drops the lines the terminal keeps above the
 * visible screen.
 * The visible screen is left alone, so this follows {@link ClearView} rather than replacing it.
 * The parameter is an `xterm` extension, so a terminal without it ignores the sequence and keeps its history.
 *
 * @example
 * ```ts
 * writeRaw(ClearView + EraseScrollback); // blank screen, nothing left to scroll back to
 * ```
 *
 * @see clearAll
 * @see ClearView
 * @see https://en.wikipedia.org/wiki/ANSI_escape_code#ED
 *
 * @since 2.0.0
 */

export const EraseScrollback = CSI + '3J';

/**
 * Erases from the cursor to the end of the line.
 *
 * @remarks
 * `CSI K` is EL, Erase in Line, and an omitted parameter means 0 - erase rightward from the cursor and leave
 * everything to It's left alone.
 * Despite the name, this does not clear the whole line. `CSI 2 K` does that, and `CSI 1 K` erases leftward.
 *
 * The cursor does not move, so a repaint pairs this with a positioning sequence rather than relying on it.
 * The erased cells take the current background color, which matters when a background is still active.
 *
 * @example
 * ```ts
 * writeRaw(`${ moveCursor(3, 1) }${ ClearLine }new text`); // rewrites row 3 from column 1
 * ```
 *
 * @see ClearView
 * @see https://en.wikipedia.org/wiki/ANSI_escape_code#EL
 *
 * @since 2.0.0
 */

export const ClearLine = CSI + 'K';

/**
 * Moves the cursor home and erases the whole visible screen.
 *
 * @remarks
 * Two sequences in one - `CSI H` is CUP with no parameters, and `CSI 2 J` is ED with a parameter of 2.
 * The order matters, since ED leaves the cursor where it found it on most terminals.
 *
 * The scrollback is untouched, so earlier output is still reachable by scrolling up.
 * {@link EraseScrollback} erases the saved lines as well, which is the difference between clearing the view and
 * clearing the history.
 *
 * @example
 * ```ts
 * writeRaw(ClearView); // blank screen, cursor at row 1 column 1, history intact
 * ```
 *
 * @see CursorHome
 * @see EraseScrollback
 * @see https://en.wikipedia.org/wiki/ANSI_escape_code#ED
 *
 * @since 2.0.0
 */

export const ClearView = CSI + 'H' +  CSI + '2J';

/**
 * Moves the cursor to the top left corner.
 *
 * @remarks
 * `CSI H` is CUP, Cursor Position, and both parameters default to 1, so this is the same as `CSI 1 ; 1 H`.
 * Rows and columns are 1-based, which is why the home position is 1 rather than 0.
 *
 * The position is absolute within the current scrolling region, so a shrunken region moves what home means.
 *
 * @example
 * ```ts
 * writeRaw(CursorHome); // row 1, column 1
 * ```
 *
 * @see ClearView
 * @see https://en.wikipedia.org/wiki/ANSI_escape_code#CUP
 *
 * @since 2.0.0
 */

export const CursorHome = CSI + 'H';

/**
 * Hides the cursor.
 *
 * @remarks
 * `CSI ? 25 l` resets DEC private mode 25, DECTCEM.
 * The `?` marks the parameter as private rather than standard, and the final `l` is RM, Reset Mode.
 *
 * Hide the cursor around a repaint so it does not flicker across the screen as the cells are rewritten and
 * restore it afterward.
 * A program that exits while the cursor is hidden leaves the terminal without one, so pair this with
 * {@link ShowCursor} on every exit path.
 *
 * @example
 * ```ts
 * writeRaw(HideCursor);
 * writeRaw(frame);
 * writeRaw(ShowCursor);
 * ```
 *
 * @see ShowCursor
 * @see https://en.wikipedia.org/wiki/ANSI_escape_code#CSIsection
 *
 * @since 2.0.0
 */

export const HideCursor = CSI + '?25l';

/**
 * Shows the cursor.
 *
 * @remarks
 * `CSI ? 25 h` sets DEC private mode 25, DECTCEM, and the final `h` is SM, Set Mode.
 * This is the counterpart of {@link HideCursor} and is safe to send when the cursor is already visible.
 *
 * @example
 * ```ts
 * writeRaw(ShowCursor); // the cursor is drawn again
 * ```
 *
 * @see HideCursor
 * @see https://en.wikipedia.org/wiki/ANSI_escape_code#CSIsection
 *
 * @since 2.0.0
 */

export const ShowCursor = CSI + '?25h';

/**
 * Saves the cursor position.
 *
 * @remarks
 * `CSI s` is SCP, also called SCOSC, and it records only the position.
 *
 * A terminal with left and right margin mode enabled reads `CSI s` as DECSLRM instead and sets margins with it,
 * so this form is not universally safe.
 * The `ESC 7` form, DECSC, has no such conflict and also saves the character attributes and the character set,
 * which makes it the better choice inside a renderer.
 *
 * @example
 * ```ts
 * writeRaw(`${ SaveCursor }${ moveCursor(1, 1) }header${ RestoreCursor }`);
 * ```
 *
 * @see RestoreCursor
 * @see https://en.wikipedia.org/wiki/ANSI_escape_code#SCP
 *
 * @since 2.0.0
 */

export const SaveCursor = CSI + 's';

/**
 * Restores the cursor to the saved position.
 *
 * @remarks
 * `CSI u` is RCP, also called SCORC, and it returns the cursor to wherever {@link SaveCursor} last recorded it.
 * Nothing is saved by default, so a restore without a matching save moves the cursor home on most terminals.
 *
 * @example
 * ```ts
 * writeRaw(RestoreCursor); // back to the position the matching save recorded
 * ```
 *
 * @see SaveCursor
 * @see https://en.wikipedia.org/wiki/ANSI_escape_code#RCP
 *
 * @since 2.0.0
 */

export const RestoreCursor = CSI + 'u';

/**
 * Moves the cursor to the first column of the current row.
 *
 * @remarks
 * `CSI 1 G` is CHA, Cursor Horizontal Absolute, with an explicit column of 1.
 * The row is left alone, which is what separates this from {@link CursorHome}.
 *
 * A carriage return does the same thing in a single byte.
 * This form is worth its extra bytes where the output passes through something that rewrites a carriage return,
 * since an escape sequence travels unchanged.
 *
 * @example
 * ```ts
 * writeRaw(`${ CursorStartLine }${ ClearLine }redrawn`); // rewrites the current row in place
 * ```
 *
 * @see CursorHome
 * @see https://en.wikipedia.org/wiki/ANSI_escape_code#CHA
 *
 * @since 2.0.0
 */

export const CursorStartLine = CSI + '1G';

/**
 * Saves the cursor position together with the character attributes and the character set.
 *
 * @remarks
 * `ESC 7` is DECSC, and it records more state than {@link SaveCursor} does - the position, the active SGR
 * attributes, and the selected character set all travel with it.
 * Nothing follows the escape byte, so no terminal can read it as a margin command the way it reads `CSI s`.
 *
 * The terminal keeps one save slot, so a second save overwrites the first rather than pushing onto a stack.
 *
 * @example
 * ```ts
 * // the cursor and the attributes come back
 * writeRaw(`${ SaveCursorState }${ moveCursor(1, 1) }header${ RestoreCursorState }`);
 * ```
 *
 * @see SaveCursor
 * @see RestoreCursorState
 * @see https://en.wikipedia.org/wiki/ANSI_escape_code#Fp_Escape_sequences
 *
 * @since 2.0.0
 */

export const SaveCursorState = ESC + '7';

/**
 * Restores the cursor position, the character attributes, and the character set.
 *
 * @remarks
 * `ESC 8` is DECRC, and it undoes whatever {@link SaveCursorState} last recorded.
 * A restore without a matching save moves the cursor home and resets the attributes on most terminals.
 *
 * @example
 * ```ts
 * writeRaw(RestoreCursorState); // back to the position and the attributes the matching save recorded
 * ```
 *
 * @see RestoreCursor
 * @see SaveCursorState
 * @see https://en.wikipedia.org/wiki/ANSI_escape_code#Fp_Escape_sequences
 *
 * @since 2.0.0
 */

export const RestoreCursorState = ESC + '8';

/**
 * Starts a synchronized update.
 *
 * @remarks
 * `CSI ? 2026 h` sets DEC private mode 2026, and it tells the terminal to hold the screen still until the
 * matching {@link SyncUpdateEnd} arrives.
 * Everything written in between lands as one frame, which removes the tearing a large repaint shows when the
 * terminal draws a partial frame.
 *
 * A terminal without the mode ignores the sequence, so the frame draws as it would have without it.
 * A frame that never ends the update leaves the screen frozen until the terminal's own timeout fires, so pair
 * this with {@link SyncUpdateEnd} on every exit path.
 *
 * @example
 * ```ts
 * writeRaw(SyncUpdateStart);
 * writeRaw(frame);
 * writeRaw(SyncUpdateEnd);
 * ```
 *
 * @see SyncUpdateEnd
 * @see https://gist.github.com/christianparpart/d8a62cc1ab659194337d73e399004036
 *
 * @since 2.0.0
 */

export const SyncUpdateStart = CSI + '?2026h';

/**
 * Ends a synchronized update.
 *
 * @remarks
 * `CSI ? 2026 l` resets DEC private mode 2026, and the terminal draws everything the update buffered as a single
 * frame.
 * This is the counterpart of {@link SyncUpdateStart} and is safe to send when no update is open.
 *
 * @example
 * ```ts
 * writeRaw(SyncUpdateEnd); // the buffered frame reaches the screen
 * ```
 *
 * @see SyncUpdateStart
 * @see https://gist.github.com/christianparpart/d8a62cc1ab659194337d73e399004036
 *
 * @since 2.0.0
 */

export const SyncUpdateEnd = CSI + '?2026l';

/**
 * Moves the cursor to the first column of the next line.
 *
 * @remarks
 * `CSI E` is CNL, Cursor Next Line, and it combines a move down with a carriage return.
 * A cursor movement clamps at the last line rather than scrolling, which is what separates it from a newline and
 * makes it safe to send from the bottom row of a frame.
 *
 * Three bytes reach the terminal instead of the six or more a {@link moveCursor} call costs, so a renderer that
 * repaints adjacent rows sends noticeably less.
 *
 * @example
 * ```ts
 * writeRaw(`row one${ CursorNextLine }row two`);
 * ```
 *
 * @see CursorStartLine
 * @see https://en.wikipedia.org/wiki/ANSI_escape_code#CNL
 *
 * @since 2.0.0
 */

export const CursorNextLine = CSI + 'E';

/**
 * Erases from the cursor to the end of the screen.
 *
 * @remarks
 * `CSI J` is ED, Erase in Display, with its default parameter of 0, so the rest of the current line goes along
 * with every line below it.
 * The scrollback is untouched, which is the difference from {@link EraseScrollback}.
 *
 * A renderer that shrinks its output uses this to drop the rows it no longer covers, rather than painting blanks
 * over them one line at a time.
 *
 * @example
 * ```ts
 * writeRaw(moveCursor(10, 1) + ClearDown); // rows 10 and below are blank
 * ```
 *
 * @see ClearLine
 * @see ClearView
 * @see https://en.wikipedia.org/wiki/ANSI_escape_code#ED
 *
 * @since 2.0.0
 */

export const ClearDown = CSI + 'J';

/**
 * Switches the terminal to its alternate screen buffer.
 *
 * @remarks
 * `CSI ? 1049 h` saves the cursor, switches to a second screen that has no scrollback of its own, and clears it.
 * The main screen keeps everything that was on it, so {@link ExitAltScreen} puts the shell back exactly as the
 * program found it - which is what makes a full screen view acceptable in a terminal the user was already
 * working in.
 *
 * A terminal without the mode ignores the sequence and the program draws over the main screen instead, so pair
 * this with {@link ExitAltScreen} on every exit path either way.
 *
 * @example
 * ```ts
 * writeRaw(EnterAltScreen);
 * // ... draw a full-screen view ...
 * writeRaw(ExitAltScreen);
 * ```
 *
 * @see ExitAltScreen
 * @see https://invisible-island.net/xterm/ctlseqs/ctlseqs.html#h3-The-Alternate-Screen-Buffer
 *
 * @since 2.0.0
 */

export const EnterAltScreen = CSI + '?1049h';

/**
 * Returns the terminal to its main screen buffer.
 *
 * @remarks
 * `CSI ? 1049 l` restores the main screen and the cursor position {@link EnterAltScreen} saved, and whatever the
 * program drew on the alternate screen is gone rather than pushed into the scrollback.
 *
 * Sending it without having entered the alternate screen is harmless, which is what lets a teardown path send it
 * unconditionally.
 *
 * @example
 * ```ts
 * writeRaw(ExitAltScreen); // the shell is back, scrollback intact
 * ```
 *
 * @see EnterAltScreen
 * @see https://invisible-island.net/xterm/ctlseqs/ctlseqs.html#h3-The-Alternate-Screen-Buffer
 *
 * @since 2.0.0
 */

export const ExitAltScreen = CSI + '?1049l';

/**
 * Resets every style back to the terminal's default.
 *
 * @remarks
 * `CSI 0 m` is SGR with its default parameter, and it drops the foreground color, the background color, and
 * every modifier at once.
 * A chain from {@link xterm} closes what it opened, so this is for text that came from somewhere else - a
 * truncated line whose closing sequence was cut off is the usual case.
 *
 * @example
 * ```ts
 * writeRaw(Reset); // nothing written after this carries earlier styling
 * ```
 *
 * @see truncate
 * @since 2.0.0
 */

export const Reset = CSI + '0m';
