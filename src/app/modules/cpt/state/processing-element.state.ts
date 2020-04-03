import { State, Selector, Action, StateContext } from '@ngxs/store';
import * as processingElementActions from './processing-element.actions';
import { ProcessingElementRepository } from '@cpt/capacity-planning-simulation-pe-repository';
import { ProcessInterfaceDescription } from '@cpt/capacity-planning-simulation-types';


export class ProcessingElementStateModel {
    public processingElements: ProcessInterfaceDescription[] = [];
    public lastUpdate: Date;
    public loaded: boolean;
    public loading: boolean;
}

@State<ProcessingElementStateModel>({
    name: 'processingElements',
    defaults: {
        processingElements: [],
        lastUpdate: new Date(0),
        loading: false,
        loaded: false,
    }
})
export class ProcessingElementState {

    constructor() { }

    @Selector()
    static processingElements(state: ProcessingElementStateModel) {
        return state.processingElements;
    }

    @Selector()
    static errorWarningProcessingElements(state: ProcessingElementStateModel) {
        return state.processingElements.filter(el => el.name === 'Error' || el.name === 'Warning');
    }

    @Action(processingElementActions.LoadProcessingElements)
    loadProcessingElements(
        { patchState }: StateContext<ProcessingElementStateModel>,
    ) {
        patchState({ processingElements: Object.values(ProcessingElementRepository) });
    }
}
