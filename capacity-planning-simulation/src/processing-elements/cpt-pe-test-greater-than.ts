import { CptProcessingElement } from '../cpt-processing-element';
import { GraphModel, Process, Inport, Outport, ProcessPortTemplate, ProcessInterfaceDescription, BooleanParam } from '@cpt/capacity-planning-simulation-types';
import { CptSimulationProcessIf } from '../cpt-object';

export var CptPeTestGreaterThanDescription: ProcessInterfaceDescription = {
    objectId: "b06160a3-1573-4568-93f1-6e4473efcd9b",
    objectType: 'PROCESS_INTERFACE_DESCRIPTION',
    name: 'Test Greater Than',
    inports: {
        'f7ab1ebe-0869-4738-ac23-6eecb41072ff': {
            name: 'In-A',
            objectId: 'f7ab1ebe-0869-4738-ac23-6eecb41072ff',
            objectType: 'INPORT',
            requiredTypes: ['NUMBER'],
            desiredUnits: [],
            generatesResponse: 'NEVER',
            index: 0
        } as Inport,
        'd65dde8e-6785-41ed-b2db-7f2a11ad3afa': {
            name: 'In-B',
            objectId: 'd65dde8e-6785-41ed-b2db-7f2a11ad3afa',
            objectType: 'INPORT',
            requiredTypes: ['NUMBER'],
            desiredUnits: [],
            generatesResponse: 'NEVER',
            index: 1
        } as Inport
    },
    outports: {
        '499023d0-81e8-4eaf-b424-0f8230efa876': {
            name: 'A > B',
            objectId: '499023d0-81e8-4eaf-b424-0f8230efa876',
            objectType: 'OUTPORT',
            types: ['BOOLEAN'],
            index: 0
        } as Outport
    },
    portTemplates: {}
}


export class CptPeTestGreaterThan extends CptProcessingElement {
    public readonly INPORT_A_ID = 'f7ab1ebe-0869-4738-ac23-6eecb41072ff';
    public readonly INPORT_B_ID = 'd65dde8e-6785-41ed-b2db-7f2a11ad3afa';
    public readonly OUTPORT_ID = '499023d0-81e8-4eaf-b424-0f8230efa876';


    constructor(public proc: Process, public parent: CptSimulationProcessIf) {
        super(proc, CptPeTestGreaterThanDescription, parent);
        this.label = proc.label || CptPeTestGreaterThanDescription.name;
    }
    public process() {
        super.process();
        let inportA = this.inports[this.INPORT_A_ID];
        let inportB = this.inports[this.INPORT_B_ID];
        let outport = this.outports[this.OUTPORT_ID];
        inportA.process();
        inportB.process();
        let inA = inportA.yieldLoad();
        let inB = inportB.yieldLoad();
        if ((inA.type === 'NUMBER' || inA.type === 'ASPECT_NUMBER') && (inB.type === 'NUMBER' || inB.type === 'ASPECT_NUMBER')) {
            let aGreaterB = inA.value > inB.value;
            let boolParam: BooleanParam = {
                type: 'BOOLEAN',
                value: aGreaterB
            };
            outport.acceptLoad(boolParam);
            outport.process();
        }
    }

}