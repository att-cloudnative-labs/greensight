import { GraphParam, ParamType } from '@cpt/capacity-planning-simulation-types';

export class ParamTypeChanged {
    static readonly type = '[Gm Process Inport Details] Param Type Changed';
    constructor(public readonly payload: {
        graphModelId: string,
        processInportId: string;
        paramType?: ParamType;
        defaultParam?: GraphParam;
    }) { }
}

export class ParamValueChanged {
    static readonly type = '[Gm Process Inport Details] Param Value Changed';
    constructor(public readonly payload: {
        graphModelId: string,
        processInportId: string;
        paramValue: any;
    }) { }
}

export class DefaultParamChanged {
    static readonly type = '[Gm Process Inport Details] Default Param Changed';
    constructor(public readonly payload: {
        graphModelId: string,
        processInportId: string;
        paramType?: ParamType;
        defaultParam?: GraphParam;
        defaultSelected?: boolean;
    }) { }
}
