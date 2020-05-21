import { CptProcessingElement } from '../cpt-processing-element';
import { Process, Inport, Outport, ProcessInterfaceDescription, ProcessPortTemplate, Aspect } from '@cpt/capacity-planning-simulation-types';
import { CptSimulationProcessIf } from '../cpt-object';
import { max } from '../cpt-math-ops';
import { isNumber, addAspects, isAspectNumber, scaleBreakdowns } from '../cpt-load-ops';
import { NumberParam } from "@cpt/capacity-planning-simulation-types/lib";


export var CptPeMaxWeightedDescription: ProcessInterfaceDescription = {
    objectId: 'f7bc3e3e-7719-4662-93ba-fbc7f79481e1',
    objectType: 'PROCESS_INTERFACE_DESCRIPTION',
    implementation: 'PROCESSING_ELEMENT',
    name: 'Max (Weighted)',
    inports: {
        '98af41f8-7cd6-4f98-8e2c-97acdce1db82': {
            name: 'In-A',
            objectId: '98af41f8-7cd6-4f98-8e2c-97acdce1db82',
            objectType: 'INPORT',
            requiredTypes: ['NUMBER'],
            desiredUnits: [],
            generatesResponse: 'PASSTHROUGH',
            index: 0
        } as Inport,
        'f87575d3-303f-40df-9d01-02fad14ec285': {
            name: 'In-B',
            objectId: 'f87575d3-303f-40df-9d01-02fad14ec285',
            objectType: 'INPORT',
            requiredTypes: ['NUMBER'],
            desiredUnits: [],
            generatesResponse: 'PASSTHROUGH',
            index: 1
        } as Inport
    },
    outports: {
        '380b54db-2e52-4292-8c67-c372113b9100': {
            name: 'Out',
            objectId: '380b54db-2e52-4292-8c67-c372113b9100',
            objectType: 'OUTPORT',
            types: ['NUMBER'],
            index: 0
        } as Outport
    },
    portTemplates: {
        'dc352282-694b-41c9-a066-57e1c9d0a77d': {
            name: "In-X",
            objectId: 'dc352282-694b-41c9-a066-57e1c9d0a77d',
            objectType: 'PROCESS_PORT_TEMPLATE',
            description: 'Add an additional inport for the comparison.',
            inportTemplates: {
                'e590105a-1e30-403e-be01-9f64b16de156': {
                    name: 'In-X',
                    objectId: 'e590105a-1e30-403e-be01-9f64b16de156',
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

export class CptPeMaxWeighted extends CptProcessingElement {
    public readonly INPORT_A_ID = '98af41f8-7cd6-4f98-8e2c-97acdce1db82';
    public readonly INPORT_B_ID = 'f87575d3-303f-40df-9d01-02fad14ec285';
    public readonly OUTPORT_ID = '380b54db-2e52-4292-8c67-c372113b9100';
    public readonly INPORT_TMPL_ID = 'e590105a-1e30-403e-be01-9f64b16de156';

    constructor(public proc: Process, public parent: CptSimulationProcessIf) {
        super(proc, CptPeMaxWeightedDescription, parent);
        this.label = proc.label || CptPeMaxWeightedDescription.name;
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
            let result = max(numberLoads) as NumberParam;
            let aspectLoads: NumberParam[] = loads.filter(load => isAspectNumber(load));
            //aggregate aspects if any
            if (aspectLoads && aspectLoads.length > 0) {
                let value: number = 0;
                let aspects: Aspect[] = [];
                for (let load of aspectLoads) {
                    aspects = addAspects(value, aspects, load.value, load.aspects);
                    value = value + load.value;
                }
                //update result to include added aspects
                result.aspects = scaleBreakdowns(result.value, aspects);
            }
            outport.acceptLoad(result);
            outport.process();
        } catch (e) {
            this.env.logProgress("failed to get max: " + e);
        }
    }

}
