import { CptProcessingElement } from '../cpt-processing-element';
import { GraphModel, Process, Inport, Outport, ProcessPortTemplate, ProcessInterfaceDescription, GraphParam } from '@cpt/capacity-planning-simulation-types';
import { CptSimulationProcessIf } from '../cpt-object';
import { aggregateResponseParallel } from '../cpt-response-ops';


export var CptPeParallelExecutionDescription: ProcessInterfaceDescription = {
    objectId: '51c9c02a-21ce-45f6-be6c-512f01aa0d32',
    objectType: 'PROCESS_INTERFACE_DESCRIPTION',
    implementation: 'PROCESSING_ELEMENT',
    name: 'Parallel Execution',
    description: 'Forward load downstream. Select max latency response.',

    inports: {
        '2c09be68-f259-4be5-85e9-9fbbcd048108': {
            objectId: '2c09be68-f259-4be5-85e9-9fbbcd048108',
            objectType: 'INPORT',
            name: 'In',
            requiredTypes: ['NUMBER'],
            desiredUnits: ['tps'],
            generatesResponse: 'ALWAYS',
            index: 0
        } as Inport
    },
    outports: {
        '2ff959c2-422b-4be3-902b-ca659d690fc1': {
            objectId: '2ff959c2-422b-4be3-902b-ca659d690fc1',
            objectType: 'OUTPORT',
            name: 'Out-A',
            types: ['NUMBER'],
            unit: 'tps',
            index: 1
        } as Outport,
        '94b5851d-9364-4c90-8497-700a20fb5178': {
            objectId: '94b5851d-9364-4c90-8497-700a20fb5178',
            objectType: 'OUTPORT',
            name: 'Out-B',
            types: ['NUMBER'],
            unit: 'tps',
            index: 2
        } as Outport
    },
    portTemplates: {
        '1a09acf7-3dd5-4ebf-9f01-1872d505512c': {
            name: "Parallel Output",
            objectId: '1a09acf7-3dd5-4ebf-9f01-1872d505512c',
            objectType: 'PROCESS_PORT_TEMPLATE',
            inportTemplates: {},
            outportTemplates: {
                'df9e60c2-169c-4d30-a4f7-58564432a261': {
                    objectId: 'df9e60c2-169c-4d30-a4f7-58564432a261',
                    objectType: 'OUTPORT',
                    name: 'Parallel-Out',
                    types: ['NUMBER'],
                    unit: 'tps',
                    index: 0
                } as Outport
            }
        } as ProcessPortTemplate
    }
};

export class CptPeParallelExecution extends CptProcessingElement {
    public readonly INPORT_LOAD_ID = '2c09be68-f259-4be5-85e9-9fbbcd048108';
    public readonly OUTPORT_A_ID = '2ff959c2-422b-4be3-902b-ca659d690fc1';
    public readonly OUTPORT_B_ID = '94b5851d-9364-4c90-8497-700a20fb5178';
    public readonly OUTPORT_TMPL_ID = 'df9e60c2-169c-4d30-a4f7-58564432a261';

    constructor(public proc: Process, public parent: CptSimulationProcessIf) {
        super(proc, CptPeParallelExecutionDescription, parent);
        this.label = proc.label || CptPeParallelExecutionDescription.name;
    }

    // just forward the load to all outports.
    public process() {
        super.process();
        let inportLoad = this.inports[this.INPORT_LOAD_ID];
        let outportA = this.outports[this.OUTPORT_A_ID];
        let outportB = this.outports[this.OUTPORT_B_ID];
        inportLoad.process();
        let load = inportLoad.yieldLoad();
        if (load) {
            outportA.acceptLoad(load);
            outportB.acceptLoad(load);
            outportA.process();
            outportB.process();
            let extraOutports = this.getTemplatePortInstances(this.OUTPORT_TMPL_ID);
            for (let port of extraOutports) {
                port.acceptLoad(load);
                port.process();
            }
        }
    }
}
