import { CptProcessingElement } from '../cpt-processing-element';
import { GraphModel, Process, Inport, Outport, ProcessPortTemplate, ProcessInterfaceDescription, GraphParam } from '@cpt/capacity-planning-simulation-types';
import { CptSimulationProcessIf, CptInformationPackage } from '../cpt-object';
import { ResponseParam } from "@cpt/capacity-planning-simulation-types/lib";

export var CptPeRemoveResponseDescription: ProcessInterfaceDescription = {
    objectId: "a6b4b5d8-5175-4ae5-8e14-af439a4d6fc9",
    objectType: 'PROCESS_INTERFACE_DESCRIPTION',
    implementation: 'PROCESSING_ELEMENT',
    name: 'Remove Response',
    inports: {
        '5408de79-a9c5-4ccb-b322-ce3d6b6a1a86': {
            name: 'In',
            objectId: '5408de79-a9c5-4ccb-b322-ce3d6b6a1a86',
            objectType: 'INPORT',
            requiredTypes: [],
            desiredUnits: [],
            generatesResponse: 'NEVER',
            index: 0
        } as Inport
    },
    outports: {
        'c071deeb-ef08-44b3-8e00-bb0bdaab3a20': {
            name: 'Out',
            objectId: 'c071deeb-ef08-44b3-8e00-bb0bdaab3a20',
            objectType: 'OUTPORT',
            types: [],
            index: 0
        } as Outport
    },
    portTemplates: {},
}

export class CptPeRemoveResponse extends CptProcessingElement {
    public readonly INPORT_ID = '5408de79-a9c5-4ccb-b322-ce3d6b6a1a86';
    public readonly OUTPORT_ID = 'c071deeb-ef08-44b3-8e00-bb0bdaab3a20';

    constructor(public proc: Process, public parent: CptSimulationProcessIf) {
        super(proc, CptPeRemoveResponseDescription, parent);
        this.label = proc.label || CptPeRemoveResponseDescription.name;
    }

    public acceptResponse(response: ResponseParam, portId?: string) {
        // don't do anything with the response...
    }

    protected _process() {
        super._process();
        let inport = this.inports[this.INPORT_ID];
        let outport = this.outports[this.OUTPORT_ID];
        inport.process();
        let inLoad = inport.yieldLoad();
        if (inLoad) {
            outport.acceptLoad(inLoad);
            outport.process();
        }
    }
}
