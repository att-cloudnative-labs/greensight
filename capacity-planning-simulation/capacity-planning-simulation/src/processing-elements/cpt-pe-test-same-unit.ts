import { CptProcessingElement } from '../cpt-processing-element';
import { GraphModel, Process, Inport, Outport, ProcessPortTemplate, ProcessInterfaceDescription, GraphParam, BooleanParam } from '@cpt/capacity-planning-simulation-types';
import { CptSimulationProcessIf } from '../cpt-object';
import { hasUnit } from '../cpt-load-ops';

export var CptPeTestSameUnitDescription: ProcessInterfaceDescription = {
    objectId: "752583fd-bc36-4604-9d5f-a276e9974c46",
    objectType: 'PROCESS_INTERFACE_DESCRIPTION',
    implementation: 'PROCESSING_ELEMENT',
    name: 'Test Same Unit',
    inports: {
        '92f778c4-4004-4c27-999a-b5964eee5911': {
            name: 'In-A',
            objectId: '92f778c4-4004-4c27-999a-b5964eee5911',
            objectType: 'INPORT',
            requiredTypes: [],
            desiredUnits: [],
            generatesResponse: 'NEVER',
            index: 0
        } as Inport,
        '58e3d41f-49f5-413c-a0c6-4a1a960d6f81': {
            name: 'In-B',
            objectId: '58e3d41f-49f5-413c-a0c6-4a1a960d6f81',
            objectType: 'INPORT',
            requiredTypes: [],
            desiredUnits: [],
            generatesResponse: 'NEVER',
            index: 1
        } as Inport
    },
    outports: {
        '46271475-2356-45b9-b32a-317130f733e9': {
            name: 'Out',
            objectId: '46271475-2356-45b9-b32a-317130f733e9',
            objectType: 'OUTPORT',
            types: ['BOOLEAN'],
            index: 0
        } as Outport
    },
    portTemplates: {
        'a1c3068b-d519-4b50-bffb-11e77c227596': {
            name: "In-X",
            objectId: 'a1c3068b-d519-4b50-bffb-11e77c227596',
            objectType: 'PROCESS_PORT_TEMPLATE',
            description: 'Add an additional inport for the comparison.',
            inportTemplates: {
                '2da68923-81de-49f2-9e75-5936420135ab': {
                    name: 'In-X',
                    objectId: '2da68923-81de-49f2-9e75-5936420135ab',
                    objectType: 'INPORT',
                    requiredTypes: [],
                    desiredUnits: [],
                    generatesResponse: 'NEVER',
                    index: 0
                } as Inport
            },
            outportTemplates: {}
        } as ProcessPortTemplate
    }
}


export class CptPeTestSameUnit extends CptProcessingElement {
    public readonly INPORT_A_ID = '92f778c4-4004-4c27-999a-b5964eee5911';
    public readonly INPORT_B_ID = '58e3d41f-49f5-413c-a0c6-4a1a960d6f81';
    public readonly OUTPORT_ID = '46271475-2356-45b9-b32a-317130f733e9';
    public readonly INPORT_TMPL_ID = '2da68923-81de-49f2-9e75-5936420135ab';

    constructor(public proc: Process, public parent: CptSimulationProcessIf) {
        super(proc, CptPeTestSameUnitDescription, parent);
        this.label = proc.label || CptPeTestSameUnitDescription.name;
    }

    private getUnit(gp: GraphParam): string | undefined {
        if (hasUnit(gp)) {
            return (gp.unit);
        }
        return undefined;
    }

    // process the load internally
    protected _process() {
        super._process();
        let inportA = this.inports[this.INPORT_A_ID];
        let inportB = this.inports[this.INPORT_B_ID];
        let outport = this.outports[this.OUTPORT_ID];
        inportA.process();
        inportB.process();
        // these are the dynamically added summand ports
        let extraPorts = this.getTemplatePortInstances(this.INPORT_TMPL_ID);
        for (let inport of extraPorts) {
            inport.process();
        }
        let a = inportA.yieldLoad();
        let b = inportB.yieldLoad();
        let checkUnit: string | undefined = this.getUnit(a);
        let allTheSameUnit: boolean = true;

        allTheSameUnit = this.getUnit(b) === checkUnit;
        if (allTheSameUnit) {
            for (let inport of extraPorts) {
                allTheSameUnit = this.getUnit(inport.yieldLoad()) === checkUnit;
                if (!allTheSameUnit) {
                    break;
                }
            }
        }

        let result: BooleanParam = {
            type: 'BOOLEAN',
            value: allTheSameUnit
        }
        outport.acceptLoad(result);
        outport.process();
    }

}
