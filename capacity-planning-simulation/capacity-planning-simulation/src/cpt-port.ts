import { CptEnvironmentIf, CptSimulationProcessIf, CptSimulationActiveNodeIf, genSimId } from './cpt-object';
import { NodeTypes, Inport, Outport, GraphParam, ProcessInport, ProcessOutport, ProcessPort, Aspect } from '@cpt/capacity-planning-simulation-types';
import { maxResponseGroups } from './cpt-response-ops';
import { aggregateParams } from './cpt-load-ops';
import { NumberParam, ResponseParam, SimulationMessageCode } from "@cpt/capacity-planning-simulation-types";

export class CptPort implements CptSimulationActiveNodeIf {

    env: CptEnvironmentIf;
    nodeType: NodeTypes;
    ref: string;
    simulationNodeId: string;
    getSimulationNodePath(): string[] {
        return this.parentNodePath.concat(this.simulationNodeId);
    }
    label?: string;

    inputLoad: GraphParam[] = [];
    load: GraphParam = null;

    inputResponse: ResponseParam[][] = [];
    response: ResponseParam[] = null;

    private parentNodePath: string[] = [];

    constructor(public processPort: ProcessPort, public processNodeId: string, public parent: CptSimulationProcessIf) {
        if (parent) {
            this.parentNodePath = parent.getSimulationNodePath();
        }
        this.simulationNodeId = genSimId(this.parentNodePath, this.processNodeId);
        this.ref = processPort.ref;

    }
    // initialize once
    public init(env: CptEnvironmentIf): boolean {
        this.env = env;
        this.env.registerSimulationNode(this, this.parent);
        return true;
    }
    // reset internal data structures.
    // should be able to re-run from here
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
        //todo: aggregate the load here
        if (this.inputLoad.length > 0) {
            this.load = aggregateParams(this.inputLoad);
        }
        this.env.popExecStack();
    }
    // yield load on the outports
    public yieldLoad(outportId?: string): GraphParam {
        return this.load;
    }
    // accept response IP on the outport
    public acceptResponse(response: ResponseParam | ResponseParam[], portId?: string) {
        if (response instanceof Array) {
            this.inputResponse.push(response)
        } else {
            this.inputResponse.push([response]);
        }
    }
    // process the response internally
    public processResponse() {
        this.env.pushExecStack(this);
        if (this.inputResponse.length > 0) {
            this.response = maxResponseGroups(this.inputResponse);
            if (this.response) {
                this.env.storeRawResponse(this, this.response);
            }
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
    // finalize all internal calculations and emit results
    public finalize() {

    }

    // allow PEs to issue warnings as a port so  PE dependent logic
    // can stay in a single place
    public warn(code: SimulationMessageCode, desc?: string, inhibitDeduplication?: boolean) {
        this.env.pushExecStack(this);
        this.env.warn(this, code, desc, inhibitDeduplication);
        this.env.popExecStack();
    }

}

export class CptInport extends CptPort {
    public param?: GraphParam;
    nodeType: NodeTypes = 'PROCESS_INPORT';
    constructor(public inport: Inport, public processInport: ProcessInport, public parent: CptSimulationProcessIf) {
        super(processInport, processInport.objectId, parent);
        this.label = inport.name;
    }

    public process() {

        // this will aggregate everything into this.load
        super.process();
        let load = this.load || this.processInport.param || this.inport.defaultParam;
        if (load) {
            if (load.type === 'ASPECT') {
                let aspNum: NumberParam = {
                    type: 'NUMBER',
                    value: 0,
                    aspects: []
                };
                // FIXME: have to be reported as aspect number because plain aspects are
                // not picked up correctly
                let aspect: Aspect = {
                    name: load.value.name,
                    slices: {}
                };
                let sum = 0;
                for (let slice in load.value.slices) {
                    // FIXME: faulty inport params have strings instead of numbers
                    if (load.value.slices[slice]) {
                        aspect.slices[slice] = parseFloat(load.value.slices[slice].toString())
                        sum += Math.abs(load.value.slices[slice]);
                    }
                }
                aspNum.value = sum;
                aspNum.aspects = [aspect];

                this.env.storeRawData(this, aspNum);
            } else {
                this.env.storeRawData(this, load);
            }
        }
        this.load = load;
    }
}


export class CptOutport extends CptPort {
    nodeType: NodeTypes = 'PROCESS_OUTPORT';
    constructor(public outport: Outport, public processOutport: ProcessOutport, public parent: CptSimulationProcessIf) {
        super(processOutport, processOutport.objectId, parent);
        this.label = outport.name;
    }
    public process() {
        // this will aggregate everything into this.load
        super.process();
        if (this.load)
            this.env.storeRawData(this, this.load);
    }
}
