import { CptProcessingElement } from '../cpt-processing-element';
import { Process, Inport, Outport, ProcessInterfaceDescription, StringParam, AspectParam, Aspect } from '@cpt/capacity-planning-simulation-types';
import { CptSimulationProcessIf } from '../cpt-object';

export var CptPeExtractBreakdownDescription: ProcessInterfaceDescription = {
    objectId: "ebf77855-9624-46a6-a1d9-7eb756343c66",
    objectType: 'PROCESS_INTERFACE_DESCRIPTION',
    implementation: 'PROCESSING_ELEMENT',
    name: 'Extract Breakdown',
    inports: {
        'ce00c1e2-0677-4c3e-8e58-e7bce8c1b088': {
            name: 'Load',
            objectId: 'ce00c1e2-0677-4c3e-8e58-e7bce8c1b088',
            objectType: 'INPORT',
            requiredTypes: ['NUMBER'],
            desiredUnits: [],
            generatesResponse: 'PASSTHROUGH',
            index: 0
        } as Inport,
        '9fd695a2-6830-11e9-a923-1681be663d3e': {
            objectId: '9fd695a2-6830-11e9-a923-1681be663d3e',
            objectType: 'INPORT',
            name: 'Aspect Name',
            requiredTypes: ['STRING'],
            desiredUnits: [],
            generatesResponse: 'NEVER',
            index: 1
        } as Inport,
    },
    outports: {
        '71646d47-3371-4579-bd12-50dfb262b425': {
            name: 'Aspect',
            objectId: '71646d47-3371-4579-bd12-50dfb262b425',
            objectType: 'OUTPORT',
            types: ['BREAKDOWN'],
            index: 0
        } as Outport
    },
    portTemplates: {},
}

export class CptPeExtractBreakdown extends CptProcessingElement {
    public readonly INPORT_LOAD_ID = 'ce00c1e2-0677-4c3e-8e58-e7bce8c1b088';
    public readonly INPORT_ASPECT_NAME_ID = '9fd695a2-6830-11e9-a923-1681be663d3e';
    public readonly OUTPORT_ID = '71646d47-3371-4579-bd12-50dfb262b425';

    constructor(public proc: Process, public parent: CptSimulationProcessIf) {
        super(proc, CptPeExtractBreakdownDescription, parent);
        this.label = proc.label || CptPeExtractBreakdownDescription.name;
    }

    public process() {
        super.process();
        let inportLoad = this.inports[this.INPORT_LOAD_ID];
        let inportAspectName = this.inports[this.INPORT_ASPECT_NAME_ID];
        let outport = this.outports[this.OUTPORT_ID];

        inportLoad.process();
        inportAspectName.process();
        let load = inportLoad.yieldLoad();
        let aspectNameParam = inportAspectName.yieldLoad();

        if (load) {
            if (load.type === 'ASPECT_NUMBER' && load.aspects.length > 0) {
                let aspect: Aspect;
                //extract first breakdown
                if (!aspectNameParam || aspectNameParam.type !== 'STRING') {
                    aspect = load.aspects[0];
                }
                //extract aspect by name
                else {
                    let aspectName: string = (aspectNameParam as StringParam).value;
                    aspect = load.aspects.find(aspect => aspect.name === aspectName);
                }
                if (aspect) {
                    let aspectParam = {
                        type: 'ASPECT',
                        value: aspect
                    } as AspectParam;

                    outport.acceptLoad(aspectParam);
                    outport.process();
                }
            }
        }
    }
}
