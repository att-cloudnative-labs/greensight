export class VariableLabelChanged {
    static readonly type = '[Gm Variable Reference] Variable Label Changed';
    constructor(public readonly payload: {
        graphModelId: string,
        variableId: any;
        label: string;
    }) { }
}

