import { CptProcessingElement } from '../cpt-processing-element';
import { Process, Inport, Outport, ProcessInterfaceDescription } from '@cpt/capacity-planning-simulation-types';
import { CptSimulationProcessIf } from '../cpt-object';
import { addResponseGroups, hasResponse, makeHopResponse } from "../cpt-response-ops";
import { ResponseParam } from "@cpt/capacity-planning-simulation-types/lib";

export var CptPeAddHopDescription: ProcessInterfaceDescription = {
    objectId: 'f68eef3d-ac8c-4e0e-9c0d-b541c7c7915b',
    objectType: 'PROCESS_INTERFACE_DESCRIPTION',
    implementation: 'PROCESSING_ELEMENT',
    name: 'Add Hop',
    description: 'Add a network hop to the response',
    inports: {
        '24c2198c-57be-4b24-b113-93aa782d0626': {
            name: 'In',
            objectId: '24c2198c-57be-4b24-b113-93aa782d0626',
            objectType: 'INPORT',
            requiredTypes: [],
            desiredUnits: [],
            generatesResponse: 'ALWAYS',
            index: 0,
            description: 'Input of Load'
        } as Inport
    },
    outports: {
        '9f1b8dfd-fda6-40f2-90cc-3bcbaf576a31': {
            name: 'Out',
            objectId: '9f1b8dfd-fda6-40f2-90cc-3bcbaf576a31',
            objectType: 'OUTPORT',
            types: [],
            index: 0,
            description: 'Output of Load'
        } as Outport
    },
    portTemplates: {}
}

export class CptPeAddHop extends CptProcessingElement {
    public readonly INPORT_LOAD_ID = '24c2198c-57be-4b24-b113-93aa782d0626';
    public readonly OUTPORT_ID = '9f1b8dfd-fda6-40f2-90cc-3bcbaf576a31';


    constructor(public proc: Process, public parent: CptSimulationProcessIf) {
        super(proc, CptPeAddHopDescription, parent);
        this.label = proc.label || CptPeAddHopDescription.name;
    }


    protected _process() {
        let inport = this.inports[this.INPORT_LOAD_ID];
        let outport = this.outports[this.OUTPORT_ID];
        // run processing here, to keep the state in sync
        // values are actually only needed, when processing the responses
        this.inports[this.INPORT_LOAD_ID].process();

        inport.process();
        let load = inport.yieldLoad();
        if (load) {
            outport.acceptLoad(load);
            outport.process();
        }
    }
    protected _processResponse() {
        const inport = this.inports[this.INPORT_LOAD_ID];
        const outport = this.outports[this.OUTPORT_ID];

        outport.processResponse();
        const inResponse = outport.yieldResponse();


        const hopResponse = makeHopResponse(1);
        let response: ResponseParam[] = [hopResponse];

        if (hasResponse(inResponse)) {
            response = addResponseGroups([response, inResponse]);
        }
        inport.acceptResponse(response);
        inport.processResponse();
    }
}
