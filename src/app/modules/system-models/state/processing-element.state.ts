import { State, Selector, Action, StateContext } from '@ngxs/store';
import * as processiongElementActions from './processing-element.actions';
import { ProcessingElementRepository } from '@cpt/capacity-planning-simulation-pe-repository';

// TODO: Restore this when cpst exports it again
// import {ProcessInterfaceDescription} from '@cpt/capacity-planning-simulation-types';

export class ProcessingElementStateModel {
    public processingElements = []; // TODO: re-type once the import above works
    public loaded: boolean;
    public loading: boolean;
}

@State<ProcessingElementStateModel>({
    name: 'processingElements',
    defaults: {
        processingElements: [],
        loading: false,
        loaded: false,
    }
})
export class ProcessingElementState {
    @Selector()
    static processingElements(state: ProcessingElementStateModel) {
        return state.processingElements;
    }

    @Selector()
    static errorWarningProcessingElements(state: ProcessingElementStateModel) {
        return state.processingElements.filter(el => el.name === 'Error' || el.name === 'Warning');
    }

    ngxsOnInit({ dispatch }: StateContext<ProcessingElementStateModel>) {
        dispatch(new processiongElementActions.LoadProcessingElements());
    }

    @Action(processiongElementActions.LoadProcessingElements)
    loadProcessingElements(
        { patchState }: StateContext<ProcessingElementStateModel>,
    ) {
        const processingElements = [];
        // get processing elements from npm package
        for (const x in ProcessingElementRepository) {
            if (x) {
                const pe = ProcessingElementRepository[x];
                processingElements.push(pe);
            }
        }
        patchState({ processingElements: processingElements });
    }
}
