import { TreeNode } from '@app/core_module/interfaces/tree-node';


export interface TreeNodeProperties {
    isExpanded: boolean;
}

export class SetNodeProperties {
    static readonly type = '[Library] Set Node Properties';
    constructor(public readonly payload: {
        id: string,
        treeNodeProperties: TreeNodeProperties
    }) { }
}

export class LibraryDestroyed {
    static readonly type = '[Library] Library Destroyed';
}

export class UpdateSearchString {
    static readonly type = '[Library] Update Search String';
    constructor(public readonly payload: string) { }
}

export class FolderClicked {
    static readonly type = '[Library] Folder Clicked';
    constructor(public treeNode: TreeNode) { }
}

export class FolderAccessed {
    static readonly type = '[Library] Folder Accessed';
    constructor(public treeNode: TreeNode) { }
}

export class GraphModelClicked {
    static readonly type = '[Library] Graph Model Clicked';
    constructor(public treeNode: TreeNode) { }
}

export class GraphModelTemplateClicked {
    static readonly type = '[Library] Graph Model Template Clicked';
    constructor(public treeNode: TreeNode) { }
}

export class GraphModelTemplateDoubleClicked {
    static readonly type = '[Library] Graph Model Template Double-Clicked';
    constructor(public treeNode: TreeNode) { }
}

export class GraphModelDoubleClicked {
    static readonly type = '[Library] Graph Model Double-Clicked';
    constructor(public treeNode: TreeNode) { }
}

export class FolderSendToTrashClicked {
    static readonly type = '[Library] Folder "send to trash" clicked';
    constructor(public trashNode: TreeNode) { }
}

export class GraphModelSendToTrashClicked {
    static readonly type = '[Library] Graph Model "send to trash" clicked';
    constructor(public trashNode: TreeNode) { }
}

export class GraphModelTemplateSendToTrashClicked {
    static readonly type = '[Library] Graph Model Template "send to trash" clicked';
    constructor(public trashNode: TreeNode) { }
}

export class SimulationSendToTrashClicked {
    static readonly type = '[Library] Simulation "send to trash" clicked';
    constructor(public trashNode: TreeNode) { }
}

export class SimulationResultSendToTrashClicked {
    static readonly type = '[Library] Simulation Result "send to trash" clicked';
    constructor(public trashNode: TreeNode) { }
}

export class TrashButtonClicked {
    static readonly type = '[Library] Trash Button Clicked';
    constructor() { }
}

export class TrashRowClicked {
    static readonly type = '[Library] Trash Row Clicked';
}

export class RenameFolderClicked {
    static readonly type = '[Library] Rename Folder Clicked';
    constructor(public readonly treeNode: TreeNode) { }
}

export class RenameGraphModelClicked {
    static readonly type = '[Library] Rename Graph Model Clicked';
    constructor(public readonly treeNode: TreeNode) { }
}

export class RenameGraphModelTemplateClicked {
    static readonly type = '[Library] Rename Graph Model Template Clicked';
    constructor(public readonly treeNode: TreeNode) { }
}

export class RenameFolderCommitted {
    static readonly type = '[Tree] Rename Folder Committed';
    constructor(public readonly payload: { nodeId: string, newName: string }) { }
}

export class RenameFolderEscaped {
    static readonly type = '[Library] Rename Folder Escaped';
    constructor() { }
}

export class RenameGraphModelCommitted {
    static readonly type = '[Tree] Rename Graph Model Committed';
    constructor(public readonly payload: { nodeId: string, newName: string }) { }
}

export class RenameGraphModelEscaped {
    static readonly type = '[Library] Rename Graph Model Escaped';
    constructor() { }
}

export class RenameGraphModelTemplateCommitted {
    static readonly type = '[Tree] Rename Graph Model Template Committed';
    constructor(public readonly payload: { nodeId: string, newName: string }) { }
}

export class RenameGraphModelTemplateEscaped {
    static readonly type = '[Library] Rename Graph Model Template Escaped';
    constructor() { }
}

export class FolderContextMenuOpened {
    static readonly type = '[Library] Folder Context Menu Opened';
    constructor(public readonly treeNode: TreeNode) { }
}

export class GraphModelContextMenuOpened {
    static readonly type = '[Library] Graph Model Context Menu Opened';
    constructor(public readonly treeNode: TreeNode) { }
}

export class GraphModelTemplateContextMenuOpened {
    static readonly type = '[Library] Graph Model Template Context Menu Opened';
    constructor(public readonly treeNode: TreeNode) { }
}

export class SimulationContextMenuOpened {
    static readonly type = '[Library] Simulation Context Menu Opened';
    constructor(public readonly treeNode: TreeNode) { }
}

export class SimulationResultContextMenuOpened {
    static readonly type = '[Library] Simulation Result Context Menu Opened';
    constructor(public readonly treeNode: TreeNode) { }
}

export class SimulationClicked {
    static readonly type = '[Library] Simulation Clicked';
    constructor(public treeNode: TreeNode) { }
}

export class SimulationDoubleClicked {
    static readonly type = '[Library] Simulation Double Clicked';
    constructor(public treeNode: TreeNode) { }
}

export class RenameSimulationClicked {
    static readonly type = '[Library] Rename Simulation Clicked';
    constructor(public readonly treeNode: TreeNode) { }
}

export class RenameSimulationCommitted {
    static readonly type = '[Tree] Rename Simulation Committed';
    constructor(public readonly payload: { nodeId: string, newName: string }) { }
}

export class RenameSimulationEscaped {
    static readonly type = '[Library] Rename Simulation Escaped';
    constructor() { }
}

export class SimulationResultClicked {
    static readonly type = '[Library] Simulation Result Clicked';
    constructor(public treeNode: TreeNode) { }
}

export class SimulationResultDoubleClicked {
    static readonly type = '[Library] Simulation Result Double Clicked';
    constructor(public treeNode: TreeNode) { }
}

export class RenameSimulationResultClicked {
    static readonly type = '[Library] Rename Simulation Result Clicked';
    constructor(public readonly treeNode: TreeNode) { }
}

export class RenameSimulationResultCommitted {
    static readonly type = '[Tree] Rename Simulation Result Committed';
    constructor(public readonly payload: { nodeId: string, newName: string }) { }
}

export class RenameSimulationResultEscaped {
    static readonly type = '[Library] Rename Simulation Result Escaped';
    constructor() { }
}

