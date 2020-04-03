import { TreeNode } from '@cpt/interfaces/tree-node';


export interface ReleaseProcessPinning {
    processId: string;
    graphModelId: string;
    releaseNr: number;
}

export interface TreeNodeReleaseCreateDto {
    objectId: string;
    versionId: number;
    description?: string;
    tags?: string[];
    treeNode?: TreeNode;

}

export interface TreeNodeRelease extends TreeNodeReleaseCreateDto {
    id: string;
    ownerId: string;
    ownerName: string;
    currentUserAccessPermissions: string[];
    timestamp: string;
    releaseNr: number;
}
