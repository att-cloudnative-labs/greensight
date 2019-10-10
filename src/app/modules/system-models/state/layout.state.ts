import { Store, Select, State, Action, StateContext, Selector } from '@ngxs/store';
import { map } from 'rxjs/operators';
import { TreeNode } from '@app/core_module/interfaces/tree-node';
import { TreeState } from '@system-models/state/tree.state';
import * as layoutActions from './layout.actions';
import * as dockableStackActions from './dockable-stack.actions';
import * as libraryActions from './library.actions';
import * as treeActions from './tree.actions';
import * as librarySearchResultActions from './library-search-result.actions';
import produce from 'immer';
import { v4 as uuid } from 'uuid';
import * as graphEditorActions from './graph-editor.actions';

export class LayoutStateModel {
    public content: Split[];
}

export type SplitDirection = 'horizontal' | 'vertical';

export interface Panel {
    id: string;
    name: string;
    fullName: string;
    useFullName: boolean;
    args?: any;
    component?: string;
    closeable: boolean;
}

export interface Split {
    kind: 'split';
    id: string;
    direction: SplitDirection;
    size: number;
    content: Array<Split | Stack>;
}

export interface Stack {
    kind: 'stack';
    id: string;
    size: number;
    selected?: string;
    panels: Panel[];
}

export type SplitOrStack = Split | Stack;

const EDITOR_STACK_ID = 'editor-stack';

const defaultLayout = {
    content: [
        {
            id: uuid(),
            kind: 'split',
            direction: 'horizontal',
            size: 100,
            content: [
                {
                    id: uuid(),
                    kind: 'stack',
                    size: 20,
                    selected: '#library',
                    panels: [{
                        id: '#library',
                        name: 'Library',
                        component: 'LibraryComponent',
                        closeable: false,
                    }]
                } as Stack,
                {
                    id: EDITOR_STACK_ID,
                    kind: 'stack',
                    size: 60,
                    selected: undefined,
                    panels: []
                } as Stack,
                {
                    id: uuid(),
                    kind: 'split',
                    direction: 'vertical',
                    size: 20,
                    content: [
                        {
                            id: uuid(),
                            kind: 'stack',
                            size: 50,
                            selected: '#details',
                            panels: [
                                {
                                    id: '#details',
                                    name: 'Details',
                                    component: 'DetailsComponent',
                                    closeable: false,
                                }
                            ]
                        } as Stack,
                        {
                            id: uuid(),
                            kind: 'stack',
                            size: 50,
                            selected: '#history',
                            panels: [
                                {
                                    id: '#history',
                                    name: 'History',
                                    component: 'HistoryComponent',
                                    closeable: false,
                                }
                            ]
                        } as Stack
                    ]
                } as Split
            ]
        } as Split
    ]
};

@State<LayoutStateModel>({
    name: 'layout',
    defaults: defaultLayout
})
export class LayoutState {
    constructor(private store: Store) { }

    @Selector()
    static getContent(state: LayoutStateModel) {
        return state.content;
    }

    static findSplitById(content: SplitOrStack[], splitId: string): any {
        for (let i = 0; i < content.length; i++) {
            const item = content[i] as SplitOrStack;
            if (item.id === splitId) {
                return item;
            } else if (item.kind === 'split') {
                return LayoutState.findSplitById(item.content, splitId);
            }
        }
    }

    static openEditor(draft: LayoutStateModel, component: string, name: string, fullName: string, args?: any) {
        let id;
        if (args) {
            const argKeys = Object.keys(args).map(key => `${key}:${args[key]}`).join(':');
            id = `${component}:${argKeys}`;
        } else {
            id = `${component}`;
        }
        const split = LayoutState.findSplitById(draft.content, EDITOR_STACK_ID);
        const existingPanel = split.panels.find(panel => panel.id === id);
        if (existingPanel) {
            split.selected = existingPanel.id;
        } else {
            const panel = {
                component,
                name,
                fullName,
                useFullName: false,
                closeable: true,
                id,
                args
            };
            split.panels.push(panel);
            const arrayLength = split.panels.length;
            for (let i = 0; i < arrayLength; i++) {
                split.panels[i].useFullName = false;
                for (let j = 0; j < arrayLength; j++) {
                    if (i != j && split.panels[i].name === split.panels[j].name) {
                        split.panels[i].useFullName = true;
                        break;
                    }
                }
            }
            split.selected = panel.id;
        }
    }

    static findEditorPanelByNodeId(draft: LayoutStateModel, nodeId: string) {
        const content = draft.content;
        const editorStack = content[0].content.find(x => x.id === 'editor-stack') as Stack;
        return editorStack.panels.find(x => x.args.nodeId === nodeId);
    }

    @Action(treeActions.TrashedTreeNode)
    @Action(libraryActions.GraphModelSendToTrashClicked)
    @Action(libraryActions.GraphModelTemplateSendToTrashClicked)
    @Action(libraryActions.SimulationSendToTrashClicked)
    @Action(libraryActions.SimulationResultSendToTrashClicked)
    closeTrashedNodeTab(
        { getState, setState }: StateContext<LayoutStateModel>,
        { trashNode }: libraryActions.GraphModelSendToTrashClicked) {
        const newState = produce(getState(), draft => {
            const split = LayoutState.findSplitById(draft.content, 'editor-stack');
            let wasSelected = null;
            switch (trashNode.type) {
                case 'MODEL':
                case 'MODELTEMPLATE':
                    wasSelected = split.selected === 'GraphModelEditorComponent:nodeId:' + trashNode.id;
                    split.panels = split.panels.filter(panel => panel.id !== 'GraphModelEditorComponent:nodeId:' + trashNode.id);
                    break;

                case 'SIMULATION':
                    wasSelected = split.selected === 'SimulationEditorComponent:nodeId:' + trashNode.id;
                    split.panels = split.panels.filter(panel => panel.id !== 'SimulationEditorComponent:nodeId:' + trashNode.id);
                    break;

                case 'SIMULATIONRESULT':
                    wasSelected = split.selected === 'SimulationResultComponent:nodeId:' + trashNode.id;
                    split.panels = split.panels.filter(panel => panel.id !== 'SimulationResultComponent:nodeId:' + trashNode.id);
                    break;
            }

            if (wasSelected && split.panels.length) {
                split.selected = split.panels[split.panels.length - 1].id;
            }

            const arrayLength = split.panels.length;
            for (let i = 0; i < arrayLength; i++) {
                split.panels[i].useFullName = false;
                for (let j = 0; j < arrayLength; j++) {
                    if (i != j && split.panels[i].name === split.panels[j].name) {
                        split.panels[i].useFullName = true;
                        break;
                    }
                }
            }

        });
        setState(newState);
    }

    @Action(layoutActions.SplitDragEnd)
    splitDragEnd(
        { getState, setState }: StateContext<LayoutStateModel>,
        { payload }: layoutActions.SplitDragEnd
    ) {
        const { splitId, sizes } = payload;
        const newState = produce(getState(), draft => {
            const split = LayoutState.findSplitById(draft.content, splitId);
            if (split) {
                sizes.forEach((size, i) => split.content[i].size = size);
            }
        });
        setState(newState);
    }

    @Action(libraryActions.GraphModelTemplateDoubleClicked)
    @Action(libraryActions.GraphModelDoubleClicked)
    @Action(librarySearchResultActions.GraphModelDoubleClicked)
    @Action(librarySearchResultActions.GraphModelTemplateDoubleClicked)
    openGraphEditorTab(
        { getState, setState }: StateContext<LayoutStateModel>,
        { treeNode }: libraryActions.GraphModelTemplateDoubleClicked) {
        const newState = produce(getState(), draft => {
            let fullName: string;
            this.store.select(TreeState.nodeFullPathById).pipe(map(byId => byId(treeNode.id))).forEach(node => { fullName = node; });
            LayoutState.openEditor(draft, 'GraphModelEditorComponent', treeNode.name, fullName, { nodeId: treeNode.id });
        });
        setState(newState);
    }

    @Action(libraryActions.SimulationDoubleClicked)
    @Action(librarySearchResultActions.SimulationDoubleClicked)
    openSimulationEditorTab(
        { getState, setState }: StateContext<LayoutStateModel>,
        { treeNode }: libraryActions.SimulationDoubleClicked) {
        const newState = produce(getState(), draft => {
            let fullName: string;
            this.store.select(TreeState.nodeFullPathById).pipe(map(byId => byId(treeNode.id))).forEach(node => { fullName = node; });
            LayoutState.openEditor(draft, 'SimulationEditorComponent', treeNode.name, fullName, { nodeId: treeNode.id });
        });
        setState(newState);
    }

    @Action(librarySearchResultActions.SimulationResultDoubleClicked)
    @Action(libraryActions.SimulationResultDoubleClicked)
    openSimulationResultTab(
        { getState, setState }: StateContext<LayoutStateModel>,
        { treeNode }: libraryActions.SimulationDoubleClicked) {
        const newState = produce(getState(), draft => {
            let fullName: string;
            this.store.select(TreeState.nodeFullPathById).pipe(map(byId => byId(treeNode.id))).forEach(node => { fullName = node; });
            LayoutState.openEditor(draft, 'SimulationResultComponent', treeNode.name, fullName, { nodeId: treeNode.id });
        });
        setState(newState);
    }

    @Action(libraryActions.TrashButtonClicked)
    openTrash(
        { getState, setState }: StateContext<LayoutStateModel>) {
        const newState = produce(getState(), draft => {
            LayoutState.openEditor(draft, 'TrashComponent', 'Trash', 'Trash');
        });
        setState(newState);
    }

    @Action(dockableStackActions.TabClicked)
    tabClicked(
        { getState, setState }: StateContext<LayoutStateModel>,
        { payload }: dockableStackActions.TabClicked) {
        const newState = produce(getState(), draft => {
            const split = LayoutState.findSplitById(draft.content, payload.stackId);
            split.selected = payload.panelId;
        });
        setState(newState);
    }

    @Action(dockableStackActions.TabCloseClicked)
    tabCloseClicked(
        { getState, setState }: StateContext<LayoutStateModel>,
        { payload }: dockableStackActions.TabCloseClicked) {
        const newState = produce(getState(), draft => {
            const split = LayoutState.findSplitById(draft.content, payload.stackId);
            const wasSelected = split.selected === payload.panelId;
            split.panels = split.panels.filter(panel => panel.id !== payload.panelId);
            if (wasSelected && split.panels.length) {
                split.selected = split.panels[split.panels.length - 1].id;
            }
            const arrayLength = split.panels.length;
            for (let i = 0; i < arrayLength; i++) {
                split.panels[i].useFullName = false;
                for (let j = 0; j < arrayLength; j++) {
                    if (i != j && split.panels[i].name === split.panels[j].name) {
                        split.panels[i].useFullName = true;
                        break;
                    }
                }
            }
        });
        setState(newState);
    }

    @Action(layoutActions.InvalidateEditorTabNames)
    refreshEditorTabNames(
        { getState, setState }: StateContext<LayoutStateModel>) {

        const newState = produce(getState(), draft => {
            const split = LayoutState.findSplitById(draft.content, EDITOR_STACK_ID);
            const arrayLength = split.panels.length;
            for (let i = 0; i < arrayLength; i++) {
                split.panels[i].useFullName = false;
                this.store.select(TreeState.nodeFullPathById).pipe(map(byId => byId(split.panels[i].args.nodeId))).forEach(node => { split.panels[i].fullName = node; });
                for (let j = 0; j < arrayLength; j++) {
                    if (i != j && split.panels[i].name === split.panels[j].name) {
                        split.panels[i].useFullName = true;
                        break;
                    }
                }
            }
        });
        setState(newState);
    }

    @Action(layoutActions.EditorTabTitleChanged)
    editorTabTitleChanged(
        { getState, setState }: StateContext<LayoutStateModel>,
        { payload }: layoutActions.EditorTabTitleChanged) {

        const newState = produce(getState(), draft => {
            const split = LayoutState.findSplitById(draft.content, EDITOR_STACK_ID);
            const arrayLength = split.panels.length;
            for (let i = 0; i < arrayLength; i++) {
                split.panels[i].useFullName = false;
                if (split.panels[i].args.nodeId === payload.nodeId) {
                    split.panels[i].name = payload.newName;
                    this.store.select(TreeState.nodeFullPathById).pipe(map(byId => byId(payload.nodeId))).forEach(node => { split.panels[i].fullName = node; });
                }
                for (let j = 0; j < arrayLength; j++) {
                    const name: string = (split.panels[j].args.nodeId === payload.nodeId) ? payload.newName : split.panels[j].name;
                    if (i != j && split.panels[i].name === name) {
                        split.panels[i].useFullName = true;
                        break;
                    }
                }
            }
        });
        setState(newState);
    }

    @Action(graphEditorActions.OpenGraphModelRef)
    openGraphModelRefTab(
        { getState, setState }: StateContext<LayoutStateModel>,
        { graphNode }: graphEditorActions.OpenGraphModelRef) {
        const newState = produce(getState(), draft => {
            let fullName: string;
            this.store.select(TreeState.nodeFullPathById).pipe(map(byId => byId(graphNode.ref))).forEach(node => { fullName = node; });
            LayoutState.openEditor(draft, 'GraphModelEditorComponent', graphNode.name, fullName, { nodeId: graphNode.ref });
        });
        setState(newState);
    }
}
