import { TreeNode } from '@app/modules/cpt/interfaces/tree-node';

export class LoadTrash {
    static readonly type = '[Trash] Load Trash';
}

export class UpdateTrashTypeFilter {
    static readonly type = '[Trash] Update Trash Type Filter';
    constructor(public readonly payload: string[]) { }
}

export class AddTrashedNode {
    static readonly type = '[Trash] Add Trash Node';
    constructor(public readonly payload: TreeNode) { }
}

export class AddTrashedFolderNode {
    static readonly type = '[Trash] Add Trashed Folder Node';
    constructor(public readonly payload: TreeNode) { }
}

export class RemoveTrashedNode {
    static readonly type = '[Trash] Remove Trash Node';
    constructor(public readonly payload: TreeNode) { }
}

export class UpdateSearchString {
    static readonly type = '[Trash] Update Search String';
    constructor(public readonly payload: string) { }
}

export class TrashedNodeRowClicked {
    static readonly type = '[Trash] Trashed Node Row Clicked';
    constructor(public readonly payload: TreeNode) { }
}

export class RestoreButtonClicked {
    static readonly type = '[Trash] Restore Button Clicked';
    constructor(public readonly trashNode: TreeNode) { }
}

export class LibraryNodeClicked {
    static readonly type = '[Trash] Library Node Clicked';
}

export class TrashPanelClosed {
    static readonly type = '[Trash] Trash Panel Closed';
}
