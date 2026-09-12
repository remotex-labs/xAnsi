/**
 * Imports
 */

import { clearView, clearAll } from '@services/ansi.service';
import { CSI, ESC as EscByte, ClearView, EraseScrollback } from '@constants/ansi.constant';
import { scrollDown, scrollUp, writeRaw, moveCursor, getCursorPosition } from '@services/ansi.service';

/**
 * Tests
 */

const ESC = String.fromCharCode(27);

describe('ESC and CSI', () => {
    test('should be the escape byte and the introducer built on top of it', () => {
        expect(EscByte).toBe(ESC);
        expect(CSI).toBe(`${ ESC }[`);
    });

    test('should be the prefix every generated sequence opens with', () => {
        expect(moveCursor(5, 1).startsWith(CSI)).toBe(true);
        expect(scrollUp(3).startsWith(CSI)).toBe(true);
        expect(scrollDown(3).startsWith(CSI)).toBe(true);
    });
});

describe('EraseScrollback', () => {
    test('should be an erase in display with a parameter of three', () => {
        expect(EraseScrollback).toBe(`${ ESC }[3J`);
    });

    test('should leave the visible screen to ClearView', () => {
        expect(EraseScrollback).not.toContain('2J');
        expect(ClearView).toBe(`${ ESC }[H${ ESC }[2J`);
    });
});

describe('writeRaw', () => {
    afterEach(() => xJet.restoreAllMocks());

    test('should write the data through without adding anything', () => {
        const write = xJet.spyOn(process.stdout, 'write').mockReturnValue(true);
        writeRaw('plain');
        writeRaw(`${ ESC }[31m`);

        expect(write).toHaveBeenCalledWith('plain');
        expect(write).toHaveBeenCalledWith(`${ ESC }[31m`);
        expect(write.mock.calls.length).toBe(2);
    });

    test('should accept a buffer', () => {
        const write = xJet.spyOn(process.stdout, 'write').mockReturnValue(true);
        const data = Buffer.from('bytes', 'utf8');
        writeRaw(data);

        expect(write).toHaveBeenCalledWith(data);
    });
});

describe('moveCursor', () => {
    test('should build a CUP sequence from a row and a column', () => {
        expect(moveCursor(5, 1)).toBe(`${ ESC }[5;1H`);
        expect(moveCursor(12, 34)).toBe(`${ ESC }[12;34H`);
    });

    test('should default the column to 0, which a terminal reads as 1', () => {
        expect(moveCursor(5)).toBe(`${ ESC }[5;0H`);
    });
});

describe('scrollUp', () => {
    test('should scroll a single row by default', () => {
        expect(scrollUp()).toBe(`${ ESC }[1S`);
    });

    test('should scroll the number of rows it is given', () => {
        expect(scrollUp(3)).toBe(`${ ESC }[3S`);
        expect(scrollUp(120)).toBe(`${ ESC }[120S`);
    });

    test('should return an empty string rather than a sequence a terminal reads as one row', () => {
        expect(scrollUp(0)).toBe('');
        expect(scrollUp(-5)).toBe('');
    });

    test('should truncate a fractional count', () => {
        expect(scrollUp(2.9)).toBe(`${ ESC }[2S`);
    });
});

describe('scrollDown', () => {
    test('should scroll a single row by default', () => {
        expect(scrollDown()).toBe(`${ ESC }[1T`);
    });

    test('should scroll the number of rows it is given', () => {
        expect(scrollDown(3)).toBe(`${ ESC }[3T`);
    });

    test('should return an empty string below one row', () => {
        expect(scrollDown(0)).toBe('');
        expect(scrollDown(-5)).toBe('');
    });

    test('should differ from scrollUp only in the final byte', () => {
        expect(scrollDown(4)).toBe(scrollUp(4).replace(/S$/, 'T'));
    });
});

describe('clearView and clearAll', () => {
    afterEach(() => xJet.restoreAllMocks());

    test('should home the cursor and erase the display', () => {
        const write = xJet.spyOn(process.stdout, 'write').mockReturnValue(true);
        clearView();

        expect(write).toHaveBeenCalledWith(ClearView);
        expect(write).toHaveBeenCalledWith(`${ ESC }[H${ ESC }[2J`);
    });

    test('should erase the saved lines as well', () => {
        const write = xJet.spyOn(process.stdout, 'write').mockReturnValue(true);
        clearAll();

        expect(write).toHaveBeenCalledWith(`${ ESC }[H${ ESC }[2J${ ESC }[3J`);
    });

    test('should send the view and the scrollback as a single write', () => {
        const write = xJet.spyOn(process.stdout, 'write').mockReturnValue(true);
        clearAll();

        expect(write).toHaveBeenCalledWith(ClearView + EraseScrollback);
        expect(write.mock.calls.length).toBe(1);
    });

    test('should leave the scrollback alone when only the view is cleared', () => {
        const write = xJet.spyOn(process.stdout, 'write').mockReturnValue(true);
        clearView();

        expect(String(write.mock.calls[0][0])).not.toContain(`${ ESC }[3J`);
    });
});

describe('getCursorPosition on a pipe', () => {
    test('should reject when the streams are not a terminal', async () => {
        await expect(getCursorPosition(20)).rejects.toThrow('can only be read from a terminal');
    });
});

describe('getCursorPosition', () => {
    const stdin = <Record<string, unknown>> <unknown> process.stdin;
    const stdout = <Record<string, unknown>> <unknown> process.stdout;

    let on: ReturnType<typeof xJet.fn>;
    let write: ReturnType<typeof xJet.fn>;
    let had: { stdin: boolean, stdout: boolean, raw: boolean };

    beforeEach(() => {
        // the sandbox runs on pipes, so isTTY and setRawMode are absent and cannot be spied on
        had = { stdin: 'isTTY' in stdin, stdout: 'isTTY' in stdout, raw: 'setRawMode' in stdin };
        stdin.isTTY = true;
        stdin.isRaw = false;
        stdin.setRawMode = xJet.fn();
        stdout.isTTY = true;

        xJet.spyOn(process.stdin, 'resume').mockImplementation(() => process.stdin);
        xJet.spyOn(process.stdin, 'pause').mockImplementation(() => process.stdin);
        xJet.spyOn(process.stdin, 'off').mockImplementation(() => process.stdin);
        xJet.spyOn(process.stdin, 'unshift').mockImplementation(() => undefined);
        xJet.spyOn(process.stdin, 'listenerCount').mockReturnValue(0);

        on = <ReturnType<typeof xJet.fn>> <unknown> xJet.spyOn(process.stdin, 'on')
            .mockImplementation(() => process.stdin);
        write = <ReturnType<typeof xJet.fn>> <unknown> xJet.spyOn(process.stdout, 'write').mockReturnValue(true);
    });

    afterEach(() => {
        xJet.restoreAllMocks();
        if (!had.stdin) delete stdin.isTTY;
        if (!had.stdout) delete stdout.isTTY;
        if (!had.raw) delete stdin.setRawMode;
        delete stdin.isRaw;
    });

    test('should write a device status report query', async () => {
        const pending = getCursorPosition(200);
        (<(chunk: Buffer) => void> on.mock.calls[0][1])(Buffer.from(`${ ESC }[1;1R`, 'utf8'));
        await pending;

        expect(write).toHaveBeenCalledWith(`${ ESC }[6n`);
    });

    test('should resolve with the row and column the terminal reports', async () => {
        const pending = getCursorPosition(200);
        (<(chunk: Buffer) => void> on.mock.calls[0][1])(Buffer.from(`${ ESC }[12;34R`, 'utf8'));

        await expect(pending).resolves.toEqual({ row: 12, column: 34 });
    });

    test('should join a report split across two chunks', async () => {
        const pending = getCursorPosition(200);
        const handler = <(chunk: Buffer) => void> on.mock.calls[0][1];
        handler(Buffer.from(`${ ESC }[12;`, 'utf8'));
        handler(Buffer.from('34R', 'utf8'));

        await expect(pending).resolves.toEqual({ row: 12, column: 34 });
    });

    test('should push back input that was not the report', async () => {
        const pending = getCursorPosition(200);
        (<(chunk: Buffer) => void> on.mock.calls[0][1])(Buffer.from(`abc${ ESC }[1;2Rxyz`, 'utf8'));
        await pending;

        expect(process.stdin.unshift).toHaveBeenCalledWith(Buffer.from('abcxyz', 'utf8'));
    });

    test('should turn raw mode on and put it back as it was', async () => {
        const pending = getCursorPosition(200);
        (<(chunk: Buffer) => void> on.mock.calls[0][1])(Buffer.from(`${ ESC }[1;1R`, 'utf8'));
        await pending;

        const setRawMode = <ReturnType<typeof xJet.fn>> stdin.setRawMode;
        expect(setRawMode.mock.calls).toEqual([[ true ], [ false ]]);
    });

    test('should remove its own listener once it settles', async () => {
        const pending = getCursorPosition(200);
        (<(chunk: Buffer) => void> on.mock.calls[0][1])(Buffer.from(`${ ESC }[1;1R`, 'utf8'));
        await pending;

        expect(process.stdin.off).toHaveBeenCalledWith('data', expect.any(Function));
    });

    test('should reject when no report arrives before the timeout', async () => {
        await expect(getCursorPosition(20)).rejects.toThrow('Timed out waiting for cursor position report');
    });
});
