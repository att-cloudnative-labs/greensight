import { v4 as uuid } from 'uuid';
import { ProcessInterfaceDescription } from '@system-models/models/graph-model.model';

export async function synchronizeGraphModel(graphModelId, graphModelNodes, processingElements, saveGraphModel) {
    let gmn;
    try {
        // TODO: support better immutable workflows in this process using immer
        gmn = JSON.parse(JSON.stringify(graphModelNodes.find(x => x.id === graphModelId)));
    } catch (e) {
        return;
    }

    const pids = function() {
        const processInterfaceDescriptions: ProcessInterfaceDescription[] = [];
        processingElements.forEach(pe => {
            processInterfaceDescriptions.push(ProcessInterfaceDescription.fromProcessingElement(pe));
        });
        graphModelNodes.forEach(gmn => {
            if (gmn.processInterface !== null) {
                processInterfaceDescriptions.push(ProcessInterfaceDescription.fromGraphModelNode(gmn));
            }
        });
        return processInterfaceDescriptions;
    };

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
    * Synchronize a child -- mutates graphModelNodes
    */

    const synchronizeChild = async (process) => {
        const index = graphModelNodes.findIndex(x => x.id === process.ref);
        if (graphModelNodes[index].content) {
            const updated = await synchronizeGraphModel(process.ref, graphModelNodes, processingElements, saveGraphModel);
            graphModelNodes[index] = updated;
        }
    };

    /*
    * Synchronize a Graph Model
    */

    const synchronize = async (gmn) => {
        let didUpdateProcess = false;
        let didUpdateConnection = false;
        if (gmn.content) {
            Object.keys(gmn.content.processes).forEach(async id => {
                const process = gmn.content.processes[id];
                if (process.type === 'GRAPH_MODEL' && process.ref !== graphModelId) {
                    synchronizeChild(process);
                }
                const pid = pids().find(x => x.id === process.ref);
                didUpdateProcess = synchronizeProcess(process, pid);
            });

            didUpdateConnection = synchronizeConnections(gmn);
        }
        return {
            updatedGraphModel: gmn,
            didUpdate: didUpdateProcess || didUpdateConnection
        };
    };

    /*
    * Perform the synchronization and call the callback
    */

    const { updatedGraphModel, didUpdate } = await synchronize(gmn);
    if (didUpdate) {
        return await saveGraphModel.call(undefined, updatedGraphModel);
    } else {
        return updatedGraphModel;
    }
}
