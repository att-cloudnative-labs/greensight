import { CptProcessingElement } from '../cpt-processing-element';
import { GraphModel, Process, Inport, Outport, ProcessInterfaceDescription, GraphParam, ProcessPortTemplate } from '@cpt/capacity-planning-simulation-types';
import { CptSimulationProcessIf } from '../cpt-object';
import { multiply } from '../cpt-math-ops';
import { isNumber, cloneParam } from '../cpt-load-ops';


export var CptPeMultiplyDescription: ProcessInterfaceDescription = {
    objectId: '59b677a7-ac5d-40cf-acd5-16a97db17719',
    objectType: 'PROCESS_INTERFACE_DESCRIPTION',
    implementation: 'PROCESSING_ELEMENT',
    name: 'Multiply',
    inports: {
        '92665c3d-9dde-471d-9413-8e59ca17f383': {
            name: 'In-A',
            objectId: '92665c3d-9dde-471d-9413-8e59ca17f383',
            objectType: 'INPORT',
            requiredTypes: ['NUMBER'],
            desiredUnits: [],
            generatesResponse: 'PASSTHROUGH',
            index: 0
        } as Inport,
        '2863c566-fe47-47bb-99ef-76a5939c7e96': {
            name: 'In-B',
            objectId: '2863c566-fe47-47bb-99ef-76a5939c7e96',
            objectType: 'INPORT',
            requiredTypes: ['NUMBER'],
            desiredUnits: [],
            generatesResponse: 'PASSTHROUGH',
            index: 1
        } as Inport
    },
    outports: {
        'b1a554bd-1572-4e8e-ba8f-1a1fa519be72': {
            name: 'Out',
            objectId: 'b1a554bd-1572-4e8e-ba8f-1a1fa519be72',
            objectType: 'OUTPORT',
            types: ['NUMBER'],
            index: 0,
        } as Outport,
        'cac91c55-68d9-4859-bb5b-151717572bec': {
            name: 'Out (Custom Unit)',
            objectId: 'cac91c55-68d9-4859-bb5b-151717572bec',
            objectType: 'OUTPORT',
            types: ['NUMBER'],
            index: 1,
            configType: 'STRING'
        } as Outport
    },
    portTemplates: {
        '772e3300-5e8f-4cce-a5d9-95116d591d48': {
            name: "Multiplicand",
            objectId: '772e3300-5e8f-4cce-a5d9-95116d591d48',
            objectType: 'PROCESS_PORT_TEMPLATE',
            description: 'Add an additional multiplicand inport.',
            inportTemplates: {
                '72e1614c-8075-42a6-a407-37b08b5e691d': {
                    name: 'Multiplicand',
                    objectId: '72e1614c-8075-42a6-a407-37b08b5e691d',
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

export class CptPeMultiply extends CptProcessingElement {
    public readonly INPORT_A_ID = '92665c3d-9dde-471d-9413-8e59ca17f383';
    public readonly INPORT_B_ID = '2863c566-fe47-47bb-99ef-76a5939c7e96';
    public readonly OUTPORT_ID = 'b1a554bd-1572-4e8e-ba8f-1a1fa519be72';
    public readonly OUTPORT_CUSTOM_UNIT_ID = 'cac91c55-68d9-4859-bb5b-151717572bec';
    public readonly TMPL_MULTIPLICAND_INPORT_ID = '72e1614c-8075-42a6-a407-37b08b5e691d';

    constructor(public proc: Process, public parent: CptSimulationProcessIf) {
        super(proc, CptPeMultiplyDescription, parent);
        this.label = proc.label || CptPeMultiplyDescription.name;
    }
    protected _process() {
        super._process();
        let inportA = this.inports[this.INPORT_A_ID];
        let inportB = this.inports[this.INPORT_B_ID];
        let outport = this.outports[this.OUTPORT_ID];
        let outportCustomUnit = this.outports[this.OUTPORT_CUSTOM_UNIT_ID];
        inportA.process();
        inportB.process();

        // these are the dynamically added multiplicand ports
        let multiplicandPorts = this.getTemplatePortInstances(this.TMPL_MULTIPLICAND_INPORT_ID);
        for (let inport of multiplicandPorts) {
            inport.process();
        }
        let a = inportA.yieldLoad();
        let b = inportB.yieldLoad();

        let customUnit: string = undefined
        if (outportCustomUnit && outportCustomUnit.processOutport.config && outportCustomUnit.processOutport.config.type === 'STRING') {
            customUnit = outportCustomUnit.processOutport.config.value;
        }

        try {
            let product = multiply(a, b);
            for (let inport of multiplicandPorts) {
                let multiplicand = inport.yieldLoad();
                if (isNumber(multiplicand)) {
                    product = multiply(product, multiplicand);
                }
            }
            outport.acceptLoad(product);
            outport.process();

            if (outportCustomUnit) {
                let productCustomUnit = cloneParam(product);

                if (isNumber(productCustomUnit)) {
                    productCustomUnit.unit = customUnit;
                }
                outportCustomUnit.acceptLoad(productCustomUnit);
                outportCustomUnit.process();
            }
        } catch (e) {
            this.env.logProgress("failed to calculate product: " + e);
        }
    }
}
