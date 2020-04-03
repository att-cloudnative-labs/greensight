import { ProcessInterfaceDescription } from '@cpt/capacity-planning-simulation-types/lib';

export class ProcessingElementSearchResultSelected {
    static readonly type = '[Graph Control Bar] Processing Element Search Result Selected';
    constructor(public readonly payload: {
        graphModelId: string,
        graphModelOrProcessInterface: ProcessInterfaceDescription,
        position: any,
        label: string
    }) { }
}
