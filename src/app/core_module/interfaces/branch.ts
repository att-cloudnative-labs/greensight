import { TreeNode } from '@app/core_module/interfaces/tree-node';

export interface Branch {
    id: string;
    projectId: string;
    title: string;
    description: string;
    isMaster: boolean;
    ownerId: string;
    ownerName: string;
    startTime: string;
    endTime: string;
    _treeNode?: TreeNode;
}
