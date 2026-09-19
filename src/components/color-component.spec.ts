/**
 * Type-only imports erased during TypeScript compilation.
 */

import type { ColorInterface } from '@components/interfaces/ansi-component.interface';

/**
 * Imports
 */

import { channel, hex, parseHex } from '@components/color.component';

/**
 * Tests
 */

describe('channel', () => {
    test.each`
        value       | expected
        ${ 0 }      | ${ 0 }
        ${ 128 }    | ${ 128 }
        ${ 255 }    | ${ 255 }
    `('should keep $value inside the byte range untouched', ({ value, expected }: any) => {
        expect(channel(value)).toBe(expected);
    });

    test.each`
        value       | expected
        ${ -1 }     | ${ 0 }
        ${ -255 }   | ${ 0 }
        ${ 256 }    | ${ 255 }
        ${ 1000 }   | ${ 255 }
    `('should clamp $value to $expected', ({ value, expected }: any) => {
        expect(channel(value)).toBe(expected);
    });

    test.each`
        value       | expected
        ${ 12.4 }   | ${ 12 }
        ${ 12.5 }   | ${ 13 }
        ${ 12.6 }   | ${ 13 }
        ${ -0.4 }   | ${ 0 }
    `('should round $value to $expected', ({ value, expected }: any) => {
        expect(channel(value)).toBe(expected);
    });

    test('should round before clamping at the upper edge', () => {
        expect(channel(254.5)).toBe(255);
        expect(channel(255.4)).toBe(255);
    });

    test('should hand back a positive zero for a negative input', () => {
        expect(Object.is(channel(-0.4), 0)).toBe(true);
    });
});

describe('hex', () => {
    test('should render black as six zeros', () => {
        expect(hex({ red: 0, green: 0, blue: 0 })).toBe('000000');
    });

    test('should render white as six f characters', () => {
        expect(hex({ red: 255, green: 255, blue: 255 })).toBe('ffffff');
    });

    test('should place red, green and blue in that order', () => {
        expect(hex({ red: 18, green: 52, blue: 86 })).toBe('123456');
    });

    test('should pad every channel to two digits', () => {
        expect(hex({ red: 1, green: 2, blue: 3 })).toBe('010203');
    });

    test('should use lowercase digits', () => {
        expect(hex({ red: 171, green: 205, blue: 239 })).toBe('abcdef');
    });

    test('should emit six digits and no leading hash', () => {
        expect(hex({ red: 10, green: 10, blue: 10 })).toHaveLength(6);
    });

    test('should clamp a channel that runs past the byte range', () => {
        expect(hex({ red: 300, green: -20, blue: 255 })).toBe('ff00ff');
    });

    test('should round a fractional channel', () => {
        expect(hex({ red: 15.6, green: 0.4, blue: 128.5 })).toBe('100081');
    });
});

describe('parseHex', () => {
    test('should read a six digit colour', () => {
        expect(parseHex('123456')).toEqual({ red: 18, green: 52, blue: 86 });
    });

    test('should drop a leading hash', () => {
        expect(parseHex('#123456')).toEqual({ red: 18, green: 52, blue: 86 });
    });

    test('should double each digit of a three digit colour', () => {
        expect(parseHex('abc')).toEqual({ red: 170, green: 187, blue: 204 });
    });

    test('should drop a leading hash from a three digit colour', () => {
        expect(parseHex('#f00')).toEqual({ red: 255, green: 0, blue: 0 });
    });

    test('should read uppercase digits', () => {
        expect(parseHex('#ABCDEF')).toEqual({ red: 171, green: 205, blue: 239 });
    });

    test('should read black and white at the ends of the range', () => {
        expect(parseHex('000000')).toEqual({ red: 0, green: 0, blue: 0 });
        expect(parseHex('ffffff')).toEqual({ red: 255, green: 255, blue: 255 });
    });

    test.each`
        color
        ${ '' }
        ${ '#' }
        ${ 'ab' }
        ${ 'abcd' }
        ${ 'abcde' }
        ${ 'abcdefa' }
        ${ 'ggg' }
        ${ '12345g' }
        ${ '#12 456' }
        ${ 'rgb(1,2,3)' }
    `('should reject $color as a hex colour', ({ color }: any) => {
        expect(() => parseHex(color)).toThrow(`Invalid hex color format: "${ color }". Expected 3 or 6 hex digits.`);
    });

    test('should report the value it was given, hash included', () => {
        expect(() => parseHex('#zzz')).toThrow('Invalid hex color format: "#zzz". Expected 3 or 6 hex digits.');
    });
});

describe('hex and parseHex', () => {
    const colors: Array<ColorInterface> = [
        { red: 0, green: 0, blue: 0 },
        { red: 255, green: 255, blue: 255 },
        { red: 18, green: 52, blue: 86 },
        { red: 1, green: 128, blue: 254 }
    ];

    test('should hand back the same colour after a round trip through hex', () => {
        for (const color of colors) {
            expect(parseHex(hex(color))).toEqual(color);
        }
    });

    test('should hand back the same digits after a round trip through parseHex', () => {
        for (const digits of [ '000000', 'ffffff', '123456', '0180fe' ]) {
            expect(hex(parseHex(digits))).toBe(digits);
        }
    });

    test('should agree on a three digit colour once it is expanded', () => {
        expect(hex(parseHex('#abc'))).toBe('aabbcc');
    });
});
