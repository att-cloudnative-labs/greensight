import { TreeNode, TreeNodeType } from '@app/core_module/interfaces/tree-node';


export class LoadTree {
    static readonly type = '[Tree] Load Tree';
}

export class LoadSimulationResultContent {
    static readonly type = '[Tree] Load Simulation Result Content';
    constructor(public readonly payload: TreeNode) { }
}

export class LoadGraphModelContent {
    static readonly type = '[Tree] Load GraphModel Content';
    constructor(public readonly payload: TreeNode) { }
}

export class LoadSimulationContent {
    static readonly type = '[Tree] Load Simulation Content';
    constructor(public readonly payload: TreeNode) { }
}


export class ReloadSingleTreeNode {
    static readonly type = '[Tree] Reload Tree Node';
    constructor(public readonly payload: string) { }
}


export class GetTreeNode {
    static readonly type = '[Tree] Get Tree Node';
    constructor(public readonly payload: string) { }
}

export class CreateTreeNode {
    static readonly type = '[Tree] Create Tree Node';
    constructor(public readonly payload: { id: string, name: string, type: TreeNodeType, parentId: string, ownerName: string, modelRef?: string }) { }
}

export class UpdateTreeNode {
    static readonly type = '[Tree] Update Tree Node';
    constructor(public readonly payload: TreeNode) { }
}

export class ForceUpdateTreeNode {
    static readonly type = '[Tree] Force Update Tree Node';
    constructor(public readonly payload: TreeNode) { }
}

export class TrashTreeNode {
    static readonly type = '[Tree] Trash Tree Node';
    constructor(public readonly payload: TreeNode) { }
}

export class TrashedTreeNode {
    static readonly type = '[Tree] Successfully Trashed Tree Node';
    constructor(public readonly trashNode: TreeNode) { }
}

export class SendFolderToTrash {
    static readonly type = '[Tree] Send Folder To Trash';
    constructor(public readonly trashNode: TreeNode) { }
}

export class SendGraphModelToTrash {
    static readonly type = '[Tree] Send Graph Model To Trash';
    constructor(public readonly trashNode: TreeNode) { }
}

export class SendGraphModelTemplateToTrash {
    static readonly type = '[Tree] Send Graph Model Template To Trash';
    constructor(public readonly trashNode: TreeNode) { }
}

export class SendSimulationToTrash {
    static readonly type = '[Tree] Send Simulation To Trash';
    constructor(public readonly trashNode: TreeNode) { }
}

export class DescriptionChanged {
    static readonly type = '[Tree] Description Changed';
    constructor(public readonly payload: { nodeId: string, newDescription: string }) { }
}

export class SendSimulationResultToTrash {
    static readonly type = '[Tree] Send Simulation Result To Trash'
        ; constructor(public readonly trashNode: TreeNode) { }
}

export class DeleteTreeNode {
    static readonly type = '[Tree] Delete Tree Node';
    constructor(public readonly payload: TreeNode) { }
}

export class DuplicateTreeNode {
    static readonly type = '[Tree] Duplicate Tree Node';
    constructor(public readonly payload: TreeNode) { }
}

export class TreeNodeConflicted {
    static readonly type = '[Tree] Tree Node Conflict Detected';
    constructor(public readonly payload: { orgNode: TreeNode, conflictedNode: TreeNode }) { }
}

export class TreeNodeTrashed {
    static readonly type = '[Tree] Trashed Tree Node Detected';
    constructor(public readonly payload: { trashedNode: TreeNode }) { }
}

export class TreeNodeFailedDependency {
    static readonly type = '[Tree] Tree Node Dependency Failed';
    constructor() { }
}

export class TreeNodeDeleteConflict {
    static readonly type = '[Tree] Tree Node Delete Version Conflict';
    constructor(public readonly payload: { trashedNode: TreeNode }) { }
}

export class TreeNodePermissionException {
    static readonly type = '[Tree] Tree Node Update Permission Exception';
    constructor(public readonly payload: TreeNode) { }
}
