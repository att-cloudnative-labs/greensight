import { CptProcessingElement } from '../cpt-processing-element';
import { GraphModel, Process, Inport, Outport, ProcessPortTemplate, ProcessInterfaceDescription, GraphParam } from '@cpt/capacity-planning-simulation-types';
import { CptSimulationProcessIf, CptInformationPackage } from '../cpt-object';
import { isNumber, isAspectNumber } from '../cpt-load-ops';

export var CptPeRemoveAspectDescription: ProcessInterfaceDescription = {
    objectId: "bda55420-1bd1-4e4e-bceb-da993d3040cc",
    objectType: 'PROCESS_INTERFACE_DESCRIPTION',
    implementation: 'PROCESSING_ELEMENT',
    name: 'Remove Aspect',
    inports: {
        'dba4d0fa-2717-4c67-8357-0a1351ad278d': {
            name: 'In',
            objectId: 'dba4d0fa-2717-4c67-8357-0a1351ad278d',
            objectType: 'INPORT',
            requiredTypes: [],
            desiredUnits: [],
            generatesResponse: 'PASSTHROUGH',
            index: 0
        } as Inport
    },
    outports: {
        'e3ee82f7-dfbc-42ca-bc76-3b8d1537c3b2': {
            name: 'Out',
            objectId: 'e3ee82f7-dfbc-42ca-bc76-3b8d1537c3b2',
            objectType: 'OUTPORT',
            types: [],
            index: 0
        } as Outport
    },
    portTemplates: {},
}

export class CptPeRemoveAspect extends CptProcessingElement {
    public readonly INPORT_ID = 'dba4d0fa-2717-4c67-8357-0a1351ad278d';
    public readonly OUTPORT_ID = 'e3ee82f7-dfbc-42ca-bc76-3b8d1537c3b2';
    constructor(public proc: Process, public parent: CptSimulationProcessIf) {
        super(proc, CptPeRemoveAspectDescription, parent);
        this.label = proc.label || CptPeRemoveAspectDescription.name;
    }

    // process the load internally
    public process() {
        super.process();
        let inport = this.inports[this.INPORT_ID];
        let outport = this.outports[this.OUTPORT_ID];
        inport.process();
        let inLoad = inport.yieldLoad();
        if (inLoad) {
            // if the input carries an aspect,
            // transform to normal number
            if (isAspectNumber(inLoad)) {
                let strippedNumber: GraphParam;
                // if the input has a distribution,
                // create the right param type
                if (inLoad.stdDev) {
                    strippedNumber = {
                        type: 'NORMAL_DIST_NUMBER',
                        value: inLoad.value,
                        unit: inLoad.unit,
                        stdDev: inLoad.stdDev
                    }
                } else {
                    strippedNumber = {
                        type: 'NUMBER',
                        value: inLoad.value,
                        unit: inLoad.unit
                    }
                }
                inLoad = strippedNumber;
            }
            outport.acceptLoad(inLoad);
            outport.process();
        }
    }

}
