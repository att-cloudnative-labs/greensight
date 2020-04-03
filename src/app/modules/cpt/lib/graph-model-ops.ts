import { TreeNode, TreeNodeContentPatch } from '@cpt/interfaces/tree-node';
import { GraphModel, Process, ProcessInterfaceDescription } from '@cpt/capacity-planning-simulation-types/lib';
import { v4 as uuid } from 'uuid';
import { GraphModelInterfaceState } from '@cpt/state/graph-model-interface.state';
import { Store } from '@ngxs/store';
import { ProcessingElementState, ProcessingElementStateModel } from '@cpt/state/processing-element.state';
import { GraphModelInterfaceStateModel } from '@cpt/state/graph-model-interface.state';


export function mergeLatestReleaseAndCurrentVersionPids(latestReleases: ProcessInterfaceDescription[], currentVersions: ProcessInterfaceDescription[]): ProcessInterfaceDescription[] {
    const combinedPids = [...latestReleases];
    for (const pid of currentVersions) {
        if (combinedPids.findIndex(p => p.objectId === pid.objectId) < 0) {
            combinedPids.push(pid);
        }
    }
    return combinedPids;
}

export function isConnectionToVariableReference(connection) {
    return (
        connection.metadata
        && (connection.metadata.referenceSource || connection.metadata.referenceDestination)
    );
}

export function deleteGraphModelConnectionsByPortId(graphModel, portId) {
    Object.keys(graphModel.content.connections).forEach(connectionId => {
        const connection = graphModel.content.connections[connectionId];
        if (connection.source === portId || connection.destination === portId) {
            if (isConnectionToVariableReference(connection)) {
                if (connection.source === portId) {
                    deleteGraphModelNodeBySelection(graphModel, { type: 'VariableReference', id: connection.metadata.referenceDestination });
                } else if (connection.destination === portId) {
                    deleteGraphModelNodeBySelection(graphModel, { type: 'VariableReference', id: connection.metadata.referenceSource });
                } else {
                    return; // never delete these by port id!
                }
            } else {
                delete graphModel.content.connections[connectionId];
            }
        }
    });
}

export function deleteGraphModelConnectionsByVariableReference(graphModel, reference) {
    Object.keys(graphModel.content.connections).forEach(connectionId => {
        const connection = graphModel.content.connections[connectionId];
        if (connection.metadata && (connection.metadata.referenceSource === reference.id || connection.metadata.referenceDestination === reference.id)) {
            delete graphModel.content.connections[connectionId];
        }
    });
}

export function deleteGraphModelConnectionsByProcess(graphModel, process) {
    const inportIds = Object.keys(process.inports);
    const outportIds = Object.keys(process.outports);
    inportIds.concat(outportIds).forEach(id => {
        deleteGraphModelConnectionsByPortId(graphModel, id);
    });
}

export function deletePortsByTemplateGroup(graphModel, templateGroupId) {
    Object.values(graphModel.content.processes).forEach((process: any) => {
        ['inports', 'outports'].forEach(prop => {
            Object.keys(process[prop]).forEach(portId => {
                const port = process[prop][portId];
                if (port.templateGroupId === templateGroupId) {
                    deleteGraphModelConnectionsByPortId(graphModel, portId);
                    delete process[prop][portId];
                }
            });
        });
    });
}

export function deleteGraphModelNodeBySelection(graphModel, { type, id }) {
    switch (type) {
        case 'Inport':
            deleteGraphModelConnectionsByPortId(graphModel, id);
            delete graphModel.content.inports[id];
            break;
        case 'Outport':
            deleteGraphModelConnectionsByPortId(graphModel, id);
            delete graphModel.content.outports[id];
            break;
        case 'Process':
            deleteGraphModelConnectionsByProcess(graphModel, graphModel.content.processes[id]);
            delete graphModel.content.processes[id];
            break;
        case 'ProcessInport':
            Object.values(graphModel.content.processes).forEach((process: any) => {
                const port = process.inports[id];
                // It's only possible to delete a process port if it's dynamic
                // Only dynamic ports have templateGroupIds
                if (port && port.templateGroupId) {
                    deleteGraphModelConnectionsByPortId(graphModel, id);
                    deletePortsByTemplateGroup(graphModel, port.templateGroupId);
                }
            });
            break;
        case 'ProcessOutport':
            Object.values(graphModel.content.processes).forEach((process: any) => {
                const port = process.outports[id];
                // It's only possible to delete a process port if it's dynamic
                // Only dynamic ports have templateGroupIds
                if (port && port.templateGroupId) {
                    deleteGraphModelConnectionsByPortId(graphModel, id);
                    deletePortsByTemplateGroup(graphModel, port.templateGroupId);
                }
            });
            break;
        case 'VariableReference':
            Object.keys(graphModel.content.variables).forEach(variableId => {
                const variable = graphModel.content.variables[variableId];
                const referenceIndex = variable.metadata.references.findIndex(x => x.id === id);
                if (referenceIndex > -1) {
                    const reference = variable.metadata.references[referenceIndex];
                    deleteGraphModelConnectionsByVariableReference(graphModel, reference);
                    variable.metadata.references.splice(referenceIndex, 1);
                }
                if (variable.metadata.references.length === 0) {
                    delete graphModel.content.variables[variableId];
                }
            });
            break;
    }
}



export function findInport(gmn, id) {
    return gmn.content.inports[id];
}

export function findOutport(gmn, id) {
    return gmn.content.outports[id];
}

export function findProcess(gmn, id) {
    return gmn.content.processes[id];
}

export function findProcessInport(gmn, id) {
    return gmProcessInports(gmn)[id];
}

export function findProcessOutport(gmn, id) {
    return gmProcessOutports(gmn)[id];
}

export function findVariable(gmn, id) {
    return gmn.content.variables[id];
}

export function findVariableReference(gmn, id) {
    return gmVariableReferences(gmn).find(x => x.id === id);
}

export function gmProcessInports(gmn) {
    return Object.keys(gmn.content.processes).reduce((a, id) => {
        const b = gmn.content.processes[id];
        return {
            ...a,
            ...b.inports
        };
    }, {});
}

export function gmProcessOutports(gmn) {
    return Object.keys(gmn.content.processes).reduce((a, id) => {
        const b = gmn.content.processes[id];
        return {
            ...a,
            ...b.outports
        };
    }, {});
}

export function gmVariableReferences(gmn) {
    return Object.keys(gmn.content.variables).reduce((a, id) => {
        const b = gmn.content.variables[id];
        return a.concat(b.metadata.references);
    }, []);
}

export function patchGmChild(gmn: TreeNode, id: string, fnPatch: (orgChild) => any) {
    fnPatch(findGmChild(gmn, id));
}

export function findGmChild(gmn, id) {
    return (
        findInport(gmn, id)
        || findOutport(gmn, id)
        || findProcess(gmn, id)
        || findProcessInport(gmn, id)
        || findProcessOutport(gmn, id)
        || findVariable(gmn, id)
        || findVariableReference(gmn, id)
    );
}

export function serializePorts(ports) {
    return Object.keys(ports).reduce((ports, ref) => {
        return {
            [uuid()]: {
                ref
            },
            ...ports
        };
    }, {});
}

export function processingElementToProcess(pe: ProcessInterfaceDescription): Process {
    const inports = serializePorts(pe.inports);
    const outports = serializePorts(pe.outports);
    return {
        objectId: uuid(),
        objectType: 'PROCESS',
        type: pe.implementation,
        ref: pe.objectId,
        inports,
        outports,
        metadata: {
            x: 200,
            y: 100
        },
        versionId: pe.versionId,
        name: pe.name
    } as Process;
}

// generate a list of process id's incl releases nr
// of all graph model processes in this graph model
export function extractDependencies(gm: GraphModel): string[] {
    const ids: { [deps: string]: string } = {};
    for (const proc of Object.values(gm.processes)) {
        const depId = proc.tracking === 'FIXED' && proc.releaseNr ? `${proc.ref}@r${proc.releaseNr}` : proc.ref;
        ids[depId] = proc.objectId;
    }
    return Object.keys(ids);
}

export function pidSignatureChanged(patch: { added: any, updated: any, deleted: any }): boolean {
    for (const method in patch) {
        if (patch[method].hasOwnProperty('inports') || patch[method].hasOwnProperty('outports')) {
            return true;
        }
    }
    return false;
}
