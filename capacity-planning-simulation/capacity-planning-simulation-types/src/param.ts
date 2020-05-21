import { ResponseValue } from './object';

export type DataType = 'NUMBER' | 'STRING' | 'BOOLEAN' | 'BREAKDOWN' | 'DATE';
export type ParamType = 'NUMBER' | 'STRING' | 'BOOLEAN' | 'BREAKDOWN' | 'DATE' | 'DEFAULT';
export type ConfigType = 'NUMBER' | 'STRING' | 'BOOLEAN' | 'DATE';
export type RandomDistributionType = 'NORMAL' | 'LOGNORMAL' | 'UNIFORM' | 'BERNOULLI' | 'POISSON' | 'EXPONENTIAL' | 'ERLANG' | 'WEIBULL';


export const ALL_PARAM_TYPES = ['NUMBER', 'STRING', 'BOOLEAN', 'BREAKDOWN', 'DATE'];

export interface NumberParam {
    type: 'NUMBER',
    value: number;
    aspects?: Aspect[];
    unit?: string;
}
export interface RandomNumberParam {
    type: 'RANDOM';
    distr: RandomDistributionType;
    distrDescr: {};
    unit?: string;
    aspects?: Aspect[];
}

export interface StringParam {
    type: 'STRING';
    value: string;
}

export interface BooleanParam {
    type: 'BOOLEAN';
    value: boolean;
}

export interface Aspect {
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
}

export interface ResponseAspect {
    type: 'RESPONSE_BREAKDOWN';
    name: string;
    relative?: boolean;
    slices: {
        [label: string]: ResponseValue;
    };
}

export interface ResponseNumberParam {
    type: 'RESPONSE_NUMBER';
    value: ResponseValue;
    category: string;
    unit?: string;
    aspects?: ResponseAspect[];
}


// this is just to make sure we can easily extend ResponseParam in the future
export interface ResponseDummyParam {
    type: 'RESPONSE_DUMMY';
    category: string;
    value: any;
}
