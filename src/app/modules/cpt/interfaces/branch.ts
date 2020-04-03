import { TreeNode } from '@app/modules/cpt/interfaces/tree-node';
import { Moment } from 'moment';

export interface Branch {
    id: string;
    projectId: string;
    title: string;
    description: string;
    isMaster: boolean;
    ownerId: string;
    ownerName: string;
    startTime: Moment;
    endTime: Moment;
    _treeNode?: TreeNode;
}
