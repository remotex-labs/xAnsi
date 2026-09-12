/**
 * Imports
 */

import { padText, stripAnsi, truncate, wrapText } from '@components/text.component';
import { clustersOf, graphemeWidth, sliceAnsi, stringWidth } from '@components/text.component';

/**
 * Tests
 */

const ESC = String.fromCharCode(27);
const RED = `${ ESC }[31m`;
const RESET = `${ ESC }[39m`;

const VS15 = '︎';
const VS16 = '️';
const ZWJ = '‍';
const ACUTE = '́';

describe('clustersOf', () => {
    test('should yield one entry per ascii character', () => {
        expect(Array.from(clustersOf('abc'))).toEqual([ 'a', 'b', 'c' ]);
    });

    test('should yield nothing for an empty string', () => {
        expect(Array.from(clustersOf(''))).toEqual([]);
    });

    test('should keep a base character and its combining mark together', () => {
        expect(Array.from(clustersOf(`e${ ACUTE }o`))).toEqual([ `e${ ACUTE }`, 'o' ]);
    });

    test('should keep a surrogate pair whole rather than splitting it', () => {
        expect(Array.from(clustersOf('😀'))).toEqual([ '😀' ]);
    });

    test('should keep a zero width joiner sequence as a single cluster', () => {
        expect(Array.from(clustersOf(`👨${ ZWJ }👩${ ZWJ }👧`))).toEqual([ `👨${ ZWJ }👩${ ZWJ }👧` ]);
    });

    test('should be a fresh generator on every call', () => {
        const first = clustersOf('ab');
        expect(Array.from(first)).toEqual([ 'a', 'b' ]);
        expect(Array.from(first)).toEqual([]);
        expect(Array.from(clustersOf('ab'))).toEqual([ 'a', 'b' ]);
    });
});

describe('graphemeWidth', () => {
    test('should give a printable ascii character a single column', () => {
        expect(graphemeWidth('a')).toBe(1);
        expect(graphemeWidth(' ')).toBe(1);
        expect(graphemeWidth('~')).toBe(1);
    });

    test('should give a cjk ideograph two columns', () => {
        expect(graphemeWidth('中')).toBe(2);
        expect(graphemeWidth('한')).toBe(2);
        expect(graphemeWidth('あ')).toBe(2);
    });

    test('should give an emoji with default presentation two columns', () => {
        expect(graphemeWidth('😀')).toBe(2);
        expect(graphemeWidth('👍')).toBe(2);
    });

    test('should give a lone combining mark no width', () => {
        expect(graphemeWidth(ACUTE)).toBe(0);
    });

    test('should give a format character no width', () => {
        expect(graphemeWidth(ZWJ)).toBe(0);
    });

    test('should charge the base character, not the mark, for a composed cluster', () => {
        expect(graphemeWidth(`e${ ACUTE }`)).toBe(1);
        expect(graphemeWidth(`中${ ACUTE }`)).toBe(2);
    });

    test('should widen a cluster asking for emoji presentation', () => {
        expect(graphemeWidth(`❤${ VS16 }`)).toBe(2);
    });

    test('should narrow a cluster asking for text presentation', () => {
        expect(graphemeWidth(`❤${ VS15 }`)).toBe(1);
    });

    test('should read the emoji request before the text one', () => {
        expect(graphemeWidth(`❤${ VS15 }${ VS16 }`)).toBe(2);
    });

    test('should charge a joined sequence as one wide cluster', () => {
        expect(graphemeWidth(`👨${ ZWJ }👩${ ZWJ }👧`)).toBe(2);
    });

    test('should charge a skin tone modifier to the emoji it follows', () => {
        expect(graphemeWidth('👍🏽')).toBe(2);
    });
});

describe('stringWidth', () => {
    test('should be zero for an empty string', () => {
        expect(stringWidth('')).toBe(0);
    });

    test('should count printable ascii by its length', () => {
        expect(stringWidth('hello world')).toBe(11);
    });

    test('should count a cjk run at two columns each', () => {
        expect(stringWidth('中文')).toBe(4);
    });

    test('should count a mixed ascii and cjk run', () => {
        expect(stringWidth('a中b')).toBe(4);
    });

    test('should ignore the escape sequences wrapping the text', () => {
        expect(stringWidth(`${ RED }hello${ RESET }`)).toBe(5);
    });

    test('should ignore escape sequences sitting between characters', () => {
        expect(stringWidth(`a${ RED }b${ RESET }c`)).toBe(3);
    });

    test('should be zero for a string that is only escape sequences', () => {
        expect(stringWidth(`${ RED }${ RESET }`)).toBe(0);
    });

    test('should ignore an operating system command sequence', () => {
        expect(stringWidth(`${ ESC }]0;title${ ESC }\\text`)).toBe(4);
    });

    test('should not count combining marks that decorate a character', () => {
        expect(stringWidth(`e${ ACUTE }`)).toBe(1);
        expect(stringWidth(`cafe${ ACUTE }`)).toBe(4);
    });

    test('should match the precomposed form of the same text', () => {
        expect(stringWidth(`cafe${ ACUTE }`)).toBe(stringWidth('café'));
    });

    test('should count an emoji as two columns', () => {
        expect(stringWidth('😀')).toBe(2);
        expect(stringWidth('a😀b')).toBe(4);
    });

    test('should count a joined emoji sequence once', () => {
        expect(stringWidth(`👨${ ZWJ }👩${ ZWJ }👧`)).toBe(2);
    });

    test('should honour a variation selector', () => {
        expect(stringWidth(`❤${ VS16 }`)).toBe(2);
        expect(stringWidth(`❤${ VS15 }`)).toBe(1);
    });

    test('should agree with the sum of its clusters', () => {
        const text = `a中😀e${ ACUTE }`;
        const sum = Array.from(clustersOf(text)).reduce((total, cluster) => total + graphemeWidth(cluster), 0);

        expect(stringWidth(text)).toBe(sum);
    });
});

describe('sliceAnsi', () => {
    test('should return the whole text when given no bounds', () => {
        expect(sliceAnsi('hello')).toBe('hello');
    });

    test('should cut at a column, not at a character index', () => {
        expect(sliceAnsi('hello world', 0, 5)).toBe('hello');
    });

    test('should drop what sits before the start column', () => {
        expect(sliceAnsi('hello world', 6)).toBe('world');
    });

    test('should take a window out of the middle', () => {
        expect(sliceAnsi('hello world', 3, 8)).toBe('lo wo');
    });

    test('should return nothing when the window is empty', () => {
        expect(sliceAnsi('hello', 2, 2)).toBe('');
    });

    test('should return nothing when the window starts past the text', () => {
        expect(sliceAnsi('hello', 20, 30)).toBe('');
    });

    test('should stop at the end of the text rather than pad it', () => {
        expect(sliceAnsi('hi', 0, 10)).toBe('hi');
    });

    test('should slice a wide run by columns', () => {
        expect(sliceAnsi('中文字', 0, 4)).toBe('中文');
        expect(sliceAnsi('中文字', 2, 4)).toBe('文');
    });

    test('should replace a wide character the cut splits with a space', () => {
        expect(sliceAnsi('中文', 0, 1)).toBe(' ');
        expect(sliceAnsi('中文', 1, 4)).toBe(' 文');
    });

    test('should replace both halves when the window splits either end', () => {
        expect(sliceAnsi('中文', 1, 3)).toBe('  ');
    });

    test('should keep every escape sequence it passes over', () => {
        expect(sliceAnsi(`${ RED }hello${ RESET }`, 0, 3)).toBe(`${ RED }hel${ RESET }`);
    });

    test('should keep an escape sequence that falls outside the window', () => {
        expect(sliceAnsi(`${ RED }hello${ RESET } world`, 6, 11)).toBe(`${ RED }${ RESET }world`);
    });

    test('should keep a cluster whole instead of splitting its marks off', () => {
        expect(sliceAnsi(`e${ ACUTE }xy`, 0, 1)).toBe(`e${ ACUTE }`);
    });

    test('should keep a joined emoji sequence whole', () => {
        const family = `👨${ ZWJ }👩${ ZWJ }👧`;
        expect(sliceAnsi(`${ family }ab`, 0, 2)).toBe(family);
    });

    test('should leave the text alone when the window covers all of it', () => {
        const text = `${ RED }a中😀${ RESET }`;
        expect(sliceAnsi(text, 0, stringWidth(text))).toBe(text);
    });

    test('should produce a slice whose width matches the window it was given', () => {
        expect(stringWidth(sliceAnsi('中a文b字', 1, 6))).toBe(5);
    });
});

describe('truncate', () => {
    test('should leave text that already fits untouched', () => {
        expect(truncate('hello', 10)).toBe('hello');
    });

    test('should leave text that fits exactly untouched', () => {
        expect(truncate('hello', 5)).toBe('hello');
    });

    test('should cut and add the ellipsis when the text is too long', () => {
        expect(truncate('hello world', 8)).toBe('hello...');
    });

    test('should keep the result inside the width it was given', () => {
        expect(stringWidth(truncate('hello world', 8))).toBe(8);
    });

    test('should take the ellipsis it is given', () => {
        expect(truncate('hello world', 6, '…')).toBe('hello…');
        expect(truncate('hello world', 8, '>>')).toBe('hello >>');
    });

    test('should drop the ellipsis when there is no room for it', () => {
        expect(truncate('hello world', 3)).toBe('hel');
        expect(truncate('hello world', 2)).toBe('he');
    });

    test('should return nothing when there is no room at all', () => {
        expect(truncate('hello world', 0)).toBe('');
    });

    test('should measure the text without its escape sequences', () => {
        expect(truncate(`${ RED }hello${ RESET }`, 5)).toBe(`${ RED }hello${ RESET }`);
    });

    test('should keep the escape sequences of the text it cuts', () => {
        expect(truncate(`${ RED }hello world${ RESET }`, 8)).toBe(`${ RED }hello${ RESET }...`);
    });

    test('should count wide characters as two columns', () => {
        expect(truncate('中文字', 6)).toBe('中文字');
        expect(truncate('中文字a', 6)).toBe('中 ...');
    });
});

describe('wrapText', () => {
    test('should return the text untouched when the width is unusable', () => {
        expect(wrapText('hello world', 0)).toEqual([ 'hello world' ]);
        expect(wrapText('hello world', -1)).toEqual([ 'hello world' ]);
    });

    test('should return a single line when the text already fits', () => {
        expect(wrapText('hello', 10)).toEqual([ 'hello' ]);
    });

    test('should break between words rather than inside them', () => {
        expect(wrapText('hello world', 5)).toEqual([ 'hello', 'world' ]);
    });

    test('should fill a line before opening the next one', () => {
        expect(wrapText('aa bb cc dd', 5)).toEqual([ 'aa bb', 'cc dd' ]);
    });

    test('should count the space that joins two words', () => {
        expect(wrapText('aa bb', 4)).toEqual([ 'aa', 'bb' ]);
        expect(wrapText('aa bb', 5)).toEqual([ 'aa bb' ]);
    });

    test('should keep the paragraphs the text already has', () => {
        expect(wrapText('one\ntwo', 10)).toEqual([ 'one', 'two' ]);
    });

    test('should wrap each paragraph on its own', () => {
        expect(wrapText('aa bb\ncc dd', 3)).toEqual([ 'aa', 'bb', 'cc', 'dd' ]);
    });

    test('should keep a blank line between paragraphs', () => {
        expect(wrapText('one\n\ntwo', 10)).toEqual([ 'one', '', 'two' ]);
    });

    test('should return a single empty line for an empty string', () => {
        expect(wrapText('', 10)).toEqual([ '' ]);
    });

    test('should cut a word that cannot fit on any line', () => {
        expect(wrapText('abcdefg', 3)).toEqual([ 'abc', 'def', 'g' ]);
    });

    test('should leave no trailing piece when the long word divides evenly', () => {
        expect(wrapText('abcdef', 3)).toEqual([ 'abc', 'def' ]);
    });

    test('should carry on wrapping after a word it had to cut', () => {
        expect(wrapText('abcdefg hi', 3)).toEqual([ 'abc', 'def', 'g', 'hi' ]);
    });

    test('should hold no line wider than the width it was given', () => {
        for (const line of wrapText('the quick brown fox jumps over the lazy dog', 10))
            expect(stringWidth(line)).toBeLessThanOrEqual(10);
    });

    test('should measure words by their columns, not their escape sequences', () => {
        expect(wrapText(`${ RED }hello${ RESET } world`, 11)).toEqual([ `${ RED }hello${ RESET } world` ]);
    });

    test('should break a coloured line on its width in columns', () => {
        expect(wrapText(`${ RED }hello${ RESET } world`, 5)).toEqual([ `${ RED }hello${ RESET }`, 'world' ]);
    });

    test('should count wide characters as two columns', () => {
        expect(wrapText('中文 字', 4)).toEqual([ '中文', '字' ]);
    });
});

describe('stripAnsi', () => {
    const BEL = String.fromCharCode(7);
    const ST = `${ ESC }\\`;

    test('should return an empty string unchanged', () => {
        expect(stripAnsi('')).toBe('');
    });

    test('should leave text carrying no escape sequence alone', () => {
        expect(stripAnsi('hello world')).toBe('hello world');
    });

    test('should leave the characters a sequence is built from when the escape is missing', () => {
        expect(stripAnsi('[31mred')).toBe('[31mred');
    });

    test('should drop the sequences wrapping the text', () => {
        expect(stripAnsi(`${ RED }red${ RESET }`)).toBe('red');
    });

    test('should drop sequences sitting between characters', () => {
        expect(stripAnsi(`a${ RED }b${ RESET }c`)).toBe('abc');
    });

    test('should drop every sequence, not only the first', () => {
        expect(stripAnsi(`${ RED }a${ RESET }${ RED }b${ RESET }`)).toBe('ab');
    });

    test('should return nothing for a string that is only sequences', () => {
        expect(stripAnsi(`${ RED }${ RESET }`)).toBe('');
    });

    test('should drop a sequence carrying several parameters', () => {
        expect(stripAnsi(`${ ESC }[1;31mbold red${ ESC }[0m`)).toBe('bold red');
        expect(stripAnsi(`${ ESC }[38;5;208morange${ ESC }[39m`)).toBe('orange');
        expect(stripAnsi(`${ ESC }[38;2;255;0;0mtrue red${ ESC }[39m`)).toBe('true red');
    });

    test('should drop a sequence carrying no parameter', () => {
        expect(stripAnsi(`${ ESC }[Hhome`)).toBe('home');
        expect(stripAnsi(`${ ESC }[2Jcleared`)).toBe('cleared');
    });

    test('should drop a sequence moving the cursor', () => {
        expect(stripAnsi(`${ ESC }[12;34Hat a position`)).toBe('at a position');
        expect(stripAnsi(`${ ESC }[3Sscrolled`)).toBe('scrolled');
    });

    test('should drop a sequence opening with a private parameter byte', () => {
        expect(stripAnsi(`${ ESC }[?25lhidden${ ESC }[?25h`)).toBe('hidden');
    });

    test('should drop a sequence carrying an intermediate byte', () => {
        expect(stripAnsi(`${ ESC }[4 qbar cursor`)).toBe('bar cursor');
    });

    test('should drop an operating system command the bell closes', () => {
        expect(stripAnsi(`${ ESC }]0;window title${ BEL }text`)).toBe('text');
    });

    test('should drop an operating system command the string terminator closes', () => {
        expect(stripAnsi(`${ ESC }]0;window title${ ST }text`)).toBe('text');
    });

    test('should drop both halves of a hyperlink and keep its label', () => {
        expect(stripAnsi(`${ ESC }]8;;https://example.com${ ST }label${ ESC }]8;;${ ST }`)).toBe('label');
    });

    test('should drop a two-character escape', () => {
        expect(stripAnsi(`${ ESC }Mreverse index`)).toBe('reverse index');
        expect(stripAnsi(`${ ESC }Enext line`)).toBe('next line');
    });

    test('should keep the text of a run holding sequences of every kind', () => {
        expect(stripAnsi(
            `${ ESC }]0;title${ BEL }${ ESC }[1m${ ESC }[31mred${ ESC }[0m plain${ ESC }M`
        )).toBe('red plain');
    });

    test('should leave a lone escape that opens no sequence', () => {
        expect(stripAnsi(`a${ ESC }`)).toBe(`a${ ESC }`);
    });

    test('should leave an introducer that never reaches a final byte', () => {
        expect(stripAnsi(`${ ESC }[31`)).toBe(`${ ESC }[31`);
    });

    test('should drop the introducer of an operating system command that never closes', () => {
        expect(stripAnsi(`${ ESC }]0;title`)).toBe('0;title');
    });

    test('should keep the text a sequence carries no claim over', () => {
        expect(stripAnsi(`${ RED }one${ RESET }\ntwo\t${ RED }three${ RESET }`)).toBe('one\ntwo\tthree');
    });

    test('should leave wide characters and clusters as they stand', () => {
        expect(stripAnsi(`${ RED }中文${ RESET }`)).toBe('中文');
        expect(stripAnsi(`${ RED }e${ ACUTE }${ RESET }`)).toBe(`e${ ACUTE }`);
        expect(stripAnsi(`${ RED }👨${ ZWJ }👩${ ZWJ }👧${ RESET }`)).toBe(`👨${ ZWJ }👩${ ZWJ }👧`);
    });

    test('should give the same result however often it is called', () => {
        const text = `${ RED }red${ RESET }`;

        expect(stripAnsi(text)).toBe('red');
        expect(stripAnsi(text)).toBe('red');
        expect(stripAnsi(stripAnsi(text))).toBe('red');
    });

    test('should leave the width of the text it strips unchanged', () => {
        const text = `${ ESC }]0;title${ BEL }${ RED }a中😀${ RESET }`;

        expect(stringWidth(stripAnsi(text))).toBe(stringWidth(text));
    });

    test('should agree with a slice that covers the whole text', () => {
        const text = `${ RED }hello${ RESET } world`;

        expect(stripAnsi(sliceAnsi(text, 0, stringWidth(text)))).toBe('hello world');
    });
});

describe('padText', () => {
    test('should leave text that already fills the width alone', () => {
        expect(padText('hello', 5)).toBe('hello');
        expect(padText('hello', 5, 'right')).toBe('hello');
    });

    test('should leave text wider than the width alone rather than cut it', () => {
        expect(padText('hello', 3)).toBe('hello');
        expect(padText('hello', 0)).toBe('hello');
        expect(padText('hello', -2)).toBe('hello');
    });

    test('should pad on the right when given no alignment', () => {
        expect(padText('ab', 5)).toBe('ab   ');
    });

    test('should pad on the right when aligned left', () => {
        expect(padText('ab', 5, 'left')).toBe('ab   ');
    });

    test('should pad on the left when aligned right', () => {
        expect(padText('ab', 5, 'right')).toBe('   ab');
    });

    test('should fill the whole width for an empty string', () => {
        expect(padText('', 3)).toBe('   ');
        expect(padText('', 3, 'right')).toBe('   ');
        expect(padText('', 0)).toBe('');
    });

    test('should add a single column when only one is spare', () => {
        expect(padText('ab', 3)).toBe('ab ');
        expect(padText('ab', 3, 'right')).toBe(' ab');
    });

    test('should bring the text up to the width it was given', () => {
        expect(stringWidth(padText('ab', 9))).toBe(9);
        expect(stringWidth(padText('ab', 9, 'right'))).toBe(9);
    });

    test('should measure the text without its escape sequences', () => {
        expect(padText(`${ RED }ab${ RESET }`, 5)).toBe(`${ RED }ab${ RESET }   `);
        expect(padText(`${ RED }ab${ RESET }`, 5, 'right')).toBe(`   ${ RED }ab${ RESET }`);
    });

    test('should leave styled text that already fills the width alone', () => {
        expect(padText(`${ RED }hello${ RESET }`, 5)).toBe(`${ RED }hello${ RESET }`);
    });

    test('should count a wide character as two columns', () => {
        expect(padText('中', 4)).toBe('中  ');
        expect(padText('中', 4, 'right')).toBe('  中');
        expect(padText('中文', 4)).toBe('中文');
    });

    test('should count a cluster by the column it draws, not its code points', () => {
        expect(padText(`e${ ACUTE }`, 3)).toBe(`e${ ACUTE }  `);
        expect(padText('😀', 4)).toBe('😀  ');
        expect(padText(`👨${ ZWJ }👩${ ZWJ }👧`, 4)).toBe(`👨${ ZWJ }👩${ ZWJ }👧  `);
    });

    describe('the width it spreads over both sides', () => {
        test('should split the padding in two when it divides evenly', () => {
            expect(padText('ab', 6, 'both')).toBe('  ab  ');
            expect(padText('ab', 8, 'both')).toBe('   ab   ');
        });

        test('should hand the odd column to the right', () => {
            expect(padText('ab', 5, 'both')).toBe(' ab  ');
            expect(padText('ab', 7, 'both')).toBe('  ab   ');
        });

        test('should put the single spare column on the right', () => {
            expect(padText('ab', 3, 'both')).toBe('ab ');
        });

        test('should bring the text up to the width it was given', () => {
            expect(stringWidth(padText('ab', 9, 'both'))).toBe(9);
            expect(stringWidth(padText('ab', 10, 'both'))).toBe(10);
        });

        test('should leave text that already fills the width alone', () => {
            expect(padText('hello', 5, 'both')).toBe('hello');
            expect(padText('hello', 3, 'both')).toBe('hello');
        });

        test('should measure the text without its escape sequences', () => {
            expect(padText(`${ RED }ab${ RESET }`, 6, 'both')).toBe(`  ${ RED }ab${ RESET }  `);
        });

        test('should count a wide character as two columns', () => {
            expect(padText('中', 6, 'both')).toBe('  中  ');
        });

        test('should count a cluster by the column it draws', () => {
            expect(padText(`e${ ACUTE }`, 5, 'both')).toBe(`  e${ ACUTE }  `);
        });
    });
});
