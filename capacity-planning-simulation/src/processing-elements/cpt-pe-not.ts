import { ProcessInterfaceDescription, Inport, Outport, Process, BooleanParam } from "@cpt/capacity-planning-simulation-types";
import { CptProcessingElement } from "../cpt-processing-element";
import { CptSimulationProcessIf } from "../cpt-object";
import { isBoolean } from '../cpt-load-ops';

export var CptPeNotDescription: ProcessInterfaceDescription = {
    objectId: "43ec72f1-14a9-4434-916c-a12c2e230947",
    objectType: 'PROCESS_INTERFACE_DESCRIPTION',
    implementation: 'PROCESSING_ELEMENT',
    name: 'Not',
    inports: {
        'a3714110-1fba-4b01-a1b7-8a8ed7310384': {
            name: 'In',
            objectId: 'a3714110-1fba-4b01-a1b7-8a8ed7310384',
            objectType: 'INPORT',
            requiredTypes: ['BOOLEAN'],
            desiredUnits: [],
            generatesResponse: 'PASSTHROUGH',
            index: 0
        } as Inport
    },
    outports: {
        '7ff3e382-e058-44f3-9293-d1a8d805bfd8': {
            name: 'Out',
            objectId: '7ff3e382-e058-44f3-9293-d1a8d805bfd8',
            objectType: 'OUTPORT',
            types: ['BOOLEAN'],
            index: 0
        } as Outport
    },
    portTemplates: {},
}

export class CptPeNot extends CptProcessingElement {
    public readonly INPORT_ID = 'a3714110-1fba-4b01-a1b7-8a8ed7310384';
    public readonly OUTPORT_ID = '7ff3e382-e058-44f3-9293-d1a8d805bfd8';
    constructor(public proc: Process, public parent: CptSimulationProcessIf) {
        super(proc, CptPeNotDescription, parent);
        this.label = proc.label || CptPeNotDescription.name;
    }

    // process the load internally
    public process() {
        super.process();
        let inport = this.inports[this.INPORT_ID];
        let outport = this.outports[this.OUTPORT_ID];
        inport.process();
        let inLoad = inport.yieldLoad();
        if (isBoolean(inLoad)) {
            let response: BooleanParam = {
                type: 'BOOLEAN',
                value: !inLoad.value
            }
            outport.acceptLoad(response);
            outport.process();
        }
    }
}