import { BasicTreeNodeInfo, TreeNodeType } from '@cpt/interfaces/tree-node';
import { TrackingModes } from '@cpt/capacity-planning-simulation-types/lib';



export interface TreeNodeInfo extends BasicTreeNodeInfo {
    type: TreeNodeType;
    id: string;
    description: string;
    name: string;
    releaseNr: number;
    currentVersionNr: number;
    parentId: string;
    pathName: string;
    processDependencies: string[];
}

export interface TreeNodeReferenceTracking {
    nodeId: string;
    tracking: TrackingModes;
    releaseNr?: number;
}
