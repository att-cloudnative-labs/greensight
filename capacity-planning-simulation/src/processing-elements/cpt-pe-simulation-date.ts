import { CptProcessingElement } from '../cpt-processing-element';
import { GraphModel, Process, Inport, Outport, ProcessPortTemplate, ProcessInterfaceDescription } from '@cpt/capacity-planning-simulation-types';
import { CptSimulationProcessIf } from '../cpt-object';

export var CptPeSimulationDateDescription: ProcessInterfaceDescription = {
    objectId: '595fddc9-5684-4a4a-a71e-14ed9885b995',
    objectType: 'PROCESS_INTERFACE_DESCRIPTION',
    implementation: 'PROCESSING_ELEMENT',
    name: 'Simulation Date',
    inports: {},
    outports: {
        '5b9b238a-fbbb-44c0-b31e-e8e1cff8cb3d': {
            objectId: '5b9b238a-fbbb-44c0-b31e-e8e1cff8cb3d',
            objectType: 'OUTPORT',
            name: 'Year',
            types: ['NUMBER'],
            index: 1
        } as Outport,
        'ba5ff363-0e26-49fc-9322-5674ee95728d': {
            objectId: 'ba5ff363-0e26-49fc-9322-5674ee95728d',
            objectType: 'OUTPORT',
            name: 'Months',
            types: ['NUMBER'],
            index: 2
        } as Outport
    },
    portTemplates: {}
};

export class CptPeSimulationDate extends CptProcessingElement {
    public readonly OUTPORT_YEAR_ID = '5b9b238a-fbbb-44c0-b31e-e8e1cff8cb3d';
    public readonly OUTPORT_MONTH_ID = 'ba5ff363-0e26-49fc-9322-5674ee95728d';
    constructor(public proc: Process, public parent: CptSimulationProcessIf) {
        super(proc, CptPeSimulationDateDescription, parent);
        this.label = proc.label || CptPeSimulationDateDescription.name;
    }

    process() {
        let outportYear = this.outports[this.OUTPORT_YEAR_ID];
        let outportMonth = this.outports[this.OUTPORT_MONTH_ID];
        // YYYY-MM
        let monthYear = this.env.getCurrentSimulationDate();
        if (monthYear) {
            let year = parseInt(monthYear.slice(0, 4));
            let month = parseInt(monthYear.slice(5));
            outportYear.acceptLoad({ type: 'NUMBER', value: year, unit: 'Y' });
            outportMonth.acceptLoad({ type: 'NUMBER', value: month, unit: 'M' });
            outportYear.process();
            outportMonth.process();
        }
    }

}