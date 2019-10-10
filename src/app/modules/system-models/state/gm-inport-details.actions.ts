import { ParamType } from '@system-models/interfaces/graph.interface'; // TODO: load this from the above import once library updated

export class RequiredTypeOptionToggled {
    static readonly type = '[Gm Inport Details] Required Types Option Toggled';
    constructor(public readonly payload: {
        graphModelId: string,
        inportId: any;
        requiredType: string;
        checked: boolean;
    }) { }
}

export class NameChanged {
    static readonly type = '[Gm Inport Details] Name Changed';
    constructor(public readonly payload: {
        graphModelId: string,
        inportId: any;
        name: string;
    }) { }
}

export class DefaultParamValueChanged {
    static readonly type = '[Gm Inport Details] Default Value Changed';
    constructor(public readonly payload: {
        graphModelId: string,
        inportId: any;
        defaultValue: any;
    }) { }
}

export class DefaultParamTypeChanged {
    static readonly type = '[Gm Inport Details] Default Type Changed';
    constructor(public readonly payload: {
        graphModelId: string,
        inportId: any;
        defaultType: ParamType;
    }) { }
}
