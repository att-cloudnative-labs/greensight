import { CptEnvironmentIf, CptSimulationProcessIf, CptSimulationNodeIf, CptOutput, CptInformationPackage, genSimId, CptSimulationActiveNodeIf } from './cpt-object';
import { GraphModel, Process, NodeTypes, Connection, Variable, GraphParam } from '@cpt/capacity-planning-simulation-types';
import { aggregateLoad } from './cpt-load-ops';
import { aggregateResponse } from './cpt-response-ops';



export class CptVariable implements CptSimulationActiveNodeIf {

    env: CptEnvironmentIf;
    nodeType: NodeTypes;
    ref: string;
    version?: string;
    simulationNodeId: string;
    processNodeId: string;
    getSimulationNodePath(): string[] {
        return this.parentNodePath.concat(this.simulationNodeId);
    }
    label?: string;

    private parentNodePath: string[] = [];
    inputLoad: GraphParam[] = [];
    load: GraphParam = null;

    inputResponse: GraphParam[] = [];
    response: GraphParam = null;


    constructor(public variable: Variable, public parent: CptSimulationProcessIf) {
        if (parent) {
            this.parentNodePath = parent.getSimulationNodePath();
        }
        // process node id doesn't really make sense for variables
        // just populate this for symetry reasons
        this.processNodeId = variable.objectId;
        this.ref = variable.objectId;
        this.nodeType = variable.objectType;
        this.simulationNodeId = genSimId(this.parentNodePath, this.processNodeId);
        this.label = variable.label;
    }

    // initialize once
    public init(env: CptEnvironmentIf): boolean {
        this.env = env;
        this.env.registerSimulationNode(this, this.parent);
        return true;
    }

    public reset() {
        this.inputLoad = [];
        this.load = null;
        this.inputResponse = [];
        this.response = null;

    }
    // accept load on the inports
    public acceptLoad(load: GraphParam, portId?: string) {
        this.inputLoad.push(load);
    }
    // process the load internally
    public process() {
        this.load = aggregateLoad(this.inputLoad);
        if (this.load) {
            this.env.storeRawData(this, this.load);
        }
    }
    // yield load on the outports
    public yieldLoad(outportId: string): GraphParam {
        return this.load;
    }
    // accept response IP on the outport
    public acceptResponse(response: GraphParam, portId?: string) {
        this.inputResponse.push(response);

    }
    // process the response internally
    public processResponse() {
        if (this.inputResponse.length > 0) {
            this.response = aggregateResponse(this.inputResponse);
        }
    }
    // yield responses on the inport
    public yieldResponse(inportId?: string): GraphParam {
        return this.response;
    }

    // re-calculate output based on global state.
    public postProcess() {

    }
    // finalize all internal calculatio and emit results
    public finalize() {

    }

}