import { State, Action, StateContext, Selector, Store } from '@ngxs/store';
import * as libraryActions from './library.actions';
import * as librarySearchResultActions from './library-search-result.actions';
import { TreeNodeProperties } from './library.actions';
import { TreeState } from './tree.state';

import produce from 'immer';

export class LibraryStateModel {
    public searchString: string;
    public renameId: string;
    public treeNodePropertiesMap: {
        [id: string]: TreeNodeProperties
    };
}

@State<LibraryStateModel>({
    name: 'library',
    defaults: {
        searchString: '',
        renameId: null,
        treeNodePropertiesMap: {}
    }
})
export class LibraryState {
    constructor(private store: Store) { }

    @Selector()
    static treeNodePropertiesMap(state: LibraryStateModel) {
        return (nodeId: string) => {
            return state.treeNodePropertiesMap[nodeId];
        };
    }

    @Selector()
    static searchString(state: LibraryStateModel) {
        return state.searchString;
    }

    @Selector()
    static renameId(state: LibraryStateModel) {
        return state.renameId;
    }

    @Action(libraryActions.SetNodeProperties)
    setNodeProperties(
        { setState, getState }: StateContext<LibraryStateModel>,
        { payload }: libraryActions.SetNodeProperties) {
        const newState = produce(getState(), draft => {
            draft.treeNodePropertiesMap[payload.id] = payload.treeNodeProperties;
        });
        setState(newState);
    }

    @Action(libraryActions.UpdateSearchString)
    updateSearchString(
        { patchState }: StateContext<LibraryStateModel>,
        { payload }: libraryActions.UpdateSearchString
    ) {
        patchState({
            searchString: payload
        });
    }

    @Action(libraryActions.FolderClicked)
    @Action(libraryActions.GraphModelClicked)
    @Action(libraryActions.GraphModelTemplateClicked)
    @Action(libraryActions.SimulationClicked)
    @Action(libraryActions.SimulationResultClicked)
    @Action(librarySearchResultActions.FolderClicked)
    @Action(librarySearchResultActions.FolderDoubleClicked)
    @Action(librarySearchResultActions.GraphModelClicked)
    @Action(librarySearchResultActions.GraphModelDoubleClicked)
    @Action(librarySearchResultActions.GraphModelTemplateClicked)
    @Action(librarySearchResultActions.GraphModelTemplateDoubleClicked)
    @Action(librarySearchResultActions.SimulationClicked)
    @Action(librarySearchResultActions.SimulationResultClicked)
    @Action(librarySearchResultActions.SimulationDoubleClicked)
    @Action(librarySearchResultActions.SimulationResultDoubleClicked)
    nodeClicked(
        { setState, getState }: StateContext<LibraryStateModel>,
        { treeNode }: libraryActions.FolderClicked) {
        const newState = produce(getState(), draft => {
            draft.searchString = '';
            switch (treeNode.type) {
                case 'MODEL':
                case 'SIMULATION':
                case 'MODELTEMPLATE':
                    // expand the folder the nodes are in
                    draft.treeNodePropertiesMap[treeNode.parentId] = { isExpanded: true };
                    break;
                case 'SIMULATIONRESULT':
                    // expand the folde the parent of the node is in
                    // as the simulation results don't show up in the tree
                    const parentNode = this.store.selectSnapshot(TreeState.nodes).find(n => n.id === treeNode.parentId);
                    if (parentNode) {
                        draft.treeNodePropertiesMap[parentNode.parentId] = { isExpanded: true };
                    }
                    break;
                default:
                    break;

            }
        });
        setState(newState);
    }

    @Action(libraryActions.RenameFolderClicked)
    @Action(libraryActions.RenameGraphModelClicked)
    @Action(libraryActions.RenameGraphModelTemplateClicked)
    @Action(libraryActions.RenameSimulationClicked)
    @Action(libraryActions.RenameSimulationResultClicked)
    renameNodeClicked(
        { setState, getState }: StateContext<LibraryStateModel>,
        { treeNode }: libraryActions.RenameFolderClicked) {
        const newState = produce(getState(), draft => {
            if (draft.renameId !== treeNode.id) {
                draft.renameId = treeNode.id;
            }
        });
        setState(newState);
    }

    @Action(libraryActions.RenameFolderEscaped)
    @Action(libraryActions.RenameGraphModelEscaped)
    @Action(libraryActions.RenameGraphModelTemplateEscaped)
    @Action(libraryActions.RenameSimulationEscaped)
    @Action(libraryActions.RenameSimulationResultEscaped)
    cancelRenameMode(
        { setState, getState }: StateContext<LibraryStateModel>) {
        const newState = produce(getState(), draft => {
            draft.renameId = null;
        });
        setState(newState);
    }
}
