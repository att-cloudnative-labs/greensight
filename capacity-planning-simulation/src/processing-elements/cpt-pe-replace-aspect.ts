import { CptProcessingElement } from '../cpt-processing-element';
import { GraphModel, Process, Inport, Outport, ProcessInterfaceDescription, GraphParam, AspectParam, Aspect, NumberParam, AspectNumberParam } from '@cpt/capacity-planning-simulation-types';
import { CptSimulationProcessIf } from '../cpt-object';
import { scaleAspect, isNumber, isAspect, isAspectNumber } from '../cpt-load-ops';

export var CptPeReplaceAspectDescription: ProcessInterfaceDescription = {
    objectId: '7cd08bf0-da46-4a51-9e3e-61a81921f1a7',
    objectType: 'PROCESS_INTERFACE_DESCRIPTION',
    implementation: 'PROCESSING_ELEMENT',
    name: 'Replace Aspect',
    inports: {
        '7f31dd1c-855e-4bb4-9868-8f083c1beb57': {
            name: 'Load',
            objectId: '7f31dd1c-855e-4bb4-9868-8f083c1beb57',
            objectType: 'INPORT',
            requiredTypes: ['NUMBER'],
            desiredUnits: [],
            generatesResponse: 'PASSTHROUGH',
            index: 0
        } as Inport,
        'ec7e2dbb-79ce-4dbe-b6e6-54e111f11d95': {
            name: 'Aspect',
            objectId: 'ec7e2dbb-79ce-4dbe-b6e6-54e111f11d95',
            objectType: 'INPORT',
            requiredTypes: ['BREAKDOWN', 'TAG', 'NUMBER'],
            desiredUnits: [],
            generatesResponse: 'NEVER',
            index: 1
        } as Inport,
    },
    outports: {
        '5a6f3142-70ea-4af2-8a18-eb821ef47cea': {
            name: 'Out',
            objectId: '5a6f3142-70ea-4af2-8a18-eb821ef47cea',
            objectType: 'OUTPORT',
            types: ['NUMBER'],
            index: 0
        } as Outport
    },
    portTemplates: {}
}

export class CptPeReplaceAspect extends CptProcessingElement {
    public readonly INPORT_LOAD_ID = '7f31dd1c-855e-4bb4-9868-8f083c1beb57';
    public readonly INPORT_ASPECT_ID = 'ec7e2dbb-79ce-4dbe-b6e6-54e111f11d95';
    public readonly OUTPORT_ID = '5a6f3142-70ea-4af2-8a18-eb821ef47cea';


    constructor(public proc: Process, public parent: CptSimulationProcessIf) {
        super(proc, CptPeReplaceAspectDescription, parent);
        this.label = proc.label || CptPeReplaceAspectDescription.name;
    }

    public process() {
        super.process();
        let inportLoad = this.inports[this.INPORT_LOAD_ID];
        let inportAspect = this.inports[this.INPORT_ASPECT_ID];
        let outport = this.outports[this.OUTPORT_ID];
        inportLoad.process();
        inportAspect.process();

        let a = inportLoad.yieldLoad();
        let b = inportAspect.yieldLoad() as AspectParam;

        if (isNumber(a)) {
            let out: GraphParam;
            if (isAspect(b)) {
                out = {
                    type: 'ASPECT_NUMBER',
                    value: a.value,
                    unit: a.unit,
                    aspects: []
                };
                let additionalAspect = scaleAspect(a.value, b.value);
                out.aspects.push(additionalAspect);
            }
            if (isAspectNumber(b)) {
                out = {
                    type: 'ASPECT_NUMBER',
                    value: a.value,
                    unit: a.unit,
                    aspects: []
                };
                for (let aspect of b.aspects) {
                    let additionalAspect = scaleAspect(a.value, aspect);
                    out.aspects.push(additionalAspect);
                }
            }
            // typescript hat problems with typeinference
            // if i bundled this into a single if/else
            if (!isAspect(b) && !isAspectNumber(b)) {
                // no new aspect given. forward without aspect
                out = {
                    type: 'NUMBER',
                    value: a.value,
                    unit: a.unit
                }
            }
            outport.acceptLoad(out);
            outport.process();
        } else if (a) {
            // just forward the input
            outport.acceptLoad(a);
            outport.process();
        }
    }
}