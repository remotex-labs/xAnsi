/**
 * Imports
 */

import { splitWithAnsiContext } from '@services/ast.service';

/**
 * Tests
 */

describe('splitWithAnsiContext', () => {
    test('handles empty / null / undefined input', () => {
        expect(splitWithAnsiContext('')).toEqual([ '' ]);
        expect(splitWithAnsiContext(<any>null)).toEqual([ '' ]);
        expect(splitWithAnsiContext(<any>undefined)).toEqual([ '' ]);
    });

    test('plain text without ANSI codes', () => {
        expect(splitWithAnsiContext('hello')).toEqual([ 'h', 'e', 'l', 'l', 'o' ]);
    });

    test('basic text styling (bold)', () => {
        const input = '\x1b[1mBold\x1b[22m';
        expect(splitWithAnsiContext(input)).toEqual([
            '\x1b[1mB\x1b[22m',
            '\x1b[1mo\x1b[22m',
            '\x1b[1ml\x1b[22m',
            '\x1b[1md\x1b[22m'
        ]);
    });

    test('multiple styles at once', () => {
        const input = '\x1b[1m\x1b[31mBold Red\x1b[0m';
        expect(splitWithAnsiContext(input)).toEqual([
            '\x1b[1;31mB\x1b[22;39m',
            '\x1b[1;31mo\x1b[22;39m',
            '\x1b[1;31ml\x1b[22;39m',
            '\x1b[1;31md\x1b[22;39m',
            '\x1b[1;31m \x1b[22;39m',
            '\x1b[1;31mR\x1b[22;39m',
            '\x1b[1;31me\x1b[22;39m',
            '\x1b[1;31md\x1b[22;39m'
        ]);
    });

    test('reset code in the middle', () => {
        const input = '\x1b[1mBold\x1b[0m and normal';
        expect(splitWithAnsiContext(input)).toEqual([
            '\x1b[1mB\x1b[22m',
            '\x1b[1mo\x1b[22m',
            '\x1b[1ml\x1b[22m',
            '\x1b[1md\x1b[22m',
            '\x1b[0m ',
            'a',
            'n',
            'd',
            ' ',
            'n',
            'o',
            'r',
            'm',
            'a',
            'l'
        ]);
    });

    test('nested or changing styles', () => {
        const input = '\x1b[1mBold\x1b[31m and red\x1b[0m';
        const out = splitWithAnsiContext(input);
        expect(out).toEqual([
            '\x1b[1mB\x1b[22m',
            '\x1b[1mo\x1b[22m',
            '\x1b[1ml\x1b[22m',
            '\x1b[1md\x1b[22m',
            '\x1b[1;31m \x1b[22;39m',
            '\x1b[1;31ma\x1b[22;39m',
            '\x1b[1;31mn\x1b[22;39m',
            '\x1b[1;31md\x1b[22;39m',
            '\x1b[1;31m \x1b[22;39m',
            '\x1b[1;31mr\x1b[22;39m',
            '\x1b[1;31me\x1b[22;39m',
            '\x1b[1;31md\x1b[22;39m'
        ]);
    });

    test('complex styling with selective resets', () => {
        const input =
            '\x1b[1m\x1b[31m\x1b[4mStyled\x1b[24m not underlined\x1b[22m not bold\x1b[39m not red';
        const out = splitWithAnsiContext(input);

        // first char includes all 3 styles and all 3 resets
        expect(out[0]).toMatch(/\x1b\[1;31;4m/);
        expect(out[0]).toMatch(/\x1b\[22;39;24m/);

        // after underline reset, still bold+red but not underlined
        const idxAfterUnderline = input.indexOf('\x1b[24m');
        const charsAfterUnderline =
            input.slice(0, idxAfterUnderline).replace(/\x1b\[[0-9;]*m/g, '').length;
        expect(out[charsAfterUnderline]).toMatch(/\x1b\[1;31m/);
        expect(out[charsAfterUnderline]).not.toMatch(/4m/);
    });

    test('one-time / unknown SGR sequences are preserved once', () => {
        const input = '\x1b[58mSpecial\x1b[0m';
        const out = splitWithAnsiContext(input);
        expect(out[0]).toContain('\x1b[58m');
        expect(out.slice(1).join('')).not.toContain('\x1b[58m');
    });

    test('ANSI codes with multiple parameters', () => {
        const input = '\x1b[1;31;4mMulti\x1b[0m';
        const first = splitWithAnsiContext(input)[0];
        expect(first).toMatch(/\x1b\[1;31;4m/);
    });

    test('invalid or incomplete ANSI sequences do not throw', () => {
        expect(() => splitWithAnsiContext('Text with \x1b[ incomplete')).not.toThrow();
        expect(() => splitWithAnsiContext('Text with \x1b[abcm malformed')).not.toThrow();
    });

    test('emoji / surrogate pairs handled as single char', () => {
        const input = '\x1b[31m😀\x1b[0m';
        expect(splitWithAnsiContext(input)).toEqual([ '\x1b[31m😀\x1b[39m' ]);
    });

    test('rapid style changes per char', () => {
        const input = '\x1b[31mR\x1b[32mG\x1b[33mB\x1b[0m';
        const out = splitWithAnsiContext(input);
        expect(out).toEqual([
            '\x1b[31mR\x1b[39m',
            '\x1b[31;32mG\x1b[39;39m',
            '\x1b[31;32;33mB\x1b[39;39;39m'
        ]);
    });

    test('truecolor foreground and background', () => {
        const input = '\x1b[38;2;10;20;30;48;2;40;50;60mX\x1b[0m';
        const out = splitWithAnsiContext(input);
        expect(out[0]).toContain('38;2;10;20;30');
        expect(out[0]).toContain('48;2;40;50;60');
    });

    test('string ending mid-escape does not hang', () => {
        const input = 'foo\x1b[31';
        expect(() => splitWithAnsiContext(input)).not.toThrow();
        expect(splitWithAnsiContext(input)).toContain('f');
    });
});
