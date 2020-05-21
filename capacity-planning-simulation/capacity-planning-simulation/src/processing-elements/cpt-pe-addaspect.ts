import { CptProcessingElement } from '../cpt-processing-element';
import { GraphModel, Process, Inport, Outport, ProcessInterfaceDescription, GraphParam, AspectParam, NumberParam } from '@cpt/capacity-planning-simulation-types';
import { CptSimulationProcessIf } from '../cpt-object';
import { scaleBreakdown, isNumber, isAspect, isAspectNumber } from '../cpt-load-ops';

export var CptPeAddAspectDescription: ProcessInterfaceDescription = {
    objectId: '5a615ab0-8960-42e7-a99c-78e5c548bfda',
    objectType: 'PROCESS_INTERFACE_DESCRIPTION',
    implementation: 'PROCESSING_ELEMENT',
    name: 'Add Aspect',
    description: 'Add an aspect (breakdown or tag) to a load. Input has to be a number for this to work.',
    inports: {
        'd5490871-414c-4b80-8502-5e39721e8feb': {
            name: 'Load',
            objectId: 'd5490871-414c-4b80-8502-5e39721e8feb',
            objectType: 'INPORT',
            requiredTypes: ['NUMBER'],
            desiredUnits: [],
            generatesResponse: 'PASSTHROUGH',
            index: 0,
            description: 'Input of numerical load'
        } as Inport,
        '301d502f-d421-44c5-a917-864c19b0f008': {
            name: 'Aspect',
            objectId: '301d502f-d421-44c5-a917-864c19b0f008',
            objectType: 'INPORT',
            requiredTypes: ['BREAKDOWN'],
            desiredUnits: [],
            generatesResponse: 'NEVER',
            index: 1,
            description: 'Input of Aspect. Can be defined as port parameter.'
        } as Inport,
    },
    outports: {
        'b93ad313-aea6-4acb-8162-d5338274a92b': {
            name: 'Out',
            objectId: 'b93ad313-aea6-4acb-8162-d5338274a92b',
            objectType: 'OUTPORT',
            types: ['NUMBER'],
            index: 0,
            description: 'Output of Load including Aspect'
        } as Outport
    },
    portTemplates: {}
}

export class CptPeAddAspect extends CptProcessingElement {
    public readonly INPORT_LOAD_ID = 'd5490871-414c-4b80-8502-5e39721e8feb';
    public readonly INPORT_ASPECT_ID = '301d502f-d421-44c5-a917-864c19b0f008';
    public readonly OUTPORT_ID = 'b93ad313-aea6-4acb-8162-d5338274a92b';


    constructor(public proc: Process, public parent: CptSimulationProcessIf) {
        super(proc, CptPeAddAspectDescription, parent);
        this.label = proc.label || CptPeAddAspectDescription.name;
    }

    protected _process() {
        super._process();
        let inportLoad = this.inports[this.INPORT_LOAD_ID];
        let inportAspect = this.inports[this.INPORT_ASPECT_ID];
        let outport = this.outports[this.OUTPORT_ID];
        inportLoad.process();
        inportAspect.process();

        let a = inportLoad.yieldLoad();
        let b = inportAspect.yieldLoad() as AspectParam;
        if (isNumber(a) && isAspect(b)) {
            let out: NumberParam = {
                type: 'NUMBER',
                value: a.value,
                unit: a.unit,
                aspects: a.aspects ? a.aspects : []
            }
            let additionalAspect = scaleBreakdown(out.value, b.value);
            out.aspects.push(additionalAspect);
            outport.acceptLoad(out);
            outport.process();
        } else if (a) {
            outport.acceptLoad(a);
            outport.process();
        }
    }
}
