export class AddBroadcastVariableClicked {
    static readonly type = '[Gm Variable Picker] Add Broadcast Variable';
    constructor(public readonly payload: {
        graphModelId: string,
        originPortId: string,
        x: number,
        y: number,
    }) { }
}

export class LinkToVariableClicked {
    static readonly type = '[Gm Variable Picker] Link to Variable';
    constructor(public readonly payload: {
        graphModelId: string,
        originPortId: string,
        originPortType: string,
        variableId: string,
        x: number,
        y: number,
    }) { }
}

export class AddNamedVariableClicked {
    static readonly type = '[Gm Variable Picker] Add Named Variable';
    constructor(public readonly payload: {
        graphModelId: string,
        originPortId: string,
        x: number,
        y: number,
    }) { }
}


