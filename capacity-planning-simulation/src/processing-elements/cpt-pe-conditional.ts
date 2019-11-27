import { CptProcessingElement } from '../cpt-processing-element';
import { GraphModel, Process, Inport, Outport, ProcessPortTemplate, ProcessInterfaceDescription } from '@cpt/capacity-planning-simulation-types';
import { CptSimulationProcessIf } from '../cpt-object';

export var CptPeConditionalDescription: ProcessInterfaceDescription = {
    objectId: "1bc3082b-a2b2-4192-9016-4ad1177130b5",
    objectType: 'PROCESS_INTERFACE_DESCRIPTION',
    implementation: 'PROCESSING_ELEMENT',
    name: 'Conditional',
    inports: {
        'ed1ce2ff-0121-49f4-8ec1-f26be3566d83': {
            name: 'Switch',
            objectId: 'ed1ce2ff-0121-49f4-8ec1-f26be3566d83',
            objectType: 'INPORT',
            requiredTypes: ['BOOLEAN'],
            desiredUnits: [],
            generatesResponse: 'NEVER',
            index: 0
        } as Inport,
        'f44946cd-b292-49f9-9770-af00530d769d': {
            name: 'True',
            objectId: 'f44946cd-b292-49f9-9770-af00530d769d',
            objectType: 'INPORT',
            requiredTypes: [],
            desiredUnits: [],
            generatesResponse: 'PASSTHROUGH',
            index: 1
        } as Inport,
        'eb40dad4-e3e1-44df-9dc1-f23f060476ee': {
            name: 'False',
            objectId: 'eb40dad4-e3e1-44df-9dc1-f23f060476ee',
            objectType: 'INPORT',
            requiredTypes: [],
            desiredUnits: [],
            generatesResponse: 'PASSTHROUGH',
            index: 2
        } as Inport
    },
    outports: {
        '3ec84792-1305-4fa2-a52a-39310810eb38': {
            name: 'Out',
            objectId: '3ec84792-1305-4fa2-a52a-39310810eb38',
            objectType: 'OUTPORT',
            types: [],
            index: 0
        } as Outport
    },
    portTemplates: {}
}


export class CptPeConditional extends CptProcessingElement {
    public readonly INPORT_SWITCH_ID = 'ed1ce2ff-0121-49f4-8ec1-f26be3566d83';
    public readonly INPORT_TRUE_ID = 'f44946cd-b292-49f9-9770-af00530d769d';
    public readonly INPORT_FALSE_ID = 'eb40dad4-e3e1-44df-9dc1-f23f060476ee';
    public readonly OUTPORT_ID = '3ec84792-1305-4fa2-a52a-39310810eb38';

    constructor(public proc: Process, public parent: CptSimulationProcessIf) {
        super(proc, CptPeConditionalDescription, parent);
        this.label = proc.label || CptPeConditionalDescription.name;
    }
    public process() {
        super.process();
        let inportSwitch = this.inports[this.INPORT_SWITCH_ID];
        let inportTrue = this.inports[this.INPORT_TRUE_ID];
        let inportFalse = this.inports[this.INPORT_FALSE_ID];
        let outport = this.outports[this.OUTPORT_ID];
        inportSwitch.process();
        inportTrue.process();
        inportFalse.process();
        let switchVal = inportSwitch.yieldLoad();
        let trueVal = inportTrue.yieldLoad();
        let falseVal = inportFalse.yieldLoad();
        if (switchVal && switchVal.type === 'BOOLEAN') {
            let outVal = switchVal.value ? trueVal : falseVal;
            if (outVal) {
                outport.acceptLoad(outVal);
                outport.process();
            }
        }

    }

}
