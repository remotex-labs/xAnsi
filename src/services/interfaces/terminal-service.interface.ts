/**
 * The size of the terminal, in cells.
 */

export interface SizeInterface {
    width: number;
    height: number;
}

/**
 * One key press, mouse button, or wheel step read from the input stream.
 */

export interface KeyInterface {
    name: string;
    ctrl: boolean;
    sequence: string;
    row?: number;
    column?: number;
}

/**
 * The settings a terminal is built with.
 */

export interface TerminalOptionsInterface {
    mouse?: boolean;
    input?: NodeJS.ReadStream;
    output?: NodeJS.WriteStream;
    error?: NodeJS.WriteStream;
    capture?: boolean;
    autoScroll?: boolean;
    exitOnCtrlC?: boolean;
    alternateScreen?: boolean;
}
