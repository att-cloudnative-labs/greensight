import { BasicTreeNodeInfo, TreeNode } from '@app/modules/cpt/interfaces/tree-node';
import { TreeNodeInfo } from '@cpt/interfaces/tree-node-tracking';

export class FolderClicked {
    static readonly type = '[Library Search Result] Folder Clicked';
    constructor(public treeNode: BasicTreeNodeInfo) { }
}

export class GraphModelClicked {
    static readonly type = '[Library Search Result] Graph Model Clicked';
    constructor(public treeNode: BasicTreeNodeInfo) { }
}

export class FolderDoubleClicked {
    static readonly type = '[Library Search Result] Folder Double-Clicked';
    constructor(public treeNode: BasicTreeNodeInfo) { }
}

export class GraphModelDoubleClicked {
    static readonly type = '[Library Search Result] Graph Model Double-Clicked';
    constructor(public treeNode: BasicTreeNodeInfo) { }
}

export class SimulationClicked {
    static readonly type = '[Library Search Result] Simulation Clicked';
    constructor(public treeNode: BasicTreeNodeInfo) { }
}

export class SimulationDoubleClicked {
    static readonly type = '[Library Search Result] Simulation Double Clicked';
    constructor(public treeNode: BasicTreeNodeInfo) { }
}

export class SimulationResultClicked {
    static readonly type = '[Library Search Result] Simulation Result Clicked';
    constructor(public treeNode: BasicTreeNodeInfo) { }
}

export class SimulationResultDoubleClicked {
    static readonly type = '[Library Search Result] Simulation Result Double Clicked';
    constructor(public treeNode: BasicTreeNodeInfo) { }
}

export class ForecastSheetDoubleClicked {
    static readonly type = '[Library Search Result] Forecast Sheet Double-Clicked';
    constructor(public treeNode: BasicTreeNodeInfo) { }
}

export class ForecastSheetClicked {
    static readonly type = '[Library Search Result] Forecast Sheet-Clicked';
    constructor(public treeNode: BasicTreeNodeInfo) { }
}
