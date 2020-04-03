import { TrackingModes } from '@cpt/capacity-planning-simulation-types/lib';

export class LabelChanged {
    static readonly type = '[Gm Process Details] Label Changed';
    constructor(public readonly payload: {
        graphModelId: string,
        processId: any;
        label: string;
    }) { }
}
export class TrackingUpdated {
    static readonly type = '[GM Process Details] Tracking Updated';
    constructor(public readonly payload: {
        graphModelId: string,
        processId: any;
        trackingMode: TrackingModes;
        releaseNr?: number;
    }) { }
}


