import { ProcessInterfaceDescription, GraphModel } from '@cpt/capacity-planning-simulation-types';

export type TreeNodeType = 'FOLDER' | 'MODEL' | 'MODELTEMPLATE' | 'SIMULATION' | 'SIMULATIONRESULT' | 'FC_SHEET' | 'META';
export type TreeNodeAccessControlMode = 'PRIVATE' | 'PUBLIC_READ_ONLY' | 'PUBLIC_READ_WRITE' | 'ADVANCED' | 'INHERIT';
export type TreeNodePermission = 'READ' | 'CREATE' | 'MODIFY' | 'DELETE';
export type TreeNodeIdentityType = 'ALL' | 'USER' | 'GROUP';

export type TreeNodeUserPermissions = 'No Access' | 'Read Only' | 'Read/Modify' | 'Read/Create/Modify' | 'Read/Create/Modify/Delete' | 'Read/Create/Modify own' | 'Read/Create/Modify own/Delete own';

export function mapUserPermissions(userPerm: TreeNodeUserPermissions): TreeNodePermission[] {
    switch (userPerm) {
        case 'No Access':
            return [];
        case 'Read Only':
            return ['READ'];
        case 'Read/Modify':
            return ['READ', 'MODIFY'];
        case 'Read/Create/Modify':
            return ['READ', 'MODIFY', 'CREATE'];
        case 'Read/Create/Modify/Delete':
            return ['READ', 'MODIFY', 'CREATE', 'DELETE'];
        default:
            return [];
    }
}


export function mapNodePermissions(nodePerm: TreeNodePermission[]): TreeNodeUserPermissions {
    function haz(...p: TreeNodePermission[]): boolean {
        if (p) {
            for (let i = p.length - 1; i >= 0; i--) {
                if (nodePerm.indexOf(p[i]) < 0) {
                    return false;
                }
            }
        }
        return true;
    }
    if (haz('READ', 'CREATE', 'MODIFY', 'DELETE')) {
        return 'Read/Create/Modify/Delete';
    } else if (haz('READ', 'CREATE', 'MODIFY')) {
        return ('Read/Create/Modify');
    } else if (haz('READ', 'MODIFY')) {
        return ('Read/Modify');
    } else if (haz('READ')) {
        return ('Read Only');
    } else return ('No Access');
}

export const accessControlModeNames: { [mode in TreeNodeAccessControlMode]: string } = {
    'PRIVATE': 'Private',
    'PUBLIC_READ_ONLY': 'Public (read only)',
    'PUBLIC_READ_WRITE': 'Public (read/write)',
    'ADVANCED': 'Advanced',
    'INHERIT': 'Inherit from Parent'
};

export function mapControlModeNames(mode: TreeNodeAccessControlMode): string {
    switch (mode) {
        case 'PRIVATE':
            return 'Private';
        case 'PUBLIC_READ_ONLY':
            return 'Public (read only)';
        case 'PUBLIC_READ_WRITE':
            return 'Public (read/write)';
        case 'ADVANCED':
            return 'Advanced';
        case 'INHERIT':
            return 'Inherit from Parent';
    }
}


export interface BasicTreeNodeInfo {
    id?: string;
    name: string;
    parentId?: string;
    type: TreeNodeType;
}

export interface TreeNode extends BasicTreeNodeInfo {
    accessControl: string | TreeNodeAccessControlMode;
    id?: string;
    name: string;
    parentId?: string;
    type: TreeNodeType;
    version?: number;
    releaseNr?: number;
    content?: any;
    ownerName?: string;
    ownerId?: string;
    description?: string;
    acl?: any[];
    trashedDate?: string;
    currentUserAccessPermissions?: string[];
    selectedScenarioId?: string;
    processInterface?: ProcessInterfaceDescription;
    processDependencies?: string[];
}


// fetch all graph model IDs of the processes
// i.e. all the graph model we're depending on
export function getProcessGraphModelIds(graphModelTreeNode: TreeNode): string[] {
    if (graphModelTreeNode.type !== 'MODEL' || !graphModelTreeNode.content) {
        return [];
    }
    let processGraphModelIds: string[] = [];
    let graphModel = graphModelTreeNode.content as GraphModel;
    for (let processId in graphModel.processes) {
        let process = graphModel.processes[processId];
        if (process.type === 'GRAPH_MODEL') {
            processGraphModelIds.push(process.ref)
        }
    }
    return processGraphModelIds;
}

export function hasDependencies(node: TreeNode): boolean {
    if (!node.processDependencies) {
        return false;
    }
    if (node.processDependencies.length < 1) {
        return false;
    }
    if (!node.processDependencies[0]) {
        return false;
    }
    return true;
}

export interface TreeNodeContentPatch {
    added?: any;
    updated?: any;
    deleted?: any;
}

// to successfully transport the deleted sections map
// they need to be changed from undefined as value for null as value
// otherwise the data will be purged during the JSON (de-)serialization.
export function buildPatch(patch: { added: any, updated: any, deleted: any }): TreeNodeContentPatch {
    function undefinedToNull(input): any {
        let output = {}
        Object.keys(input).forEach(key => {
            if (input[key] === undefined) {
                output[key] = null;
            } else if (typeof input[key] === 'object') {
                let subkey = undefinedToNull(input[key]);
                output[key] = subkey;
            } else {
                output[key] = input[key];
            }
        });
        return output;
    };

    return { added: patch.added, updated: patch.updated, deleted: undefinedToNull(patch.deleted) };
}
