/**
 * Type-only imports erased during TypeScript compilation.
 */

import type { AnsiFgChainType, ChainInterface } from '@services/interfaces/xterm-service.interface';
import type { AnsiBgChainType, AnsiChainableBuilderType } from '@services/interfaces/xterm-service.interface';

/**
 * Imports
 */

import { bg, derive, fg, hexChain, restore, rgbChain, xterm } from '@services/xterm.service';

/**
 * Tests
 */

const styles = <Record<string, AnsiChainableBuilderType>> <unknown> xterm;

describe('restore', () => {
    test('should leave text holding no reset of its own untouched', () => {
        expect(restore('plain', '\x1b[31m', '\x1b[39m')).toBe('plain');
    });

    test('should turn a reset it owns back into the matching open', () => {
        expect(restore('\x1b[32mHello\x1b[39m World', '\x1b[31m', '\x1b[39m'))
            .toBe('\x1b[32mHello\x1b[31m World');
    });

    test('should pair every sequence when the chain carries several', () => {
        expect(restore('a\x1b[22mb\x1b[39mc\x1b[49md', '\x1b[44m\x1b[31m\x1b[1m', '\x1b[22m\x1b[39m\x1b[49m'))
            .toBe('a\x1b[1mb\x1b[31mc\x1b[44md');
    });

    test('should ignore a reset the chain does not own', () => {
        expect(restore('a\x1b[27mb', '\x1b[31m', '\x1b[39m')).toBe('a\x1b[27mb');
    });

    test('should replace every occurrence, not only the first', () => {
        expect(restore('\x1b[39ma\x1b[39mb', '\x1b[31m', '\x1b[39m')).toBe('\x1b[31ma\x1b[31mb');
    });
});

describe('derive', () => {
    test('should wrap text in the sequences it is given', () => {
        expect(derive(xterm, '\x1b[1m', '\x1b[22m')('t')).toBe('\x1b[1mt\x1b[22m');
    });

    test('should expose the accumulated sequences', () => {
        const chain = derive<ChainInterface>(xterm, '\x1b[31m', '\x1b[39m');

        expect(chain.open).toBe('\x1b[31m');
        expect(chain.close).toBe('\x1b[39m');
    });

    test('should append to the parent open and prepend to the parent close', () => {
        const parent = derive<ChainInterface>(xterm, '\x1b[31m', '\x1b[39m');
        const chain = derive<ChainInterface>(parent, '\x1b[1m', '\x1b[22m');

        expect(chain.open).toBe('\x1b[31m\x1b[1m');
        expect(chain.close).toBe('\x1b[22m\x1b[39m');
    });

    test('should give every chain the entry point as its prototype', () => {
        expect(Object.getPrototypeOf(derive(xterm, '\x1b[1m', '\x1b[22m'))).toBe(xterm);
    });

    test('should produce a callable chain', () => {
        expect(typeof derive(xterm, '\x1b[1m', '\x1b[22m')).toBe('function');
    });
});

describe('fg and bg', () => {
    test('should close a foreground color with the foreground reset', () => {
        expect(fg<AnsiFgChainType>(xterm, '\x1b[31m')('t')).toBe('\x1b[31mt\x1b[39m');
    });

    test('should close a background color with the background reset', () => {
        expect(bg<AnsiBgChainType>(xterm, '\x1b[41m')('t')).toBe('\x1b[41mt\x1b[49m');
    });
});

describe('rgbChain', () => {
    test('should build a 24-bit foreground sequence', () => {
        expect(rgbChain<AnsiFgChainType>(xterm, 38, 1, 2, 3)('t')).toBe('\x1b[38;2;1;2;3mt\x1b[39m');
    });

    test('should build a 24-bit background sequence', () => {
        expect(rgbChain<AnsiBgChainType>(xterm, 48, 1, 2, 3)('t')).toBe('\x1b[48;2;1;2;3mt\x1b[49m');
    });

    test('should throw when a component is not a finite number', () => {
        expect(() => rgbChain(xterm, 38, <number> <unknown> 'a', 0, 0)).toThrow('RGB values must be numbers');
        expect(() => rgbChain(xterm, 38, NaN, 0, 0)).toThrow('RGB values must be numbers');
        expect(() => rgbChain(xterm, 38, Infinity, 0, 0)).toThrow('RGB values must be numbers');
    });

    test('should name every component in the message', () => {
        expect(() => rgbChain(xterm, 38, <number> <unknown> 'a', <number> <unknown> 'b', <number> <unknown> 'c'))
            .toThrow('RGB values must be numbers, received: r=a, g=b, b=c');
    });
});

describe('hexChain', () => {
    test('should read a 6 digit color', () => {
        expect(hexChain<AnsiFgChainType>(xterm, 38, '#64a0c8')('t')).toBe('\x1b[38;2;100;160;200mt\x1b[39m');
    });

    test('should expand a 3 digit color by doubling each digit', () => {
        expect(hexChain<AnsiFgChainType>(xterm, 38, '#f50')('t')).toBe(hexChain<AnsiFgChainType>(xterm, 38, '#ff5500')('t'));
    });

    test('should accept a color without the leading hash', () => {
        expect(hexChain<AnsiBgChainType>(xterm, 48, '333')('t')).toBe('\x1b[48;2;51;51;51mt\x1b[49m');
    });

    test('should read a color case-insensitively', () => {
        expect(hexChain<AnsiFgChainType>(xterm, 38, '#FF5500')('t')).toBe(hexChain<AnsiFgChainType>(xterm, 38, '#ff5500')('t'));
    });

    test('should keep a leading zero component', () => {
        expect(hexChain<AnsiFgChainType>(xterm, 38, '#0000ff')('t')).toBe('\x1b[38;2;0;0;255mt\x1b[39m');
    });

    test('should throw on a length that is neither 3 nor 6', () => {
        expect(() => hexChain(xterm, 38, '#12345')).toThrow('Invalid hex color format');
        expect(() => hexChain(xterm, 38, '')).toThrow('Invalid hex color format');
    });

    test('should throw on a non hexadecimal digit', () => {
        expect(() => hexChain(xterm, 38, '#gggggg')).toThrow('Invalid hex color format');
    });

    test('should quote the offending value in the message', () => {
        expect(() => hexChain(xterm, 38, '#12345'))
            .toThrow('Invalid hex color format: "#12345". Expected 3 or 6 hex digits.');
    });
});

describe('xterm modifiers', () => {
    const modifiers = [
        [ 'dim', '\x1b[2m', '\x1b[22m' ],
        [ 'bold', '\x1b[1m', '\x1b[22m' ],
        [ 'reset', '\x1b[0m', '\x1b[0m' ],
        [ 'hidden', '\x1b[8m', '\x1b[28m' ],
        [ 'inverse', '\x1b[7m', '\x1b[27m' ]
    ];

    for (const [ name, open, close ] of modifiers) {
        test(`should wrap text in the ${ name } sequences`, () => {
            expect(styles[name]('t')).toBe(`${ open }t${ close }`);
        });
    }
});

describe('xterm foreground colors', () => {
    const colors = [
        [ 'red', '31' ], [ 'gray', '90' ], [ 'blue', '34' ], [ 'cyan', '36' ], [ 'black', '30' ],
        [ 'white', '37' ], [ 'green', '32' ], [ 'yellow', '33' ], [ 'magenta', '35' ],
        [ 'redBright', '91' ], [ 'blueBright', '94' ], [ 'cyanBright', '96' ], [ 'whiteBright', '97' ],
        [ 'greenBright', '92' ], [ 'blackBright', '90' ], [ 'yellowBright', '93' ], [ 'magentaBright', '95' ],
        [ 'darkGray', '38;5;238' ], [ 'lightGray', '38;5;252' ], [ 'lightCyan', '38;5;81' ],
        [ 'lightCoral', '38;5;203' ], [ 'oliveGreen', '38;5;149' ], [ 'deepOrange', '38;5;166' ],
        [ 'brightPink', '38;5;197' ], [ 'lightOrange', '38;5;215' ], [ 'burntOrange', '38;5;208' ],
        [ 'lightYellow', '38;5;230' ], [ 'canaryYellow', '38;5;227' ], [ 'lightGoldenrodYellow', '38;5;221' ]
    ];

    for (const [ name, code ] of colors) {
        test(`should emit ${ name } and close with the foreground reset`, () => {
            expect(styles[name]('t')).toBe(`\x1b[${ code }mt\x1b[39m`);
        });
    }
});

describe('xterm background colors', () => {
    const colors = [
        [ 'bgRed', '41' ], [ 'bgBlue', '44' ], [ 'bgCyan', '46' ], [ 'bgGray', '100' ], [ 'bgBlack', '40' ],
        [ 'bgGreen', '42' ], [ 'bgWhite', '47' ], [ 'bgYellow', '43' ], [ 'bgMagenta', '45' ],
        [ 'bgRedBright', '101' ], [ 'bgBlueBright', '104' ], [ 'bgCyanBright', '106' ],
        [ 'bgBlackBright', '100' ], [ 'bgWhiteBright', '107' ], [ 'bgGreenBright', '102' ],
        [ 'bgYellowBright', '103' ], [ 'bgMagentaBright', '105' ]
    ];

    for (const [ name, code ] of colors) {
        test(`should emit ${ name } and close with the background reset`, () => {
            expect(styles[name]('t')).toBe(`\x1b[${ code }mt\x1b[49m`);
        });
    }
});

describe('xterm chaining', () => {
    test('should close chained styles in reverse order', () => {
        expect(xterm.red.bgBlue.bold('t'))
            .toBe('\x1b[31m\x1b[44m\x1b[1mt\x1b[22m\x1b[49m\x1b[39m');
    });

    test('should combine a modifier, a color, and a background in any order', () => {
        expect(xterm.bold.red('t')).toBe('\x1b[1m\x1b[31mt\x1b[39m\x1b[22m');
        expect(xterm.red.bold('t')).toBe('\x1b[31m\x1b[1mt\x1b[22m\x1b[39m');
    });

    test('should leave a reused chain unchanged by the chains derived from it', () => {
        const base = xterm.bold;

        expect(base.red('a')).toBe('\x1b[1m\x1b[31ma\x1b[39m\x1b[22m');
        expect(base.blue('b')).toBe('\x1b[1m\x1b[34mb\x1b[39m\x1b[22m');
        expect(base('c')).toBe('\x1b[1mc\x1b[22m');
    });

    test('should return a new chain on every read', () => {
        expect(xterm.red).not.toBe(xterm.red);
    });
});

describe('xterm arguments', () => {
    test('should pass a lone argument through', () => {
        expect(xterm.red('t')).toBe('\x1b[31mt\x1b[39m');
    });

    test('should join several arguments with a space', () => {
        expect(xterm.cyan('Hello', 'world')).toBe('\x1b[36mHello world\x1b[39m');
    });

    test('should wrap an empty string when called with no argument', () => {
        expect(xterm.cyan()).toBe('\x1b[36m\x1b[39m');
    });

    test('should work as a tagged template', () => {
        expect(xterm.green`Done in ${ 412 }ms`).toBe('\x1b[32mDone in 412ms\x1b[39m');
    });

    test('should render a template with no interpolation', () => {
        expect(xterm.green`plain`).toBe('\x1b[32mplain\x1b[39m');
    });

    test('should render a nullish interpolation as an empty string', () => {
        expect(xterm.cyan`a${ null }b${ undefined }c`).toBe('\x1b[36mabc\x1b[39m');
    });
});

describe('xterm true color', () => {
    test('should apply rgb and bgRgb', () => {
        expect(xterm.rgb(100, 150, 200)('t')).toBe('\x1b[38;2;100;150;200mt\x1b[39m');
        expect(xterm.bgRgb(100, 150, 200)('t')).toBe('\x1b[48;2;100;150;200mt\x1b[49m');
    });

    test('should apply hex and bgHex', () => {
        expect(xterm.hex('#64a0c8')('t')).toBe('\x1b[38;2;100;160;200mt\x1b[39m');
        expect(xterm.bgHex('333')('t')).toBe('\x1b[48;2;51;51;51mt\x1b[49m');
    });

    test('should combine a 24-bit foreground with a 24-bit background', () => {
        expect(xterm.rgb(255, 100, 50).bgHex('#003366')('t'))
            .toBe('\x1b[38;2;255;100;50m\x1b[48;2;0;51;102mt\x1b[49m\x1b[39m');
    });

    test('should throw where the chain is built, not where it is called', () => {
        expect(() => xterm.hex('#12345')).toThrow('Invalid hex color format');
        expect(() => xterm.rgb(<number> <unknown> 'a', 0, 0)).toThrow('RGB values must be numbers');
    });
});

describe('xterm nesting', () => {
    test('should restore the outer color after an inner chain resets it', () => {
        expect(xterm.bgBlue.red.bold(`${ xterm.green('Hello') } World`)).toBe(
            '\x1b[44m\x1b[31m\x1b[1m\x1b[32mHello\x1b[31m World\x1b[22m\x1b[39m\x1b[49m'
        );
    });

    test('should restore an outer modifier after an inner one closes', () => {
        expect(xterm.bold(`a${ xterm.dim('b') }c`)).toBe('\x1b[1ma\x1b[2mb\x1b[1mc\x1b[22m');
    });

    test('should restore an outer background after an inner one closes', () => {
        expect(xterm.bgRed(`a${ xterm.bgGreen('b') }c`)).toBe('\x1b[41ma\x1b[42mb\x1b[41mc\x1b[49m');
    });

    test('should restore a 24-bit color after an inner reset', () => {
        expect(xterm.hex('#f50')(`a${ xterm.blue('b') }c`))
            .toBe('\x1b[38;2;255;85;0ma\x1b[34mb\x1b[38;2;255;85;0mc\x1b[39m');
    });

    test('should nest more than one level deep', () => {
        const inner = xterm.green(`x${ xterm.yellow('y') }z`);

        expect(xterm.red(`a${ inner }b`)).toBe('\x1b[31ma\x1b[32mx\x1b[33my\x1b[32mz\x1b[31mb\x1b[39m');
    });

    test('should nest through a tagged template too', () => {
        expect(xterm.red`a${ xterm.green('b') }c`).toBe('\x1b[31ma\x1b[32mb\x1b[31mc\x1b[39m');
    });
});

describe('xterm NO_COLOR', () => {
    afterEach(() => {
        globalThis.NO_COLOR = undefined;
    });

    test('should return the argument unchanged', () => {
        globalThis.NO_COLOR = true;

        expect(xterm.red.bold('t')).toBe('t');
        expect(xterm.hex('#f50')`a${ 1 }`).toBe('a1');
    });

    test('should still join several arguments', () => {
        globalThis.NO_COLOR = true;

        expect(xterm.cyan('a', 'b')).toBe('a b');
    });

    test('should leave an already styled inner string alone', () => {
        const inner = xterm.green('x');
        globalThis.NO_COLOR = true;

        expect(xterm.red(inner)).toBe(inner);
    });
});
