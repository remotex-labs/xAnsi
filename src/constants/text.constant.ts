/**
 * The pattern that matches a string made entirely of printable ASCII.
 *
 * @remarks
 * The class runs from the space at `\x20` to the tilde at `\x7e`, so it spans every ASCII character that draws
 * something.
 * The control characters, the delete byte, and everything above them fall outside it.
 *
 * The pattern anchors both ends, so the test asks about the whole string rather than about a part of it.
 * The quantifier is `*`, so an empty string passes.
 *
 * This is the fast path for measuring and for slicing.
 * A printable ASCII character occupies exactly one column,
 * so the length of a matching string is already its width, and a column of it is already an index into it.
 *
 * @example
 * ```ts
 * PrintableAscii.test('hello world'); // true
 * PrintableAscii.test('café');        // false - the accented letter sits above 0x7e
 * PrintableAscii.test('a\tb');        // false - a tab is a control character
 * ```
 *
 * @see sliceAnsi
 * @see stringWidth
 *
 * @since 2.0.0
 */

export const PrintableAscii = /^[\x20-\x7e]*$/;

/**
 * The pattern that recognizes a grapheme cluster with no column of its own.
 *
 * @remarks
 * The three classes are the ones that attach to a neighbor rather than stand on their own:
 *
 * - `\p{Mn}` is a non-spacing mark, such as a combining accent.
 * - `\p{Me}` is an enclosing mark, which draws around the character in front of it.
 * - `\p{Cf}` is a format character, such as a zero width joiner or a bidirectional control.
 *
 * Only the start is anchored, so the test reads the first code point of a cluster and ignores the rest.
 * A cluster that opens with one of these carries no base character of its own, so it measures 0.
 *
 * The class leaves out `\p{Mc}`, the spacing combining marks, so a cluster that opens with one measures as
 * ordinary text.
 *
 * Measuring tests this against one character at a time and remembers the answer,
 * so a code point costs the pattern once however often the text repeats it.
 *
 * @example
 * ```ts
 * ZeroWidthCluster.test('\u0301');  // true - a combining acute accent
 * ZeroWidthCluster.test('\u200d');  // true - a zero width joiner
 * ZeroWidthCluster.test('e\u0301'); // false - the cluster opens with its base letter
 * ZeroWidthCluster.test('a');       // false
 * ```
 *
 * @see graphemeWidth
 * @since 2.0.0
 */

export const ZeroWidthCluster = /^[\p{Mn}\p{Me}\p{Cf}]/u;

/**
 * The pattern that recognizes a grapheme cluster two columns wide.
 *
 * @remarks
 * Only the start is anchored, so the test reads the first code point of a cluster.
 * One character class covers three groups:
 *
 * - **The BMP ranges** - Hangul Jamo and Hangul syllables, Kana, the CJK radicals and ideographs, their
 *   compatibility forms, Yi, the vertical and small form variants, and the fullwidth forms.
 * - **The astral ranges** - U+16FE0 to U+18AFF for Tangut and Nushu, U+1B000 to U+1B2FF for the Kana
 *   supplements, and U+20000 to U+3FFFD for the CJK extensions past the basic block.
 * - **`\p{Emoji_Presentation}`** - the code points that a terminal draws as an emoji by default.
 *
 * A character that can render as an emoji but defaults to text, such as U+2764, stays outside this set and
 * measures one column until U+FE0F asks for the other presentation.
 *
 * The three groups sit inside one class rather than in an alternation, and they have to stay there.
 * A property escape written outside a class makes esbuild rewrite the whole literal as a `new RegExp` call
 * whenever the target names a Node version,
 * and no bundler drops a call it cannot prove pure, so the pattern would reach every consumer that imports
 * anything at all from this module.
 *
 * @example
 * ```ts
 * WideCluster.test('世'); // true - a CJK ideograph
 * WideCluster.test('가'); // true - a Hangul syllable
 * WideCluster.test('👍'); // true - default emoji presentation
 * WideCluster.test('Ａ'); // true - a fullwidth letter
 * WideCluster.test('❤'); // false - it can render as an emoji, but it defaults to text
 * ```
 *
 * @see graphemeWidth
 * @see ZeroWidthCluster
 *
 * @since 2.0.0
 */

export const WideCluster = /^[ᄀ-ᅟ⺀-〾ぁ-㏿㐀-䶿一-鿿ꀀ-꓏ꥠ-꥿가-힣豈-﫿︐-︙︰-﹯＀-｠￠-￦\u{16fe0}-\u{18aff}\u{1b000}-\u{1b2ff}\u{20000}-\u{3fffd}\p{Emoji_Presentation}]/u;

/**
 * The pattern that isolates a whole escape sequence from the surrounding text.
 *
 * @remarks
 * The outer group captures, so `String.split` keeps the sequences instead of dropping them.
 * The result alternates between plain text and the sequences that separated it,
 * and an entry opening with `\x1b` is a sequence, which is how a caller tells the two apart in one pass.
 *
 * Three alternatives follow the escape byte:
 *
 * - **CSI** - `[`, then parameter bytes in `0x30` to `0x3f`, intermediate bytes in `0x20` to `0x2f`,
 *   and one final byte in `0x40` to `0x7e` that names the command.
 * - **OSC** - `]`, then a run holding neither a BEL nor an escape, closed by a BEL or by an escape and a
 *   backslash.
 * - **A two-byte escape** - one byte in `@` to `Z` or `\` to `_`, which covers the Fe sequences that carry no
 *   parameters.
 *
 * The `[` that opens CSI falls in the gap between `Z` and `\`, so it never matches as a two-byte escape.
 * The `]` that opens OSC does fall in that class, so the OSC alternative is listed first and a title sequence
 * is never cut down to its opening two bytes.
 *
 * @example
 * ```ts
 * '\x1b[31mred\x1b[39m'.split(AnsiToken); // [ '', '\x1b[31m', 'red', '\x1b[39m', '' ]
 * '\x1b]0;title\x07ok'.split(AnsiToken);  // [ '', '\x1b]0;title\x07', 'ok' ]
 * 'hello'.split(AnsiToken);               // [ 'hello' ]
 * ```
 *
 * @see sliceAnsi
 * @see stringWidth
 *
 * @since 2.0.0
 */

export const AnsiToken = /(\x1b(?:\[[\x30-\x3f]*[\x20-\x2f]*[\x40-\x7e]|\][^\x07\x1b]*(?:\x07|\x1b\\)|[@-Z\\-_]))/;

/**
 * The pattern that tells whether text needs grapheme segmentation.
 *
 * @remarks
 * Nothing is anchored, so the test searches the whole string and stops at the first hit:
 *
 * - `\p{M}` is any mark, spacing or not, and it always belongs to the character in front of it.
 * - `\p{Cf}` is a format character, which joins or reorders the surrounding characters.
 * - U+10000 and above is an astral code point, which no single UTF-16 code unit can hold.
 *
 * When none of the three is present, one code point is one cluster,
 * and a caller can walk the string by code unit rather than pay for an `Intl.Segmenter` pass.
 * Measuring asks this of one character at a time and remembers the answer,
 * so the question is settled for a whole run by reading the characters of the run rather than by cutting it out.
 *
 * The mark side of this class is wider than {@link ZeroWidthCluster}, which names only the marks that draw
 * nothing.
 * A wide character is not in the class at all, so text such as `'世界'` still takes the cheaper code point path.
 *
 * @example
 * ```ts
 * ClusteredText.test('hello');   // false - one code point is one cluster
 * ClusteredText.test('世界');      // false - wide, but still one code point each
 * ClusteredText.test('café');    // false - the accented letter is precomposed
 * ClusteredText.test('e\u0301'); // true - a base letter and a combining mark
 * ClusteredText.test('👍');       // true - an astral code point
 * ```
 *
 * @see sliceAnsi
 * @see stringWidth
 *
 * @since 2.0.0
 */

export const ClusteredText = /[\p{M}\p{Cf}\u{10000}-\u{10FFFF}]/u;

/**
 * The pattern that matches every escape sequence in a string.
 *
 * @remarks
 * The body is the pattern {@link AnsiToken} carries, without the capturing group and with the `g` flag,
 * so the two differ only in what a caller does with a match.
 * {@link AnsiToken} partitions text through `String.split`, which hands back an array holding the sequences
 * alongside the text they separated.
 * This one sweeps every sequence out at once through `String.replace`, which resets `lastIndex` itself,
 * so a sweep is safe to repeat.
 *
 * The `g` flag keeps a `lastIndex` between calls, so a caller driving `test` or `exec` by hand sets the index
 * to 0 before the first call.
 * Measuring and slicing read this grammar one byte at a time instead,
 * since that walk wants the index a sequence ends at rather than a match object.
 *
 * @example
 * ```ts
 * '\x1b[31mred\x1b[39m'.replace(AnsiSequence, ''); // 'red'
 * '\x1b]0;title\x07ok'.replace(AnsiSequence, '');  // 'ok'
 * ```
 *
 * @see AnsiToken
 * @see stripAnsi
 *
 * @since 2.0.0
 */

export const AnsiSequence = /\x1b(?:\[[\x30-\x3f]*[\x20-\x2f]*[\x40-\x7e]|\][^\x07\x1b]*(?:\x07|\x1b\\)|[@-Z\\-_])/g;

/**
 * The bits of a classification byte that carry the width of a code unit.
 *
 * @remarks
 * The width is stored with one added to it, so a byte of 0 reads as a code unit the table has not seen yet.
 * A stored 1 is a width of 0, a stored 2 is a width of 1, and a stored 3 is a width of 2.
 *
 * @see classifyCode
 * @since 2.0.0
 */

export const WidthMask = 0b011;

/**
 * The bit of a classification byte that marks a code unit segmentation has to see.
 *
 * @remarks
 * The bit stands for the same question {@link ClusteredText} asks, held per code unit rather than per string.
 * A run carrying none of these code units holds one cluster per code unit,
 * so measuring it never reaches an `Intl.Segmenter`.
 *
 * @see classifyCode
 * @see ClusteredText
 *
 * @since 2.0.0
 */

export const ClusterFlag = 0b100;
