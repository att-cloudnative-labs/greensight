import { v4 as uuid } from 'uuid';
import { ProcessInterfaceDescription } from '@cpt/capacity-planning-simulation-types';
import { GraphModel, pidFromGraphModelNode } from '@system-models/models/graph-model.model';
import { TreeNode } from '@app/core_module/interfaces/tree-node';
import produce from 'immer';

export async function synchronizeGraphModel(graphModel: TreeNode, processingElements: ProcessInterfaceDescription[], saveGraphModel) {


    /*
    * Synchronize a Process
    */

    const synchronizeProcess = (process, pid: ProcessInterfaceDescription) => {
        let didUpdate = false;

        // update existing, add new
        Object.keys(pid.inports).forEach(id => {
            const inport = Object.values(process.inports).find((x: any) => x.ref === id);
            if (!inport) {
                didUpdate = true;
                process.inports[uuid()] = {
                    ref: id
                };
            }
        });
        Object.keys(pid.outports).forEach(id => {
            const outport = Object.values(process.outports).find((x: any) => x.ref === id);
            if (!outport) {
                didUpdate = true;
                process.outports[uuid()] = {
                    ref: id
                };
            }
        });

        // remove no longer present
        const getDef = function(type, port, pid) {
            const prop = `${type}s`;
            if (pid[prop][port.ref]) {
                return pid[prop][port.ref];
            }
            const template = pid.portTemplates[port.templateId];
            const def = template && template[`${type}Templates`][port.ref];
            return def;
        };

        new Array('inport', 'outport').forEach(type => {
            const prop = `${type}s`;
            Object.keys(process[prop]).forEach(id => {
                const exists = getDef(type, process[prop][id], pid);
                if (!exists) {
                    didUpdate = true;
                    delete process[prop][id];
                }
            });
        });

        return didUpdate;
    };

    /*
    * Synchronize a Connection
    */

    const synchronizeConnections = (gmn) => {
        let didUpdate = false;

        const portMap = {
            sources: gmn.content.inports,
            destinations: gmn.content.outports
        };
        Object.values(gmn.content.processes).forEach((process: any) => {
            portMap.sources = {
                ...portMap.sources,
                ...process.outports
            };
            portMap.destinations = {
                ...portMap.destinations,
                ...process.inports
            };
        });
        portMap.sources = {
            ...portMap.sources,
            ...gmn.content.variables
        };
        portMap.destinations = {
            ...portMap.sources,
            ...gmn.content.variables
        };

        Object.keys(gmn.content.connections).forEach(id => {
            const connection = gmn.content.connections[id];
            if (!portMap.sources[connection.source] && !portMap.destinations[connection.destination]) {
                didUpdate = true;
                delete gmn.content.connections[id];
            }
        });

        return didUpdate;
    };


    /*
    * Synchronize a Graph Model
    */

    const synchronize = async (gmn: TreeNode) => {
        let didUpdateProcess = false;
        let didUpdateConnection = false;
        const editedNode = produce(gmn, (node => {
            if (node.content) {
                Object.keys(node.content.processes).forEach(async id => {
                    const process = node.content.processes[id];
                    const pid = processingElements.find(x => x.objectId === process.ref);
                    didUpdateProcess = synchronizeProcess(process, pid);
                });

                didUpdateConnection = synchronizeConnections(node);
            }
        }));

        return {
            updatedGraphModel: editedNode,
            didUpdate: didUpdateProcess || didUpdateConnection
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
