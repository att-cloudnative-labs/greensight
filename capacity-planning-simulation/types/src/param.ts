import { ResponseSplit, ResponseSplitEntry } from './object';

export type DataType = 'NUMBER' | 'STRING' | 'BOOLEAN' | 'BREAKDOWN' | 'TAG' | 'DATE';
export type ParamType = 'NUMBER' | 'STRING' | 'BOOLEAN' | 'BREAKDOWN' | 'TAG' | 'DATE';
export type ConfigType = 'NUMBER' | 'STRING' | 'BOOLEAN' | 'DATE';


export interface NumberParam {
    type: 'NUMBER';
    value: number;
    unit?: string;
}

export interface NormalDistNumberParam {
    type: 'NORMAL_DIST_NUMBER';
    value: number;
    stdDev: number;
    unit?: string;
}

export interface AspectNumberParam {
    type: 'ASPECT_NUMBER',
    value: number;
    aspects?: Aspect[];
    stdDev?: number;
    unit?: string;
}

export interface StringParam {
    type: 'STRING';
    value: string;
    unit?: string;
}

export interface BooleanParam {
    type: 'BOOLEAN';
    value: boolean;
    unit?: string;
}

export interface Aspect {
    type: 'BREAKDOWN' | 'TAG';
    name: string;
    relative?: boolean;
    slices: {
        [label: string]: number;
    };
}

export interface AspectParam {
    type: 'ASPECT';
    value: Aspect;
}

export interface DateParam {
    type: 'DATE';
    value: string;
    unit?: string;
}

export interface ResponseAspect {
    type: 'RESPONSE_BREAKDOWN' | 'RESPONSE_TAG';
    name: string;
    relative?: boolean;
    slices: {
        [label: string]: ResponseSplit;
    };
}

export interface ResponseNumberParam {
    type: 'RESPONSE_NUMBER';
    value: number;
    split: ResponseSplit;
    category: string;
    unit?: string;
    aspects?: ResponseAspect[];
}
