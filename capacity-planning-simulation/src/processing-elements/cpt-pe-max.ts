import { CptProcessingElement } from '../cpt-processing-element';
import { GraphModel, Process, Inport, Outport, ProcessInterfaceDescription, ProcessPortTemplate, GraphParam } from '@cpt/capacity-planning-simulation-types';
import { CptSimulationProcessIf } from '../cpt-object';
import { max } from '../cpt-math-ops';
import { isNumber, NumberType, dupl } from '../cpt-load-ops';


export var CptPeMaxDescription: ProcessInterfaceDescription = {
    objectId: 'afe75ba2-2530-4fa7-82e6-a2e0bdc3f5d6',
    objectType: 'PROCESS_INTERFACE_DESCRIPTION',
    implementation: 'PROCESSING_ELEMENT',
    name: 'Max',
    inports: {
        'cfad3400-064a-47eb-a18b-2e325161e43b': {
            name: 'In-A',
            objectId: 'cfad3400-064a-47eb-a18b-2e325161e43b',
            objectType: 'INPORT',
            requiredTypes: ['NUMBER'],
            desiredUnits: [],
            generatesResponse: 'PASSTHROUGH',
            index: 0
        } as Inport,
        '62fecc4a-042c-4043-b8f5-82e2c7dd06df': {
            name: 'In-B',
            objectId: '62fecc4a-042c-4043-b8f5-82e2c7dd06df',
            objectType: 'INPORT',
            requiredTypes: ['NUMBER'],
            desiredUnits: [],
            generatesResponse: 'PASSTHROUGH',
            index: 1
        } as Inport
    },
    outports: {
        '66622dbf-0d69-4a02-8954-0cbbf418eb72': {
            name: 'Out',
            objectId: '66622dbf-0d69-4a02-8954-0cbbf418eb72',
            objectType: 'OUTPORT',
            types: ['NUMBER'],
            index: 0
        } as Outport
    },
    portTemplates: {
        '71249ab1-e530-48b3-9073-69f0d5256312': {
            name: "In-X",
            objectId: '71249ab1-e530-48b3-9073-69f0d5256312',
            objectType: 'PROCESS_PORT_TEMPLATE',
            description: 'Add an additional inport for the comparison.',
            inportTemplates: {
                '49400269-2a72-4e30-9455-3ef3d8fd8072': {
                    name: 'In-X',
                    objectId: '49400269-2a72-4e30-9455-3ef3d8fd8072',
                    objectType: 'INPORT',
                    requiredTypes: ['NUMBER'],
                    desiredUnits: [],
                    generatesResponse: 'PASSTHROUGH',
                    index: 0
                } as Inport
            },
            outportTemplates: {}
        } as ProcessPortTemplate
    }
}

export class CptPeMax extends CptProcessingElement {
    public readonly INPORT_A_ID = 'cfad3400-064a-47eb-a18b-2e325161e43b';
    public readonly INPORT_B_ID = '62fecc4a-042c-4043-b8f5-82e2c7dd06df';
    public readonly OUTPORT_ID = '66622dbf-0d69-4a02-8954-0cbbf418eb72';
    public readonly INPORT_TMPL_ID = '49400269-2a72-4e30-9455-3ef3d8fd8072';

    constructor(public proc: Process, public parent: CptSimulationProcessIf) {
        super(proc, CptPeMaxDescription, parent);
        this.label = proc.label || CptPeMaxDescription.name;
    }

    public process() {
        super.process();
        let inportA = this.inports[this.INPORT_A_ID];
        let inportB = this.inports[this.INPORT_B_ID];
        let outport = this.outports[this.OUTPORT_ID];
        inportA.process();
        inportB.process();
        let extraPorts = this.getTemplatePortInstances(this.INPORT_TMPL_ID);
        for (let inport of extraPorts) {
            inport.process();
        }
        let loads = [];
        let a = inportA.yieldLoad();
        let b = inportB.yieldLoad();
        loads.push(a, b);
        for (let inport of extraPorts) {
            let c = inport.yieldLoad();
            loads.push(c);
        }
        let numberLoads: NumberType[] = loads.filter(load => isNumber(load));
        try {
            let result = max(numberLoads);
            outport.acceptLoad(result);
            outport.process();
        } catch (e) {
            this.env.logProgress("failed to get max: " + e);
        }
    }
}
