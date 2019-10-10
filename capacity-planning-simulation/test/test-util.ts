
import { CptSimulationProcessIf, CptEnvironmentIf } from '../src/index';
import { Process, ProcessInterfaceDescription, ProcessInport, ProcessOutport, NumberParam, BooleanParam, Aspect, AspectNumberParam, NormalDistNumberParam, StringParam, ResponseNumberParam, processPopulateStaticPorts, processAddTemplate, GraphConfig, ProcessPortTemplate } from '../types/src/index';
import { expect, should } from 'chai';


function getRandom(length?: number): string {
    var r = "";
    if (!length) {
        length = 10;
    }
    while (r.length < length) {
        r += Math.random().toString(36).substr(2);
    }
    return r.substr(0, length);
}

export function generatePeProcess(pid: ProcessInterfaceDescription): Process {
    let peProcess: Process = {
        objectId: '...',
        objectType: 'PROCESS',
        type: 'PROCESSING_ELEMENT',
        ref: pid.objectId,
        inports: {},
        outports: {}
    }

    processPopulateStaticPorts(peProcess, pid, getRandom);
    return peProcess;
}

function getPortByRefId(process: Process, portId: string): ProcessInport | ProcessOutport {

    for (let inportId in process.inports) {
        let inport = process.inports[inportId];
        if (inport.ref === portId)
            return inport;
    }
    for (let outportId in process.outports) {
        let outport = process.outports[outportId];
        if (outport.ref === portId)
            return outport;
    }
    return null;
}

export function setProcessPortConfiguration(process: Process, portId: string, config: GraphConfig) {
    let port = process.inports[portId] || process.outports[portId] || getPortByRefId(process, portId);
    if (port) {
        port.config = config;
    }
}

// this will only work for templates with a single port
// returns the id of the port created
export function addTemplate(process: Process, template: ProcessPortTemplate): string {
    let groupId = processAddTemplate(process, template, getRandom);
    for (let inportId in process.inports) {
        let inport = process.inports[inportId];
        if (inport.templateGroupId === groupId)
            return inportId
    }
    for (let outportId in process.outports) {
        let outport = process.outports[outportId];
        if (outport.templateGroupId === groupId)
            return outportId;
    }
    return null;
}
export function genTestParent(): CptSimulationProcessIf {
    let parentProcess: Process = {
        objectId: '...',
        objectType: 'PROCESS',
        type: 'GRAPH_MODEL',
        ref: 'parent',
        inports: {},
        outports: {}
    }
    let cptsimproc: CptSimulationProcessIf = {
        proc: parentProcess,
        simulationNodeId: 'simulationNodeid',
        getSimulationNodePath: () => [],
        ref: 'parentRef',
        processNodeId: parentProcess.objectId,
        nodeType: 'GRAPH_MODEL',
        init: (env) => true,
        reset: () => { },
        process: () => { },
        postProcess: () => { },
        finalize: () => { },
        acceptLoad: (load, portId) => { },
        yieldLoad: (portId) => null,
        acceptResponse: (response, portId) => { },
        processResponse: () => { },
        yieldResponse: (portid) => null
    }
    return cptsimproc;
}

export function genTestEnvironment(): CptEnvironmentIf {
    let testEnv: CptEnvironmentIf = {
        findObject: (id) => null,
        findInstance: (id) => null,
        registerInstance: (id) => null,
        registerSimulationNode: (node, parent, children) => { },
        buildProcess: (proc, parent) => null,
        storeRawData: (sender, data) => { },
        storeRawResponse: (sender, data) => { },
        log: (sender, i) => { },
        warn: (sender, i, blank) => { },
        error: (sender, i, blank, fatal) => { },
        output: (sender, o) => { },
        logProgress: (i) => { },
        getCurrentSimulationDate: () => '2019-04'
    };
    return testEnv;
}


export function makeNum(i: number, unit?: string): NumberParam {
    return {
        type: 'NUMBER',
        value: i,
        unit: unit
    }
}

export function makeDistNum(i: number, stdDev: number, unit?: string): NormalDistNumberParam {
    return {
        type: 'NORMAL_DIST_NUMBER',
        value: i,
        stdDev: stdDev,
        unit: unit
    }
}


export function makeBool(b: boolean): BooleanParam {
    return {
        type: 'BOOLEAN',
        value: b
    }
}

export function makeAspectNumber(i: number, aspects?: Aspect[] | Aspect, unit?: string, stdDev?: number): AspectNumberParam {
    return {
        type: 'ASPECT_NUMBER',
        value: i,
        aspects: aspects instanceof Array ? aspects : [aspects],
        unit: unit,
        stdDev: stdDev
    }
}

export function makeString(s: string): StringParam {
    return {
        type: 'STRING',
        value: s
    }
}

export function assertAspect(aspect: Aspect, slices: { [label: string]: number }, name?: string) {
    if (name) {
        aspect.name.should.equal(name);
    }
    expect(aspect).to.not.equal(null);
    expect(aspect).to.not.equal(undefined);
    for (let label in slices) {
        slices[label].should.equal(aspect.slices[label]);
    }
    // todo: do we want to check for extra slices as well?
}
