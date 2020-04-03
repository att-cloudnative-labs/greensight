import { ReleaseProcessPinning, TreeNodeRelease, TreeNodeReleaseCreateDto } from '@cpt/interfaces/tree-node-release';
import { Process } from '@cpt/capacity-planning-simulation-types';


export class ReleaseDescriptionOpened {
    static readonly type = '[Release] Opened Release Description Editor';
    constructor(public readonly payload: { nodeId: string }) { }
}
export class ReleaseDescriptionClosed {
    static readonly type = '[Release] Closed Release Description Editor';
    constructor(public readonly payload: { nodeId: string }) { }
}

export class ReleaseCreateClicked {
    static readonly type = '[Release] Create Release Button Clicked';
    constructor(public readonly payload: { nodeId: string, version: number }) { }
}

export class ReleasePrepared {
    static readonly type = '[Release] Release Prepared and Ready to Save';
    constructor(public readonly payload: { nodeId: string, version: number, release: TreeNodeReleaseCreateDto }) { }
}

export class ReleaseFailedToPrepare {
    static readonly type = '[Release] Release Cannot be Prepared';
    constructor(public readonly payload: { nodeId: string, version: number, failedProcesses: Process[] }) { }
}

export class GraphModelReleaseFailedToPrepareException {
    static readonly type = '[Release] Graph Model Release Cannot be Prepared';
    constructor(public readonly payload: { failedProcesses: Process[] }) { }
}


export class ReleaseNeedsPinning {
    static readonly type = '[Release] Release Needs Pinning';
    constructor(public readonly payload: { nodeId: string, version: number, toBePinnedProcesses: Process[], pinningSuggestions: ReleaseProcessPinning[] }) { }
}

export class GraphModelReleaseNeedsPinningException {
    static readonly type = '[Release] Graph Model Release Needs Pinning Exception';
    constructor(public readonly payload: { toBePinnedProcesses: Process[], pinningSuggestions: ReleaseProcessPinning[] }) { }
}

export class ReleaseAddedPinning {
    static readonly type = '[Release] Release Added Pinning';
    constructor(public readonly payload: { nodeId: string, version: number, pinningDecisions: ReleaseProcessPinning[] }) { }
}

export class ReleaseAddedDescription {
    static readonly type = '[Release] Release Added Description';
    constructor(public readonly payload: { nodeId: string, version: number, release: TreeNodeReleaseCreateDto, description: string }) { }
}

export class ReleaseCreated {
    static readonly type = '[Release] Release Created';
    constructor(public readonly payload: { id: string, release: TreeNodeRelease }) { }
}


export class ReleaseFailedToSubmit {
    static readonly type = '[Release] Release Failed to Submit';
    constructor(public readonly payload: { nodeId: string, version: number, release: TreeNodeReleaseCreateDto, description: string }) { }
}

export class ReleaseFetch {
    static readonly type = '[Release] Fetch';
    constructor(public readonly payload: { nodeId: string, releaseNr: number }) { }
}

export class ReleaseSelected {
    static readonly type = '[Release] Selected';
    constructor(public readonly payload: { nodeId: string, releaseNr: number }) { }
}
