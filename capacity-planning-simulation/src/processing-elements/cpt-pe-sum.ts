import { CptProcessingElement } from '../cpt-processing-element';
import { GraphModel, Process, Inport, Outport, ProcessPortTemplate, ProcessInterfaceDescription, GraphParam, NumberParam, AspectNumberParam } from '@cpt/capacity-planning-simulation-types';
import { CptSimulationProcessIf } from '../cpt-object';
import { add } from '../cpt-math-ops';
import { isNumber } from '../cpt-load-ops';

export var CptPeSumDescription: ProcessInterfaceDescription = {
    objectId: "bd96eec1-483b-44fe-a07b-11bb9141f02f",
    objectType: 'PROCESS_INTERFACE_DESCRIPTION',
    name: 'Sum',
    inports: {
        'f37c3cf8-881d-46ba-8715-de76904365c5': {
            name: 'In-A',
            objectId: 'f37c3cf8-881d-46ba-8715-de76904365c5',
            objectType: 'INPORT',
            requiredTypes: ['NUMBER'],
            desiredUnits: [],
            generatesResponse: 'PASSTHROUGH',
            index: 0
        } as Inport,
        'e4b97aaa-bd31-421a-9948-c30ac1a396c1': {
            name: 'In-B',
            objectId: 'e4b97aaa-bd31-421a-9948-c30ac1a396c1',
            objectType: 'INPORT',
            requiredTypes: ['NUMBER'],
            desiredUnits: [],
            generatesResponse: 'PASSTHROUGH',
            index: 1
        } as Inport
    },
    outports: {
        '8f4c41e4-f501-4374-a34c-62744996349a': {
            name: 'Out',
            objectId: '8f4c41e4-f501-4374-a34c-62744996349a',
            objectType: 'OUTPORT',
            types: ['NUMBER'],
            index: 0
        } as Outport
    },
    portTemplates: {
        '8be3030f-50b1-4a5a-9a51-417d205974bb': {
            name: "Summand",
            objectId: '8be3030f-50b1-4a5a-9a51-417d205974bb',
            objectType: 'PROCESS_PORT_TEMPLATE',
            description: 'Add an additional summand inport.',
            inportTemplates: {
                'ca210892-da31-4066-8657-55786ffb3642': {
                    name: 'Summand',
                    objectId: 'ca210892-da31-4066-8657-55786ffb3642',
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


export class CptPeSum extends CptProcessingElement {
    public readonly INPORT_A_ID = 'f37c3cf8-881d-46ba-8715-de76904365c5';
    public readonly INPORT_B_ID = 'e4b97aaa-bd31-421a-9948-c30ac1a396c1';
    public readonly OUTPORT_ID = '8f4c41e4-f501-4374-a34c-62744996349a';
    public readonly TMPL_SUMMAND_INPORT_ID = 'ca210892-da31-4066-8657-55786ffb3642';
    public readonly TMPL_SUMMAND_ID = '8be3030f-50b1-4a5a-9a51-417d205974bb';

    constructor(public proc: Process, public parent: CptSimulationProcessIf) {
        super(proc, CptPeSumDescription, parent);
        this.label = proc.label || CptPeSumDescription.name;
    }

    // process the load internally
    public process() {
        super.process();
        let inportA = this.inports[this.INPORT_A_ID];
        let inportB = this.inports[this.INPORT_B_ID];
        let outport = this.outports[this.OUTPORT_ID];
        inportA.process();
        inportB.process();
        // these are the dynamically added summand ports
        let summandPorts = this.getTemplatePortInstances(this.TMPL_SUMMAND_INPORT_ID);
        for (let inport of summandPorts) {
            inport.process();
        }
        let a = inportA.yieldLoad();
        let b = inportB.yieldLoad();
        let sum: GraphParam;
        try {
            let sum = add(a, b);
            for (let inport of summandPorts) {
                let summand = inport.yieldLoad();
                if (summand) {
                    sum = add(sum, summand);
                }
            }
            if (isNumber(a) && a.unit && isNumber(sum)) {
                sum.unit = a.unit;
            }
            outport.acceptLoad(sum);
            outport.process();
        } catch (e) {
            this.env.logProgress("failed to calculate sum: " + e);
        }

    }
}
