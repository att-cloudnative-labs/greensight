import { TreeNode } from '@app/core_module/interfaces/tree-node';

export class FolderClicked {
    static readonly type = '[Library Search Result] Folder Clicked';
    constructor(public treeNode: TreeNode) { }
}

export class GraphModelClicked {
    static readonly type = '[Library Search Result] Graph Model Clicked';
    constructor(public treeNode: TreeNode) { }
}

export class GraphModelTemplateClicked {
    static readonly type = '[Library Search Result] Graph Model Template Clicked';
    constructor(public treeNode: TreeNode) { }
}

export class FolderDoubleClicked {
    static readonly type = '[Library Search Result] Folder Double-Clicked';
    constructor(public treeNode: TreeNode) { }
}

export class GraphModelDoubleClicked {
    static readonly type = '[Library Search Result] Graph Model Double-Clicked';
    constructor(public treeNode: TreeNode) { }
}

export class GraphModelTemplateDoubleClicked {
    static readonly type = '[Library Search Result] Graph Model Template Double-Clicked';
    constructor(public treeNode: TreeNode) { }
}

export class SimulationClicked {
    static readonly type = '[Library Search Result] Simulation Clicked';
    constructor(public treeNode: TreeNode) { }
}

export class SimulationDoubleClicked {
    static readonly type = '[Library Search Result] Simulation Double Clicked';
    constructor(public treeNode: TreeNode) { }
}

export class SimulationResultClicked {
    static readonly type = '[Library Search Result] Simulation Result Clicked';
    constructor(public treeNode: TreeNode) { }
}

export class SimulationResultDoubleClicked {
    static readonly type = '[Library Search Result] Simulation Result Double Clicked';
    constructor(public treeNode: TreeNode) { }
}
