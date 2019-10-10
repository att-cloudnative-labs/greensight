export class LabelChanged {
    static readonly type = '[Gm Process Details] Label Changed';
    constructor(public readonly payload: {
        graphModelId: string,
        processId: any;
        label: string;
    }) { }
}


