import { BasicTreeNodeInfo, TreeNode } from '@app/modules/cpt/interfaces/tree-node';
import { TreeNodeInfo } from '@cpt/interfaces/tree-node-tracking';


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
    constructor(public treeNode: BasicTreeNodeInfo) { }
}

export class FolderAccessed {
    static readonly type = '[Library] Folder Accessed';
    constructor(public treeNode: BasicTreeNodeInfo) { }
}

export class GraphModelClicked {
    static readonly type = '[Library] Graph Model Clicked';
    constructor(public treeNode: BasicTreeNodeInfo) { }
}

export class GraphModelDoubleClicked {
    static readonly type = '[Library] Graph Model Double-Clicked';
    constructor(public treeNode: BasicTreeNodeInfo) { }
}

export class FolderSendToTrashClicked {
    static readonly type = '[Library] Folder "send to trash" clicked';
    constructor(public trashNode: BasicTreeNodeInfo) { }
}

export class GraphModelSendToTrashClicked {
    static readonly type = '[Library] Graph Model "send to trash" clicked';
    constructor(public trashNode: BasicTreeNodeInfo) { }
}

export class ForecastSheetSendToTrashClicked {
    static readonly type = '[Library] Forecast Sheet "send to trash" clicked';
    constructor(public trashNode: BasicTreeNodeInfo) { }
}

export class SimulationSendToTrashClicked {
    static readonly type = '[Library] Simulation "send to trash" clicked';
    constructor(public trashNode: BasicTreeNodeInfo) { }
}

export class SimulationResultSendToTrashClicked {
    static readonly type = '[Library] Simulation Result "send to trash" clicked';
    constructor(public trashNode: BasicTreeNodeInfo) { }
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
    constructor(public readonly treeNode: BasicTreeNodeInfo) { }
}

export class RenameGraphModelClicked {
    static readonly type = '[Library] Rename Graph Model Clicked';
    constructor(public readonly treeNode: BasicTreeNodeInfo) { }
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


export class FolderContextMenuOpened {
    static readonly type = '[Library] Folder Context Menu Opened';
    constructor(public readonly treeNode: BasicTreeNodeInfo) { }
}

export class GraphModelContextMenuOpened {
    static readonly type = '[Library] Graph Model Context Menu Opened';
    constructor(public readonly treeNode: BasicTreeNodeInfo) { }
}


export class SimulationContextMenuOpened {
    static readonly type = '[Library] Simulation Context Menu Opened';
    constructor(public readonly treeNode: BasicTreeNodeInfo) { }
}

export class SimulationResultContextMenuOpened {
    static readonly type = '[Library] Simulation Result Context Menu Opened';
    constructor(public readonly treeNode: BasicTreeNodeInfo) { }
}

export class SimulationClicked {
    static readonly type = '[Library] Simulation Clicked';
    constructor(public treeNode: BasicTreeNodeInfo) { }
}

export class SimulationDoubleClicked {
    static readonly type = '[Library] Simulation Double Clicked';
    constructor(public treeNode: BasicTreeNodeInfo) { }
}

export class RenameSimulationClicked {
    static readonly type = '[Library] Rename Simulation Clicked';
    constructor(public readonly treeNode: BasicTreeNodeInfo) { }
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
    constructor(public treeNode: BasicTreeNodeInfo) { }
}

export class SimulationResultDoubleClicked {
    static readonly type = '[Library] Simulation Result Double Clicked';
    constructor(public treeNode: BasicTreeNodeInfo) { }
}

export class RenameSimulationResultClicked {
    static readonly type = '[Library] Rename Simulation Result Clicked';
    constructor(public readonly treeNode: BasicTreeNodeInfo) { }
}

export class RenameSimulationResultCommitted {
    static readonly type = '[Tree] Rename Simulation Result Committed';
    constructor(public readonly payload: { nodeId: string, newName: string }) { }
}

export class RenameSimulationResultEscaped {
    static readonly type = '[Library] Rename Simulation Result Escaped';
    constructor() { }
}

export class ForecastSheetDoubleClicked {
    static readonly type = '[Library] Forecast Sheet Double-Clicked';
    constructor(public treeNode: BasicTreeNodeInfo) { }
}

export class ForecastSheetClicked {
    static readonly type = '[Library] Forecast Sheet Clicked';
    constructor(public treeNode: BasicTreeNodeInfo) { }
}

export class RenameForecastSheetCommitted {
    static readonly type = '[Tree] Rename Forecast Sheet Committed';
    constructor(public readonly payload: { nodeId: string, newName: string }) { }
}

export class RenameForecastSheetEscaped {
    static readonly type = '[Library] Rename Forecast Sheet Escaped';
    constructor() { }
}

export class RenameForecastSheetClicked {
    static readonly type = '[Library] Rename Forecast Sheet Clicked';
    constructor(public readonly treeNode: BasicTreeNodeInfo) { }
}

export class ForecastSheetContextMenuOpened {
    static readonly type = '[Library] Forecast Sheet Context Menu Opened';
    constructor(public readonly treeNode: BasicTreeNodeInfo) { }
}
