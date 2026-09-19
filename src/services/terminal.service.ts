/**
 * Type-only imports erased during TypeScript compilation.
 */

import type { KeyInterface, SizeInterface, TerminalOptionsInterface } from '@services/interfaces/terminal-service.interface';

/**
 * Imports
 */

import { Subject } from '@remotex-labs/xobservable';
import { moveCursor } from '@services/ansi.service';
import { sliceAnsi, stringWidth } from '@components/text.component';
import {
    ClearLine,
    ClearView,
    CSI,
    CursorNextLine,
    EnterAltScreen,
    ExitAltScreen,
    HideCursor,
    Reset,
    ShowCursor,
    SyncUpdateEnd,
    SyncUpdateStart
} from '@constants/ansi.constant';

/**
 * Mouse reporting, in the SGR encoding every current terminal understands.
 */

const EnableMouse = CSI + '?1000h' + CSI + '?1006h';
const DisableMouse = CSI + '?1006l' + CSI + '?1000l';

/**
 * The sequences that carry no printable character of their own.
 */

const Keys: Record<string, string> = {
    '\r': 'enter',
    '\n': 'enter',
    '\t': 'tab',
    ' ': 'space',
    '\x7f': 'backspace',
    '\x1b': 'escape',
    [CSI + 'A']: 'up',
    [CSI + 'B']: 'down',
    [CSI + 'C']: 'right',
    [CSI + 'D']: 'left',
    [CSI + 'H']: 'home',
    [CSI + 'F']: 'end',
    [CSI + '1~']: 'home',
    [CSI + '4~']: 'end',
    [CSI + '3~']: 'delete',
    [CSI + '5~']: 'pageUp',
    [CSI + '6~']: 'pageDown',
    [CSI + 'Z']: 'shiftTab'
};

export class Terminal {
    readonly key$ = new Subject<KeyInterface>();
    readonly resize$ = new Subject<SizeInterface>();

    rows: Array<string> = [];
    topRows: Array<string> = [];
    bottomRows: Array<string> = [];
    autoScroll: boolean;

    private offset = 0;
    private frame: Array<string> = [];
    private dirty = true;
    private queued = false;
    private opened = false;
    private disposed = false;
    private resizeTimer?: ReturnType<typeof setTimeout>;

    private readonly mouse: boolean;
    private readonly alternate: boolean;
    private readonly exitOnCtrlC: boolean;
    private readonly input: NodeJS.ReadStream;
    private readonly output: NodeJS.WriteStream;
    private readonly raw: (data: string) => void;
    private readonly hooks: Array<[ NodeJS.WriteStream, NodeJS.WriteStream['write'] ]> = [];

    constructor(options: TerminalOptionsInterface = {}) {
        const error = options.error ?? process.stderr;

        this.input = options.input ?? process.stdin;
        this.output = options.output ?? process.stdout;
        this.mouse = options.mouse ?? false;
        this.autoScroll = options.autoScroll ?? true;
        this.alternate = options.alternateScreen ?? true;
        this.exitOnCtrlC = options.exitOnCtrlC ?? true;
        this.raw = this.output.write.bind(this.output);

        this.raw((this.alternate ? EnterAltScreen : '') + HideCursor + (this.mouse ? EnableMouse : ''));
        this.output.on('resize', this.onResize);
        process.on('exit', this.onExit);

        if (options.capture ?? true) {
            this.hook(this.output);
            if (error !== this.output) this.hook(error);
        }

        if (this.input.isTTY) {
            this.input.setRawMode(true);
            this.input.resume();
            this.input.on('data', this.onData);
        }
    }

    get width(): number {
        return this.output.columns || 80;
    }

    get height(): number {
        return this.output.rows || 24;
    }

    get bodyHeight(): number {
        const bottom = Math.min(this.bottomRows.length, this.height);

        return this.height - bottom - Math.min(this.topRows.length, this.height - bottom);
    }

    get maxScroll(): number {
        return Math.max(0, this.rows.length - this.bodyHeight);
    }

    get isResizing(): boolean {
        return this.resizeTimer !== undefined;
    }

    get scroll(): number {
        return Math.min(this.offset, this.maxScroll);
    }

    set scroll(value: number) {
        this.offset = Math.max(0, Math.min(value, this.maxScroll));
    }

    scrollBy(rows: number): void {
        this.scroll = this.scroll + rows;
    }

    scrollToTop(): void {
        this.offset = 0;
    }

    scrollToBottom(): void {
        this.offset = this.maxScroll;
    }

    writeRow(index: number, text: string): void {
        while (this.rows.length < index) this.rows.push('');
        this.rows[index] = text;
        this.opened = false;
    }

    print(text: string): void {
        const parts = String(text).split('\n');
        if (parts[parts.length - 1] === '') parts.pop();

        for (let index = 0; index < parts.length; index++) {
            if (index === 0 && this.opened && this.rows.length) this.rows[this.rows.length - 1] += parts[0];
            else this.rows.push(parts[index]);
        }

        this.opened = !text.endsWith('\n');
        if (this.autoScroll) this.scrollToBottom();
        this.queue();
    }

    clear(): void {
        this.rows = [];
        this.offset = 0;
        this.opened = false;
    }

    render(): void {
        if (this.disposed) return;

        const width = this.width;
        const height = this.height;
        const bottom = Math.min(this.bottomRows.length, height);
        const top = Math.min(this.topRows.length, height - bottom);
        const body = height - top - bottom;
        const start = this.scroll;

        let output = '';
        let cursor = -1;

        if (this.dirty) {
            this.dirty = false;
            this.frame = new Array(height).fill('');
            output = ClearView;
        }

        for (let index = 0; index < height; index++) {
            const source = index < top
                ? this.topRows[index]
                : index < top + body ? this.rows[start + index - top] : this.bottomRows[index - top - body];

            const line = this.fit(source ?? '', width);
            if (this.frame[index] === line) continue;

            output += (index === cursor ? CursorNextLine : moveCursor(index + 1, 1)) + line + ClearLine;
            this.frame[index] = line;
            cursor = index + 1;
        }

        if (output) this.raw(SyncUpdateStart + output + SyncUpdateEnd);
    }

    dispose(): void {
        if (this.disposed) return;
        this.disposed = true;
        clearTimeout(this.resizeTimer);

        for (const [ stream, write ] of this.hooks) stream.write = write;
        this.hooks.length = 0;
        this.output.off('resize', this.onResize);
        process.off('exit', this.onExit);

        if (this.input.isTTY) {
            this.input.off('data', this.onData);
            this.input.setRawMode(false);
            this.input.pause();
        }

        this.raw((this.mouse ? DisableMouse : '') + ShowCursor + (this.alternate ? ExitAltScreen : moveCursor(this.height, 1) + '\n'));
        this.key$.complete();
        this.resize$.complete();
    }

    [Symbol.dispose](): void {
        this.dispose();
    }

    private fit(line: string, width: number): string {
        if (line.length <= width) return line;

        return stringWidth(line) > width ? sliceAnsi(line, 0, width) + Reset : line;
    }

    private queue(): void {
        if (this.queued || this.disposed) return;
        this.queued = true;
        setImmediate(() => {
            this.queued = false;
            this.render();
        });
    }

    private hook(stream: NodeJS.WriteStream): void {
        this.hooks.push([ stream, stream.write ]);
        stream.write = ((chunk: string | Uint8Array, encoding?: unknown, callback?: unknown): boolean => {
            this.print(typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf8'));
            const done = typeof encoding === 'function' ? encoding : callback;
            if (typeof done === 'function') done();

            return true;
        }) as NodeJS.WriteStream['write'];
    }

    private parse(sequence: string): KeyInterface {
        if (sequence.startsWith(CSI + '<')) {
            const mouse = /^\x1b\[<(\d+);(\d+);(\d+)[Mm]$/.exec(sequence);

            if (mouse) return {
                name: mouse[1] === '64' ? 'wheelUp' : mouse[1] === '65' ? 'wheelDown' : 'mouse',
                ctrl: false,
                sequence,
                column: Number(mouse[2]),
                row: Number(mouse[3])
            };
        }

        const named = Keys[sequence];
        if (named) return { name: named, ctrl: false, sequence };

        const code = sequence.charCodeAt(0);
        if (sequence.length === 1 && code < 27) return { name: String.fromCharCode(code + 96), ctrl: true, sequence };

        return { name: sequence, ctrl: false, sequence };
    }

    private readonly onExit = (): void => {
        this.dispose();
    };

    private readonly onData = (chunk: Buffer): void => {
        const sequence = chunk.toString('utf8');
        if (sequence === '\x03' && this.exitOnCtrlC) {
            this.dispose();
            process.exit(0);
        }

        this.key$.next(this.parse(sequence));
    };

    private readonly onResize = (): void => {
        this.dirty = true;
        clearTimeout(this.resizeTimer);
        this.resizeTimer = setTimeout(() => {
            this.resizeTimer = undefined;
            this.render();
        }, 80);

        this.resize$.next({ width: this.width, height: this.height });
        this.queue();
    };
}
