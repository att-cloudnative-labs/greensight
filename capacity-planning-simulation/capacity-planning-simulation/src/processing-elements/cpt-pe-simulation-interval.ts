import { CptProcessingElement } from '../cpt-processing-element';
import { GraphModel, Process, Inport, Outport, ProcessPortTemplate, ProcessInterfaceDescription } from '@cpt/capacity-planning-simulation-types';
import { CptSimulationProcessIf } from '../cpt-object';
import { getMonthNr, monthNrToString } from '../cpt-date-ops';

export var CptPeSimulationIntervalDescription: ProcessInterfaceDescription = {
    objectId: '498a73a6-a046-43bf-9f59-3847daa52296',
    objectType: 'PROCESS_INTERFACE_DESCRIPTION',
    implementation: 'PROCESSING_ELEMENT',
    name: 'Simulation Interval',
    inports: {},
    outports: {
        'c4983ca6-322f-4a8d-9ddf-6bd80aad9ee7': {
            objectId: 'c4983ca6-322f-4a8d-9ddf-6bd80aad9ee7',
            objectType: 'OUTPORT',
            name: 'Days',
            types: ['NUMBER'],
            index: 1
        } as Outport,
        '5e883248-3547-48fa-98df-9e04c513d23a': {
            objectId: '5e883248-3547-48fa-98df-9e04c513d23a',
            objectType: 'OUTPORT',
            name: 'Hours',
            types: ['NUMBER'],
            index: 2
        } as Outport,
        'c40b53e7-e5f5-47f6-896e-dd90c09277d4': {
            objectId: 'c40b53e7-e5f5-47f6-896e-dd90c09277d4',
            objectType: 'OUTPORT',
            name: 'Minutes',
            types: ['NUMBER'],
            index: 3
        } as Outport,
        '3c254e49-6910-454a-bc28-ba7338716ed0': {
            objectId: '3c254e49-6910-454a-bc28-ba7338716ed0',
            objectType: 'OUTPORT',
            name: 'Seconds',
            types: ['NUMBER'],
            index: 4
        } as Outport
    },
    portTemplates: {}
};

export class CptPeSimulationInterval extends CptProcessingElement {
    public readonly OUTPORT_DAYS_ID = 'c4983ca6-322f-4a8d-9ddf-6bd80aad9ee7';
    public readonly OUTPORT_HOURS_ID = '5e883248-3547-48fa-98df-9e04c513d23a';
    public readonly OUTPORT_MINUTES_ID = 'c40b53e7-e5f5-47f6-896e-dd90c09277d4';
    public readonly OUTPORT_SECONDS_ID = '3c254e49-6910-454a-bc28-ba7338716ed0';
    constructor(public proc: Process, public parent: CptSimulationProcessIf) {
        super(proc, CptPeSimulationIntervalDescription, parent);
        this.label = proc.label || CptPeSimulationIntervalDescription.name;
    }

    protected _process() {
        let outportDays = this.outports[this.OUTPORT_DAYS_ID];
        let outportHours = this.outports[this.OUTPORT_HOURS_ID];
        let outportMinutes = this.outports[this.OUTPORT_MINUTES_ID];
        let outportSeconds = this.outports[this.OUTPORT_SECONDS_ID];
        let monthYear = this.env.getCurrentSimulationDate();
        if (monthYear) {
            let nextMonthYear = monthNrToString(getMonthNr(monthYear) + 1);
            let curDate = new Date(monthYear);
            let nextDate = new Date(nextMonthYear);
            let millis = nextDate.getTime() - curDate.getTime();
            let seconds = Math.ceil(millis / 1000);
            let minutes = Math.ceil(seconds / 60);
            let hours = Math.ceil(minutes / 60);
            let days = Math.ceil(hours / 24);
            outportDays.acceptLoad({ type: 'NUMBER', value: days, unit: 'd' });
            outportHours.acceptLoad({ type: 'NUMBER', value: hours, unit: 'h' });
            outportMinutes.acceptLoad({ type: 'NUMBER', value: minutes, unit: 'm' });
            outportSeconds.acceptLoad({ type: 'NUMBER', value: seconds, unit: 's' });

            outportDays.process();
            outportHours.process();
            outportMinutes.process();
            outportSeconds.process();
        }
    }

}
