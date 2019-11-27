import { State, Selector, Action, StateContext, Store } from '@ngxs/store';
import * as processiongElementActions from './processing-element.actions';
import { ProcessingElementRepository } from '@cpt/capacity-planning-simulation-pe-repository';

import { ProcessInterfaceDescription } from '@cpt/capacity-planning-simulation-types';
import { TreeService } from '@app/core_module/service/tree.service';
import { append, patch, updateItem } from '@ngxs/store/operators';
import { TreeNode } from '@app/core_module/interfaces/tree-node';
import { TreeStateModel } from '@system-models/state/tree.state';

export class ProcessingElementStateModel {
    public processingElements: ProcessInterfaceDescription[] = [];
    public graphModels: ProcessInterfaceDescription[] = [];
    public lastUpdate: Date;
    public loaded: boolean;
    public loading: boolean;
}

@State<ProcessingElementStateModel>({
    name: 'processingElements',
    defaults: {
        processingElements: [],
        graphModels: [],
        lastUpdate: new Date(0),
        loading: false,
        loaded: false,
    }
})
export class ProcessingElementState {

    constructor(
        private treeService: TreeService,
        private store: Store) { }

    @Selector()
    static processingElements(state: ProcessingElementStateModel) {
        return state.processingElements;
    }

    @Selector()
    static graphModels(state: ProcessingElementStateModel) {
        return state.graphModels;
    }

    @Selector()
    static pids(state: ProcessingElementStateModel) {
        return [...state.graphModels, ...state.processingElements];
    }

    @Selector()
    static errorWarningProcessingElements(state: ProcessingElementStateModel) {
        return state.processingElements.filter(el => el.name === 'Error' || el.name === 'Warning');
    }

    ngxsOnInit({ dispatch }: StateContext<ProcessingElementStateModel>) {
        dispatch(new processiongElementActions.LoadProcessingElements());
        dispatch(new processiongElementActions.LoadGraphModels());
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

    @Action(processiongElementActions.LoadGraphModels)
    loadGraphModels({ patchState, getState, setState }: StateContext<ProcessingElementStateModel>) {
        return this.treeService.getProcessInfo().subscribe(pi => {
            const state = getState();
            setState({ processingElements: state.processingElements, graphModels: pi, lastUpdate: this.treeService.getLastProcessUpdate(), loaded: true, loading: false });
            // patchState({graphModels: pi});
        });

    }
    @Action(processiongElementActions.UpdatedGraphModel)
    updateGraphModel({ patchState, getState, setState }: StateContext<ProcessingElementStateModel>, { payload }: processiongElementActions.UpdatedGraphModel) {
        const curPid = getState().graphModels.find(gm => gm.objectId === payload.objectId);
        if (curPid) {
            return setState(patch<ProcessingElementStateModel>({ graphModels: updateItem<ProcessInterfaceDescription>(pid => pid.objectId === payload.objectId, payload) }));
        } else {
            return setState(patch({ graphModels: append([payload]) }));
        }
    }

    @Action(processiongElementActions.UpdatedGraphModelName)
    updateGraphModelName({ patchState, getState, setState }: StateContext<ProcessingElementStateModel>, { payload }: processiongElementActions.UpdatedGraphModel) {
        const curPid = getState().graphModels.find(gm => gm.objectId === payload.objectId);
        if (curPid) {
            return setState(patch<ProcessingElementStateModel>({ graphModels: updateItem<ProcessInterfaceDescription>(pid => pid.objectId === payload.objectId, { ...curPid, name: payload.name }) }));
        }
    }


}
