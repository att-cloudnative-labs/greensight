import { TreeNodeVersion } from '@app/modules/cpt/interfaces/tree-node-version';
import { TreeNodeRelease } from '@app/modules/cpt/interfaces/tree-node-release';
export interface HGraphModelTreeNode {
    type: 'GRAPH_MODEL';
    nodeId: string;
    nodeName: string;
}

export interface HGraphModelProcess {
    type: 'PROCESS';
    nodeId: string;
    nodeName: string;
    processId: string;
    hostNodeId: string;
    versionId?: string;
}

export interface HGraphModelSimulation {
    type: 'SIMULATION';
    nodeId: string;
    nodeName: string;
    versionId?: string;
    simulationId: string;
}

export interface HForecastSheet {
    type: 'FC_SHEET';
    nodeId: string;
    nodeName: string;
    versionId?: string;
}

export type HElement = HGraphModelProcess | HGraphModelSimulation | HGraphModelTreeNode | HForecastSheet;



export interface HistoryItem {
    time: string;
    icon: string;
    user: string;
    action: string;
    element: HElement;
    version?: TreeNodeVersion;
    release?: TreeNodeRelease;
    currentUserAccessPermissions: string[];
    timestamp: string;
}
