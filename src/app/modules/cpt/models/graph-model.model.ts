import { TreeNode } from '@app/modules/cpt/interfaces/tree-node';
import {
    ProcessTypes,
    ParamType,
    GeneratesResponseTypes,
    ConfigType,
    GraphParam,
    GraphConfig,
    ProcessInterfaceDescription,
    GraphModel as SGraphModel,
    Process as SProcess
} from '@cpt/capacity-planning-simulation-types';
import { v4 as uuid } from 'uuid';
import { TrackingModes } from '@cpt/capacity-planning-simulation-types/lib';
import { Observable } from 'rxjs';


class Discriminator {
    public fn;

    constructor(fn) {
        this.fn = fn;
    }

    public discriminate(item) {
        return this.fn.call(this, item);
    }
}


export function pidFromGraphModelNode(graphModelNode: TreeNode): ProcessInterfaceDescription {
    const pid: ProcessInterfaceDescription = {
        objectId: graphModelNode.id,
        objectType: 'PROCESS_INTERFACE_DESCRIPTION',
        implementation: 'GRAPH_MODEL',
        name: graphModelNode.name,
        description: graphModelNode.description,
        inports: {},
        outports: {},
        portTemplates: {},
        parentId: graphModelNode.parentId,
        versionId: graphModelNode.version.toString()
    };
    if (graphModelNode.content) {
        pid.inports = graphModelNode.content.inports as any || {}
        pid.outports = graphModelNode.content.outports as any || {};
    }
    return graphModelNode.type === 'MODEL' ? pid : null;
}

// TODO: New name, Serializable no longer makes sense
class Serializable {
    public synchronizeMapToClassArray(prop: any[], klassOrDiscriminator, map, ...rest) {
        if (!map) {
            prop = [];
            return;
        }

        // add new, update existing
        Object.keys(map).map(id => {
            let klass;
            const item = map[id];
            if (klassOrDiscriminator instanceof Discriminator) {
                klass = klassOrDiscriminator.discriminate(item);
            } else {
                klass = klassOrDiscriminator;
            }
            const existing = prop.find(x => x.id === id);
            if (existing) {
                existing.update(id, item, ...rest);
            } else {
                prop.push(new klass(id, item, ...rest));
            }
        });

        // remove omitted
        prop.filter(x => !map[x.id]).forEach(item => {
            prop.splice(prop.findIndex(x => x.id === item.id), 1);
        });
    }
}

export class Port extends Serializable {
    public nodeType: string;
    public portType: string;
    public isSource: boolean;
    public isDestination: boolean;
    public id: string;
    public name: string;
    public metadata?: any;
    public graphModel: GraphModel;

    get connections(): Connection[] {
        return this.graphModel.connections.filter(c => c.source === this.id || c.destination === this.id);
    }

    get isConnected(): boolean {
        return this.connections.length > 0;
    }

    get hasParam(): boolean {
        return false;
    }
}

export class Inport extends Port {
    public nodeType = 'Inport';
    public portType = 'source';
    public isSource = true;
    public isDestination = false;
    public requiredTypes: ParamType[];
    public desiredUnits: string[];
    public generatesResponse: GeneratesResponseTypes;
    public defaultParam?: ParamType;
    public configType?: ConfigType;

    constructor(id, inport, graphModel) {
        super();
        this.update(id, inport, graphModel);
    }

    public update(id, inport, graphModel) {
        this.id = id;
        this.graphModel = graphModel;
        Object.assign(this, inport);
    }
}

export class Outport extends Port {
    public nodeType = 'Outport';
    public portType = 'destination';
    public isSource = false;
    public isDestination = true;
    public types: ParamType[]; // we might not know the type!
    public unit?: string;
    public configType?: ConfigType;

    constructor(id, outport, graphModel) {
        super();
        this.update(id, outport, graphModel);
    }

    public update(id, outport, graphModel) {
        this.id = id;
        this.graphModel = graphModel;
        Object.assign(this, outport);
    }
}

export class ProcessInport extends Port {
    public nodeType = 'ProcessInport';
    public portType = 'destination';
    public isSource = false;
    public isDestination = true;
    public ref: string;
    public param: GraphParam;
    public requiredTypes: ParamType[];
    public desiredUnits: string[];
    public generatesResponse: GeneratesResponseTypes;
    public defaultParam?: GraphParam;
    public config?: GraphConfig;
    public configType?: ConfigType;
    public templateId?: string;
    public templateGroupId?: string;
    public description?: string;
    public index: number;
    defaultSelected?: boolean;

    constructor(id, processInport, graphModel, pid) {
        super();
        this.update(id, processInport, graphModel, pid);
    }

    public update(id, processInport, graphModel, pid) {
        this.id = id;
        this.graphModel = graphModel;
        Object.assign(this, processInport);

        const def = this.pidToDef(pid);
        Object.assign(this, def);
    }

    public pidToDef(pid) {
        if (pid.inports[this.ref]) {
            return pid.inports[this.ref];
        }
        const template = pid.portTemplates[this.templateId];
        const def = template && template.inportTemplates[this.ref];
        return def;
    }

    get hasParam(): boolean {
        return !!this.param;
    }
}

export class ProcessOutport extends Port {
    public nodeType = 'ProcessOutport';
    public portType = 'source';
    public isSource = true;
    public isDestination = false;
    public ref: string;
    public param: GraphParam;
    public types: ParamType[];
    public index: number;
    public unit?: string;
    public config?: GraphConfig;
    public configType?: ConfigType;
    public templateId?: string;
    public templateGroupId?: string;
    public description?: string;
    public defaultParam?: GraphParam;
    defaultSelected?: boolean;

    constructor(id, processOutport, graphModel, pid) {
        super();
        this.update(id, processOutport, graphModel, pid);
    }

    public update(id, processOutport, graphModel, pid) {
        this.id = id;
        this.graphModel = graphModel;
        Object.assign(this, processOutport);

        const def = this.pidToDef(pid);
        Object.assign(this, def);
    }

    public pidToDef(pid) {
        if (pid.outports[this.ref]) {
            return pid.outports[this.ref];
        }
        const template = pid.portTemplates[this.templateId];
        const def = template && template.outportTemplates[this.ref];
        return def;
    }
}

export class ProcessPortTemplate extends Serializable {
    public id: string;
    public name: string;
    public inportTemplates: { [id: string]: any }; // TODO: use Inport interface here
    public outportTemplates: { [id: string]: any }; // TODO: use Outport interface here
    public graphModel: GraphModel;
    public index: number;

    get flavor(): string {
        if (this.hasInports && this.hasOutports) {
            return 'both';
        } else if (this.hasInports) {
            return 'in-only';
        } else if (this.hasOutports) {
            return 'out-only';
        } else {
            return 'none';
        }
    }

    public toObject() {
        const { inportTemplates, outportTemplates, id } = this;
        return {
            inportTemplates,
            outportTemplates,
            id
        };
    }

    get hasInports(): boolean {
        return Object.keys(this.inportTemplates).length > 0;
    }

    get hasOutports(): boolean {
        return Object.keys(this.outportTemplates).length > 0;
    }

    constructor(id, processPortTemplate, graphModel, pid) {
        super();
        this.update(id, processPortTemplate, graphModel, pid);
    }

    public update(id, processPortTemplate, graphModel, pid) {
        this.id = id;
        this.graphModel = graphModel;
        Object.assign(this, processPortTemplate);
    }
}

export class Process extends Serializable {
    public nodeType = 'Process';
    public id: string;
    public type: ProcessTypes;
    public ref: string;
    public name: string;
    // if not set assume latest
    public versionId?: string;
    public label?: string;
    public metadata?: any;
    public description?: string;
    public inports?: ProcessInport[] = [];
    public outports?: ProcessOutport[] = [];
    public portTemplates: ProcessPortTemplate[] = [];
    public graphModel: GraphModel;
    public visualizationHint?: string;
    public tracking?: TrackingModes;
    public releaseNr: number;

    get objectId(): string {
        return this.id;
    }

    constructor(id, process, graphModel, getPid: fetchPid) {
        super();
        this.update(id, process, graphModel, getPid);
    }

    public update(id, process, graphModel, getPid: fetchPid) {
        this.id = id;
        this.graphModel = graphModel;
        this.type = process.type;
        this.ref = process.ref;
        this.versionId = process.versionId;
        this.label = process.label;
        // this.description = process.description;
        this.metadata = process.metadata;
        const pid = getPid(process);
        this.description = pid ? pid.description : undefined;
        this.name = pid.name;
        this.visualizationHint = pid.visualizationHint;
        this.synchronizeMapToClassArray(this.inports, ProcessInport, process.inports, graphModel, pid);
        this.synchronizeMapToClassArray(this.outports, ProcessOutport, process.outports, graphModel, pid);
        this.synchronizeMapToClassArray(this.portTemplates, ProcessPortTemplate, pid.portTemplates, graphModel, pid);
        if (process.tracking) {
            this.tracking = process.tracking;
        }
        this.releaseNr = pid.releaseNr;
    }

    public getInportByRef(ref) {
        return this.inports.find(x => x.ref === ref);
    }

    public getOutportByRef(ref) {
        return this.outports.find(x => x.ref === ref);
    }
}

export class GraphModelProcess extends Process {
    public update(id, process, graphModel, getPid) {
        super.update(id, process, graphModel, getPid);
        // sort inports/outports
        this.inports = this.inports.sort((a, b) => {
            if (a.metadata && b.metadata) {
                return a.metadata.y - b.metadata.y;
            }
        });
        this.outports = this.outports.sort((a, b) => {
            if (a.metadata && b.metadata) {
                return a.metadata.y - b.metadata.y;
            }
        });
    }
}
export class ProcessingElementProcess extends Process {
    public update(id, process, graphModel, getPid) {
        super.update(id, process, graphModel, getPid);
        // sort inports and outports using specified index
        this.inports = this.inports.sort((a, b) => {
            // excluding port templates from the ordering for now
            if (!a.templateId && !b.templateId) {
                return a.index - b.index;
            }
        });
        this.outports = this.outports.sort((a, b) => {
            if (!a.templateId && !b.templateId) {
                return a.index - b.index;
            }
        });
    }
}

export class Connection extends Serializable {
    public id: string;
    public source: string;
    public destination: string;
    public metadata?: string;
    public graphModel: GraphModel;

    constructor(id, connection, graphModel) {
        super();
        this.update(id, connection, graphModel);
    }

    public update(id, connection, graphModel) {
        this.id = id;
        this.graphModel = graphModel;
        Object.assign(this, connection);
    }

    get isValid(): boolean | Error {
        return (
            this.goesSomewhere
            && this.isUnique
            && this.isSourceToDestination
            && this.isNonCircular
        );
    }

    private get goesSomewhere(): boolean {
        return this.source !== this.destination;
    }

    private get isUnique(): boolean {
        return !this.graphModel.connections.find(connection => {
            return connection.source === this.source && connection.destination === this.destination;
        });
    }

    private get isSourceToDestination(): boolean {
        return this.graphModel.find(this.source).isSource && this.graphModel.find(this.destination).isDestination;
    }

    get sourcePort(): SourcePort {
        return this.graphModel.find(this.source);
    }

    get destinationPort(): DestinationPort {
        return this.graphModel.find(this.destination);
    }

    private get isNonCircular(): boolean {
        if (!(this.destinationPort instanceof ProcessInport) || this.sourcePort instanceof Inport) {
            return true;
        }

        try {
            this.graphModel.walkConnections(this.destination, (connection) => {
                if (connection.destination === this.destinationPort.id) {
                    throw new Error('circular');
                }
            }, this.graphModel.connections.concat(this));
        } catch (e) {
            return e;
        }
        return true;
    }
}

export class VariableReference extends Serializable {
    public nodeType = 'VariableReference';
    public portId: string;
    public portType: 'source' | 'destination';
    public id: string;
    public graphModel: GraphModel;
    public variable: Variable;
    public metadata: {
        x: number;
        y: number;
    };

    constructor(variableReference, variable, graphModel) {
        super();
        this.update(variableReference, variable, graphModel);
    }

    public update(variableReference, variable, graphModel) {
        this.graphModel = graphModel;
        this.variable = variable;
        Object.assign(this, variableReference);
    }
}

export class Variable extends Serializable {
    public nodeType = 'Variable';
    public objectId: string;
    public objectType: 'NAMED_VARIABLE' | 'BROADCAST_VARIABLE';
    public label: string;
    public type: string;
    public metadata: {
        references: VariableReference[]
    };
    public id: string;
    public graphModel: GraphModel;

    constructor(id, variable, graphModel) {
        super();
        this.update(id, variable, graphModel);
    }

    public update(id, variable, graphModel) {
        this.id = id;
        this.graphModel = graphModel;
        this.objectId = variable.objectId;
        this.objectType = variable.objectType;
        this.label = variable.label;
        if (!this.metadata) {
            this.metadata = { references: [] };
        }

        // update existing
        variable.metadata.references.forEach(reference => {
            const existing = this.metadata.references.find(x => x.id === reference.id);
            if (existing) {
                existing.update(reference, this, graphModel);
            } else {
                this.metadata.references.push(new VariableReference(reference, this, graphModel));
            }
        });

        // remove omitted
        this.metadata.references.filter(x => !variable.metadata.references.find(y => y.id === x.id)).forEach(x => {
            this.metadata.references.splice(this.metadata.references.findIndex(y => y.id === x.id), 1);
        });
    }

    private synchronizeReferences(references) {
    }
}

export type fetchPid = (p: SProcess) => ProcessInterfaceDescription;


export class GraphModel extends Serializable {
    public id: string;
    public name: string;
    public inports: Inport[] = [];
    public outports: Outport[] = [];
    public processes: Process[] = [];
    public connections: Connection[] = [];
    public variables: Variable[] = [];
    public metadata?: any;
    public version?: number;
    public releaseNr?: number;
    constructor(graphModelTreeNode: TreeNode, getPid: fetchPid) {
        super();
        this.update(graphModelTreeNode, getPid);
    }

    public update(graphModelTreeNode: TreeNode, getPid: fetchPid) {
        this.id = graphModelTreeNode.id;
        this.name = graphModelTreeNode.name;
        this.metadata = graphModelTreeNode.content.metadata;
        this.version = graphModelTreeNode.version;
        this.releaseNr = graphModelTreeNode.releaseNr;
        this.synchronizeMapToClassArray(this.inports, Inport, graphModelTreeNode.content.inports, this, getPid);
        this.synchronizeMapToClassArray(this.outports, Outport, graphModelTreeNode.content.outports, this, getPid);
        this.synchronizeMapToClassArray(this.processes, new Discriminator((process) => {
            if (process.type === 'PROCESSING_ELEMENT') {
                return ProcessingElementProcess;
            } else if (process.type === 'GRAPH_MODEL') {
                return GraphModelProcess;
            }
        }), graphModelTreeNode.content.processes, this, getPid);
        this.synchronizeMapToClassArray(this.connections, Connection, graphModelTreeNode.content.connections, this, getPid);
        this.synchronizeMapToClassArray(this.variables, Variable, graphModelTreeNode.content.variables, this, getPid);
    }

    public validateConnection({ source, destination }) {
        return new Connection('', { source, destination }, this).isValid;
    }

    public walkConnections(portId, callbackFn, connections) {
        const currentProcess = this.findDestinationProcess(portId);

        if (currentProcess) {
            currentProcess.outports.forEach(outport => {
                const portConnections = connections.filter(x => x.source === outport.id);
                portConnections.forEach(connection => {
                    callbackFn(connection);
                    this.walkConnections(connection.destination, callbackFn, connections);
                });
            });
        }
    }

    private findDestinationProcess(destinationId) {
        for (const process of this.processes) {
            if (process.inports.find(inport => inport.id === destinationId)) {
                return process;
            }
        }
    }

    get broadcastVariables() {
        return this.variables.filter(x => x.objectType === 'BROADCAST_VARIABLE');
    }

    get namedVariables() {
        return this.variables.filter(x => x.objectType === 'NAMED_VARIABLE');
    }

    get processInports() {
        return this.processes.reduce((a, b) => {
            return a.concat(b.inports);
        }, []);
    }

    get processOutports() {
        return this.processes.reduce((a, b) => {
            return a.concat(b.outports);
        }, []);
    }

    get variableReferences() {
        return this.variables.reduce((a, b) => {
            return a.concat(b.metadata.references);
        }, []);
    }

    public find(id) {
        return (
            this.findInport(id)
            || this.findOutport(id)
            || this.findProcess(id)
            || this.findProcessInport(id)
            || this.findProcessOutport(id)
            || this.findVariableReference(id)
        );
    }

    public findInport(id) {
        return this.inports.find(x => x.id === id);
    }

    public findOutport(id) {
        return this.outports.find(x => x.id === id);
    }

    public findProcess(id) {
        return this.processes.find(x => x.id === id);
    }

    public findProcessInport(id) {
        return this.processInports.find(x => x.id === id);
    }

    public findProcessOutport(id) {
        return this.processOutports.find(x => x.id === id);
    }

    public findVariableReference(id) {
        return this.variableReferences.find(x => x.id === id);
    }

    public portMap() {
        const map = {
            sources: {},
            destinations: {}
        };
        this.inports.forEach(inport => {
            map.sources[inport.id] = inport;
        });
        this.outports.forEach(outport => {
            map.destinations[outport.id] = outport;
        });
        this.processes.forEach(process => {
            process.inports.forEach(inport => {
                map.destinations[inport.id] = inport;
            });
            process.outports.forEach(outport => {
                map.sources[outport.id] = outport;
            });
        });
        return map;
    }
}

export function synchronizeProcess(process, pid: ProcessInterfaceDescription) {
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

    ['inport', 'outport'].forEach(type => {
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
}

export function synchronizeConnections(gmn: SGraphModel) {
    let didUpdate = false;

    const portMap = {
        sources: gmn.inports as any,
        destinations: gmn.outports as any
    };
    Object.values(gmn.processes).forEach((process: any) => {
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
        ...gmn.variables
    };
    portMap.destinations = {
        ...portMap.destinations,
        ...gmn.variables
    };

    Object.keys(gmn.connections).forEach(id => {
        const connection = gmn.connections[id];
        if (!portMap.sources[connection.source] || !portMap.destinations[connection.destination]) {
            didUpdate = true;
            delete gmn.connections[id];
        }
    });
    return didUpdate;
}


// TODO: This could use a better name :)
export type DraggableNode = Process | Inport | Outport | VariableReference;
export type DestinationPort = ProcessInport | Outport;
export type SourcePort = Inport | ProcessOutport;
