import { CptProcessingElement } from '../cpt-processing-element';
import { Process, Inport, Outport, ProcessPortTemplate, ProcessInterfaceDescription } from '@cpt/capacity-planning-simulation-types';
import { CptSimulationProcessIf } from '../cpt-object';
import { addResponseGroups } from '../cpt-response-ops';
import { ResponseParam } from "@cpt/capacity-planning-simulation-types/lib";

export var CptPeSerialExecutionDescription: ProcessInterfaceDescription = {
    objectId: '23b4f3ff-1e7c-4fb9-b8b0-a98611f58573',
    objectType: 'PROCESS_INTERFACE_DESCRIPTION',
    implementation: 'PROCESSING_ELEMENT',
    name: 'Serial Execution',
    description: 'Forward load downstream. Add up responses.',
    inports: {
        '7bd20c1f-3b00-40a6-a978-2c3f72e34f47': {
            objectId: '7bd20c1f-3b00-40a6-a978-2c3f72e34f47',
            objectType: 'INPORT',
            name: 'In',
            requiredTypes: [],
            desiredUnits: [],
            generatesResponse: 'PASSTHROUGH',
            index: 0
        } as Inport
    },
    outports: {
        '2562449c-9f98-443b-803c-a2e2ba998d98': {
            objectId: '2562449c-9f98-443b-803c-a2e2ba998d98',
            objectType: 'OUTPORT',
            name: 'Out-A',
            types: [],
            index: 1
        } as Outport,
        '6f3fd23e-9566-42bc-877e-e72b2fc5dd3e': {
            objectId: '6f3fd23e-9566-42bc-877e-e72b2fc5dd3e',
            objectType: 'OUTPORT',
            name: 'Out-B',
            types: [],
            index: 2
        } as Outport
    },
    portTemplates: {
        '3f0a3bc0-fe55-4947-a4a8-998205798368': {
            name: "Serial Output",
            objectId: '3f0a3bc0-fe55-4947-a4a8-998205798368',
            objectType: 'PROCESS_PORT_TEMPLATE',
            inportTemplates: {},
            outportTemplates: {
                '900afc02-881d-42b2-8632-0d468c4e1137': {
                    objectId: '900afc02-881d-42b2-8632-0d468c4e1137',
                    objectType: 'OUTPORT',
                    name: 'Serial-Out',
                    types: ['NUMBER'],
                    unit: 'tps',
                    index: 0
                } as Outport
            }
        } as ProcessPortTemplate
    }
};

export class CptPeSerialExecution extends CptProcessingElement {
    public readonly INPORT_LOAD_ID = '7bd20c1f-3b00-40a6-a978-2c3f72e34f47';
    public readonly OUTPORT_A_ID = '2562449c-9f98-443b-803c-a2e2ba998d98';
    public readonly OUTPORT_B_ID = '6f3fd23e-9566-42bc-877e-e72b2fc5dd3e';
    public readonly OUTPORT_TMPL_ID = '900afc02-881d-42b2-8632-0d468c4e1137';

    constructor(public proc: Process, public parent: CptSimulationProcessIf) {
        super(proc, CptPeSerialExecutionDescription, parent);
        this.label = proc.label || CptPeSerialExecutionDescription.name;
    }


    // just forward the load to all outports.
    protected _process() {
        super._process();
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


    // aggregate all incoming responses
    protected _processResponse() {
        let inportLoad = this.inports[this.INPORT_LOAD_ID];
        let outportA = this.outports[this.OUTPORT_A_ID];
        let outportB = this.outports[this.OUTPORT_B_ID];
        let extraOutports = this.getTemplatePortInstances(this.OUTPORT_TMPL_ID);
        let responses: ResponseParam[][] = [];

        outportA.processResponse();
        responses.push(outportA.yieldResponse());
        outportB.processResponse();
        responses.push(outportB.yieldResponse());
        for (let port of extraOutports) {
            port.processResponse();
            responses.push(port.yieldResponse());
        }
        let aggregatedResponse = addResponseGroups(responses)
        if (aggregatedResponse) {
            inportLoad.acceptResponse(aggregatedResponse);
            inportLoad.processResponse();
        }
    }
}
