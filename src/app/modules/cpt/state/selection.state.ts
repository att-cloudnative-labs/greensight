import { State, Selector, Action, StateContext, Store } from '@ngxs/store';
import produce from 'immer';

import { TreeState, TreeStateModel } from './tree.state';
import { ProcessingElementState, ProcessingElementStateModel } from './processing-element.state';
import * as libraryActions from './library.actions';
import * as librarySearchResultActions from './library-search-result.actions';
import * as graphEditorActions from './graph-editor.actions';
import * as dockableStackActions from './dockable-stack.actions';
import * as clipBoardActions from './clipboard.actions';
import * as forecastActions from './forecast-sheet.action';
import { pidFromGraphModelNode, GraphModel } from '@app/modules/cpt/models/graph-model.model';
import { GraphModelInterfaceState, GraphModelInterfaceStateModel } from '@cpt/state/graph-model-interface.state';
import { ReleaseState, ReleaseStateModel } from '@cpt/state/release.state';
import { ReleaseSelected } from '@cpt/state/release.actions';


export interface Selection {
    id: string;
    type: 'TreeNode' | 'Inport' | 'Outport' | 'Process' | 'ProcessInport' | 'ProcessOutport' | 'VariableReference' | 'VariableCell';
    context: string; // e.g. Library or a graph id. Maybe a discriminated union is the way to go?
    releaseNr?: number;
}

@State<Selection[]>({
    name: 'selection',
    defaults: []
})

export class SelectionState {

    constructor(private store: Store) { }


    @Selector([TreeState, ProcessingElementState, GraphModelInterfaceState, ReleaseState])
    static withNodes(state: Selection[], treeState: TreeStateModel, processingElements: ProcessingElementStateModel, graphModelInterfaces: GraphModelInterfaceStateModel, releases: ReleaseStateModel) {
        return state.map(selected => {
            let object, graphModel;
            switch (selected.type) {
                case 'TreeNode':
                    if (selected.releaseNr) {
                        object = releases.releases.find(x => x.releaseNr === selected.releaseNr && x.id === selected.id);
                    } else {
                        object = treeState.nodes.find(x => x.id === selected.id);
                    }
                    break;
                case 'Inport':
                case 'Process':
                case 'Outport':
                case 'ProcessInport':
                case 'ProcessOutport':
                case 'VariableReference':
                    const treeNode = selected.releaseNr ? releases.releases.map(rel => rel.treeNode).find(x => x.releaseNr === selected.releaseNr && x.id === selected.context) : treeState.nodes.find(x => x.id === selected.context);
                    graphModel = new GraphModel(treeNode, (p) => GraphModelInterfaceState.findPidDirect(graphModelInterfaces, processingElements, p));
                    object = graphModel.find(selected.id);
                    break;
                case 'VariableCell':
                    object = treeState.nodes.find(x => x.id === selected.context);
                    break;
            }
            return {
                ...selected,
                object
            };
        });
    }

    private isSelected(state, item) {
        return !!state.find(x => this.compare(x, item));
    }

    private compare(a, b) {
        return (
            a.id === b.id
            && a.type === b.type
            && a.context === b.context
        );
    }

    private remove(state, item) {
        return state.splice(state.findIndex(x => this.compare(x, item)), 1);
    }

    private add(state, item) {
        return state.push(item);
    }

    private clear(state) {
        state.splice(0, state.length);
    }

    private set(state, item) {
        this.clear(state);
        state.push(item);
    }

    private removeBy(state, fn) {
        state.forEach(item => {
            if (fn.call(state, item)) {
                this.remove(state, item);
            }
        });
    }

    @Action(forecastActions.ClickedVariableCell)
    variableCellSelected(
        ctx: StateContext<Selection[]>,
        { payload: { sheetId, variableId, date } }: forecastActions.ClickedVariableCell) {

        // @ts-ignore
        ctx.setState(produce((draft) => {
            // Clear selection outside of this context
            this.removeBy(draft, (item) => {
                return item.context !== sheetId;
            });

            const item = {
                id: variableId,
                type: 'VariableCell',
                context: sheetId
            };
            this.set(draft, item);
        }));
    }

    @Action(graphEditorActions.NodeDoubleClicked)
    graphEditorNodeDoubleClicked(
        ctx: StateContext<Selection[]>,
        { payload: { nodeType, nodeId, graphModelId, modifierKeys, eventType, graphModelReleaseNr } }: graphEditorActions.NodeDoubleClicked) {
        // @ts-ignore
        ctx.setState(produce((draft) => {
            this.removeBy(draft, (item) => {
                return item.context !== graphModelId;
            });
            const item = {
                id: nodeId,
                type: nodeType,
                context: graphModelId,
                eventType: eventType,
                releaseNr: graphModelReleaseNr
            };
            if (modifierKeys.find(x => x === 'Shift' || x === 'Meta')) {
                if (this.isSelected(draft, item)) {
                    this.remove(draft, item);
                } else {
                    this.add(draft, item);
                }
            } else {
                this.set(draft, item);
            }
        }));
    }

    @Action(graphEditorActions.AddRefModelToSelection)
    @Action(graphEditorActions.NodeSelected)
    graphEditorNodeSelected(
        ctx: StateContext<Selection[]>,
        { payload: { nodeType, nodeId, graphModelId, modifierKeys, graphModelReleaseNr } }: graphEditorActions.NodeSelected) {

        // @ts-ignore
        ctx.setState(produce((draft) => {
            // Clear selection outside of this context
            this.removeBy(draft, (item) => {
                return item.context !== graphModelId;
            });

            const item = {
                id: nodeId,
                type: nodeType,
                context: graphModelId,
                releaseNr: graphModelReleaseNr
            };
            if (modifierKeys.find(x => x === 'Shift' || x === 'Meta')) {
                if (this.isSelected(draft, item)) {
                    this.remove(draft, item);
                } else {
                    this.add(draft, item);
                }
            } else {
                this.set(draft, item);
            }
        }));
    }

    @Action(graphEditorActions.ProcessPortSelected)
    graphEditorProcessPortSelected(
        ctx: StateContext<Selection[]>,
        { payload: { nodeType, nodeId, graphModelId, graphModelReleaseNr } }: graphEditorActions.ProcessPortSelected) {

        // @ts-ignore
        ctx.setState(produce((draft) => {
            this.set(draft, {
                id: nodeId,
                type: nodeType,
                context: graphModelId,
                releaseNr: graphModelReleaseNr
            });
        }));
    }

    @Action(graphEditorActions.ProcessPortDoubleClicked)
    graphEditorProcessPortDoubleClicked(
        ctx: StateContext<Selection[]>,
        { payload: { nodeType, nodeId, graphModelId, eventType } }: graphEditorActions.ProcessPortDoubleClicked) {

        // @ts-ignore
        ctx.setState(produce((draft) => {
            this.set(draft, {
                id: nodeId,
                type: nodeType,
                context: graphModelId,
                eventType: eventType
            });
        }));
    }

    @Action(graphEditorActions.DragSelectionChanged)
    graphEditorDragSelectionChanged(
        ctx: StateContext<Selection[]>,
        { payload: { graphModelId, selection } }: graphEditorActions.DragSelectionChanged) {

        // @ts-ignore
        ctx.setState(produce((draft) => {
            this.clear(draft);

            if (selection.length === 0) {
                this.set(draft, {
                    id: graphModelId,
                    type: 'TreeNode',
                    context: 'Library'
                });
            } else {
                selection.forEach(selected => {
                    const item = {
                        id: selected.nodeId,
                        type: selected.nodeType,
                        context: graphModelId
                    };
                    this.add(draft, item);
                });
            }
        }));
    }

    @Action(ReleaseSelected)
    @Action(graphEditorActions.DeleteKeyPressed)
    clearSelection(
        ctx: StateContext<TreeStateModel>,
        { payload: { graphModelId } }: graphEditorActions.DeleteKeyPressed
    ) {
        ctx.setState(produce((draft) => {
            this.clear(draft);
        }));
    }

    /*
    * Setting library selection
    */
    @Action(libraryActions.FolderClicked)
    @Action(libraryActions.GraphModelClicked)
    @Action(libraryActions.SimulationClicked)
    @Action(libraryActions.SimulationResultClicked)
    @Action(librarySearchResultActions.FolderClicked)
    @Action(librarySearchResultActions.FolderDoubleClicked)
    @Action(librarySearchResultActions.GraphModelClicked)
    @Action(librarySearchResultActions.GraphModelDoubleClicked)
    @Action(librarySearchResultActions.SimulationClicked)
    @Action(librarySearchResultActions.SimulationDoubleClicked)
    @Action(librarySearchResultActions.SimulationResultDoubleClicked)
    @Action(libraryActions.ForecastSheetClicked)
    @Action(libraryActions.ForecastSheetDoubleClicked)
    @Action(librarySearchResultActions.ForecastSheetClicked)
    setLibrarySelection(
        ctx: StateContext<Selection[]>,
        { treeNode }: libraryActions.FolderClicked) {
        // @ts-ignore
        ctx.setState(produce((draft) => {
            this.set(draft, {
                id: treeNode.id,
                type: 'TreeNode',
                context: 'Library'
            });
        }));
    }


    // when a simulation result is selected in the search result
    // select the simulation configuration (it's parent) instead
    // since the simulation results don't show up on the tree but
    // are part of the simulation configuration page now
    @Action(librarySearchResultActions.SimulationResultClicked)
    setLibrarySimulationResultSelection(
        ctx: StateContext<Selection[]>,
        { treeNode }: libraryActions.FolderClicked) {
        // @ts-ignore
        ctx.setState(produce((draft) => {
            this.set(draft, {
                id: treeNode.parentId,
                type: 'TreeNode',
                context: 'Library'
            });
        }));
    }

    @Action(libraryActions.RenameFolderClicked)
    @Action(libraryActions.RenameGraphModelClicked)
    @Action(libraryActions.RenameSimulationClicked)
    @Action(libraryActions.RenameSimulationResultClicked)
    @Action(libraryActions.FolderSendToTrashClicked)
    @Action(libraryActions.GraphModelSendToTrashClicked)
    @Action(libraryActions.SimulationSendToTrashClicked)
    @Action(libraryActions.SimulationResultSendToTrashClicked)
    @Action(libraryActions.TrashRowClicked)
    @Action(libraryActions.UpdateSearchString)
    @Action(graphEditorActions.UndoPerformed)
    @Action(graphEditorActions.RedoPerformed)
    @Action(libraryActions.ForecastSheetSendToTrashClicked)
    clearLibrarySelection(
        ctx: StateContext<Selection[]>
    ) {
        // @ts-ignore
        ctx.setState(produce((draft) => {
            this.clear(draft);
        }));
    }

    @Action(dockableStackActions.TabClicked)
    @Action(dockableStackActions.TabCloseClicked)
    clearGraphNodeSelection(
        ctx: StateContext<Selection[]>
    ) {
        // @ts-ignore
        ctx.setState(produce((draft) => {
            this.removeBy(draft, (item) => {
                return item.context !== 'Library';
            });
        }));
    }

    @Action(dockableStackActions.TabSelectionChanged)
    setTabSelection(
        ctx: StateContext<Selection[]>,
        { payload }: dockableStackActions.TabSelectionChanged
    ) {
        if (payload.stackId === 'editor-stack') {
            if (payload.nodeId) {
                // @ts-ignore
                ctx.setState(produce((draft) => {
                    this.set(draft, {
                        id: payload.nodeId,
                        type: 'TreeNode',
                        context: 'Library'
                    });
                }));
            } else {
                // @ts-ignore
                ctx.setState(produce((draft) => {
                    this.removeBy(draft, (item) => {
                        return item.context !== 'Library';
                    });
                }));
            }
        }
    }

    @Action(clipBoardActions.NodesCopied)
    @Action(clipBoardActions.GraphModelElementsCopied)
    copyNode(
        ctx: StateContext<Selection[]>) {
        const state = ctx.getState();
        ctx.dispatch(new clipBoardActions.ClipboardDataSet({
            selections: state,
            action: 'COPY'
        }));
    }

    @Action(clipBoardActions.NodesCut)
    cutNode(
        ctx: StateContext<Selection[]>) {
        const state = ctx.getState();
        ctx.dispatch(new clipBoardActions.ClipboardDataSet({
            selections: state,
            action: 'CUT'
        }));
        // @ts-ignore
        ctx.setState(produce((draft) => {
            this.clear(draft);
        }));
    }



}
