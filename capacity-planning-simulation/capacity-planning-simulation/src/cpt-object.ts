import { GraphParam } from '@cpt/capacity-planning-simulation-types';
import { Connection, NodeTypes, Process } from '@cpt/capacity-planning-simulation-types';
import * as sha1 from 'sha1';
import { ResponseParam, SimulationMessage, SimulationMessageCode } from "@cpt/capacity-planning-simulation-types";


export interface CptOutput { }

export interface CptObjectIf {
}

export interface CptProcessNodeIf extends CptObjectIf {
    nodeType: NodeTypes;
    processNodeId: string;
    ref: string;
    releaseNr?: number;
    version?: string;

}

export interface CptSimulationNodeIf extends CptProcessNodeIf {
    simulationNodeId: string;
    getSimulationNodePath(): string[];
    label?: string;
}


export interface CptSimulationActiveNodeIf extends CptSimulationNodeIf, CptSimulationLifecycle {

}

export interface CptSimulationProcessIf extends CptSimulationActiveNodeIf {
    proc: Process

}


export interface CptEnvironmentIf {
    findObject<T>(id: string): T;
    findInstance<T>(id: string): T;
    registerInstance<T>(id: string, instance: T);
    registerSimulationNode(node: CptSimulationNodeIf, parent?: CptSimulationNodeIf, children?: CptSimulationNodeIf[]);
    buildProcess(processConfiguration: Process, parent: CptSimulationProcessIf): CptSimulationProcessIf | Error;
    storeRawData(sender: CptSimulationNodeIf, data: GraphParam | SimulationMessage | ResponseParam[]);
    storeRawResponse(sender: CptSimulationNodeIf, data: ResponseParam[]);
    getCurrentSimulationDate(): string;

    pushExecStack(node: CptSimulationNodeIf);
    popExecStack();

    // this is for logging simulation results
    log(sender: CptSimulationNodeIf, i: any);
    // if 'standalone' is set warnings of the same code and sender will not get
    // aggregated to a single warning
    warn(sender: CptSimulationNodeIf, code: SimulationMessageCode, desc?: string, inhibitDeduplication?: boolean);
    output(sender: CptSimulationProcessIf, o: CptOutput);

    // this is for logging runtime info
    logProgress(i: any);

}



export interface CptBasicSimulationLifecycle {
    // initialize once
    init(env: CptEnvironmentIf): boolean;
    // reset internal data structures.
    // should be able to re-run from here
    reset();
    // process the load internally
    process();
    // re-calculate output based on global state.
    postProcess();
    // finalize all internal calculation and emit results
    finalize();
}




export interface CptSimulationLifecycle extends CptBasicSimulationLifecycle {
    // accept load on the inports
    acceptLoad(load: GraphParam, portId?: string);
    // yield load on the outports
    yieldLoad(portId?: string): GraphParam;
    // accept response IP on the outport
    acceptResponse(response: ResponseParam | ResponseParam[], portId?: string);
    // process the response internally
    processResponse();
    // yield responses on the inport
    yieldResponse(portId?: string): ResponseParam[];
}

export interface CptInformationPackage extends CptObjectIf {
    p: GraphParam;
    c: Connection;
    reverse?: boolean;
}

export function genSimId(nodepath: string[], processId: string) {
    let out: string = processId;
    for (let n of nodepath) {
        out = n + ":" + out;
    }
    return sha1(out);
}

export class CptSimError extends Error {
    constructor(public code: SimulationMessageCode, msg: string) {
        super(msg);
    }
}
