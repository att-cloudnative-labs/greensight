import * as clipboardActions from './clipboard.actions';
import { Selection } from './selection.state';
import { Action, Selector, State, StateContext } from '@ngxs/store';
import produce from 'immer';
import * as clipBoardActions from '@system-models/state/clipboard.actions';
import { TreeState, TreeStateModel } from '@system-models/state/tree.state';
import { ProcessingElementState, ProcessingElementStateModel } from '@system-models/state/processing-element.state';
import { GraphModel, ProcessInterfaceDescription } from '@system-models/models/graph-model.model';
import * as graphEditorActions from '@system-models/state/graph-editor.actions';

export class ClipboardStateModel {
    selections: Selection[];
    action: 'CUT' | 'COPY' | '';
}

@State<ClipboardStateModel>({
    name: 'clipboard',
    defaults: {
        selections: [],
        action: ''
    }
})

export class ClipboardState {
    @Selector()
    static clipboardData(state: ClipboardStateModel) {
        return state;
    }

    private set(state: ClipboardStateModel, item: Selection[], action) {
        this.clear(state);
        state.selections = item;
        state.action = action;
    }

    private clear(state: ClipboardStateModel) {
        state.selections = [];
        state.action = '';
    }

    @Action(clipBoardActions.GraphModelElementsPasted)
    @Action(clipBoardActions.NodesPasted)
    pasteNode(
        ctx: StateContext<ClipboardStateModel>,
        { targetNodeId, position }: clipBoardActions.GraphModelElementsPasted) {
        const state = ctx.getState();
        ctx.dispatch(new clipBoardActions.PastePerformed({
            targetNodeId: targetNodeId,
            clipboardData: state,
            position: position
        }));
        if (state.selections[0].context === 'Library') {
            ctx.dispatch(new clipboardActions.ClipboardDataCleared());
        }
    }

    @Action(clipboardActions.ClipboardDataSet)
    setClipboardData(
        ctx: StateContext<ClipboardStateModel>,
        { payload: { selections, action } }: clipboardActions.ClipboardDataSet) {
        ctx.setState(produce((draft) => {
            this.set(draft, selections, action);
        }));
    }

    @Action(clipboardActions.ClipboardDataCleared)
    clearClipboardData(
        ctx: StateContext<ClipboardStateModel>) {
        ctx.setState(produce((draft) => {
            this.clear(draft);
        }));
    }
}
