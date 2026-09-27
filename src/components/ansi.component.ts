/**
 * Type-only imports erased during TypeScript compilation.
 */

import type { CursorStyle, Mode } from '@constants/ansi.constant';
import type { ColorInterface, CursorPositionInterface } from '@components/interfaces/ansi-component.interface';
import type { PixelSizeInterface, TerminalSizeInterface } from '@components/interfaces/ansi-component.interface';
import type { DeviceAttributesInterface, RequestAttentionType } from '@components/interfaces/ansi-component.interface';

/**
 * Imports
 */

import { channel } from '@components/color.component';
import { BEL, CSI, OSC } from '@constants/ansi.constant';

export function counted(amount: number, final: string): string {
    const count = Math.trunc(amount);

    return count >= 1 ? `${ CSI }${ count }${ final }` : '';
}

export function modes(list: Array<Mode>, final: string): string {
    let sequence = '';
    for (const mode of list) sequence += `${ CSI }?${ mode }${ final }`;

    return sequence;
}

export function osc(payload: string): string {
    return `${ OSC }${ payload }${ BEL }`;
}

export function iterm(command: string): string {
    return osc(`1337;${ command }`);
}

export function tab(payload: string): string {
    return osc(`6;1;bg;${ payload }`);
}

export function base64(text: string): string {
    return Buffer.from(text, 'utf8').toString('base64');
}

export function setMark(): string {
    return iterm('SetMark');
}

export function stealFocus(): string {
    return iterm('StealFocus');
}

export function badge(text = ''): string {
    return iterm(`SetBadgeFormat=${ base64(text) }`);
}

export function requestAttention(kind: RequestAttentionType): string {
    return iterm(`RequestAttention=${ kind }`);
}

export function highlightCursorLine(enabled = true): string {
    return iterm(`HighlightCursorLine=${ enabled ? 'yes' : 'no' }`);
}

export function resetTabColor(): string {
    return tab('*;default');
}

export function tabColor({ red, green, blue }: ColorInterface): string {
    return tab(`red;brightness;${ channel(red) }`)
        + tab(`green;brightness;${ channel(green) }`)
        + tab(`blue;brightness;${ channel(blue) }`);
}

export function scrollUp(rows = 1): string {
    return counted(rows, 'S');
}

export function scrollDown(rows = 1): string {
    return counted(rows, 'T');
}

export function insertLines(rows = 1): string {
    return counted(rows, 'L');
}

export function deleteLines(rows = 1): string {
    return counted(rows, 'M');
}

export function cursorUp(rows = 1): string {
    return counted(rows, 'A');
}

export function cursorDown(rows = 1): string {
    return counted(rows, 'B');
}

export function cursorNextLine(rows = 1): string {
    return counted(rows, 'E');
}

export function cursorPrevLine(rows = 1): string {
    return counted(rows, 'F');
}

export function insertChars(columns = 1): string {
    return counted(columns, '@');
}

export function deleteChars(columns = 1): string {
    return counted(columns, 'P');
}

export function eraseChars(columns = 1): string {
    return counted(columns, 'X');
}

export function moveColumn(column: number): string {
    return `${ CSI }${ column }G`;
}

export function cursorStyle(style: CursorStyle): string {
    return `${ CSI }${ style } q`;
}

export function moveCursor(row: number, column = 1): string {
    return `${ CSI }${ row };${ column }H`;
}

export function scrollRegion(top?: number, bottom?: number): string {
    return top && bottom ? `${ CSI }${ top };${ bottom }r` : `${ CSI }r`;
}

export function setMode(...list: Array<Mode>): string {
    return modes(list, 'h');
}

export function resetMode(...list: Array<Mode>): string {
    return modes(list, 'l');
}

export function notify(message: string): string {
    return osc(`9;${ message }`);
}

export function clipboard(text: string): string {
    return osc(`52;c;${ base64(text) }`);
}

export function title(text: string, target: 0 | 1 | 2 = 0): string {
    return osc(`${ target };${ text }`);
}

export function hyperlink(text: string, url: string): string {
    return osc(`8;;${ url }`) + text + osc('8;;');
}

export const notify777 = (title: string, body: string): string =>
    `${ OSC }777;notify;${ title.replaceAll(';', '') };${ body }${ BEL }`;

export function writeTerminal(sequence: string): boolean {
    const { stdout, stderr } = process;
    const stream = stdout.isTTY ? stdout : stderr.isTTY ? stderr : null;

    if (stream) {
        stream.write(sequence);

        return true;
    }

    return false;
}

export function query(request: string, pattern: RegExp, subject: string, timeout = 200): Promise<RegExpExecArray> {
    const { stdin } = process;
    const unreachable = `The ${ subject } can only be read from a terminal`;
    if (!stdin.isTTY)
        return Promise.reject(new Error(unreachable));

    let buffer = '';
    const wasRaw = stdin.isRaw;
    const wasListening = stdin.listenerCount('data') > 0;
    const { promise, resolve, reject } = Promise.withResolvers<RegExpExecArray>();

    function settle(error: Error | null, match?: RegExpExecArray): void {
        clearTimeout(timer);
        stdin.off('data', onData);
        stdin.setRawMode(wasRaw);
        if (!wasListening) stdin.pause();
        if (buffer) stdin.unshift(Buffer.from(buffer, 'latin1'));

        if (error) reject(error);
        else resolve(<RegExpExecArray> match);
    }

    function onData(chunk: Buffer): void {
        buffer += chunk.toString('latin1');
        const match = pattern.exec(buffer);
        if (!match) return;

        buffer = buffer.slice(0, match.index) + buffer.slice(match.index + match[0].length);
        settle(null, match);
    }

    const timer = setTimeout(settle, timeout, new Error(`Timed out waiting for ${ subject } report`));

    stdin.setRawMode(true);
    stdin.resume();
    stdin.on('data', onData);
    if (!writeTerminal(request)) settle(new Error(unreachable));

    return promise;
}

export async function getCursorPosition(timeout?: number): Promise<CursorPositionInterface> {
    const report = await query(`${ CSI }6n`, /\x1b\[(\d+);(\d+)R/, 'cursor position', timeout);

    return { row: Number(report[1]), column: Number(report[2]) };
}

export async function getTerminalSize(timeout?: number): Promise<TerminalSizeInterface> {
    const report = await query(`${ CSI }18t`, /\x1b\[8;(\d+);(\d+)t/, 'terminal size', timeout);

    return { rows: Number(report[1]), columns: Number(report[2]) };
}

export async function getPixelSize(timeout?: number): Promise<PixelSizeInterface> {
    const report = await query(`${ CSI }14t`, /\x1b\[4;(\d+);(\d+)t/, 'window size', timeout);

    return { height: Number(report[1]), width: Number(report[2]) };
}

export async function getDeviceAttributes(timeout?: number): Promise<DeviceAttributesInterface> {
    const report = await query(`${ CSI }c`, /\x1b\[\?([\d;]*)c/, 'device attributes', timeout);
    const [ terminal, ...features ] = report[1].split(';').map(Number);

    return <DeviceAttributesInterface> { terminal, features: new Set(features) };
}

export async function getBackgroundColor(timeout?: number): Promise<ColorInterface> {
    function scale(digits: string): number {
        return Math.round(parseInt(digits, 16) * 255 / ((16 ** digits.length) - 1));
    }

    const pattern = /\x1b]11;rgb:([\da-f]+)\/([\da-f]+)\/([\da-f]+)(?:\x07|\x1b\\)/i;
    const report = await query(osc('11;?'), pattern, 'background color', timeout);

    return { red: scale(report[1]), green: scale(report[2]), blue: scale(report[3]) };
}

export async function isDarkBackground(timeout?: number): Promise<boolean> {
    const { red, green, blue } = await getBackgroundColor(timeout);

    return red * 299 + green * 587 + blue * 114 < 128000;
}
