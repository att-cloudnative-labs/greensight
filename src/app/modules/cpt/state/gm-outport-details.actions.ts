export class NameChanged {
    static readonly type = '[Gm Outport Details] Name Changed';
    constructor(public readonly payload: {
        graphModelId: string,
        outportId: any;
        name: string;
    }) { }
}

