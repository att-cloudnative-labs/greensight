import { TreeNodeVersion } from '@cpt/interfaces/tree-node-version';
import { TreeNodeRelease } from '@cpt/interfaces/tree-node-release';

export class GetHistory {
    static readonly type = '[History] Get History';
    constructor(public readonly payload: { id: string }) { }
}

export class EditVersionClicked {
    static readonly type = '[History] Edit Version';
    constructor(public readonly payload: { version: TreeNodeVersion, objectName: string }) { }
}

export class EditReleaseClicked {
    static readonly type = '[History] Open Release Editor';
    constructor(public readonly payload: { release: TreeNodeRelease, objectName: string }) { }
}

export class UpdateVersionDescription {
    static readonly type = '[History] Update Version Description';
    constructor(public readonly payload: { version: TreeNodeVersion, description: string }) { }
}

export class UpdateReleaseDescription {
    static readonly type = '[History] Update Release Description';
    constructor(public readonly payload: { release: TreeNodeRelease, description: string }) { }
}


