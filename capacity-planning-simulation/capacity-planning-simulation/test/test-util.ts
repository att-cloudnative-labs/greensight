
import { CptSimulationProcessIf, CptEnvironmentIf } from '../src/index';
import {
    Process,
    ProcessInterfaceDescription,
    ProcessInport,
    ProcessOutport,
    NumberParam,
    BooleanParam,
    Aspect,
    StringParam,
    ResponseNumberParam,
    processPopulateStaticPorts,
    processAddTemplate,
    GraphConfig,
    ProcessPortTemplate,
    ResponseAspect, ResponseValueEntry, ResponseValue, ResponseParam
} from '@cpt/capacity-planning-simulation-types';
import { expect } from 'chai';
import { getResponseValueEntry, isResponseNumber } from "../src/cpt-response-ops";
import { CptSimulationNodeIf } from "../lib";


export function getRandom(length?: number): string {
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
        outports: {},
        name: pid.name
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
        outports: {},
        name: 'parent'
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
        output: (sender, o) => { },
        logProgress: (i) => { },
        getCurrentSimulationDate: () => '2019-04',
        popExecStack: () => { },
        pushExecStack: (node: CptSimulationNodeIf) => { }
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

export function makeBool(b: boolean): BooleanParam {
    return {
        type: 'BOOLEAN',
        value: b
    }
}

export function makeAspectNumber(i: number, aspects?: Aspect[] | Aspect, unit?: string): NumberParam {
    return {
        type: 'NUMBER',
        value: i,
        aspects: aspects instanceof Array ? aspects : [aspects],
        unit: unit,
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

export function assertSplitEntry(a: ResponseValueEntry, b: ResponseValueEntry) {
    expect(a).to.not.equal(null);
    expect(b).to.not.equal(null);
    a.value.should.equal(b.value);
    a.freq.should.equal(b.freq);
}

export function assertSplit(a: ResponseValue | number, b: ResponseValue) {
    const compA = typeof a === 'number' ? [{ freq: 1000, value: a }] : a;
    expect(compA).to.not.equal(null);
    expect(b).to.not.equal(null);
    expect(compA.length).to.equal(b.length);
    for (let e of compA) {
        let comp = getResponseValueEntry(b, e.value);
        expect(comp).to.not.equal(null);
        assertSplitEntry(e, comp);
    }
}

export function assertResponseGroupMember(a: ResponseParam[]): ResponseNumberParam {
    const member = a instanceof Array && a.length > 0 ? a[0] : null;
    expect(member).to.not.equal(null);
    expect(isResponseNumber(member)).to.equal(true);
    return member as ResponseNumberParam;
}

export function assertLatencyResponseNumber(a: ResponseParam | ResponseParam[]): ResponseNumberParam {
    const member = a instanceof Array ? assertResponseGroupMember(a) : a;
    expect(member).to.not.equal(null);
    expect(isResponseNumber(member)).to.equal(true);
    expect(member.category).to.equal('latency');
    return member as ResponseNumberParam;
}

export function makeResponseEnvironment() {
    const aspectSeason: Aspect = {
        name: 'season',
        relative: true,
        slices: { 'spring': 40, 'summer': 40, 'autumn': 40, 'winter': 40 }
    };

    const aspectShortSeason: Aspect = {
        name: 'season',
        relative: true,
        slices: { 'summer': 40, 'winter': 40 }
    };

    const aspectLeapyear: Aspect = {
        name: 'leapyear',
        slices: { 'yes': 25, 'no': 75 }
    };

    const responseAspect1: ResponseAspect = {
        type: 'RESPONSE_BREAKDOWN',
        name: 'platform',
        slices: { 'android': [{ value: 100, freq: 500 }, { value: 200, freq: 500 }], 'ios': [{ value: 50, freq: 500 }, { value: 300, freq: 500 }] }
    };

    const responseAspect2: ResponseAspect = {
        type: 'RESPONSE_BREAKDOWN',
        name: 'platform',
        slices: { 'android': [{ value: 50, freq: 1000 }], 'ios': [{ value: 10, freq: 1000 }] }
    };

    const responseAspectWinter1: ResponseAspect = {
        type: 'RESPONSE_BREAKDOWN',
        name: 'season',
        slices: { 'winter': [{ value: 40, freq: 1000 }] }
    };
    const responseAspectWinter2: ResponseAspect = {
        type: 'RESPONSE_BREAKDOWN',
        name: 'leapyear',
        slices: { 'yes': [{ value: 40, freq: 1000 }], 'no': [{ value: 40, freq: 1000 }] }
    };

    const winterResponse: ResponseNumberParam = {
        type: 'RESPONSE_NUMBER',
        category: 'latency',
        unit: 'ms',
        value: [{ value: 40, freq: 1000 }],
        aspects: [responseAspectWinter1, responseAspectWinter2]
    };

    const responseAspectSummer1: ResponseAspect = {
        type: 'RESPONSE_BREAKDOWN',
        name: 'season',
        slices: { 'summer': [{ value: 60, freq: 1000 }] }
    };
    const responseAspectSummer2: ResponseAspect = {
        type: 'RESPONSE_BREAKDOWN',
        name: 'leapyear',
        slices: { 'yes': [{ value: 60, freq: 1000 }], 'no': [{ value: 60, freq: 1000 }] }
    };

    const summerResponse: ResponseNumberParam = {
        type: 'RESPONSE_NUMBER',
        category: 'latency',
        unit: 'ms',
        value: [{ value: 60, freq: 1000 }],
        aspects: [responseAspectSummer1, responseAspectSummer2]
    };

    const leapYesResponse: ResponseNumberParam = {
        type: 'RESPONSE_NUMBER',
        category: 'latency',
        unit: 'ms',
        value: [{ value: 1000, freq: 1000 }],
        aspects: [
            { type: "RESPONSE_BREAKDOWN", name: 'leapyear', slices: { yes: [{ value: 1000, freq: 1000 }] } },
            {
                type: "RESPONSE_BREAKDOWN", name: 'season', slices: {
                    winter: [{ value: 1000, freq: 1000 }], summer: [{ value: 1000, freq: 1000 }],
                }
            }
        ]
    };
    const leapNoResponse: ResponseNumberParam = {
        type: 'RESPONSE_NUMBER',
        category: 'latency',
        unit: 'ms',
        value: [{ value: 5, freq: 1000 }],
        aspects: [
            { type: "RESPONSE_BREAKDOWN", name: 'leapyear', slices: { no: [{ value: 5, freq: 1000 }] } },
            {
                type: "RESPONSE_BREAKDOWN", name: 'season', slices: {
                    winter: [{ value: 5, freq: 1000 }], summer: [{ value: 5, freq: 1000 }],
                }
            }
        ]
    };

    const seasonsAggregate: ResponseNumberParam = {
        "type": "RESPONSE_NUMBER",
        "unit": "ms",
        "category": "latency",
        "value": [
            {
                "freq": 500,
                "value": 60
            },
            {
                "freq": 500,
                "value": 40
            }
        ],
        "aspects": [
            {
                "type": "RESPONSE_BREAKDOWN",
                "name": "leapyear",
                "slices": {
                    "yes": [
                        {
                            "freq": 500,
                            "value": 60
                        },
                        {
                            "freq": 500,
                            "value": 40
                        }
                    ],
                    "no": [
                        {
                            "freq": 500,
                            "value": 60
                        },
                        {
                            "freq": 500,
                            "value": 40
                        }
                    ]
                }
            },
            {
                "type": "RESPONSE_BREAKDOWN",
                "name": "season",
                "slices": {
                    "summer": [
                        {
                            "value": 60,
                            "freq": 1000
                        }
                    ],
                    "winter": [
                        {
                            "value": 40,
                            "freq": 1000
                        }
                    ]
                }
            }
        ]
    };

    const leapYearAggregate: ResponseNumberParam = {
        "type": "RESPONSE_NUMBER",
        "unit": "ms",
        "category": "latency",
        "value": [
            {
                "freq": 250,
                "value": 1000
            },
            {
                "freq": 750,
                "value": 5
            }
        ],
        "aspects": [
            {
                "type": "RESPONSE_BREAKDOWN",
                "name": "season",
                "slices": {
                    "winter": [
                        {
                            "freq": 250,
                            "value": 1000
                        },
                        {
                            "freq": 750,
                            "value": 5
                        }
                    ],
                    "summer": [
                        {
                            "freq": 250,
                            "value": 1000
                        },
                        {
                            "freq": 750,
                            "value": 5
                        }
                    ]
                }
            },
            {
                "type": "RESPONSE_BREAKDOWN",
                "name": "leapyear",
                "slices": {
                    "yes": [
                        {
                            "value": 1000,
                            "freq": 1000
                        }
                    ],
                    "no": [
                        {
                            "value": 5,
                            "freq": 1000
                        }
                    ]
                }
            }]
    };

    const serialAggregate = {
        "type": "RESPONSE_NUMBER",
        "split": [
            {
                "freq": 125,
                "value": 1060
            },
            {
                "freq": 375,
                "value": 65
            },
            {
                "freq": 125,
                "value": 1040
            },
            {
                "freq": 375,
                "value": 45
            }
        ],
        "category": "latency",
        "unit": "ms",
        "value": 303.75,
        "aspects": [
            {
                "name": "leapyear",
                "slices": {
                    "yes": [
                        {
                            "freq": 500,
                            "value": 1060
                        },
                        {
                            "freq": 500,
                            "value": 1040
                        }
                    ],
                    "no": [
                        {
                            "freq": 500,
                            "value": 65
                        },
                        {
                            "freq": 500,
                            "value": 45
                        }
                    ]
                },
                "type": "RESPONSE_BREAKDOWN"
            },
            {
                "name": "season",
                "slices": {
                    "summer": [
                        {
                            "freq": 250,
                            "value": 1060
                        },
                        {
                            "freq": 750,
                            "value": 65
                        }
                    ],
                    "winter": [
                        {
                            "freq": 250,
                            "value": 1040
                        },
                        {
                            "freq": 750,
                            "value": 45
                        }
                    ]
                },
                "type": "RESPONSE_BREAKDOWN"
            }
        ]
    };

    const parallelAggregate: ResponseNumberParam = {
        "type": "RESPONSE_NUMBER",
        "value": [
            {
                "freq": 250,
                "value": 1000
            },
            {
                "freq": 375,
                "value": 60
            },
            {
                "freq": 375,
                "value": 40
            }
        ],
        "category": "latency",
        "unit": "ms",
        "aspects": [
            {
                "name": "leapyear",
                "slices": {
                    "yes": [
                        {
                            "freq": 1000,
                            "value": 1000
                        }
                    ],
                    "no": [
                        {
                            "freq": 500,
                            "value": 60
                        },
                        {
                            "freq": 500,
                            "value": 40
                        }
                    ]
                },
                "type": "RESPONSE_BREAKDOWN"
            },
            {
                "name": "season",
                "slices": {
                    "summer": [
                        {
                            "freq": 250,
                            "value": 1000
                        },
                        {
                            "freq": 750,
                            "value": 60
                        }
                    ],
                    "winter": [
                        {
                            "freq": 250,
                            "value": 1000
                        },
                        {
                            "freq": 750,
                            "value": 40
                        }
                    ]
                },
                "type": "RESPONSE_BREAKDOWN"
            }
        ]
    };


    return {
        aspectSeason: aspectSeason,
        aspectShortSeason: aspectShortSeason,
        aspectLeapyear: aspectLeapyear,
        responseAspect1: responseAspect1,
        responseAspect2: responseAspect2,
        winterResponse: winterResponse,
        summerResponse: summerResponse,
        seasonsAggregate: seasonsAggregate,
        leapYearAggregate: leapYearAggregate,
        leapNoResponse: leapNoResponse,
        leapYesResponse: leapYesResponse,
        serialAggregate: serialAggregate,
        parallelAggregate: parallelAggregate
    }


}
