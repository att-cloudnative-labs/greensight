import { CptProcessingElement } from '../cpt-processing-element';
import { GraphModel, Process, Inport, Outport, ProcessPortTemplate, ProcessInterfaceDescription, Aspect } from '@cpt/capacity-planning-simulation-types';
import { CptSimulationProcessIf } from '../cpt-object';
import { isNumber, dupl, scaleAspect } from '../cpt-load-ops';

export var CptPeDivideRoundupDescription: ProcessInterfaceDescription = {
    objectId: "26ec17f3-cce9-4854-a139-49d65ed6dc0e",
    objectType: 'PROCESS_INTERFACE_DESCRIPTION',
    implementation: 'PROCESSING_ELEMENT',
    name: 'Divide and Round Up',
    inports: {
        '6634faf4-9d9f-4ec8-be06-fa1e65ce05ff': {
            name: 'Numerator',
            objectId: '6634faf4-9d9f-4ec8-be06-fa1e65ce05ff',
            objectType: 'INPORT',
            requiredTypes: ['NUMBER'],
            desiredUnits: [],
            generatesResponse: 'PASSTHROUGH',
            index: 0
        } as Inport,
        '81332654-3a4a-4b79-b7ee-a86e7b568b1a': {
            name: 'Divisor',
            objectId: '81332654-3a4a-4b79-b7ee-a86e7b568b1a',
            objectType: 'INPORT',
            requiredTypes: ['NUMBER'],
            desiredUnits: [],
            generatesResponse: 'PASSTHROUGH',
            index: 1
        } as Inport
    },
    outports: {
        '3c175cbd-2dd4-4ef6-8e31-bddb90e1f61c': {
            name: 'Out',
            objectId: '3c175cbd-2dd4-4ef6-8e31-bddb90e1f61c',
            objectType: 'OUTPORT',
            types: ['NUMBER'],
            index: 0
        } as Outport
    },
    portTemplates: {
        '26e6f598-b27e-4f10-80e2-43e5e6964bb5': {
            name: "Divisor Multiplier",
            objectId: '26e6f598-b27e-4f10-80e2-43e5e6964bb5',
            objectType: 'PROCESS_PORT_TEMPLATE',
            inportTemplates: {
                '7dae1a52-193e-40cd-b1d1-686bcace8bbe': {
                    name: 'Divisor Multiplier',
                    objectId: '7dae1a52-193e-40cd-b1d1-686bcace8bbe',
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


export class CptPeDivideRoundup extends CptProcessingElement {
    public readonly INPORT_NUMERATOR_ID = '6634faf4-9d9f-4ec8-be06-fa1e65ce05ff';
    public readonly INPORT_DIVISOR_ID = '81332654-3a4a-4b79-b7ee-a86e7b568b1a';
    public readonly OUTPORT_ID = '3c175cbd-2dd4-4ef6-8e31-bddb90e1f61c';
    public readonly INPORT_TMPL_DIV_MUL_ID = '7dae1a52-193e-40cd-b1d1-686bcace8bbe';

    constructor(public proc: Process, public parent: CptSimulationProcessIf) {
        super(proc, CptPeDivideRoundupDescription, parent);
        this.label = proc.label || CptPeDivideRoundupDescription.name;
    }

    public process() {
        super.process();
        let inportNumerator = this.inports[this.INPORT_NUMERATOR_ID];
        let inportDivisor = this.inports[this.INPORT_DIVISOR_ID];
        let outport = this.outports[this.OUTPORT_ID];
        inportNumerator.process();
        inportDivisor.process();

        let extraPorts = this.getTemplatePortInstances(this.INPORT_TMPL_DIV_MUL_ID);
        for (let inport of extraPorts) {
            inport.process();
        }
        let numerator = inportNumerator.yieldLoad();
        let divisor = inportDivisor.yieldLoad();
        if (isNumber(numerator) && isNumber(divisor) && divisor.value !== 0) {
            let result = dupl(numerator);
            let divNum = divisor.value;
            for (let inport of extraPorts) {
                let v = inport.yieldLoad();
                if (isNumber(v) && v.value !== 0) {
                    divNum = divNum * v.value;
                }
            }
            result.value = Math.ceil(numerator.value / divNum);
            if (numerator.type === 'ASPECT_NUMBER' && result.type == 'ASPECT_NUMBER') {
                result.aspects = [];
                for (let aspect of numerator.aspects) {
                    result.aspects.push(scaleAspect(result.value, aspect));
                }
            }
            outport.acceptLoad(result);
            outport.process();
        }

    }

}
