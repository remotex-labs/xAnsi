/**
 * Import will remove at compile time
 */

import type { MockState } from '@remotex-labs/xjet';

/**
 * Imports
 */

import { ShadowRenderer } from '@services/shadow.service';
import { ANSI, writeRaw, moveCursor } from '@components/ansi.component';

/**
 * Tests
 */

describe('ShadowRenderer', () => {
    let writeRawMock: MockState;
    let renderer: ShadowRenderer;

    beforeEach(() => {
        xJet.clearAllMocks();
        xJet.mock(moveCursor).mockImplementation((row, col) => `MOCK_CURSOR_MOVE_${ row }_${ col }`);
        writeRawMock = xJet.mock(writeRaw).mockImplementation((text) => `MOCK_WRITE_RAW_${ text }`);

        renderer = new ShadowRenderer(5, 10, 2, 3);
    });

    describe('initialization', () => {
        test('should initialize with the correct properties', () => {
            expect(renderer.top).toBe(2);
            expect(renderer.left).toBe(3);
            expect(renderer.width).toBe(10);
            expect(renderer.height).toBe(5);
            expect(renderer.scroll).toBe(0);
        });

        test('should allow changing dimensions and position', () => {
            renderer.top = 5;
            renderer.left = 7;
            renderer.width = 20;
            renderer.height = 10;

            expect(renderer.top).toBe(5);
            expect(renderer.left).toBe(7);
            expect(renderer.width).toBe(20);
            expect(renderer.height).toBe(10);
        });
    });

    describe('writeText', () => {
        test('should write text to the internal buffer', () => {
            renderer.writeText(0, 0, 'Hello');
            // Trigger render to check if the text appears
            renderer.render();

            // The writeRaw should be called with a string containing the text
            expect(writeRaw).toHaveBeenCalled();
            expect(writeRaw).toHaveBeenCalledWith(expect.stringContaining('Hello'));
        });

        test('should truncate text that exceeds terminal width', () => {
            renderer.writeText(0, 0, 'This is a very long text');
            renderer.render();

            expect(writeRaw).toHaveBeenCalledWith(expect.stringContaining('This is a '));
            expect(writeRaw).not.toHaveBeenCalledWith(expect.stringContaining('very long text'));
        });

        test('should only process the first line of multi-line text', () => {
            renderer.writeText(0, 0, 'Line 1\nLine 2');
            renderer.render();

            const writeRawArg = writeRawMock.mock.calls[0][0];
            expect(writeRawArg).toContain('Line 1');
            expect(writeRawArg).not.toContain('Line 2');
        });

        test('should clean existing content when clean flag is true', () => {
            renderer.writeText(0, 0, 'Hello');

            // Then write with clean at a position that overlaps
            renderer.writeText(0, 3, 'World', true);
            renderer.render();

            const writeRawArg = writeRawMock.mock.calls[0][0];
            // Should have removed 'Hello' and only have 'World'
            expect(writeRawArg).toContain('World');
            expect(writeRawArg).not.toContain('Hello');
        });
    });

    describe('writeBlock', () => {
        test('should write multiple lines from a single string', () => {
            const text = 'Line 1\nLine 2\nLine 3';
            renderer.writeBlock(0, 0, text);

            // Render to trigger writeRaw
            renderer.render();
            const output = writeRawMock.mock.calls[0][0];

            expect(output).toContain('Line 1');
            expect(output).toContain('Line 2');
            expect(output).toContain('Line 3');
        });

        test('should write multiple lines from an array of strings', () => {
            const lines = [ 'First', 'Second', 'Third' ];
            renderer.writeBlock(1, 2, lines);

            renderer.render();
            const output = writeRawMock.mock.calls[0][0];

            expect(output).toContain('First');
            expect(output).toContain('Second');
            expect(output).toContain('Third');
        });

        test('should only apply clean to the first line', () => {
            // Fill the first row with something
            renderer.writeText(0, 0, 'AAAAA');
            renderer.writeText(1, 0, 'BBBBB');

            renderer.writeBlock(0, 0, [ 'X1', 'Y1' ], true);

            renderer.render();
            const output = writeRawMock.mock.calls[0][0];

            expect(output).toContain('X1');
            expect(output).not.toContain('AAAAA');

            expect(output).toContain('Y1');
            expect(output).not.toContain('BBBBB');
        });

        test('should handle writing beyond terminal width by truncating', () => {
            const longLine = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            renderer.writeBlock(0, 0, [ longLine ]);

            renderer.render();
            const output = writeRawMock.mock.calls[0][0];

            // Only first 10 characters should appear (renderer width = 10)
            expect(output).toContain('ABCDEFGHIJ');
            expect(output).not.toContain('KLMNOPQRSTUVWXYZ');
        });
    });

    describe('render', () => {
        test('should only render dirty cells', () => {
            // Initial render
            renderer.writeText(0, 0, 'Hello');
            renderer.render();

            // Render again without changes
            renderer.render();

            // Nothing should be written since no cells are dirty
            expect(writeRaw).toHaveBeenCalledWith(expect.not.stringContaining('Hello'));
        });

        test('should render all cells when force=true', () => {
            // Initial render
            renderer.writeText(0, 0, 'Hello');
            renderer.render();

            // Force render
            renderer.render(true);

            // All cells should be re-rendered
            const writeRawArg = writeRawMock.mock.calls[0][0];
            expect(writeRawArg).toContain('Hello');
        });

        test('should clean up extra rows when content shrinks', () => {
            // Initial content with multiple rows
            renderer.writeText(0, 0, 'Row 1');
            renderer.writeText(1, 0, 'Row 2');
            renderer.writeText(2, 0, 'Row 3');
            renderer.render();

            // Clear content
            renderer.clear();
            renderer.writeText(0, 0, 'Only row');
            renderer.render();

            // Should clear the extra rows
            expect(writeRaw).toHaveBeenCalledWith(expect.stringContaining(ANSI.CLEAR_LINE));
        });
    });

    describe('scroll', () => {
        beforeEach(() => {
            // Setup content for scrolling tests
            renderer.writeText(0, 0, 'Line 1');
            renderer.writeText(1, 0, 'Line 2');
            renderer.writeText(2, 0, 'Line 3');
            renderer.writeText(3, 0, 'Line 4');
            renderer.writeText(4, 0, 'Line 5');
            renderer.writeText(5, 0, 'Line 6');
            renderer.writeText(6, 0, 'Line 7');
            renderer.render();
        });

        test('should update scroll position with absolute value', () => {
            // Setup content for scrolling tests - add multiple lines
            for (let i = 0; i < 10; i++) {
                renderer.writeText(i, 0, `Line ${ i + 1 }`);
            }

            renderer.render();
            renderer.scroll = 2;

            expect(renderer.scroll).toBe(2);
            expect(writeRaw).toHaveBeenCalled();

            const renderSpy = xJet.spyOn(renderer, 'render');
            renderer.scroll = 3;

            expect(renderSpy).toHaveBeenCalled();
            expect(renderer.scroll).toBe(3);
        });

        test('should handle relative scrolling with negative values', () => {

            const renderSpy = xJet.spyOn(renderer, 'render');

            renderer.scroll = 3;
            expect(renderer.scroll).toBe(3);
            renderer.scroll = -2;

            expect(renderer.scroll).toBe(1);
            expect(renderSpy).toHaveBeenCalled();
            expect(writeRaw).toHaveBeenCalled();
        });

        test('should ignore scrolling beyond content boundaries', () => {
            renderer.scroll = 10;

            expect(renderer.scroll).toBe(6);
            expect(writeRaw).toHaveBeenCalled();
        });
    });

    describe('flushToTerminal', () => {
        test('should write all cells with correct cursor positions and clear buffers', () => {
            // Arrange: fill some content at different positions
            renderer.writeText(0, 0, 'A');
            renderer.writeText(0, 2, 'B');
            renderer.writeText(1, 1, 'C');

            // Act: flush the terminal
            renderer.flushToTerminal();
            expect(writeRaw).toHaveBeenCalledWith(expect.stringContaining('\n\x1B[KA B'));
            expect(writeRaw).toHaveBeenCalledWith(expect.stringContaining('\n\x1B[K C'));

            // Ensure buffers are cleared
            expect((renderer as any).contentBuffer).toEqual([]);
            expect((renderer as any).viewBuffer).toEqual([]);
        });

        test('should handle sparse lines and skip empty cells', () => {
            // Arrange: sparse content
            renderer.writeText(0, 0, 'X');
            renderer.writeText(0, 4, 'Y'); // gaps between

            // Act
            renderer.flushToTerminal();

            // Assert cursor moves only for existing cells
            expect(writeRaw).toHaveBeenCalledWith(expect.stringContaining('\n\x1B[KX   Y'));
        });
    });
});
