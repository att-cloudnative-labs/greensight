import { TreeNode } from '@app/core_module/interfaces/tree-node';

export class GetHistory {
    static readonly type = '[History] Get History';
    constructor(public readonly payload: TreeNode) { }
}
