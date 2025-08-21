/**
 * Imports
 */

import { xterm } from '@components/xterm.component';

/**
 * Tests
 */

describe('styles.components', () => {
    describe('xterm', () => {
        test('should apply a single style correctly', () => {
            const result = xterm.red('test');
            expect(result).toBe('\x1b[31mtest\x1b[39m');
        });

        test('should apply multiple chained styles correctly', () => {
            const result = xterm.red.bgBlue.bold('test');
            // When multiple styles are applied, they're wrapped in order
            // and terminated in reverse order
            expect(result).toBe('\x1b[31m\x1b[44m\x1b[1mtest\x1b[22m\x1b[49m\x1b[39m');
        });

        test('should handle RGB colors', () => {
            const result = xterm.rgb(100, 150, 200)('test');
            expect(result).toBe('\x1b[38;2;100;150;200mtest\x1b[39m');
        });

        test('should handle RGB background colors', () => {
            const result = xterm.bgRgb(100, 150, 200)('test');
            expect(result).toBe('\x1b[48;2;100;150;200mtest\x1b[49m');
        });

        test('should handle hex colors', () => {
            const result = xterm.hex('#64a0c8')('test');
            expect(result).toBe('\x1b[38;2;100;160;200mtest\x1b[39m');
        });

        test('should handle hex background colors', () => {
            const result = xterm.bgHex('#64a0c8')('test');
            expect(result).toBe('\x1b[48;2;100;160;200mtest\x1b[49m');
        });

        test('should handle short hex colors (3 digits)', () => {
            const result = xterm.hex('#abc')('test');
            // #abc expands to #aabbcc (170, 187, 204)
            expect(result).toBe('\x1b[38;2;170;187;204mtest\x1b[39m');
        });

        test('should handle template literals', () => {
            const name = 'world';
            const result = xterm.green`Hello ${ name }!`;
            expect(result).toBe('\x1b[32mHello world!\x1b[39m');
        });

        test('should throw error for invalid RGB values', () => {
            expect(() => {
                // @ts-expect-error Testing invalid argument
                xterm.rgb('not', 'a', 'number')('test');
            }).toThrow(/RGB values must be numbers/);
        });

        test('should throw error for invalid hex values', () => {
            expect(() => {
                xterm.hex('not-a-hex')('test');
            }).toThrow(/Invalid hex color/);
        });

        test('should handle multiple arguments as concatenated string', () => {
            const result = xterm.blue('Hello', 'world', '!');
            expect(result).toBe('\x1b[34mHello world !\x1b[39m');
        });
    });
});

describe('xterm - no color mode', () => {
    // Backup original NO_COLOR
    const originalNoColor = globalThis.NO_COLOR;

    beforeEach(() => {
        // Enable no-color
        globalThis.NO_COLOR = true;
    });

    afterEach(() => {
        // Restore original value
        (globalThis as any).NO_COLOR = originalNoColor;
    });

    test('should return plain text when NO_COLOR is true', () => {
        const result = xterm.red.bgBlue.bold('test');
        expect(result).toBe('test');

        const rgbResult = xterm.rgb(100, 150, 200)('test');
        expect(rgbResult).toBe('test');

        const hexResult = xterm.hex('#64a0c8')('test');
        expect(hexResult).toBe('test');

        const templateResult = xterm.green`Hello ${ 'world' }!`;
        expect(templateResult).toBe('Hello world!');
    });
});
