import { CptProcessingElement } from '../cpt-processing-element';
import { GraphModel, Process, Inport, Outport, ProcessPortTemplate, ProcessInterfaceDescription, StringParam, AspectNumberParam, NumberParam, GraphParam, Aspect, ResponseNumberParam } from '@cpt/capacity-planning-simulation-types';
import { CptSimulationProcessIf } from '../cpt-object';
import { CptOutport } from '../cpt-port';
import { filterAspectNum, getRandomSliceName } from '../cpt-load-ops';
import { isResponseNumber, aggregateResponseByAspect } from '../cpt-response-ops';

export var CptPeSplitByAspectDescription: ProcessInterfaceDescription = {
    objectId: 'c6a9bfed-4949-4692-b5c3-3906f48bc9ad',
    objectType: 'PROCESS_INTERFACE_DESCRIPTION',
    name: 'Split By Aspect',
    inports: {
        '07638ad0-7e36-4392-82e0-e90b5898dede': {
            objectId: '07638ad0-7e36-4392-82e0-e90b5898dede',
            objectType: 'INPORT',
            name: 'Load',
            requiredTypes: ['NUMBER'],
            desiredUnits: [],
            generatesResponse: 'PASSTHROUGH',
            index: 0
        } as Inport,
        '836a53ce-2a9f-4592-a93c-e9d85e94bc57': {
            objectId: '836a53ce-2a9f-4592-a93c-e9d85e94bc57',
            objectType: 'INPORT',
            name: 'Aspect Name',
            requiredTypes: ['STRING'],
            desiredUnits: [],
            generatesResponse: 'NEVER',
            index: 1
        } as Inport,
    },
    outports: {
        '34703d60-4c73-446a-b7c6-40e4ce92b1b3': {
            objectId: '34703d60-4c73-446a-b7c6-40e4ce92b1b3',
            objectType: 'OUTPORT',
            name: 'Undefined',
            types: ['NUMBER'],
            index: 0
        } as Outport
    },
    portTemplates: {
        '965261aa-e0a6-46a0-aa82-33defa2d4efc': {
            name: "Slice Output",
            objectId: '965261aa-e0a6-46a0-aa82-33defa2d4efc',
            objectType: 'PROCESS_PORT_TEMPLATE',
            description: 'Add an output for the slice of the load as defined by the selected aspect.',
            inportTemplates: {},
            outportTemplates: {
                '8cdf6ffc-d33c-4aee-b6cc-571a8f44f0e3': {
                    name: 'Slice Out',
                    objectId: '8cdf6ffc-d33c-4aee-b6cc-571a8f44f0e3',
                    objectType: 'OUTPORT',
                    types: ['NUMBER'],
                    configType: 'STRING',
                    index: 0
                } as Outport
            }
        } as ProcessPortTemplate
    }
}


export class CptPeSplitByAspect extends CptProcessingElement {
    public readonly INPORT_LOAD_ID = '07638ad0-7e36-4392-82e0-e90b5898dede';
    public readonly INPORT_ASPECT_NAME_ID = '836a53ce-2a9f-4592-a93c-e9d85e94bc57';
    public readonly OUTPORT_UNDEFINED_ID = '34703d60-4c73-446a-b7c6-40e4ce92b1b3';
    public readonly OUTPORT_SLICE_TMPL_ID = '8cdf6ffc-d33c-4aee-b6cc-571a8f44f0e3';
    private sliceOutportMap: { [sliceName: string]: CptOutport } = {};
    private activeAspect: Aspect;

    constructor(public proc: Process, public parent: CptSimulationProcessIf) {
        super(proc, CptPeSplitByAspectDescription, parent);
        this.label = proc.label || CptPeSplitByAspectDescription.name;
    }

    public process() {
        super.process();
        let inportLoad = this.inports[this.INPORT_LOAD_ID];
        let inportAspectName = this.inports[this.INPORT_ASPECT_NAME_ID];
        let outportUndefined = this.outports[this.OUTPORT_UNDEFINED_ID];
        inportLoad.process();
        inportAspectName.process();


        // actual processing will only happen when we have an aspect number coming in on the load port
        // otherwise we will just forward everything to the undefined port.
        let load = inportLoad.yieldLoad();
        let aspectNameParam = inportAspectName.yieldLoad();

        if (load) {
            if ((load.type !== 'ASPECT_NUMBER' || load.aspects.length === 0) || (aspectNameParam && aspectNameParam.type !== 'STRING')) {
                outportUndefined.acceptLoad(load);
                outportUndefined.process();
            } else {
                let aspectName: string = (aspectNameParam as StringParam).value;
                for (let aspect of load.aspects) {
                    if (aspect.name === aspectName) {
                        this.activeAspect = JSON.parse(JSON.stringify(aspect)) as Aspect;
                    }
                }
                for (let filterSliceName in this.sliceOutportMap) {
                    let outNum = filterAspectNum(load, aspectName, filterSliceName);
                    if (outNum) {
                        let sliceOut = this.sliceOutportMap[filterSliceName];
                        if (sliceOut) {
                            sliceOut.acceptLoad(outNum);
                            sliceOut.process();
                        }
                    }
                }
            }
        }
    }

    // set slice out names and populate sliceOutportMap
    protected createDyamicPorts(): boolean {
        let rc = super.createDyamicPorts();
        let sliceOutports = this.getTemplatePortInstances(this.OUTPORT_SLICE_TMPL_ID);
        this.sliceOutportMap['unknown'] = this.outports[this.OUTPORT_UNDEFINED_ID];
        for (let port of sliceOutports) {
            if (port.nodeType === 'PROCESS_OUTPORT') {
                let outport = port as CptOutport;
                if (outport.processOutport.config && outport.processOutport.config.type === 'STRING') {
                    outport.label = 'Slice \'' + outport.processOutport.config.value + '\'';
                    this.sliceOutportMap[outport.processOutport.config.value] = outport;
                }
            }
        }


        return rc;
    }

    public processResponse() {
        let inportLoad = this.inports[this.INPORT_LOAD_ID];
        let responses: { [sliceName: string]: ResponseNumberParam } = {};
        let gotResponses: boolean = false;

        // process responses on all ports so they can report their response values
        for (let slicePortName in this.sliceOutportMap) {
            let slicePort = this.sliceOutportMap[slicePortName];
            slicePort.processResponse();
            let response = slicePort.yieldResponse();
            if (isResponseNumber(response)) {
                responses[slicePortName] = response;
                gotResponses = true;
            }
        }
        if (this.activeAspect !== undefined && gotResponses) {
            let aggregatedResponse = aggregateResponseByAspect(this.activeAspect, responses);
            if (aggregatedResponse) {
                inportLoad.acceptResponse(aggregatedResponse);
                inportLoad.processResponse();
            }
        } else if (responses['unknown']) {
            inportLoad.acceptResponse(responses['unknown']);
            inportLoad.processResponse();
        }
    }
}
