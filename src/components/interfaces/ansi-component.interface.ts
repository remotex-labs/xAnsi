/**
 * Type-only imports erased during TypeScript compilation.
 */

import type { DeviceFeature, TerminalClass } from '@constants/ansi.constant';


export interface CursorPositionInterface {
    row: number;
    column: number;
}

export interface TerminalSizeInterface {
    rows: number;
    columns: number;
}

export interface PixelSizeInterface {
    width: number;
    height: number;
}

export interface DeviceAttributesInterface {
    terminal: TerminalClass;
    features: Set<DeviceFeature>;
}

export interface ColorInterface {
    red: number;
    blue: number;
    green: number;
}

export type RequestAttentionType = 'yes' | 'once' | 'no' | 'fireworks';
