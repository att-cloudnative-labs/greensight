import { ProcessInterfaceDescription } from '@cpt/capacity-planning-simulation-types/lib';
import { TreeNodeInfo } from '@cpt/interfaces/tree-node-tracking';

export class AddCurrentPid {
    static readonly type = '[Graph Model Interfaces] Add Current';
    constructor(public readonly payload: {
        pid: ProcessInterfaceDescription
    }) { }
}

export class LoadReleasePid {
    static readonly type = '[Graph Model Interfaces] Load Release';
    constructor(public readonly payload: {
        nodeId: string, releaseNr: number
    }) { }
}

export class AugmentNewProcessWithPid {
    static readonly type = '[Graph Model Interfaces] Augment New Process';
    constructor(public readonly payload: {
        graphModelId: string,
        tracking: TreeNodeInfo,
        position: any,
        label: string
    }) { }
}
