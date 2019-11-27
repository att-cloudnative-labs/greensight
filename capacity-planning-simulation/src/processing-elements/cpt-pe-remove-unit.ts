import { CptProcessingElement } from '../cpt-processing-element';
import { GraphModel, Process, Inport, Outport, ProcessPortTemplate, ProcessInterfaceDescription, GraphParam } from '@cpt/capacity-planning-simulation-types';
import { CptSimulationProcessIf, CptInformationPackage } from '../cpt-object';
import { isNumber } from '../cpt-load-ops';

export var CptPeRemoveUnitDescription: ProcessInterfaceDescription = {
    objectId: "bdc9e038-2d18-40a4-ae71-4a707e1f08c7",
    objectType: 'PROCESS_INTERFACE_DESCRIPTION',
    implementation: 'PROCESSING_ELEMENT',
    name: 'Remove Unit',
    inports: {
        '30f50f34-e265-4add-98d8-0142be665d9d': {
            name: 'In',
            objectId: '30f50f34-e265-4add-98d8-0142be665d9d',
            objectType: 'INPORT',
            requiredTypes: [],
            desiredUnits: [],
            generatesResponse: 'PASSTHROUGH',
            index: 0
        } as Inport
    },
    outports: {
        '68b7b805-1e9f-438c-be73-29b9a1dc88fb': {
            name: 'Out',
            objectId: '68b7b805-1e9f-438c-be73-29b9a1dc88fb',
            objectType: 'OUTPORT',
            types: [],
            index: 0
        } as Outport
    },
    portTemplates: {},
}

export class CptPeRemoveUnit extends CptProcessingElement {
    public readonly INPORT_ID = '30f50f34-e265-4add-98d8-0142be665d9d';
    public readonly OUTPORT_ID = '68b7b805-1e9f-438c-be73-29b9a1dc88fb';
    constructor(public proc: Process, public parent: CptSimulationProcessIf) {
        super(proc, CptPeRemoveUnitDescription, parent);
        this.label = proc.label || CptPeRemoveUnitDescription.name;
    }


    // process the load internally
    public process() {
        super.process();
        let inport = this.inports[this.INPORT_ID];
        let outport = this.outports[this.OUTPORT_ID];
        inport.process();
        let inLoad = inport.yieldLoad();
        if (inLoad) {
            let loadCopy = JSON.parse(JSON.stringify(inLoad)) as GraphParam;
            if (isNumber(loadCopy)) {
                loadCopy.unit = undefined;
            }
            outport.acceptLoad(loadCopy);
            outport.process();
        }
    }
}
