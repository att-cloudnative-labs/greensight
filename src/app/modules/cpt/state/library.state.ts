import { State, Action, StateContext, Selector, Store, createSelector } from '@ngxs/store';
import * as libraryActions from './library.actions';
import * as librarySearchResultActions from './library-search-result.actions';
import * as treeActions from './tree.actions';

import { TreeNodeProperties } from './library.actions';
import { TreeState } from './tree.state';

import produce from 'immer';
import { TreeNodeInfo } from '@cpt/interfaces/tree-node-tracking';
import { TreeService } from '@cpt/services/tree.service';
import { tap } from 'rxjs/operators';
import * as Sifter from 'sifter';


export class LibraryStateModel {
    public searchString: string;
    public renameId: string;
    public treeNodePropertiesMap: {
        [id: string]: TreeNodeProperties
    };
    public searchResults: { [searchTerm: string]: TreeNodeInfo[] };
}

@State<LibraryStateModel>({
    name: 'library',
    defaults: {
        searchString: '',
        renameId: null,
        treeNodePropertiesMap: {},
        searchResults: {}
    }
})
export class LibraryState {
    static readonly QUERY_PAGE_SIZE = 50;

    constructor(private store: Store, private treeService: TreeService) { }

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

    static searchResults(term: string) {
        return createSelector([LibraryState], (state: LibraryStateModel) => {
            const trimmedTerm = term.trim();
            if (trimmedTerm.length > 0) {
                for (let i = trimmedTerm.length; i >= 0; i--) {
                    const cacheLookUp = trimmedTerm.toLowerCase().substr(0, i);
                    if (state.searchResults[cacheLookUp]) {
                        const cachedResults = state.searchResults[cacheLookUp];
                        const sifter = new Sifter(cachedResults);
                        const sifterResults = sifter.search(term, {
                            fields: ['name'],
                            sort: [{ field: 'name', direction: 'asc' }],
                        });
                        return sifterResults.items.map(item => {
                            return cachedResults[item.id];
                        });
                    }
                }
            }
            return [];
        });
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

    private isCached(st: string, state: LibraryStateModel): boolean {
        const curSearchResults = state.searchResults;
        // if the exact term is in the cache return results
        if (curSearchResults[st]) {
            return true;
        }
        // otherwise check if some non query page size sub strings are cached
        for (let i = 1; i < st.length; i++) {
            const cacheCheckTerm = st.toLowerCase().substr(0, i);
            if (curSearchResults[cacheCheckTerm] && curSearchResults[cacheCheckTerm].length < LibraryState.QUERY_PAGE_SIZE) {
                return true;
            }
        }
        return false;

    }

    @Action(libraryActions.UpdateSearchString)
    updateSearchString(
        { patchState, getState, setState }: StateContext<LibraryStateModel>,
        { payload }: libraryActions.UpdateSearchString
    ) {
        const trimmedTerm = payload.trim();
        if (trimmedTerm.length && !this.isCached(trimmedTerm, getState())) {
            return this.treeService.search({ searchTerm: trimmedTerm, nodeTypes: ['FC_SHEET', 'FOLDER', 'SIMULATION', 'MODEL'], page: 0, size: LibraryState.QUERY_PAGE_SIZE }).pipe(
                tap(searchResults => {
                    const updatedSearchResults = produce(getState().searchResults, (draft) => {
                        draft[trimmedTerm.toLowerCase()] = searchResults;
                    });
                    patchState({
                        searchResults: updatedSearchResults,
                        searchString: payload
                    });
                })
            );
        } else {
            return patchState({
                searchString: payload
            });
        }
    }

    @Action(libraryActions.FolderClicked)
    @Action(libraryActions.GraphModelClicked)
    @Action(libraryActions.SimulationClicked)
    @Action(libraryActions.SimulationResultClicked)
    @Action(librarySearchResultActions.FolderClicked)
    @Action(librarySearchResultActions.FolderDoubleClicked)
    @Action(librarySearchResultActions.GraphModelClicked)
    @Action(librarySearchResultActions.GraphModelDoubleClicked)
    @Action(librarySearchResultActions.SimulationClicked)
    @Action(librarySearchResultActions.SimulationResultClicked)
    @Action(librarySearchResultActions.SimulationDoubleClicked)
    @Action(librarySearchResultActions.SimulationResultDoubleClicked)
    @Action(libraryActions.ForecastSheetClicked)
    @Action(libraryActions.ForecastSheetDoubleClicked)
    @Action(librarySearchResultActions.ForecastSheetDoubleClicked)
    @Action(librarySearchResultActions.ForecastSheetClicked)
    nodeClicked(
        { setState, getState }: StateContext<LibraryStateModel>,
        { treeNode }: libraryActions.FolderClicked) {
        const newState = produce(getState(), draft => {
            draft.searchString = '';
            switch (treeNode.type) {
                case 'FC_SHEET':
                case 'MODEL':
                case 'SIMULATION':
                    // expand the folder the nodes are in
                    draft.treeNodePropertiesMap[treeNode.parentId] = { isExpanded: true };
                    break;
                case 'SIMULATIONRESULT':
                    // expand the folder the parent of the node is in
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
        if (!this.store.selectSnapshot(TreeState.nodes).find(n => n.id === treeNode.id)) {
            this.store.dispatch(new libraryActions.FolderAccessed({ id: treeNode.parentId, name: '', parentId: 'root', type: 'FOLDER' }));
        }
    }

    @Action(libraryActions.RenameFolderClicked)
    @Action(libraryActions.RenameGraphModelClicked)
    @Action(libraryActions.RenameSimulationClicked)
    @Action(libraryActions.RenameSimulationResultClicked)
    @Action(libraryActions.RenameForecastSheetClicked)
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
    @Action(libraryActions.RenameSimulationEscaped)
    @Action(libraryActions.RenameSimulationResultEscaped)
    @Action(libraryActions.RenameForecastSheetEscaped)
    cancelRenameMode(
        { setState, getState }: StateContext<LibraryStateModel>) {
        const newState = produce(getState(), draft => {
            draft.renameId = null;
        });
        setState(newState);
    }

    @Action(treeActions.CreatedTreeNode)
    @Action(libraryActions.RenameFolderCommitted)
    @Action(libraryActions.RenameForecastSheetCommitted)
    @Action(libraryActions.RenameGraphModelCommitted)
    @Action(libraryActions.RenameSimulationCommitted)
    cleanCache({ patchState }: StateContext<LibraryStateModel>) {
        return patchState({ searchResults: {} });
    }

}
