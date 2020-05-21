import { CptProcessingElement } from '../cpt-processing-element';
import { GraphModel, Process, Inport, Outport, ProcessPortTemplate, ProcessInterfaceDescription, GraphParam } from '@cpt/capacity-planning-simulation-types';
import { CptSimulationProcessIf, CptInformationPackage } from '../cpt-object';

export var CptPeWarningDescription: ProcessInterfaceDescription = {
    objectId: "e3cc50a9-795c-4a47-8643-6d0aee39b49c",
    objectType: 'PROCESS_INTERFACE_DESCRIPTION',
    implementation: 'PROCESSING_ELEMENT',
    name: 'Warning',
    inports: {
        'a3cbcc81-fb06-4bd2-87cd-31c6665de9ce': {
            name: 'Trigger',
            objectId: 'a3cbcc81-fb06-4bd2-87cd-31c6665de9ce',
            objectType: 'INPORT',
            requiredTypes: [],
            desiredUnits: [],
            generatesResponse: 'NEVER',
            index: 0
        } as Inport
    },
    outports: {},
    portTemplates: {},
    visualizationHint: 'WARNING'
}



export class CptPeWarning extends CptProcessingElement {

    private triggeredWarning: boolean = false;

    constructor(public proc: Process, public parent: CptSimulationProcessIf) {
        super(proc, CptPeWarningDescription, parent);
        this.label = proc.label || CptPeWarningDescription.name;
    }
    public acceptLoad(load: GraphParam, portId?: string) {
        if ((load.type !== 'BOOLEAN' || load.value) && !this.triggeredWarning) {
            this.env.storeRawData(this, {
                type: 'WARNING',
                name: this.label
            });
            this.triggeredWarning = true;
        }
    }

    // shoot a blank
    protected _process() {
        if (!this.triggeredWarning) {
            this.env.storeRawData(this, {
                type: 'WARNING',
                name: this.label,
                blank: true
            });
        }
    }

    public reset() {
        super.reset();
        this.triggeredWarning = false;
    }

}
