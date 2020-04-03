export class ConfigChanged {
    static readonly type = '[Gm Process Outport Details] Config Changed';
    constructor(public readonly payload: {
        graphModelId: string,
        processOutportId: string;
        config: any; // TODO: type this
    }) { }
}
