/**
 * Imports
 */

import { stripAnsi } from '@components/ansi.component';
import { processAnsiCode, splitWithAnsiContext } from '@services/ast.service';

/**
 * Tests
 */

describe('processAnsiCode', () => {
    let active: Map<string, string>;

    beforeEach(() => {
        // Reset the active map before each test
        active = new Map<string, string>();
    });

    test('handles text styling codes', () => {
        // Bold text
        const boldCode = '1';
        const boldIndex = processAnsiCode(boldCode, 0, [ boldCode ], active);

        expect(boldIndex).toBe(0);
        expect(active.has(boldCode)).toBe(true);
        expect(active.get(boldCode)).toBe('22');

        // Italic text
        const italicCode = '3';
        const italicIndex = processAnsiCode(italicCode, 0, [ italicCode ], active);

        expect(italicIndex).toBe(0);
        expect(active.has(italicCode)).toBe(true);
        expect(active.get(italicCode)).toBe('23');
    });

    test('handles foreground color codes', () => {
        // Red foreground
        const redCode = '31';
        const redIndex = processAnsiCode(redCode, 0, [ redCode ], active);

        expect(redIndex).toBe(0);
        expect(active.has(redCode)).toBe(true);
        expect(active.get(redCode)).toBe('39');
    });

    test('handles background color codes', () => {
        // Blue background
        const blueBackgroundCode = '44';
        const blueIndex = processAnsiCode(blueBackgroundCode, 0, [ blueBackgroundCode ], active);

        expect(blueIndex).toBe(0);
        expect(active.has(blueBackgroundCode)).toBe(true);
        expect(active.get(blueBackgroundCode)).toBe('49');
    });

    test('handles RGB foreground color', () => {
        const codes = [ '38', '2', '255', '0', '0' ];
        const index = processAnsiCode(codes[0], 0, codes, active);

        expect(index).toBe(4); // Should skip the processed RGB parts
        expect(active.has('38;2;255;0;0')).toBe(true);
        expect(active.get('38;2;255;0;0')).toBe('39');
    });

    test('handles RGB background color', () => {
        const codes = [ '48', '2', '0', '255', '0' ];
        const index = processAnsiCode(codes[0], 0, codes, active);

        expect(index).toBe(4); // Should skip the processed RGB parts
        expect(active.has('48;2;0;255;0')).toBe(true);
        expect(active.get('48;2;0;255;0')).toBe('49');
    });

    test('handles incomplete RGB sequence', () => {
        const codes = [ '38', '2', '255' ]; // Missing two RGB components
        const index = processAnsiCode(codes[0], 0, codes, active);

        // Should not process as RGB since it's incomplete
        expect(index).toBe(0);
        expect(active.size).toBe(0);
    });

    test('handles full reset code 0', () => {
        active.set('1', '22');
        active.set('31', '39');

        const resetCode = '0';
        const resetIndex = processAnsiCode(resetCode, 0, [ resetCode ], active);

        expect(resetIndex).toBe(0);
        expect(active.size).toBe(0); // Map should be cleared
    });

    test('handles partial reset by code', () => {
        active.set('1', '22');  // Bold
        active.set('31', '39'); // Red foreground

        // Reset only the bold style
        const resetCode = '22';
        const resetIndex = processAnsiCode(resetCode, 0, [ resetCode ], active);

        expect(resetIndex).toBe(0);
        expect(active.size).toBe(1);
        expect(active.has('1')).toBe(false); // Bold should be removed
        expect(active.has('31')).toBe(true); // Red should remain
    });

    test('handles multiple styles simultaneously', () => {
        // Add bold
        processAnsiCode('1', 0, [ '1' ], active);
        // Add red foreground
        processAnsiCode('31', 0, [ '31' ], active);
        // Add underline
        processAnsiCode('4', 0, [ '4' ], active);

        expect(active.size).toBe(3);
        expect(active.get('1')).toBe('22');
        expect(active.get('31')).toBe('39');
        expect(active.get('4')).toBe('24');
    });

    test('handles reset of style by key or value', () => {
        // Add bold and red foreground
        active.set('1', '22');  // Bold with reset code 22
        active.set('31', '39'); // Red foreground with reset code 39

        // Reset by code
        processAnsiCode('22', 0, [ '22' ], active);
        expect(active.has('1')).toBe(false); // Bold should be removed
        expect(active.has('31')).toBe(true); // Red should remain

        // Reset by reset code
        processAnsiCode('39', 0, [ '39' ], active);
        expect(active.has('31')).toBe(false); // Red should now be removed
        expect(active.size).toBe(0);
    });
});

describe('splitWithAnsiContext', () => {
    test('handles plain text without ANSI codes', () => {
        const input = 'Hello';
        const result = splitWithAnsiContext(input);

        expect(result).toEqual([ 'H', 'e', 'l', 'l', 'o' ]);
    });

    test('handles single style for entire text', () => {
        // Bold text
        const input = '\x1b[1mBold\x1b[22m';
        const result = splitWithAnsiContext(input);

        expect(result).toEqual([
            '\x1b[1mB\x1b[22m',
            '\x1b[1mo\x1b[22m',
            '\x1b[1ml\x1b[22m',
            '\x1b[1md\x1b[22m'
        ]);
    });

    test('handles single foreground color', () => {
        // Red text
        const input = '\x1b[31mRed\x1b[39m';
        const result = splitWithAnsiContext(input);

        expect(result).toEqual([
            '\x1b[31mR\x1b[39m',
            '\x1b[31me\x1b[39m',
            '\x1b[31md\x1b[39m'
        ]);
    });

    test('handles multiple styles', () => {
        // Bold and red text
        const input = '\x1b[1m\x1b[31mBold Red\x1b[22m\x1b[39m';
        const result = splitWithAnsiContext(input);

        expect(result).toEqual([
            '\x1b[1m\x1b[31mB\x1b[22m\x1b[39m',
            '\x1b[1m\x1b[31mo\x1b[22m\x1b[39m',
            '\x1b[1m\x1b[31ml\x1b[22m\x1b[39m',
            '\x1b[1m\x1b[31md\x1b[22m\x1b[39m',
            '\x1b[1m\x1b[31m \x1b[22m\x1b[39m',
            '\x1b[1m\x1b[31mR\x1b[22m\x1b[39m',
            '\x1b[1m\x1b[31me\x1b[22m\x1b[39m',
            '\x1b[1m\x1b[31md\x1b[22m\x1b[39m'
        ]);
    });

    test('handles style changes mid-string', () => {
        // Text with style change in the middle
        const input = 'Normal\x1b[1mBold\x1b[22mNormal';
        const result = splitWithAnsiContext(input);

        expect(result).toEqual([
            'N',
            'o',
            'r',
            'm',
            'a',
            'l',
            '\x1b[1mB\x1b[22m',
            '\x1b[1mo\x1b[22m',
            '\x1b[1ml\x1b[22m',
            '\x1b[1md\x1b[22m',
            'N',
            'o',
            'r',
            'm',
            'a',
            'l'
        ]);
    });

    test('handles multiple style changes', () => {
        // Text with multiple style changes
        const input = 'Normal\x1b[1mBold\x1b[31mBold Red\x1b[22mRed\x1b[39mNormal';
        const result = splitWithAnsiContext(input);

        // First: Normal text
        // Then: Bold text
        // Then: Bold Red text
        // Then: Red text (not bold)
        // Then: Normal text again

        // Check the results for a few key positions
        expect(result[0]).toBe('N'); // First normal character
        expect(result[6]).toBe('\x1b[1mB\x1b[22m'); // First bold character
        expect(result[10]).toBe('\x1b[1m\x1b[31mB\x1b[22m\x1b[39m'); // First bold+red character
        expect(result[18]).toBe('\x1b[31mR\x1b[39m'); // First red (not bold) character
        expect(result[21]).toBe('N'); // Back to normal

        // Check overall length
        expect(result.length).toBe(stripAnsi(input).length);
    });

    test('handles RGB colors', () => {
        // Text with RGB color (38;2;r;g;b format)
        const input = '\x1b[38;2;255;0;0mRGB Red\x1b[39m';
        const result = splitWithAnsiContext(input);

        expect(result).toEqual([
            '\x1b[38;2;255;0;0mR\x1b[39m',
            '\x1b[38;2;255;0;0mG\x1b[39m',
            '\x1b[38;2;255;0;0mB\x1b[39m',
            '\x1b[38;2;255;0;0m \x1b[39m',
            '\x1b[38;2;255;0;0mR\x1b[39m',
            '\x1b[38;2;255;0;0me\x1b[39m',
            '\x1b[38;2;255;0;0md\x1b[39m'
        ]);
    });

    test('handles full reset code', () => {
        // Text with full reset (code 0)
        const input = '\x1b[1m\x1b[31mStyled\x1b[0mNormal';
        const result = splitWithAnsiContext(input);

        // The first part should have both bold and red styling
        expect(result[0]).toBe('\x1b[1m\x1b[31mS\x1b[22m\x1b[39m');

        // After reset, should have no styling
        expect(result[6]).toBe('N');
    });

    test('handles empty string', () => {
        const input = '';
        const result = splitWithAnsiContext(input);

        expect(result).toEqual([]);
    });

    test('handles string with only ANSI codes but no visible characters', () => {
        const input = '\x1b[1m\x1b[31m\x1b[0m';
        const result = splitWithAnsiContext(input);

        expect(result).toEqual([]);
    });

    test('handles consecutive ANSI codes without characters between them', () => {
        // Multiple consecutive style changes without characters
        const input = '\x1b[1m\x1b[31m\x1b[4mStyled\x1b[0m';
        const result = splitWithAnsiContext(input);

        // Each character should have all three styles applied (bold, red, underline)
        expect(result[0]).toBe('\x1b[1m\x1b[31m\x1b[4mS\x1b[22m\x1b[39m\x1b[24m');
        expect(result.length).toBe(6);
    });

    test('handles styled text without explicit reset codes', () => {
        const input = '\x1b[1mStyled';
        const result = splitWithAnsiContext(input);

        // Check the first character is properly styled with bold
        expect(result[0]).toBe('\x1b[1mS\x1b[22m');

        // Check all characters maintain the same styling
        expect(result[1]).toBe('\x1b[1mt\x1b[22m');
        expect(result[2]).toBe('\x1b[1my\x1b[22m');
        expect(result[3]).toBe('\x1b[1ml\x1b[22m');
        expect(result[4]).toBe('\x1b[1me\x1b[22m');
        expect(result[5]).toBe('\x1b[1md\x1b[22m');

        // Check the total length
        expect(result.length).toBe(6);

        // Verify all characters have the same styling pattern
        result.forEach(char => {
            expect(char.startsWith('\x1b[1m')).toBe(true);
            expect(char.endsWith('\x1b[22m')).toBe(true);
        });
    });

});

describe('processAnsiCode - extended color handling', () => {
    let active: Map<string, string>;

    beforeEach(() => {
        active = new Map<string, string>();
    });

    test('handles 256-color foreground', () => {
        const codes = [ '38', '5', '208' ]; // Orange foreground
        const index = processAnsiCode(codes[0], 0, codes, active);

        expect(index).toBe(2); // Should skip processed parts
        expect(active.has('38;5;208')).toBe(true);
        expect(active.get('38;5;208')).toBe('39');
    });

    test('handles 256-color background', () => {
        const codes = [ '48', '5', '34' ]; // Blue background
        const index = processAnsiCode(codes[0], 0, codes, active);

        expect(index).toBe(2); // Should skip processed parts
        expect(active.has('48;5;34')).toBe(true);
        expect(active.get('48;5;34')).toBe('49');
    });

    test('handles truecolor foreground', () => {
        const codes = [ '38', '2', '123', '45', '67' ]; // RGB foreground
        const index = processAnsiCode(codes[0], 0, codes, active);

        expect(index).toBe(4); // Skips the RGB components
        expect(active.has('38;2;123;45;67')).toBe(true);
        expect(active.get('38;2;123;45;67')).toBe('39');
    });

    test('handles truecolor background', () => {
        const codes = [ '48', '2', '0', '128', '255' ]; // RGB background
        const index = processAnsiCode(codes[0], 0, codes, active);

        expect(index).toBe(4);
        expect(active.has('48;2;0;128;255')).toBe(true);
        expect(active.get('48;2;0;128;255')).toBe('49');
    });

    test('does not process incomplete 256-color sequence', () => {
        const codes = [ '38', '5' ]; // Missing the color value
        const index = processAnsiCode(codes[0], 0, codes, active);

        expect(index).toBe(0);
        expect(active.size).toBe(0);
    });

    test('does not process incomplete truecolor sequence', () => {
        const codes = [ '48', '2', '255', '0' ]; // Missing one RGB component
        const index = processAnsiCode(codes[0], 0, codes, active);

        expect(index).toBe(0);
        expect(active.size).toBe(0);
    });

    test('preserves standard reset behavior with extended colors', () => {
        // Add a 256-color foreground and a bold style
        processAnsiCode('38', 0, [ '38', '5', '208' ], active);
        processAnsiCode('1', 0, [ '1' ], active);

        // Full reset
        processAnsiCode('0', 0, [ '0' ], active);
        expect(active.size).toBe(0);
    });
});
