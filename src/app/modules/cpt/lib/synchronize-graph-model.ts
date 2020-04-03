import { ProcessInterfaceDescription } from '@cpt/capacity-planning-simulation-types';
import { TreeNode } from '@app/modules/cpt/interfaces/tree-node';
import produce from 'immer';
import * as gmod from '@app/modules/cpt/models/graph-model.model';
import { Process } from '@cpt/capacity-planning-simulation-types/lib';
import { fetchPid } from '@app/modules/cpt/models/graph-model.model';

export function runSyncGraphModel(node: TreeNode, getPid: fetchPid): boolean {
    let didUpdateProcess = false;
    let didUpdateConnection = false;
    if (node.content) {
        Object.keys(node.content.processes).forEach(async id => {
            const process: Process = node.content.processes[id];
            const pid = getPid(process);
            if (pid) {
                didUpdateProcess = gmod.synchronizeProcess(process, pid) || didUpdateProcess;
            }
        });

        didUpdateConnection = gmod.synchronizeConnections(node.content);
    }
    return didUpdateConnection || didUpdateProcess;
}

export async function synchronizeGraphModel(graphModel: TreeNode, getPid: fetchPid, saveGraphModel) {


    /*
    * Synchronize a Graph Model
    */
    const synchronize = async (gmn: TreeNode) => {
        let didUpdate = false;
        const editedNode = produce(gmn, (node => {
            didUpdate = runSyncGraphModel(node, getPid);
        }));

        return {
            updatedGraphModel: editedNode,
            didUpdate: didUpdate
        };
    };

    /*
    * Perform the synchronization and call the callback
    */

    const { updatedGraphModel, didUpdate } = await synchronize(graphModel);
    if (didUpdate) {
        return await saveGraphModel.call(undefined, updatedGraphModel);
    } else {
        return updatedGraphModel;
    }
}
