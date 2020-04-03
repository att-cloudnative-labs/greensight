import { TreeNodeInfo } from '@cpt/interfaces/tree-node-tracking';
import { ProcessInterfaceDescription } from '@cpt/capacity-planning-simulation-types/lib';
import { ProcessTypes } from '@cpt/capacity-planning-simulation-types/lib/process';

export interface ProcessOption {

    name: string;
    pathName?: string;
    parentId?: string;
    implementation: ProcessTypes;
    disabled?: boolean;

    graphModel?: TreeNodeInfo;
    processingElement?: ProcessInterfaceDescription;
}

export function processOptionFromTreeNodeInfo(tni: TreeNodeInfo, sourceId?: string): ProcessOption {
    const hasCircularDependency = sourceId ? tni.processDependencies && !!tni.processDependencies.find(x => x === sourceId) : false;
    return { name: tni.name, graphModel: tni, implementation: 'GRAPH_MODEL', pathName: tni.pathName, disabled: hasCircularDependency } as ProcessOption;
}
