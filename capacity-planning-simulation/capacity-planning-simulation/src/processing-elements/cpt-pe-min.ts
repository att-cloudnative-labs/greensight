import { CptProcessingElement } from '../cpt-processing-element';
import { GraphModel, Process, Inport, Outport, ProcessInterfaceDescription, ProcessPortTemplate, GraphParam } from '@cpt/capacity-planning-simulation-types';
import { CptSimulationProcessIf } from '../cpt-object';
import { min } from '../cpt-math-ops';
import { isNumber } from '../cpt-load-ops';
import { NumberParam } from "@cpt/capacity-planning-simulation-types/lib";


export var CptPeMinDescription: ProcessInterfaceDescription = {
    objectId: '4642ea8a-1c77-4b08-96a8-73eb8d204ae2',
    objectType: 'PROCESS_INTERFACE_DESCRIPTION',
    implementation: 'PROCESSING_ELEMENT',
    name: 'Min',
    inports: {
        '3e2b3e71-b36e-4a28-9264-4d1d833f3a71': {
            name: 'In-A',
            objectId: '3e2b3e71-b36e-4a28-9264-4d1d833f3a71',
            objectType: 'INPORT',
            requiredTypes: ['NUMBER'],
            desiredUnits: [],
            generatesResponse: 'PASSTHROUGH',
            index: 0
        } as Inport,
        '66717e9c-44ef-47f2-8a53-7d7494af501b': {
            name: 'In-B',
            objectId: '66717e9c-44ef-47f2-8a53-7d7494af501b',
            objectType: 'INPORT',
            requiredTypes: ['NUMBER'],
            desiredUnits: [],
            generatesResponse: 'PASSTHROUGH',
            index: 1
        } as Inport
    },
    outports: {
        'bc2f6b1f-3a3f-43c7-8dc1-4755e562362f': {
            name: 'Out',
            objectId: 'bc2f6b1f-3a3f-43c7-8dc1-4755e562362f',
            objectType: 'OUTPORT',
            types: ['NUMBER'],
            index: 0
        } as Outport
    },
    portTemplates: {
        '27149017-e3fc-42f1-93c5-a8766dbe344d': {
            name: "In-X",
            objectId: '27149017-e3fc-42f1-93c5-a8766dbe344d',
            objectType: 'PROCESS_PORT_TEMPLATE',
            description: 'Add an additional inport for the comparison.',
            inportTemplates: {
                '56d36a1f-b98d-4336-a1a0-1c2c6fd9fc61': {
                    name: 'In-X',
                    objectId: '56d36a1f-b98d-4336-a1a0-1c2c6fd9fc61',
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

export class CptPeMin extends CptProcessingElement {
    public readonly INPORT_A_ID = '3e2b3e71-b36e-4a28-9264-4d1d833f3a71';
    public readonly INPORT_B_ID = '66717e9c-44ef-47f2-8a53-7d7494af501b';
    public readonly OUTPORT_ID = 'bc2f6b1f-3a3f-43c7-8dc1-4755e562362f';
    public readonly INPORT_TMPL_ID = '56d36a1f-b98d-4336-a1a0-1c2c6fd9fc61';

    constructor(public proc: Process, public parent: CptSimulationProcessIf) {
        super(proc, CptPeMinDescription, parent);
        this.label = proc.label || CptPeMinDescription.name;
    }
    protected _process() {
        super._process();
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
        let numberLoads: NumberParam[] = loads.filter(load => isNumber(load));
        try {
            let result = min(numberLoads);
            outport.acceptLoad(result);
            outport.process();
        } catch (e) {
            this.env.logProgress("failed to get min: " + e);
        }
    }

}
