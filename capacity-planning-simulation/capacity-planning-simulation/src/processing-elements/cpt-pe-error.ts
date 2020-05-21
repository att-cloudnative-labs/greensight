import { CptProcessingElement } from '../cpt-processing-element';
import { GraphModel, Process, Inport, Outport, ProcessPortTemplate, ProcessInterfaceDescription, GraphParam } from '@cpt/capacity-planning-simulation-types';
import { CptSimulationProcessIf, CptInformationPackage } from '../cpt-object';

export var CptPeErrorDescription: ProcessInterfaceDescription = {
    objectId: "41c22bcb-f966-406a-8814-a7b8e187b508",
    objectType: 'PROCESS_INTERFACE_DESCRIPTION',
    implementation: 'PROCESSING_ELEMENT',
    name: 'Error',
    inports: {
        '694dacf2-7a7c-4bbb-89eb-6bb3a7461677': {
            name: 'Trigger',
            objectId: '694dacf2-7a7c-4bbb-89eb-6bb3a7461677',
            objectType: 'INPORT',
            requiredTypes: [],
            desiredUnits: [],
            generatesResponse: 'NEVER',
            index: 0
        } as Inport
    },
    outports: {},
    portTemplates: {},
    visualizationHint: 'ERROR'
}



export class CptPeError extends CptProcessingElement {
    private triggeredError: boolean = false;

    constructor(public proc: Process, public parent: CptSimulationProcessIf) {
        super(proc, CptPeErrorDescription, parent);
        this.label = proc.label || CptPeErrorDescription.name;
    }


    public acceptLoad(load: GraphParam, portId?: string) {
        if ((load.type !== 'BOOLEAN' || load.value) && !this.triggeredError) {
            this.env.storeRawData(this, {
                type: 'ERROR',
                name: this.label
            });
            this.triggeredError = true;
        }
    }

    // shoot a blank
    protected _process() {
        if (!this.triggeredError) {
            this.env.storeRawData(this, {
                type: 'ERROR',
                name: this.label,
                blank: true
            });
        }
    }

    public reset() {
        super.reset();
        this.triggeredError = false;
    }

}
