import { State, Action, StateContext, Selector } from '@ngxs/store';
import * as trashActions from './trash.actions';
import { TreeService } from '@app/core_module/service/tree.service';
import { TreeNode } from '@app/core_module/interfaces/tree-node';

import { catchError, map } from 'rxjs/operators';
import { asapScheduler, of } from 'rxjs';
import { Utils } from '@app/utils_module/utils';

export class TrashStateModel {
    public nodes: TreeNode[];
    public loaded: boolean;
    public loading: boolean;
    public typeFilter: string[];
    public searchString: string;
    public selected: TreeNode;
}

@State<TrashStateModel>({
    name: 'trash',
    defaults: {
        nodes: [],
        loading: false,
        loaded: false,
        typeFilter: ['FOLDER', 'MODEL', 'MODELTEMPLATE', 'SIMULATION', 'SIMULATIONRESULT'],
        searchString: '',
        selected: null
    }
})
export class TrashState {

    constructor(private treeService: TreeService) { }

    @Selector()
    static hasLoaded(state: TrashStateModel) {
        return state.loaded;
    }

    @Selector()
    static trashedNodes(state: TrashStateModel) {
        return state.nodes.filter(node => node.id !== 'root');
    }

    @Selector()
    static nodesOfTypes(state: TrashStateModel) {
        return state.nodes.filter(node => node.id !== 'root' && state.typeFilter.includes(node.type));
    }

    @Selector()
    static typeFilter(state: TrashStateModel) {
        return state.typeFilter;
    }

    @Selector()
    static searchString(state: TrashStateModel) {
        return state.searchString;
    }

    @Selector()
    static selected(state: TrashStateModel) {
        return state.selected;
    }

    @Action(trashActions.LoadTrash)
    loadTrash({ patchState }: StateContext<TrashStateModel>) {
        patchState({ loading: true, loaded: false });
        return this.treeService
            .getTrash().subscribe(trashedNodes => {
                trashedNodes.forEach(node => {
                    node.trashedDate = Utils.convertUTCToUserTimezone(node.trashedDate);
                });
                patchState({
                    nodes: trashedNodes,
                    loaded: true,
                    loading: false
                });
            });
    }

    @Action(trashActions.AddTrashedNode)
    addTrashTreeNode({ getState, patchState }: StateContext<TrashStateModel>,
        { payload }: trashActions.AddTrashedNode) {
        const state = getState();
        // remove trashed child nodes from the list
        const nodesWithoutTrashedChildren = state.nodes.filter(node => node.parentId !== payload.id);
        // get trashedDate
        return this.treeService
            .getTrashedNode(payload)
            .pipe(
                map((response: any) => {
                    const newTrashNode = response.data;
                    newTrashNode.forEach(node => {
                        node.trashedDate = Utils.convertUTCToUserTimezone(node.trashedDate);
                    });
                    patchState({ nodes: [...nodesWithoutTrashedChildren, ...newTrashNode] });
                }),
                catchError(error =>
                    of(
                        asapScheduler.schedule(() => {
                            console.error(error);
                            patchState({ nodes: state.nodes, loading: false, loaded: true });
                        })
                    )
                )
            );
    }

    @Action(trashActions.AddTrashedFolderNode)
    addTrashedFolderNode({ getState, patchState }: StateContext<TrashStateModel>,
        { payload }: trashActions.AddTrashedFolderNode) {
        const state = getState();
        const nodesWithoutFolderChildren = getState().nodes.filter(node => node.parentId !== payload.id);
        const newTrashedNode = payload;
        patchState({
            nodes: [...nodesWithoutFolderChildren, newTrashedNode]
        });
    }


    @Action(trashActions.RemoveTrashedNode)
    removeTrashedTreeNode({ getState, patchState }: StateContext<TrashStateModel>,
        { payload }: trashActions.RemoveTrashedNode) {
        const state = getState();
        const newTrashedNode = payload;
        patchState({
            nodes: getState().nodes.filter(node => node.id !== payload.id),
            selected: null
        });
    }


    @Action(trashActions.UpdateTrashTypeFilter)
    updateTrashFilterTypes(
        { patchState }: StateContext<TrashStateModel>,
        { payload }: trashActions.UpdateTrashTypeFilter
    ) {
        patchState({
            typeFilter: payload
        });
    }

    @Action(trashActions.UpdateSearchString)
    updateSearchString(
        { patchState }: StateContext<TrashStateModel>,
        { payload }: trashActions.UpdateSearchString
    ) {
        patchState({ searchString: payload });
    }

    @Action(trashActions.TrashedNodeRowClicked)
    selectTrashedNode({ getState, patchState }: StateContext<TrashStateModel>,
        { payload }: trashActions.TrashedNodeRowClicked) {
        const state = getState();
        if (state.selected === payload) {
            patchState({ selected: null });
        } else {
            patchState({ selected: payload });
        }
    }

    @Action(trashActions.LibraryNodeClicked)
    @Action(trashActions.TrashPanelClosed)
    deselectTrashNode({ patchState }: StateContext<TrashStateModel>) {
        patchState({ selected: null });
    }
}
