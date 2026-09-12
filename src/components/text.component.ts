/**
 * Imports
 */

import { ESC } from '@constants/ansi.constant';
import { ZeroWidthCluster, WideCluster, PrintableAscii } from '@constants/text.constant';
import { ClusteredText, AnsiSequence, ClusterFlag, WidthMask } from '@constants/text.constant';

/**
 * The classification of every code unit the module has measured, built as the text asks for it.
 *
 * @remarks
 * The table covers the basic multilingual plane, one byte per code unit, and it is allocated on the first
 * character above U+00AC.
 * Text that stays below that point never pays the 64 KiB.
 *
 * @see classifyCode
 * @since 2.0.0
 */

let classTable: Uint8Array | undefined;

/**
 * The shared grapheme segmenter, created on the first call that needs it.
 *
 * @remarks
 * Constructing an `Intl.Segmenter` is expensive relative to segmenting a short string,
 * so one instance is built lazily and reused for every later call.
 * A module that never measures non-ASCII text never pays for it.
 *
 * @since 2.0.0
 */

let segmenter: Intl.Segmenter | undefined;

/**
 * Returns the shared grapheme segmenter, building it on the first call.
 *
 * @returns The segmenter every caller in this module shares
 *
 * @remarks
 * The instance is held in a module variable rather than rebuilt per call,
 * so segmenting stays a lookup once the first caller has paid for the construction.
 *
 * @since 2.0.0
 */

function graphemeSegmenter(): Intl.Segmenter {
    segmenter ??= new Intl.Segmenter(undefined, { granularity: 'grapheme' });

    return segmenter;
}

/**
 * Classifies one code unit, answering from the table whenever it has been asked before.
 *
 * @param code - The code unit to classify, which the caller has already found to be U+00AD or above
 * @returns The width of the code unit plus one, carrying {@link ClusterFlag} where segmentation has to see it
 *
 * @remarks
 * The three patterns run once per distinct code unit rather than once per character of the text,
 * and every later sighting is an array index.
 * That is what the table buys: a line of CJK asks the regular expression engine once for each character it
 * has never seen, and never again for the rest of the process.
 *
 * A high surrogate is marked for segmentation without a test,
 * since the code point it opens cannot be read from one code unit.
 *
 * @see WIDTH_MASK
 * @see CLUSTER_FLAG
 *
 * @since 2.0.0
 */

function classifyCode(code: number): number {
    classTable ??= new Uint8Array(0x10000);

    const known = classTable[code];
    if (known !== 0) return known;

    const character = String.fromCharCode(code);
    let info = 2;

    if (ZeroWidthCluster.test(character)) info = 1;
    else if (WideCluster.test(character)) info = 3;
    if ((code >= 0xd800 && code <= 0xdbff) || ClusteredText.test(character)) info |= ClusterFlag;

    classTable[code] = info;

    return info;
}

/**
 * Finds where the escape sequence at a position ends.
 *
 * @param text - The text the sequence sits in
 * @param start - The index of the escape byte that opens it
 * @returns The index the sequence stops before, or `start` where the bytes complete no sequence
 *
 * @remarks
 * This reads the grammar {@link AnsiSequence} carries, one byte at a time and without a match object:
 *
 * - **CSI** - `[`, parameter bytes, intermediate bytes, and one final byte that names the command.
 * - **OSC** - `]`, a run holding neither a BEL nor an escape, closed by a BEL or by an escape and a backslash.
 * - **A two-byte escape** - one byte in `@` to `Z` or `\` to `_`.
 *
 * An OSC that never closes falls back to the two-byte escape, because `]` sits inside that class,
 * which is the same answer the pattern reaches by backtracking.
 * The `[` that opens CSI does not sit inside it, so an unfinished CSI completes nothing and the caller is told so.
 *
 * @see AnsiSequence
 * @since 2.0.0
 */

function sequenceEnd(text: string, start: number): number {
    const length = text.length;
    const introducer = text.charCodeAt(start + 1);

    if (introducer === 0x5b) {
        let index = start + 2;

        while (index < length && text.charCodeAt(index) >= 0x30 && text.charCodeAt(index) <= 0x3f) index++;
        while (index < length && text.charCodeAt(index) >= 0x20 && text.charCodeAt(index) <= 0x2f) index++;

        const final = text.charCodeAt(index);

        return final >= 0x40 && final <= 0x7e ? index + 1 : start;
    }

    if (introducer === 0x5d) {
        for (let index = start + 2; index < length; index++) {
            const code = text.charCodeAt(index);

            if (code === 0x07) return index + 1;
            if (code === 0x1b) return text.charCodeAt(index + 1) === 0x5c ? index + 2 : start + 2;
        }

        return start + 2;
    }

    if ((introducer >= 0x40 && introducer <= 0x5a) || (introducer >= 0x5c && introducer <= 0x5f)) return start + 2;

    return start;
}

/**
 * Tells whether a range of the text holds a code unit that segmentation has to see.
 *
 * @param text - The text the range belongs to
 * @param from - The index the range starts at
 * @param to - The index the range stops before
 * @returns `true` when one code point of the range may join its neighbour into a cluster
 *
 * @remarks
 * This is the range form of {@link ClusteredText}, and it answers the same question from the table.
 * Testing the pattern would need a substring, which is the allocation the caller is trying to avoid,
 * so the range is walked instead.
 *
 * Every code unit below U+00AD is settled by its code alone,
 * since no mark, no format character, and no surrogate sits under that point.
 *
 * @see ClusteredText
 * @see classifyCode
 *
 * @since 2.0.0
 */

function isClustered(text: string, from: number, to: number): boolean {
    for (let index = from; index < to; index++) {
        const code = text.charCodeAt(index);
        if (code >= 0xad && (classifyCode(code) & ClusterFlag)) return true;
    }

    return false;
}

/**
 * Measures a range by grapheme cluster.
 *
 * @param text - The text the range belongs to
 * @param from - The index the range starts at
 * @param to - The index the range stops before
 * @returns The number of columns the range draws
 *
 * @remarks
 * This is the slow path {@link plainWidth} falls back to,
 * and it is the only one that cuts the range out of the text, because `Intl.Segmenter` takes a string.
 *
 * @see plainWidth
 * @see graphemeWidth
 *
 * @since 2.0.0
 */

function segmentedWidth(text: string, from: number, to: number): number {
    let width = 0;
    for (const { segment } of graphemeSegmenter().segment(text.slice(from, to)))
        width += graphemeWidth(segment);

    return width;
}

/**
 * Measures how many terminal columns a run carrying no escape sequence occupies.
 *
 * @param text - The text the run belongs to
 * @param from - The index the run starts at
 * @param to - The index the run stops before
 * @returns The number of columns the run draws
 *
 * @remarks
 * The run is read in place, so a caller that already knows where a run starts and stops never cuts it out
 * of the text to measure it.
 * Every character below U+00AD is one column and costs one comparison,
 * which carries ASCII, Latin-1, and the punctuation between them.
 * Anything above that point is classified once and then read from the table.
 *
 * The walk doubles as the test for segmentation.
 * Where it meets a code unit that joins its neighbour, it hands the whole run to {@link segmentedWidth} and
 * throws away what it had counted, since a mark is charged to the base in front of it rather than to itself.
 *
 * @see segmentedWidth
 * @see classifyCode
 *
 * @since 2.0.0
 */

function plainWidth(text: string, from: number, to: number): number {
    let width = 0;

    for (let index = from; index < to; index++) {
        const code = text.charCodeAt(index);

        if (code < 0xad) {
            width++;
            continue;
        }

        const info = classifyCode(code);
        if (info & ClusterFlag) return segmentedWidth(text, from, to);
        width += (info & WidthMask) - 1;
    }

    return width;
}

/**
 * Splits text into grapheme clusters.
 *
 * @param text - The text to split
 * @returns A generator that yields each cluster in source order
 *
 * @remarks
 * A grapheme cluster is what a reader sees as one character, which is often several code points:
 * a base letter and its combining marks, an emoji and its skin tone modifier,
 * or a family sequence held together by zero width joiners.
 * Iterating a string with `for ... of` walks code points instead and would split all three apart.
 *
 * Segmentation runs in the default locale, and the generator yields lazily,
 * so a caller that stops early never segments the rest of the string.
 *
 * @example
 * ```ts
 * const clusters = [ ...clustersOf('a👍🏽b') ];  // [ 'a', '👍🏽', 'b' ]
 * const accented = [ ...clustersOf('é') ]; // [ 'é' ] - one cluster, two code points
 * ```
 *
 * @see graphemeWidth
 * @since 2.0.0
 */

export function* clustersOf(text: string): Generator<string> {
    for (const { segment } of graphemeSegmenter().segment(text)) yield segment;
}

/**
 * Measures how many terminal columns a single grapheme cluster occupies.
 *
 * @param cluster - One grapheme cluster, as {@link clustersOf} yields it
 * @returns `0` for a cluster that draws nothing of its own, `2` for a wide cluster, `1` otherwise
 *
 * @remarks
 * A cluster holding one character below U+00AD is answered from its code alone.
 * That range carries no mark, no format character, and nothing wide,
 * and U+00AD is the first code point any of the tests below can match,
 * so ASCII text never reaches a pattern.
 *
 * The two variation selectors are read next, because each one overrides the default presentation
 * of the character in front of it:
 *
 * - **U+FE0F** asks for emoji presentation, which a terminal draws across two columns.
 * - **U+FE0E** asks for text presentation, which stays inside one column.
 *
 * One pass finds both, and the emoji request wins wherever the two appear together.
 *
 * What is left is settled by the first code point of the cluster, which is the one a base carries its marks on.
 * A cluster opening inside the basic multilingual plane is classified through the shared table,
 * so a repeated character costs an array index.
 * A cluster opening on an astral code point is read by {@link ZeroWidthCluster} and {@link WideCluster} instead,
 * and both patterns are anchored, so they answer for that first code point alone.
 *
 * @example
 * ```ts
 * graphemeWidth('a');        // 1
 * graphemeWidth('世');       // 2 - a fullwidth CJK ideograph
 * graphemeWidth('́');   // 0 - a combining acute accent
 * graphemeWidth('❤️'); // 2 - emoji presentation
 * graphemeWidth('❤︎'); // 1 - text presentation
 * ```
 *
 * @see clustersOf
 * @see WideCluster
 * @see ZeroWidthCluster
 *
 * @since 2.0.0
 */

export function graphemeWidth(cluster: string): 0 | 1 | 2 {
    const length = cluster.length;
    if (length === 1) {
        const code = cluster.charCodeAt(0);

        return code < 0xad ? 1 : <0 | 1 | 2> ((classifyCode(code) & WidthMask) - 1);
    }

    let presentation = 0;
    for (let index = 0; index < length; index++) {
        const code = cluster.charCodeAt(index);
        if (code === 0xfe0f) return 2;
        if (code === 0xfe0e) presentation = 1;
    }

    if (presentation === 1) return 1;

    const first = cluster.charCodeAt(0);
    if (first < 0xad) return 1;
    if (first < 0xd800 || first > 0xdbff) return <0 | 1 | 2> ((classifyCode(first) & WidthMask) - 1);
    if (ZeroWidthCluster.test(cluster)) return 0;

    return WideCluster.test(cluster) ? 2 : 1;
}

/**
 * Measures how many terminal columns a string occupies.
 *
 * @param text - The text to measure, which may carry escape sequences
 * @returns The number of columns the text draws
 *
 * @remarks
 * This is the width a terminal renders, not the length of the string,
 * and the two differ as soon as color, wide characters, or combining marks are involved.
 *
 * Text that is printable ASCII throughout is answered by its length.
 * Anything else is walked once, stepping from one escape byte to the next with `String.indexOf`
 * and leaving the plain runs between them for {@link plainWidth} to measure in place.
 * A sequence colors or moves without drawing, so the columns it covers are never counted,
 * and no part of the text is ever cut out into an array of tokens.
 *
 * An escape byte that opens no complete sequence draws nothing itself,
 * and the characters behind it are measured as the text they are.
 *
 * @example
 * ```ts
 * stringWidth('hello');                // 5
 * stringWidth('\x1b[31mred\x1b[39m');  // 3 - the color escapes draw nothing
 * stringWidth('世界');                  // 4 - two wide characters
 * stringWidth('👨‍👩‍👧');                   // 2 - one cluster joined by zero width joiners
 * ```
 *
 * @see plainWidth
 * @see sequenceEnd
 * @see graphemeWidth
 *
 * @since 2.0.0
 */

export function stringWidth(text: string): number {
    if (PrintableAscii.test(text)) return text.length;

    const length = text.length;
    let width = 0;
    let cursor = 0;
    let escape = text.indexOf(ESC);

    while (escape >= 0) {
        width += plainWidth(text, cursor, escape);

        const finish = sequenceEnd(text, escape);
        cursor = finish > escape ? finish : escape + 1;
        escape = text.indexOf(ESC, cursor);
    }

    return width + plainWidth(text, cursor, length);
}

/**
 * Slices a string by terminal column while keeping its escape sequences.
 *
 * @param text - The text to slice
 * @param start - The first column to keep, defaulting to 0
 * @param end - The column to stop before, defaulting to `Infinity`
 * @returns The slice, carrying every escape sequence of the original
 *
 * @remarks
 * Columns are counted rather than characters, so a wide character advances the position by two
 * and a combining mark advances it by none.
 *
 * Every escape token passes through wherever it sits, including the ones outside the requested range.
 * That is what keeps the result correct: the style in effect at the cut still applies to the text that
 * survives, and the closing reset is never dropped along with the tail.
 *
 * A cluster is kept only when it fits entirely inside the range.
 * A wide character straddling either edge becomes a single space, which holds the column it's half would
 * have occupied, so the slice keeps the width the caller asked for.
 *
 * Text that is printable ASCII throughout is one column per character,
 * so the window is a plain substring and the walk below is skipped.
 * Anything else is walked once with `String.indexOf`, the same single pass {@link stringWidth} makes.
 * A run holding no cluster is cut by code unit, and each stretch of characters below U+00AD inside it is
 * copied out in one piece rather than one character at a time.
 *
 * @example
 * ```ts
 * sliceAnsi('hello world', 0, 5);   // 'hello'
 * sliceAnsi('世界', 0, 1);          // ' ' - the wide character cannot be halved
 * sliceAnsi('世界', 1, 4);          // ' 界'
 * ```
 *
 * @see isClustered
 * @see stringWidth
 * @see sequenceEnd
 * @see graphemeWidth
 *
 * @since 2.0.0
 */

export function sliceAnsi(text: string, start: number = 0, end: number = Infinity): string {
    const length = text.length;
    if (PrintableAscii.test(text)) return text.slice(Math.max(start, 0), Math.min(end, length));

    let output = '';
    let column = 0;
    let cursor = 0;

    while (cursor < length) {
        const escape = text.indexOf(ESC, cursor);
        const stop = escape < 0 ? length : escape;

        if (isClustered(text, cursor, stop)) {
            for (const cluster of clustersOf(text.slice(cursor, stop))) {
                const width = graphemeWidth(cluster);

                if (column >= start && column + width <= end) output += cluster;
                else if (width > 0 && column < end && column + width > start) output += ' ';

                column += width;
            }
        } else {
            let index = cursor;

            while (index < stop) {
                const code = text.charCodeAt(index);

                if (code < 0xad) {
                    let run = index;
                    while (run < stop && text.charCodeAt(run) < 0xad) run++;

                    const from = Math.max(start, column);
                    const to = Math.min(end, column + run - index);

                    if (to > from) output += text.slice(index + from - column, index + to - column);

                    column += run - index;
                    index = run;
                    continue;
                }

                const width = (classifyCode(code) & WidthMask) - 1;

                if (column >= start && column + width <= end) output += text.charAt(index);
                else if (width > 0 && column < end && column + width > start) output += ' ';

                column += width;
                index++;
            }
        }

        if (escape < 0) break;

        const finish = sequenceEnd(text, escape);

        if (finish > escape) {
            output += text.slice(escape, finish);
            cursor = finish;
        } else {
            output += ESC;
            cursor = escape + 1;
        }
    }

    return output;
}

/**
 * Shortens text to a column width and marks the cut with an ellipsis.
 *
 * @param text - The text to shorten
 * @param width - The number of columns the result may occupy
 * @param ellipsis - The marker that replaces what is cut, defaulting to `'...'`
 * @returns The text unchanged when it already fits, otherwise the shortened text
 *
 * @remarks
 * The marker is measured with {@link stringWidth} and counted against the limit,
 * so the result never grows past the width the caller asked for.
 *
 * A marker as wide as the limit leaves no room for any text, and there is nothing left to signal,
 * so the text is sliced to the full width and the marker is left off.
 *
 * @example
 * ```ts
 * truncate('hello world', 8);      // 'hello...'
 * truncate('hello', 8);            // 'hello' - already inside the width
 * truncate('hello world', 8, '…'); // 'hello w...'
 * truncate('hello world', 2);      // 'he' - no room for the marker
 * ```
 *
 * @see sliceAnsi
 * @see stringWidth
 *
 * @since 2.0.0
 */

export function truncate(text: string, width: number, ellipsis: string = '...'): string {
    if (stringWidth(text) <= width) return text;

    const room = width - stringWidth(ellipsis);
    if (room <= 0) return sliceAnsi(text, 0, width);

    return sliceAnsi(text, 0, room) + ellipsis;
}

/**
 * Wraps text into lines that each fit a column width.
 *
 * @param text - The text to wrap
 * @param width - The number of columns a line may occupy
 * @returns The wrapped lines, in order
 *
 * @remarks
 * A newline in the input is a paragraph break.
 * Each paragraph wraps on its own and always contributes at least one entry,
 * so an empty line in the input stays an empty line in the output.
 *
 * Words break on a single space, and a word moves to the next line when the space before it and the word
 * itself no longer fit.
 * Width is measured with {@link stringWidth}, so an escape sequence inside a word costs no columns and the
 * styling rides along with the text.
 *
 * A word wider than the whole limit cannot move anywhere, so it is cut into pieces of exactly the width,
 * and its last piece opens the line that the following words join.
 * A width below 1 leaves no room to wrap into, so the text comes back as a single entry.
 *
 * @example
 * ```ts
 * wrapText('the quick brown fox', 10); // [ 'the quick', 'brown fox' ]
 * wrapText('abcdefghij klm', 4);       // [ 'abcd', 'efgh', 'ij', 'klm' ]
 * wrapText('one two\nthree', 7);       // [ 'one two', 'three' ]
 * wrapText('abc', 0);                  // [ 'abc' ]
 * ```
 *
 * @see truncate
 * @see sliceAnsi
 * @see stringWidth
 *
 * @since 2.0.0
 */

export function wrapText(text: string, width: number): Array<string> {
    if (width < 1) return [ text ];

    const output: Array<string> = [];
    for (const paragraph of text.split('\n')) {
        let line = '';
        let used = 0;

        for (const word of paragraph.split(' ')) {
            const size = stringWidth(word);

            if (used > 0 && used + 1 + size > width) {
                output.push(line);
                line = '';
                used = 0;
            }

            if (size > width) {
                for (let cut = 0; cut < size; cut += width) {
                    if (cut + width < size) output.push(sliceAnsi(word, cut, cut + width));
                    else {
                        line = sliceAnsi(word, cut, size);
                        used = size - cut;
                    }
                }

                continue;
            }

            if (used > 0) {
                line += ' ' + word;
                used += size + 1;
            } else {
                line += word;
                used = size;
            }
        }

        output.push(line);
    }

    return output;
}

/**
 * Removes every escape sequence from text and leaves the characters they styled.
 *
 * @param text - The text to strip
 * @returns The text with every sequence removed
 *
 * @remarks
 * This is the counterpart to {@link sliceAnsi}, which cuts by column and carries the styling through.
 * Reach for this one where the styling itself has to go, such as a log file, a stored value,
 * or a test that asserts on plain text.
 *
 * Text holding no escape byte carries no sequence to remove, so it comes back as it stands.
 *
 * Only the sequences go.
 * A wide character, a combining mark, and every other character the terminal draws all survive,
 * so the result still needs {@link stringWidth} rather than its own length to measure.
 *
 * @example
 * ```ts
 * stripAnsi('\x1b[31mred\x1b[39m'); // 'red'
 * stripAnsi('\x1b]0;title\x07ok');  // 'ok'
 * stripAnsi('hello');               // 'hello'
 * ```
 *
 * @see AnsiSequence
 * @since 2.0.0
 */

export function stripAnsi(text: string): string {
    if (!text.includes(ESC)) return text;

    return text.replace(AnsiSequence, '');
}

/**
 * Pads text with spaces until it fills a column width.
 *
 * @param text - The text to pad, which may carry escape sequences
 * @param width - The number of columns the result should fill
 * @param align - Where the padding goes, defaulting to `'left'`
 * @returns The padded text, or the text unchanged when it already fills the width
 *
 * @remarks
 * The gap is measured with {@link stringWidth} rather than with the length of the string.
 * An escape sequence therefore costs no columns, a wide character costs two,
 * and a padded column lands in the same place on screen for every row.
 *
 * `'left'` puts the padding after the text, `'right'` puts it before,
 * and `'both'` splits the gap between the two sides.
 * An odd gap cannot split evenly, so `'both'` gives the extra column to the right side.
 *
 * Text already at or past the width comes back untouched, so this never shortens anything.
 * Reach for {@link truncate} where a hard limit matters.
 *
 * This appends plain spaces outside the text, so a style that the text leaves open carries into them.
 * Close a background with a reset before padding where that matters.
 *
 * @example
 * ```ts
 * padText('ab', 5);          // 'ab   '
 * padText('ab', 5, 'right'); // '   ab'
 * padText('ab', 7, 'both');  // '  ab   ' - the odd column goes to the right
 * padText('世', 5);          // '世   ' - the wide character counts as two columns
 * padText('hello', 3);       // 'hello' - already past the width
 * ```
 *
 * @see truncate
 * @see stringWidth
 *
 * @since 2.0.0
 */

export function padText(text: string, width: number, align: 'left' | 'right' | 'both' = 'left'): string {
    const space = width - stringWidth(text);
    if (space <= 0) return text;

    if (align === 'right') return ' '.repeat(space) + text;
    if (align === 'left') return text + ' '.repeat(space);

    const before = space >> 1;

    return ' '.repeat(before) + text + ' '.repeat(space - before);
}
