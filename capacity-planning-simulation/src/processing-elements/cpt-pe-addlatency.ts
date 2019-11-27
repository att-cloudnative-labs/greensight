import { CptProcessingElement } from '../cpt-processing-element';
import { GraphModel, Process, Inport, Outport, ProcessInterfaceDescription, NormalDistNumberParam, ResponseNumberParam, ResponseAspect } from '@cpt/capacity-planning-simulation-types';
import { CptSimulationProcessIf } from '../cpt-object';
import { isNumber } from '../cpt-load-ops';
import { sampleNormal } from '../cpt-math-ops';
import { isLatencyResponse, addLatencyResponse, makeLatencyResponse } from '../cpt-response-ops';
import { Normal } from 'essy-distribution';
import { SampleStat } from 'essy-stats';
import * as MersenneTwister from 'mersenne-twister';

export var CptPeAddLatencyDescription: ProcessInterfaceDescription = {
    objectId: "acbb16d9-1c4c-4930-a3b4-28a7c33b54e4",
    objectType: 'PROCESS_INTERFACE_DESCRIPTION',
    implementation: 'PROCESSING_ELEMENT',
    name: 'Add Latency',
    inports: {
        '38563813-210b-4458-8172-4138186966a8': {
            objectId: '38563813-210b-4458-8172-4138186966a8',
            objectType: 'INPORT',
            name: 'In',
            requiredTypes: ['NUMBER'],
            desiredUnits: ['tps'],
            generatesResponse: 'ALWAYS',
            index: 0
        } as Inport,
        'edc9a0e8-2ed1-4a8d-9944-b4b11a95ddd4': {
            objectId: 'edc9a0e8-2ed1-4a8d-9944-b4b11a95ddd4',
            objectType: 'INPORT',
            name: 'Mean',
            requiredTypes: ['NUMBER'],
            desiredUnits: [],
            generatesResponse: 'NEVER',
            index: 1
        } as Inport,
        'fd8cf9bd-0390-4152-9db2-f3c63bee2124': {
            objectId: 'fd8cf9bd-0390-4152-9db2-f3c63bee2124',
            objectType: 'INPORT',
            name: 'StdDev',
            requiredTypes: ['NUMBER'],
            desiredUnits: [],
            generatesResponse: 'NEVER',
            index: 2
        } as Inport,
    },
    outports: {
        '8421bb7b-908b-44e6-879e-b3b32c8815d3': {
            objectId: '8421bb7b-908b-44e6-879e-b3b32c8815d3',
            objectType: 'OUTPORT',
            name: 'Out',
            types: ['NUMBER'],
            unit: 'tps',
            index: 0
        } as Outport
    },
    portTemplates: {}
}


export class CptPeAddLatency extends CptProcessingElement {
    public readonly INPORT_LOAD_ID = '38563813-210b-4458-8172-4138186966a8';
    public readonly INPORT_MEAN_ID = 'edc9a0e8-2ed1-4a8d-9944-b4b11a95ddd4';
    public readonly INPORT_STDDEV_ID = 'fd8cf9bd-0390-4152-9db2-f3c63bee2124';
    public readonly OUTPORT_ID = '8421bb7b-908b-44e6-879e-b3b32c8815d3';

    constructor(public proc: Process, public parent: CptSimulationProcessIf) {
        super(proc, CptPeAddLatencyDescription, parent);
        this.label = proc.label || CptPeAddLatencyDescription.name;
    }

    // no impl yet. just forward load
    public process() {
        let inport = this.inports[this.INPORT_LOAD_ID];
        let outport = this.outports[this.OUTPORT_ID];
        // run processing here, to keep the state in sync
        // values are actually only needed, when processing the responses
        this.inports[this.INPORT_MEAN_ID].process();
        this.inports[this.INPORT_STDDEV_ID].process();

        inport.process();
        let load = inport.yieldLoad();
        if (load) {
            outport.acceptLoad(load);
            outport.process();
        }
    }
    public processResponse() {
        let inport = this.inports[this.INPORT_LOAD_ID];
        let outport = this.outports[this.OUTPORT_ID];
        let meanPort = this.inports[this.INPORT_MEAN_ID];
        let stddevPort = this.inports[this.INPORT_STDDEV_ID];

        outport.processResponse();

        let mean = meanPort.yieldLoad();
        let stddev = stddevPort.yieldLoad();
        let inResponse = outport.yieldResponse();

        if (isNumber(mean) || isLatencyResponse(inResponse)) {
            let latency = 0;
            if (isNumber(mean)) {
                latency = mean.value;
                if (isNumber(stddev)) {
                    latency = sampleNormal(mean.value, stddev.value);
                }
            }
            let response: ResponseNumberParam = makeLatencyResponse(latency);
            if (isLatencyResponse(inResponse)) {
                response = addLatencyResponse(inResponse, latency);
            }
            let sourceTag: ResponseAspect = {
                type: 'RESPONSE_TAG',
                slices: { "added": [{ value: latency, freq: 1000 }] },
                name: '__source__' + this.simulationNodeId
            }
            if (response.aspects !== undefined) {
                response.aspects.push(sourceTag);
            } else {
                response.aspects = [sourceTag];
            }
            inport.acceptResponse(response);
            inport.processResponse();
        }

    }
}
