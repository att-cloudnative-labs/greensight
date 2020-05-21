import { CptEnvironmentIf, CptSimulationProcessIf, CptOutput, CptInformationPackage, genSimId, CptProcessNodeIf, CptSimulationLifecycle, CptSimulationNodeIf, CptSimulationActiveNodeIf } from './cpt-object';
import { CptInport, CptOutport, CptPort } from './cpt-port';
import { CptConnection } from './cpt-connection';
import { CptVariable } from './cpt-variable';
import { GraphModel, Process, NodeTypes, Connection, Variable, GraphParam } from '@cpt/capacity-planning-simulation-types';
import { ResponseParam } from "@cpt/capacity-planning-simulation-types/lib";


interface NodeWithDependencies {
    nodeType: NodeTypes,
    dependencies: string[],
    node: CptSimulationActiveNodeIf;
}

export class CptGraphModel implements CptSimulationProcessIf {

    env: CptEnvironmentIf;
    nodeType: NodeTypes = 'GRAPH_MODEL';
    ref: string;
    version?: string;
    simulationNodeId: string;
    processNodeId: string;
    getSimulationNodePath(): string[] {
        return this.parentNodePath.concat(this.simulationNodeId);
    }
    label?: string;

    private parentNodePath: string[] = [];

    private processes: { [internalId: string]: CptSimulationProcessIf } = {};
    private processPortMap: { [procNodeId: string]: CptSimulationProcessIf } = {};
    private processOrder: CptSimulationActiveNodeIf[] = [];

    private connections: { [internalId: string]: CptConnection } = {};
    private variables: { [internalId: string]: CptVariable } = {};

    private inports: { [internalId: string]: CptInport } = {};
    private outports: { [internalId: string]: CptOutport } = {};
    private inportsExternalId: { [procNodeId: string]: CptInport } = {};
    private outportsExternalId: { [procNodeId: string]: CptOutport } = {};





    constructor(public gm: GraphModel, public proc: Process, public parent?: CptSimulationProcessIf) {
        if (parent) {
            this.parentNodePath = parent.getSimulationNodePath();
        }
        this.processNodeId = proc.objectId;
        this.simulationNodeId = genSimId(this.parentNodePath, this.processNodeId);
        this.ref = gm.objectId;
        this.label = proc.label || gm.label;
    }

    private getUpstreamNodeIdsForPort(portId: string): string[] {
        let upstreamIds: string[] = [];
        for (let connectionId in this.connections) {
            let connection = this.connections[connectionId].conn;
            // we're looking for all connection that end at
            // our port
            if (connection.destination === portId) {
                let updstreamNodeId: string = undefined;
                // now find the node of the source
                // it can be a the outport of a process, a variable or an inport
                if (this.variables[connection.source] || this.inports[connection.source]) {
                    updstreamNodeId = connection.source;
                } else {
                    // go through all the outports of all processes and see if we can find
                    // our source there.
                    // TODO: optimize
                    for (let procId in this.processes) {
                        for (let outportId in this.processes[procId].proc.outports) {
                            if (outportId === connection.source) {
                                updstreamNodeId = procId;
                            }
                        }
                        if (updstreamNodeId) {
                            break;
                        }
                    }
                }
                if (updstreamNodeId && upstreamIds.indexOf(updstreamNodeId) < 0) {
                    upstreamIds.push(updstreamNodeId);
                }
            }
        }
        return upstreamIds;
    }

    private generateNodesWithDependencies(): NodeWithDependencies[] {
        let nodesWithDeps: NodeWithDependencies[] = [];
        for (let inportId in this.inports) {
            let inport = this.inports[inportId];
            let node: NodeWithDependencies = {
                nodeType: inport.nodeType,
                node: inport,
                dependencies: []
            }
            nodesWithDeps.push(node);
        }
        // add our PEs and GraphModels
        for (let processId in this.processes) {

            let proc = this.processes[processId].proc;
            let node: NodeWithDependencies = {
                nodeType: proc.type,
                node: this.processes[processId],
                dependencies: []
            }
            for (let procInportId in proc.inports) {
                let portDeps = this.getUpstreamNodeIdsForPort(procInportId);
                for (let depId of portDeps) {
                    if (node.dependencies.indexOf(depId) < 0) {
                        node.dependencies.push(depId);
                    }
                }
            }
            nodesWithDeps.push(node);
        }
        // now go through the variables
        for (let varId in this.variables) {
            let variable = this.variables[varId];
            let node: NodeWithDependencies = {
                nodeType: variable.nodeType,
                node: variable,
                dependencies: this.getUpstreamNodeIdsForPort(varId)
            }
            nodesWithDeps.push(node);
        }

        for (let outportId in this.outports) {
            let outport = this.outports[outportId];
            let node: NodeWithDependencies = {
                nodeType: outport.nodeType,
                node: outport,
                dependencies: this.getUpstreamNodeIdsForPort(outportId)
            }
            nodesWithDeps.push(node);
        }

        return nodesWithDeps;
    }

    private calculateExecutionOrder(): boolean {
        let nodes = this.generateNodesWithDependencies();

        // ordered nodes
        let lNodes: NodeWithDependencies[] = [];
        // nodes without dependencies
        let sNodes = nodes.filter(n => n.dependencies.length == 0);

        let n: NodeWithDependencies = sNodes.pop();

        while (n !== undefined) {
            lNodes.push(n);
            // remove that dependency from the other nodes
            let nodeId = n.node.processNodeId;
            for (let checkNode of nodes) {
                if (checkNode.dependencies.indexOf(nodeId) > -1) {
                    checkNode.dependencies = checkNode.dependencies.filter(d => d != nodeId);
                    if (checkNode.dependencies.length == 0) {
                        sNodes.push(checkNode);
                    }
                }

            }
            n = sNodes.pop();
        }
        // now all nodes must have empty dependencies
        if (nodes.filter(n => n.dependencies.length > 0).length) {
            return false;
        }
        // all nodes should be in the ordered list
        if (nodes.length !== lNodes.length) {
            return false;
        }
        // populate the execution order list
        for (let orderedNode of lNodes) {
            this.processOrder.push(orderedNode.node);
        }
        return true;
    }

    private createProcesses(): boolean {
        for (let procId in this.gm.processes) {
            let proc = this.gm.processes[procId];
            // todo make sure this is generally included
            if (!proc.objectId) {
                proc.objectId = procId;
            }
            let procInst = this.env.buildProcess(proc, this);
            if (procInst instanceof Error) {
                return false;
            } else {
                if (!procInst.init(this.env)) {
                    return false;
                }
                this.processes[procId] = procInst;
                // register the inports in our process port map
                for (let procInportId in proc.inports) {
                    this.processPortMap[procInportId] = procInst;
                }
                // register the outports in our process port map
                for (let procOutportId in proc.outports) {
                    this.processPortMap[procOutportId] = procInst;
                }
            }
        }
        return true;
    }

    private createConnections(): boolean {
        for (let connectionId in this.gm.connections) {
            let c = this.gm.connections[connectionId];
            // todo make sure objectId is enforeced outside our scope
            c.objectId = connectionId;
            let connection = new CptConnection(c, this);
            this.connections[connectionId] = connection;
            if (!connection.init(this.env) || !this.hazPort(c.destination) || !this.hazPort(c.source)) {
                return false;
            }
        }
        return true;
    }

    private hazPort(portId: string): boolean {
        let procPort = this.processPortMap[portId];
        let inport = this.inports[portId];
        let outport = this.outports[portId];
        let variable = this.variables[portId];

        return procPort !== undefined || inport !== undefined || outport !== undefined || variable !== undefined;
    }

    private createInports(): boolean {
        // todo: check if proc inports and gm inports are synced
        for (let externalInportId in this.proc.inports) {
            let processInport = this.proc.inports[externalInportId];
            if (!processInport.objectId) {
                processInport.objectId = processInport.ref;
            }

            let inport = this.gm.inports[processInport.ref];

            if (inport && processInport) {
                let inportInst = new CptInport(inport, processInport, this);
                this.inports[processInport.ref] = inportInst;
                this.inportsExternalId[externalInportId] = inportInst;
                inportInst.init(this.env);
            } else {
                return false;
            }
        }
        return true;
    }

    private createOutports(): boolean {
        // todo: check if proc inports and gm inports are synced
        for (let externalOutportId in this.proc.outports) {
            let processOutport = this.proc.outports[externalOutportId];
            if (!processOutport.objectId) {
                processOutport.objectId = processOutport.ref;
            }
            let outport = this.gm.outports[processOutport.ref];
            if (outport && processOutport) {
                let outportInst = new CptOutport(outport, processOutport, this);
                this.outports[processOutport.ref] = outportInst;
                this.outportsExternalId[externalOutportId] = outportInst;
                outportInst.init(this.env);
            } else {
                return false;
            }
        }
        return true;
    }

    private createVariables(): boolean {
        for (let variableId in this.gm.variables) {

            let variable = this.gm.variables[variableId];
            let variableInst = new CptVariable(variable, this);
            this.variables[variableId] = variableInst;
            if (!variableInst.init(this.env)) {
                return false;
            }
        }
        return true;
    }

    private initSubNodes(nodes: { [nodeId: string]: CptSimulationLifecycle }): boolean {
        for (let nodeId in nodes) {
            let node = nodes[nodeId];
            if (!node.init(this.env)) {
                return false;
            }
        }

        return true;
    }

    private getAllSimulationSubNodes(): CptSimulationNodeIf[] {
        let subNodes: CptSimulationNodeIf[] = [];
        for (let procId in this.processes) {
            subNodes.push(this.processes[procId]);
        }
        for (let inportId in this.inports) {
            subNodes.push(this.inports[inportId]);
        }
        for (let outportId in this.outports) {
            subNodes.push(this.outports[outportId]);
        }
        for (let connectionId in this.connections) {
            subNodes.push(this.connections[connectionId]);
        }
        for (let variableId in this.variables) {
            subNodes.push(this.variables[variableId]);
        }

        return subNodes;
    }

    // initialize once
    public init(env: CptEnvironmentIf): boolean {
        this.env = env;
        this.env.logProgress("initializing " + this.label);
        if (!this.createInports()) {
            this.env.logProgress("failed to create inports for " + this.label);
        } else if (!this.createOutports()) {
            this.env.logProgress("failed to create outports for " + this.label);
        } else if (!this.createProcesses()) {
            this.env.logProgress("failed to create  processes for " + this.label);
        } else if (!this.createVariables()) {
            this.env.logProgress("failed to create  variable for " + this.label);
        } else if (!this.createConnections()) {
            this.env.logProgress("failed to create  connections for " + this.label);
        } else if (!this.calculateExecutionOrder()) {
            this.env.logProgress("failed to calculate execution order for " + this.label);
        } else {
            this.env.registerSimulationNode(this, this.parent, this.getAllSimulationSubNodes());
            return true;
        }
        return false;
    }
    // reset internal data structures.
    // should be able to re-run from here
    public reset() {
        for (let procId in this.processes) {
            let p = this.processes[procId];
            p.reset();
        }
        for (let inportId in this.inports) {
            this.inports[inportId].reset();
        }
        for (let outportId in this.outports) {
            this.outports[outportId].reset();
        }
        for (let variableId in this.variables) {
            this.variables[variableId].reset();
        }

    }
    // accept load on the inports
    public acceptLoad(load: GraphParam, portId?: string) {
        let inport = this.inports[portId] || this.inportsExternalId[portId];
        if (inport) {
            inport.acceptLoad(load);
        }

    }

    private pushLoadToNextNode(sourceId: string, load: GraphParam) {
        let connections: Connection[] = [];
        for (let connectionId in this.connections) {
            let c = this.connections[connectionId];
            if (c.conn.source === sourceId)
                connections.push(c.conn);
        }
        for (let connection of connections) {
            let destNode = this.processPortMap[connection.destination] || this.variables[connection.destination] || this.outports[connection.destination];
            if (destNode) {
                destNode.acceptLoad(load, connection.destination);
            }
        }
    }

    private pushResponseToPrevNodes(destinationId: string, response: ResponseParam[]) {
        let connections: Connection[] = [];
        for (let connectionId in this.connections) {
            let c = this.connections[connectionId];
            if (c.conn.destination === destinationId)
                connections.push(c.conn);
        }
        for (let connection of connections) {
            let destNode = this.processPortMap[connection.source] || this.variables[connection.source] || this.inports[connection.source];
            if (destNode) {
                destNode.acceptResponse(response, connection.source);
            }
        }
    }

    // process the load internally
    public process() {
        this.env.pushExecStack(this);
        for (let node of this.processOrder) {
            node.process();
            switch (node.nodeType) {
                case 'PROCESSING_ELEMENT':
                case 'GRAPH_MODEL':
                    let procNode = node as CptSimulationProcessIf;
                    for (let procOutportId in procNode.proc.outports) {
                        let load = procNode.yieldLoad(procOutportId);
                        if (load) {
                            this.pushLoadToNextNode(procOutportId, load);
                        }
                    }
                    break;
                case 'NAMED_VARIABLE':
                case 'BROADCAST_VARIABLE':
                case 'PROCESS_INPORT':
                    let load = node.yieldLoad();
                    if (load) {
                        this.pushLoadToNextNode(node.processNodeId, load);
                    }
                    break;
                case 'OUTPORT':
                    // outports just store the data
                    break;
                default:
                    // we shouldnt get here
                    break;
            }
        }
        this.env.popExecStack();
    }


    // yield load on the outports
    public yieldLoad(outportId: string): GraphParam {
        let outport = this.outports[outportId] || this.outportsExternalId[outportId];
        if (outport) {
            return outport.yieldLoad();
        }
    }
    // accept response IP on the outport
    public acceptResponse(response: ResponseParam | ResponseParam[], portId?: string) {
        let outport = this.outports[portId] || this.outportsExternalId[portId];
        if (outport) {
            outport.acceptResponse(response);
        }
    }
    // process the response internally
    public processResponse() {
        this.env.pushExecStack(this);
        for (let i = this.processOrder.length - 1; i >= 0; i--) {
            let node = this.processOrder[i];
            node.processResponse();
            switch (node.nodeType) {
                case 'PROCESSING_ELEMENT':
                case 'GRAPH_MODEL':
                    let procNode = node as CptSimulationProcessIf;
                    for (let procInportId in procNode.proc.inports) {
                        let response = procNode.yieldResponse(procInportId);
                        if (response) {
                            this.pushResponseToPrevNodes(procInportId, response);
                        }
                    }
                    break;
                case 'NAMED_VARIABLE':
                case 'BROADCAST_VARIABLE':
                case 'PROCESS_OUTPORT':
                    let response = node.yieldResponse();
                    if (response) {
                        this.pushResponseToPrevNodes(node.processNodeId, response);
                    }
                    break;
                default:
                    // we shouldn't get here
                    break;
            }
        }
        this.env.popExecStack();
    }
    // yield responses on the inport
    public yieldResponse(inportId?: string): ResponseParam[] {
        let inport = this.inports[inportId] || this.inportsExternalId[inportId];
        if (inport) {
            return inport.yieldResponse();
        } else {
            return null;
        }
    }
    // re-calculate output based on global state.
    public postProcess() {

    }
    // finalize all internal calculation and emit results
    public finalize() {

    }

}
