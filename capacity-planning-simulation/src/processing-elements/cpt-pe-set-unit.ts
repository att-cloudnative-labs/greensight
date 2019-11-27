import { CptProcessingElement } from '../cpt-processing-element';
import { GraphModel, Process, Inport, Outport, ProcessInterfaceDescription, GraphParam } from '@cpt/capacity-planning-simulation-types';
import { CptSimulationProcessIf } from '../cpt-object';
import { isString, isNumber } from '../cpt-load-ops';

export var CptPeSetUnitDescription: ProcessInterfaceDescription = {
    objectId: 'bf195969-ca1a-4924-91ce-57fbe6da371f',
    objectType: 'PROCESS_INTERFACE_DESCRIPTION',
    implementation: 'PROCESSING_ELEMENT',
    name: 'Set Unit',
    inports: {
        'df042fe4-b146-4725-ae1c-d4f6c5a4dc6f': {
            name: 'Load',
            objectId: 'df042fe4-b146-4725-ae1c-d4f6c5a4dc6f',
            objectType: 'INPORT',
            requiredTypes: [],
            desiredUnits: [],
            generatesResponse: 'PASSTHROUGH',
            index: 0
        } as Inport,
        '19333fd7-278b-4e28-9d5d-c849f489fa58': {
            name: 'Unit',
            objectId: '19333fd7-278b-4e28-9d5d-c849f489fa58',
            objectType: 'INPORT',
            requiredTypes: ['STRING'],
            desiredUnits: [],
            generatesResponse: 'NEVER',
            index: 1
        } as Inport
    },
    outports: {
        '0cf3bb07-bd23-4aab-b65d-6912105cb463': {
            name: 'Out',
            objectId: '0cf3bb07-bd23-4aab-b65d-6912105cb463',
            objectType: 'OUTPORT',
            types: ['NUMBER'],
            index: 0
        } as Outport
    },
    portTemplates: {}
}

export class CptPeSetUnit extends CptProcessingElement {
    public readonly INPORT_LOAD_ID = 'df042fe4-b146-4725-ae1c-d4f6c5a4dc6f';
    public readonly INPORT_UNIT_ID = '19333fd7-278b-4e28-9d5d-c849f489fa58';
    public readonly OUTPORT_ID = '0cf3bb07-bd23-4aab-b65d-6912105cb463';
    constructor(public proc: Process, public parent: CptSimulationProcessIf) {
        super(proc, CptPeSetUnitDescription, parent);
        this.label = proc.label || CptPeSetUnitDescription.name;
    }

    // process the load internally
    public process() {
        super.process();
        let inportLoad = this.inports[this.INPORT_LOAD_ID];
        let inportUnit = this.inports[this.INPORT_UNIT_ID];
        let outport = this.outports[this.OUTPORT_ID];
        inportLoad.process();
        inportUnit.process();
        let inLoad = inportLoad.yieldLoad();
        let inUnit = inportUnit.yieldLoad();
        if (inLoad) {
            let loadCopy = JSON.parse(JSON.stringify(inLoad)) as GraphParam;
            if (isString(inUnit) && isNumber(loadCopy)) {
                loadCopy.unit = inUnit.value;
            }
            outport.acceptLoad(loadCopy);
            outport.process();
        }
    }

}