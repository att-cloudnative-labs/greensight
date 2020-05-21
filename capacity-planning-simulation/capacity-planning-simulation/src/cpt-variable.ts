import { CptEnvironmentIf, CptSimulationProcessIf, genSimId, CptSimulationActiveNodeIf } from './cpt-object';
import { NodeTypes, Variable, GraphParam } from '@cpt/capacity-planning-simulation-types';
import { aggregateParams } from './cpt-load-ops';
import { combineResponseGroups } from './cpt-response-ops';
import { ResponseParam } from "@cpt/capacity-planning-simulation-types/lib";



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

    inputResponse: ResponseParam[][] = [];
    response: ResponseParam[] = null;


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
        this.env.pushExecStack(this);
        this.load = aggregateParams(this.inputLoad);
        if (this.load) {
            this.env.storeRawData(this, this.load);
        }
        this.env.popExecStack();
    }
    // yield load on the outports
    public yieldLoad(outportId: string): GraphParam {
        return this.load;
    }
    // accept response IP on the outport
    public acceptResponse(response: ResponseParam | ResponseParam[], portId?: string) {
        if (response instanceof Array) {
            this.inputResponse.push(response);
        } else {
            this.inputResponse.push([response]);
        }
    }
    // process the response internally
    public processResponse() {
        this.env.pushExecStack(this);
        if (this.inputResponse.length > 0) {
            this.response = combineResponseGroups(this.inputResponse);
        }
        this.env.popExecStack();
    }
    // yield responses on the inport
    public yieldResponse(inportId?: string): ResponseParam[] {
        return this.response;
    }

    // re-calculate output based on global state.
    public postProcess() {

    }
    // finalize all internal calculation and emit results
    public finalize() {

    }

}
