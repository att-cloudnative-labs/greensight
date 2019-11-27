import { ProcessInterfaceDescription } from '@cpt/capacity-planning-simulation-types';

export class LoadProcessingElements {
    static readonly type = '[Processing Elements] Load Processing Elements';
}
export class LoadGraphModels {
    static readonly type = '[Processing Elements] Load Graph Models';
}

export class UpdatedGraphModel {
    static readonly type = '[Processing Elements] Updated Graph Model';
    constructor(public readonly payload: ProcessInterfaceDescription) { }
}

export class UpdatedGraphModelName {
    static readonly type = '[Processing Elements] Updated Graph Model Name';
    constructor(public readonly payload: { objectId: string, name: string }) { }
}

export class DeletedGraphModel {
    static readonly type = '[Processing Elements] Deleted Graph Model';
    constructor(public readonly payload: { objectId: string }) { }
}
