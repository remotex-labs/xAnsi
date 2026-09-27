/**
 * The escape character that opens every terminal sequence.
 *
 * @remarks
 * A terminal reads the byte `0x1b` as the start of a control sequence rather than as text,
 * and the character right after it decides which family the sequence belongs to.
 *
 * @example
 * ```ts
 * `${ ESC }7`; // '\x1b7' - the save cursor sequence
 * ```
 *
 * @see CSI
 * @see OSC
 *
 * @since 2.0.0
 */

export const ESC = '\x1b';

/**
 * The bell character that terminates a string sequence.
 *
 * @remarks
 * A terminal rings or flashes at this byte on its own,
 * so it carries a second meaning only where a sequence already waits for a terminator.
 * An OSC string ends either with this character or with the ST sequence, and the bell form is the older of the two.
 *
 * @example
 * ```ts
 * `${ OSC }0;xAnsi${ BEL }`; // '\x1b]0;xAnsi\x07' - sets the window title
 * ```
 *
 * @see OSC
 * @since 2.0.0
 */

export const BEL = '\x07';

/**
 * The Control Sequence Introducer that opens a cursor, erase, or mode sequence.
 *
 * @remarks
 * What follows is a list of numeric parameters and a final letter that names the operation,
 * so a caller builds a sequence by appending to this prefix instead of writing the escape again.
 * A private mode puts a `?` in front of its parameter.
 *
 * @example
 * ```ts
 * `${ CSI }2J`;   // '\x1b[2J'   - erases the screen
 * `${ CSI }5;1H`; // '\x1b[5;1H' - moves the cursor to row 5, column 1
 * ```
 *
 * @see ESC
 * @see OSC
 *
 * @since 2.0.0
 */

export const CSI = `${ ESC }[`;

/**
 * The Operating System Command that opens a string request such as a window title.
 *
 * @remarks
 * Its parameters are text rather than numbers, so nothing inside the payload marks the end of it.
 * A terminator closes it instead, either {@link BEL} or the ST sequence.
 *
 * @example
 * ```ts
 * `${ OSC }0;build${ BEL }`; // '\x1b]0;build\x07' - sets the window title
 * ```
 *
 * @see BEL
 * @see CSI
 *
 * @since 2.0.0
 */

export const OSC = `${ ESC }]`;

/**
 * The sequence that clears every style back to the terminal's default.
 *
 * @remarks
 * Parameter `0` of the graphic rendition sequence drops the color, the weight, and every other attribute at once,
 * which makes it the safe way to end output whose styles are unknown.
 *
 * @example
 * ```ts
 * `${ CSI }31merror${ Reset }`; // '\x1b[31merror\x1b[0m'
 * ```
 *
 * @see CSI
 * @since 2.0.0
 */

export const Reset = `${ CSI }0m`;

/**
 * The sequence that erases the line the cursor sits on.
 *
 * @remarks
 * Parameter `2` covers the line on both sides of the cursor,
 * and the cursor itself stays where it is, so a redraw overwrites the row and leaves no stale tail behind.
 *
 * @example
 * ```ts
 * `${ CursorHome }${ ClearLine }ready`; // '\x1b[H\x1b[2Kready' - rewrites the first row
 * ```
 *
 * @see ClearDown
 * @since 2.0.0
 */

export const ClearLine = `${ CSI }2K`;

/**
 * The sequence that erases from the cursor to the end of the screen.
 *
 * @remarks
 * The erase parameter defaults to `0`, so the sequence carries no digit at all.
 * Whatever sits above the cursor survives, which makes it the cheap way to shrink a frame that used to be taller.
 *
 * @example
 * ```ts
 * `${ CursorHome }${ ClearDown }`; // '\x1b[H\x1b[J' - clears the view from the top down
 * ```
 *
 * @see ClearLine
 * @see ClearView
 *
 * @since 2.0.0
 */

export const ClearDown = `${ CSI }J`;

/**
 * The sequence that moves the cursor to row 1, column 1.
 *
 * @remarks
 * Both coordinates of the cursor position sequence default to `1`, so this form needs no parameter at all.
 *
 * @example
 * ```ts
 * `${ CursorHome }title`; // '\x1b[Htitle' - writes at the top left
 * ```
 *
 * @see CursorNextLine
 * @since 2.0.0
 */

export const CursorHome = `${ CSI }H`;

/**
 * The pair of sequences that homes the cursor and erases the screen.
 *
 * @remarks
 * Erasing the display leaves the cursor where it was,
 * so the home sequence runs first and output resumes at the top left.
 * The scrollback survives - {@link ClearScrollback} is what drops it.
 *
 * @example
 * ```ts
 * ClearView; // '\x1b[H\x1b[2J'
 * ```
 *
 * @see ClearDown
 * @see ClearScrollback
 *
 * @since 2.0.0
 */

export const ClearView = `${ CursorHome }${ CSI }2J`;

/**
 * The sequence that drops the scrollback buffer.
 *
 * @remarks
 * Parameter `3` is a xterm extension that removes the lines that scrolled off the top,
 * and it leaves what is on screen alone.
 * Pair it with {@link ClearView} to leave the terminal with nothing to scroll back to.
 *
 * @example
 * ```ts
 * `${ ClearView }${ ClearScrollback }`; // '\x1b[H\x1b[2J\x1b[3J'
 * ```
 *
 * @see ClearView
 * @since 2.0.0
 */

export const ClearScrollback = `${ CSI }3J`;

/**
 * The sequence that moves the cursor to the start of the next line.
 *
 * @remarks
 * The column resets to `1` as part of the move,
 * so a frame drawn row by row needs no carriage return of its own.
 *
 * @example
 * ```ts
 * `row${ CursorNextLine }row`; // 'row\x1b[Erow' - the second row starts at column 1
 * ```
 *
 * @see CursorHome
 * @since 2.0.0
 */

export const CursorNextLine = `${ CSI }E`;

/**
 * The sequence that stores the cursor position together with the styles in effect.
 *
 * @remarks
 * One slot holds the saved state, so a second save overwrites the first instead of stacking on it.
 * The styles travel with the position, which is why a restore also puts back the color that was active.
 *
 * @example
 * ```ts
 * `${ SaveCursor }${ CursorHome }status${ RestoreCursor }`;
 * // '\x1b7\x1b[Hstatus\x1b8' - writes at the top left and comes back
 * ```
 *
 * @see RestoreCursor
 * @since 2.0.0
 */

export const SaveCursor = `${ ESC }7`;

/**
 * The sequence that returns the cursor to the last saved position and styles.
 *
 * @remarks
 * A terminal with nothing saved moves the cursor to the top left and resets the styles,
 * so a restore without It's matching save is not a harmless call.
 *
 * @example
 * ```ts
 * RestoreCursor; // '\x1b8'
 * ```
 *
 * @see SaveCursor
 * @since 2.0.0
 */

export const RestoreCursor = `${ ESC }8`;

/**
 * The private modes a terminal turns on and off.
 *
 * @remarks
 * Each value is the parameter of a private mode sequence rather than a sequence of its own,
 * where a final `h` turns the mode on and a final `l` turns it off.
 * A terminal that does not know a mode ignores the sequence, so enabling one is safe even where it does nothing.
 *
 * @example
 * ```ts
 * `${ CSI }?${ Mode.AltScreen }h`; // '\x1b[?1049h' - switches to the alternate screen
 * `${ CSI }?${ Mode.Cursor }l`;    // '\x1b[?25l'   - hides the cursor
 * `${ CSI }?${ Mode.Cursor }h`;    // '\x1b[?25h'   - shows it again
 * ```
 *
 * @see CSI
 * @see CursorStyle
 * @see MouseAction
 *
 * @since 2.0.0
 */

export const enum Mode {
    /**
     * Whether the terminal wraps text that reaches the right margin.
     *
     * @remarks
     * With the mode off, the last column swallows whatever runs past it,
     * which keeps a full-width frame from scrolling the screen up by a row.
     *
     * @example
     * ```ts
     * `${ CSI }?${ Mode.Wrap }l`; // '\x1b[?7l' - stops the right margin from wrapping
     * ```
     *
     * @since 2.0.0
     */

    Wrap = 7,

    /**
     * Whether the terminal holds its screen updates until the mode goes off.
     *
     * @remarks
     * A frame drawn between the two sequences reaches the screen in one step, so a half-drawn frame never shows.
     * A terminal without the mode draws as the writes arrive, which costs nothing beyond the tearing it already had.
     *
     * @example
     * ```ts
     * `${ CSI }?${ Mode.Sync }h`; // '\x1b[?2026h' - opens an atomic frame
     * ```
     *
     * @since 2.0.0
     */

    Sync = 2026,

    /**
     * Whether the terminal reports that its window gained or lost focus.
     *
     * @remarks
     * Focus arrives on the input stream as `CSI I` and blur as `CSI O`,
     * which lets a render loop idle while nobody is looking at it.
     *
     * @example
     * ```ts
     * `${ CSI }?${ Mode.Focus }h`; // '\x1b[?1004h' - asks for focus reports
     * ```
     *
     * @since 2.0.0
     */

    Focus = 1004,

    /**
     * Whether the terminal brackets the text of a paste.
     *
     * @remarks
     * Pasted text arrives wrapped in `CSI 200~` and `CSI 201~`,
     * which tells a reader that a paste is running and keeps a newline inside it from submitting the line.
     *
     * @example
     * ```ts
     * `${ CSI }?${ Mode.Paste }h`; // '\x1b[?2004h' - turns on bracketed paste
     * ```
     *
     * @since 2.0.0
     */

    Paste = 2004,

    /**
     * Whether the cursor is visible.
     *
     * @remarks
     * Hiding it for the length of a redraw keeps it from flickering across the frame as the rows are written.
     *
     * @example
     * ```ts
     * `${ CSI }?${ Mode.Cursor }l`; // '\x1b[?25l' - hides the cursor
     * ```
     *
     * @since 2.0.0
     */

    Cursor = 25,

    /**
     * Whether the terminal encodes a mouse report in the SGR form.
     *
     * @remarks
     * The original encoding packs each coordinate into one byte and stops reporting past column 223,
     * while this form writes the numbers as text and marks a release with its own final letter.
     * Turn it on alongside whichever tracking mode the reports come from.
     *
     * @example
     * ```ts
     * `${ CSI }?${ Mode.MouseSgr }h`; // '\x1b[?1006h' - asks for SGR encoded reports
     * ```
     *
     * @see MouseAction
     * @since 2.0.0
     */

    MouseSgr = 1006,

    /**
     * Whether the terminal draws on the alternate screen.
     *
     * @remarks
     * The alternate screen keeps no scrollback of its own, and the switch saves the cursor on the way in,
     * so leaving it hands the shell back the output it had before.
     *
     * @example
     * ```ts
     * `${ CSI }?${ Mode.AltScreen }l`; // '\x1b[?1049l' - returns to the shell's screen
     * ```
     *
     * @since 2.0.0
     */

    AltScreen = 1049,

    /**
     * Whether the terminal reports pointer motion while a button is held.
     *
     * @remarks
     * Button event tracking adds a drag report to the presses and releases of normal tracking,
     * which is what a selection or a drag handle needs and nothing more.
     *
     * @example
     * ```ts
     * `${ CSI }?${ Mode.MouseDrag }h`; // '\x1b[?1002h' - reports a drag
     * ```
     *
     * @since 2.0.0
     */

    MouseDrag = 1002,

    /**
     * Whether the terminal reports pointer motion with no button held.
     *
     * @remarks
     * Any event tracking reports every movement across the window, which is the loudest of the three modes.
     * Reach for it where a hover has to light something up, and for nothing else.
     *
     * @example
     * ```ts
     * `${ CSI }?${ Mode.MouseMove }h`; // '\x1b[?1003h' - reports every movement
     * ```
     *
     * @since 2.0.0
     */

    MouseMove = 1003,

    /**
     * Whether the terminal reports a button press and its release.
     *
     * @remarks
     * Normal tracking is the quietest of the three modes, since it says nothing while the pointer moves.
     *
     * @example
     * ```ts
     * `${ CSI }?${ Mode.MouseClick }h`; // '\x1b[?1000h' - reports a click
     * ```
     *
     * @since 2.0.0
     */

    MouseClick = 1000
}

/**
 * The shapes a cursor takes.
 *
 * @remarks
 * Each value is the parameter of the cursor style sequence, which ends in a space and a `q`.
 * A terminal that does not implement the sequence ignores it and keeps the shape its own settings name.
 *
 * @example
 * ```ts
 * `${ CSI }${ CursorStyle.Bar } q`;        // '\x1b[6 q' - a steady bar
 * `${ CSI }${ CursorStyle.BlinkBlock } q`; // '\x1b[1 q' - back to a blinking block
 * ```
 *
 * @see Mode
 * @since 2.0.0
 */

export const enum CursorStyle {
    /**
     * The steady vertical bar.
     *
     * @remarks
     * The narrow shape reads as an insertion point, which suits a prompt that edits one line of text.
     *
     * @example
     * ```ts
     * `${ CSI }${ CursorStyle.Bar } q`; // '\x1b[6 q'
     * ```
     *
     * @since 2.0.0
     */

    Bar = 6,

    /**
     * The steady block.
     *
     * @remarks
     * The block covers the whole cell, which reads as a selected character rather than as a gap between two.
     *
     * @example
     * ```ts
     * `${ CSI }${ CursorStyle.Block } q`; // '\x1b[2 q'
     * ```
     *
     * @since 2.0.0
     */

    Block = 2,

    /**
     * The blinking vertical bar.
     *
     * @example
     * ```ts
     * `${ CSI }${ CursorStyle.BlinkBar } q`; // '\x1b[5 q'
     * ```
     *
     * @since 2.0.0
     */

    BlinkBar = 5,

    /**
     * The steady underline.
     *
     * @remarks
     * The underline sits below the cell, so it marks a position without hiding the character that holds it.
     *
     * @example
     * ```ts
     * `${ CSI }${ CursorStyle.Underline } q`; // '\x1b[4 q'
     * ```
     *
     * @since 2.0.0
     */

    Underline = 4,

    /**
     * The blinking block.
     *
     * @example
     * ```ts
     * `${ CSI }${ CursorStyle.BlinkBlock } q`; // '\x1b[1 q'
     * ```
     *
     * @since 2.0.0
     */

    BlinkBlock = 1,

    /**
     * The blinking underline.
     *
     * @example
     * ```ts
     * `${ CSI }${ CursorStyle.BlinkUnderline } q`; // '\x1b[3 q'
     * ```
     *
     * @since 2.0.0
     */

    BlinkUnderline = 3
}

/**
 * The actions a decoded mouse report carries.
 *
 * @remarks
 * These numbers are the library's own, and they do not match the button code a terminal puts on the wire,
 * which packs the button, the modifier keys, and the motion flag into a single value.
 *
 * @example
 * ```ts
 * MouseAction.Press;   // 0
 * MouseAction.Release; // 1
 * ```
 *
 * @see Mode
 * @since 2.0.0
 */

export const enum MouseAction {
    /**
     * The pointer moved across the window.
     *
     * @remarks
     * A move arrives only while a tracking mode that reports motion is on.
     *
     * @example
     * ```ts
     * MouseAction.Move; // 2
     * ```
     *
     * @since 2.0.0
     */

    Move = 2,

    /**
     * A button went down.
     *
     * @example
     * ```ts
     * MouseAction.Press; // 0
     * ```
     *
     * @since 2.0.0
     */

    Press = 0,

    /**
     * The wheel turned away from the user.
     *
     * @remarks
     * A wheel turn has no release of its own, so it stands as one action rather than as a press and its partner.
     *
     * @example
     * ```ts
     * MouseAction.WheelUp; // 3
     * ```
     *
     * @since 2.0.0
     */

    WheelUp = 3,

    /**
     * A button came back up.
     *
     * @remarks
     * The original encoding names no button on a release, so only the SGR form says which one came up.
     *
     * @example
     * ```ts
     * MouseAction.Release; // 1
     * ```
     *
     * @since 2.0.0
     */

    Release = 1,

    /**
     * The wheel turned toward the user.
     *
     * @example
     * ```ts
     * MouseAction.WheelDown; // 4
     * ```
     *
     * @since 2.0.0
     */

    WheelDown = 4
}

/**
 * The terminal class a device attributes report names first.
 *
 * @remarks
 * The first number of a DA1 reply says which DEC terminal the emulator claims to be,
 * and every number after it is a feature code.
 * A later terminal carries a higher number, so a comparison reads as a generation test rather than as a lookup.
 *
 * @example
 * ```ts
 * const { terminal } = await getDeviceAttributes();
 * terminal >= TerminalClass.VT220; // true on a modern emulator
 * ```
 *
 * @see DeviceFeature
 * @see DeviceAttributesInterface
 *
 * @since 2.0.0
 */

export const enum TerminalClass {
    /**
     * The VT100 class.
     *
     * @example
     * ```ts
     * TerminalClass.VT100; // 1
     * ```
     *
     * @since 2.0.0
     */

    VT100 = 1,

    /**
     * The VT102 class.
     *
     * @example
     * ```ts
     * TerminalClass.VT102; // 6
     * ```
     *
     * @since 2.0.0
     */

    VT102 = 6,

    /**
     * The VT220 class.
     *
     * @remarks
     * Most emulators that speak color and Sixel report this class or a later one,
     * which makes it the usual floor for a capability test.
     *
     * @example
     * ```ts
     * TerminalClass.VT220; // 62
     * ```
     *
     * @since 2.0.0
     */

    VT220 = 62,

    /**
     * The VT320 class.
     *
     * @example
     * ```ts
     * TerminalClass.VT320; // 63
     * ```
     *
     * @since 2.0.0
     */

    VT320 = 63,

    /**
     * The VT420 class.
     *
     * @example
     * ```ts
     * TerminalClass.VT420; // 64
     * ```
     *
     * @since 2.0.0
     */

    VT420 = 64,

    /**
     * The VT500 class.
     *
     * @remarks
     * One number covers the whole VT5xx family, so the report says nothing about which model of it answered.
     *
     * @example
     * ```ts
     * TerminalClass.VT500; // 65
     * ```
     *
     * @since 2.0.0
     */

    VT500 = 65
}

/**
 * The capabilities a device attributes report lists after the terminal class.
 *
 * @remarks
 * Each number after the first one names one capability the terminal claims.
 * A terminal that leaves a code out may still implement the feature,
 * so a code that is present is stronger evidence than a code that is missing.
 *
 * @example
 * ```ts
 * const { features } = await getDeviceAttributes();
 * features.has(DeviceFeature.Sixel); // true where the terminal draws Sixel graphics
 * ```
 *
 * @see TerminalClass
 * @see DeviceAttributesInterface
 *
 * @since 2.0.0
 */

export const enum DeviceFeature {
    /**
     * The national replacement character sets.
     *
     * @example
     * ```ts
     * DeviceFeature.Nrcs; // 9
     * ```
     *
     * @since 2.0.0
     */

    Nrcs = 9,

    /**
     * The Sixel graphics feature.
     *
     * @remarks
     * Sixel carries a bitmap inside an escape sequence,
     * which is what an image drawn in the terminal rides on where no other protocol is available.
     *
     * @example
     * ```ts
     * DeviceFeature.Sixel; // 4
     * ```
     *
     * @since 2.0.0
     */

    Sixel = 4,

    /**
     * The printer port.
     *
     * @example
     * ```ts
     * DeviceFeature.Printer; // 2
     * ```
     *
     * @since 2.0.0
     */

    Printer = 2,

    /**
     * The ANSI color feature.
     *
     * @remarks
     * The code covers the sixteen ANSI colors rather than the 256 color or the 24-bit sequences,
     * which no DA1 code names at all.
     *
     * @example
     * ```ts
     * DeviceFeature.AnsiColor; // 22
     * ```
     *
     * @since 2.0.0
     */

    AnsiColor = 22,

    /**
     * The windowing operations.
     *
     * @example
     * ```ts
     * DeviceFeature.Windowing; // 18
     * ```
     *
     * @since 2.0.0
     */

    Windowing = 18,

    /**
     * The 132 column mode.
     *
     * @example
     * ```ts
     * DeviceFeature.Columns132; // 1
     * ```
     *
     * @since 2.0.0
     */

    Columns132 = 1,

    /**
     * The selective erase feature.
     *
     * @remarks
     * Selective erase leaves the characters a sequence marked as protected where they are,
     * so a form can clear what was typed into it and keep its own labels.
     *
     * @example
     * ```ts
     * DeviceFeature.SelectiveErase; // 6
     * ```
     *
     * @since 2.0.0
     */

    SelectiveErase = 6,

    /**
     * The technical character set.
     *
     * @example
     * ```ts
     * DeviceFeature.TechnicalCharset; // 15
     * ```
     *
     * @since 2.0.0
     */

    TechnicalCharset = 15,

    /**
     * The rectangular editing operations.
     *
     * @remarks
     * These sequences copy, fill, and erase a rectangle of cells,
     * which moves a block of the screen without redrawing the rows around it.
     *
     * @example
     * ```ts
     * DeviceFeature.RectangularEditing; // 28
     * ```
     *
     * @since 2.0.0
     */

    RectangularEditing = 28,

    /**
     * The horizontal scrolling feature.
     *
     * @example
     * ```ts
     * DeviceFeature.HorizontalScrolling; // 21
     * ```
     *
     * @since 2.0.0
     */

    HorizontalScrolling = 21
}
