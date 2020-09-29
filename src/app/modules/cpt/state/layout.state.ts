import { Store, State, Action, StateContext, Selector } from '@ngxs/store';
import { catchError, map, tap } from 'rxjs/operators';
import { TreeState } from '@app/modules/cpt/state/tree.state';
import * as layoutActions from './layout.actions';
import * as dockableStackActions from './dockable-stack.actions';
import * as libraryActions from './library.actions';
import * as treeActions from './tree.actions';
import * as librarySearchResultActions from './library-search-result.actions';
import produce from 'immer';
import { v4 as uuid } from 'uuid';
import * as graphEditorActions from './graph-editor.actions';
import * as historyAction from '@app/modules/cpt/state/history.actions';
import { ReleaseSelected } from '@cpt/state/release.actions';
import { TreeNodeTrackingState } from '@cpt/state/tree-node-tracking.state';
import { SettingsButtonClicked } from '@cpt/state/settings.actions';
import * as userActions from '@cpt/state/users.actions';
import { Navigate } from '@ngxs/router-plugin';
import { ReloadSingleTreeNode } from './tree.actions';
import { of } from 'rxjs';
import { BasicTreeNodeInfo } from '@cpt/interfaces/tree-node';
import { Utils } from '../lib/utils';
import { LayoutService } from '@cpt/services/layout.service';

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
function isSplit(item: SplitOrStack): item is Split {
    return item && item.kind === 'split';
}
function isStack(item: SplitOrStack): item is Stack {
    return item && item.kind === 'stack';
}


export const EDITOR_STACK_ID = 'editor-stack';
export const HISTORY_STACK_ID = 'history-stack';

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
                            id: HISTORY_STACK_ID,
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
    constructor(private store: Store, private layoutService: LayoutService ) { }
    static simResultOpen = false;

    @Selector()
    static getContent(state: LayoutStateModel) {
        return state.content;
    }

    @Selector()
    static defaultLayout() {
        return defaultLayout;
    }
    static findItemById(content: SplitOrStack[], splitId: string): SplitOrStack {
        for (let i = 0; i < content.length; i++) {
            const item = content[i] as SplitOrStack;
            if (item.id === splitId) {
                return item;
            } else if (item.kind === 'split') {
                return LayoutState.findItemById(item.content, splitId);
            }
        }
    }

    static findSplitById(content: SplitOrStack[], splitId: string): Split {
        const split = this.findItemById(content, splitId);
        return isSplit(split) ? split : null;
    }

    static findStackById(content: SplitOrStack[], stackId: string): Stack {
        const stack = this.findItemById(content, stackId);
        return isStack(stack) ? stack : null;
    }

    static adjustStackNames(stack: Stack) {
        const arrayLength = stack.panels.length;
        for (let i = 0; i < arrayLength; i++) {
            stack.panels[i].useFullName = false;
            for (let j = 0; j < arrayLength; j++) {
                if (i !== j && stack.panels[i].name === stack.panels[j].name) {
                    stack.panels[i].useFullName = true;
                    break;
                }
            }
        }
    }

    openEditor(draft: LayoutStateModel, component: string, name: string, fullName: string, args?: any, panelId?: string) {
        this.openTab(draft, EDITOR_STACK_ID, component, name, fullName, args, panelId);
    }

    openHistoryTab(draft: LayoutStateModel, component: string, name: string, fullName: string, args?: any, panelId?: string) {
        this.openTab(draft, HISTORY_STACK_ID, component, name, fullName, args, panelId);
    }

    openTab(draft: LayoutStateModel, stackId: string, component: string, name: string, fullName: string, args?: any, panelId?: string) {
        let id: string;
        if (panelId) {
            id = panelId;
        } else if (args) {
            const argKeys = Object.keys(args).map(key => `${key}:${args[key]}`).join(':');
            id = `${component}:${argKeys}`;
        } else {
            id = `${component}`;
        }
        const stack = LayoutState.findStackById(draft.content, stackId);
        const existingPanel = stack.panels.find(panel => panel.id === id);
        if (existingPanel) {
            // guard changes to the args as every change to the draft
            // will re-load the whole panel
            if (existingPanel.args.releaseNr !== args.releaseNr) {
                existingPanel.args = args;
            }
            this.setSelected(stack, id);
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
            stack.panels.push(panel);
            this.setSelected(stack, panel.id);
            LayoutState.adjustStackNames(stack);
        }
    }

    private setSelected(stack: Stack, selectedId: string) {
        if (!selectedId) {
            if (stack.panels.length) {
                stack.selected = stack.panels[stack.panels.length - 1].id;
            } else {
                stack.selected = null;
            }
        } else {
            stack.selected = selectedId;
        }
        if (stack.id === EDITOR_STACK_ID) {
            if (stack.selected) {
                const panel = stack.panels.find(p => p.id === stack.selected);
                if (panel && panel.args && panel.args.nodeId) {
                    const releaseNrArgs = panel.args.releaseNr ? { 'releaseNr': panel.args.releaseNr } : {};
                    this.store.dispatch(new Navigate([panel.args.nodeId], releaseNrArgs));
                } else {
                    this.store.dispatch(new Navigate(['/']));
                }
            } else {
                this.store.dispatch(new Navigate(['/']));
            }
        }

    }

    @Action(treeActions.TrashedTreeNode)
    @Action(libraryActions.GraphModelSendToTrashClicked)
    @Action(libraryActions.SimulationSendToTrashClicked)
    @Action(libraryActions.SimulationResultSendToTrashClicked)
    @Action(libraryActions.ForecastSheetSendToTrashClicked)
    closeTrashedNodeTab(
        { getState, setState }: StateContext<LayoutStateModel>,
        { trashNode }: libraryActions.GraphModelSendToTrashClicked) {
        const newState = produce(getState(), draft => {
            const stack = LayoutState.findStackById(draft.content, 'editor-stack');
            let wasSelected = null;
            switch (trashNode.type) {
                case 'MODEL':
                    wasSelected = stack.selected === 'GraphModelEditorComponent:nodeId:' + trashNode.id;
                    stack.panels = stack.panels.filter(panel => panel.id !== 'GraphModelEditorComponent:nodeId:' + trashNode.id);
                    break;
                case 'FC_SHEET':
                    wasSelected = stack.selected === 'ForecastEditorComponent:nodeId:' + trashNode.id;
                    stack.panels = stack.panels.filter(panel => panel.id !== 'ForecastEditorComponent:nodeId:' + trashNode.id);
                    break;
                case 'SIMULATION':
                    wasSelected = stack.selected === 'SimulationEditorComponent:nodeId:' + trashNode.id;
                    stack.panels = stack.panels.filter(panel => panel.id !== 'SimulationEditorComponent:nodeId:' + trashNode.id);
                    break;

                case 'SIMULATIONRESULT':
                    wasSelected = stack.selected === 'SimulationResultComponent:nodeId:' + trashNode.id;
                    stack.panels = stack.panels.filter(panel => panel.id !== 'SimulationResultComponent:nodeId:' + trashNode.id);
                    LayoutState.simResultOpen = false;
                    break;
            }

            this.setSelected(stack, null);

            LayoutState.adjustStackNames(stack);

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
        this.store.dispatch(new layoutActions.SaveLayout({ ownerId: Utils.getUserName(), content: newState }));
        setState(newState);
    }

    @Action(layoutActions.SaveLayout)
    saveLayout(ctx: StateContext<LayoutStateModel>, { payload: { ownerId, content } }: layoutActions.SaveLayout) {
        // check user's layout
        this.layoutService.getLayout(sessionStorage['user_name']).subscribe(result => {
            if (result !== null) {
                return this.layoutService.updateLayout(
                    Utils.getUserName(),
                    content
                ).subscribe(success => { },
                    error => {
                        console.log('Failed to get user layout', error);
                    });
            } else {
                return this.layoutService.createLayout(
                    Utils.getUserName(),
                    content
                ).subscribe(success => { },
                    error => {
                        console.log('Failed to create user layout ', error);
                    }
                );
            }
        },
            error => {
                console.log('Failed to get user layout ', error);
            });

    }

    openNodeEditorTab(ctx: StateContext<LayoutStateModel>, node: BasicTreeNodeInfo, releaseNr?: number) {
        const fullName = this.store.selectSnapshot(TreeState.nodeFullPathById)(node.id);
        const component = node.type === 'MODEL' ? 'GraphModelEditorComponent' :
            node.type === 'SIMULATION' ? 'SimulationEditorComponent' :
                node.type === 'SIMULATIONRESULT' ? 'SimulationResultComponent' :
                    'ForecastEditorComponent';
        LayoutState.simResultOpen = node.type === 'SIMULATIONRESULT' ? true : false;
        const newState = produce(ctx.getState(), draft => {
            this.openEditor(draft, component, node.name, fullName, { nodeId: node.id, releaseNr: releaseNr }, `${component}:nodeId:${node.id}`);
        });
        ctx.setState(newState);
    }

    @Action(layoutActions.OpenTabByNodeId)
    openTabById(ctx: StateContext<LayoutStateModel>, { payload: { nodeId, releaseNr } }: layoutActions.OpenTabByNodeId) {
        return this.store.dispatch(new ReloadSingleTreeNode(nodeId)).pipe(
            tap(() => {
                const node = this.store.selectSnapshot(TreeState.nodeById)(nodeId);

                this.openNodeEditorTab(ctx, node, releaseNr);
            }),
            catchError(() => {
                const newState = produce(ctx.getState(), draft => {
                    const editorStack = LayoutState.findStackById(draft.content, EDITOR_STACK_ID);
                    this.setSelected(editorStack, null);
                });
                ctx.setState(newState);
                return of('');
            })
        );

    }

    @Action(libraryActions.GraphModelDoubleClicked)
    @Action(librarySearchResultActions.GraphModelDoubleClicked)
    @Action(libraryActions.ForecastSheetDoubleClicked)
    @Action(librarySearchResultActions.ForecastSheetDoubleClicked)
    @Action(libraryActions.SimulationDoubleClicked)
    @Action(librarySearchResultActions.SimulationDoubleClicked)
    @Action(librarySearchResultActions.SimulationResultDoubleClicked)
    @Action(libraryActions.SimulationResultDoubleClicked)
    openEditorTab(
        ctx: StateContext<LayoutStateModel>,
        { treeNode }: libraryActions.GraphModelDoubleClicked) {
        return this.openNodeEditorTab(ctx, treeNode);
    }

    @Action(SettingsButtonClicked)
    openSettingsTab(
        { getState, setState }: StateContext<LayoutStateModel>,
        arg: SettingsButtonClicked) {
        const newState = produce(getState(), draft => {
            this.openEditor(draft, 'SettingsEditorComponent', 'Settings', 'Settings');
        });
        setState(newState);
        LayoutState.simResultOpen = false;
    }

    @Action(userActions.UserEditorButtonClicked)
    openUserEditorTab(
        { getState, setState }: StateContext<LayoutStateModel>,
        arg: userActions.UserEditorButtonClicked) {
        const newState = produce(getState(), draft => {
            this.openEditor(draft, 'UserEditorComponent', 'Manage Users', 'Manage Users');
        });
        setState(newState);
        LayoutState.simResultOpen = false;
    }

    @Action(userActions.UserGroupEditorButtonClicked)
    openUserGroupEditorTab(
        { getState, setState }: StateContext<LayoutStateModel>,
        arg: userActions.UserGroupEditorButtonClicked) {
        const newState = produce(getState(), draft => {
            this.openEditor(draft, 'UserGroupEditorComponent', 'Manage User Groups', 'Manage User Groups');
        });
        setState(newState);
        LayoutState.simResultOpen = false;
    }

    @Action(historyAction.EditVersionClicked)
    openEditVersionTab(
        { getState, setState }: StateContext<LayoutStateModel>,
        { payload }: historyAction.EditVersionClicked) {
        const component = 'VersionEditorComponent';
        const panelId = `${component}:${payload.version.objectId}@${payload.version.versionId}`;
        const newState = produce(getState(), draft => {
            const name = `${payload.objectName}@${payload.version.versionId}`;
            const fullName = `${payload.objectName} Version: ${payload.version.versionId}`;
            this.openHistoryTab(draft, component, name, fullName, payload, panelId);
        });
        setState(newState);
    }

    @Action(historyAction.EditReleaseClicked)
    openEditReleaseTab(
        { getState, setState }: StateContext<LayoutStateModel>,
        { payload }: historyAction.EditReleaseClicked) {
        const component = 'ReleaseEditorComponent';
        const panelId = `${component}:${payload.objectName}@${payload.release.id}`;
        const newState = produce(getState(), draft => {
            const name = `${payload.objectName}@${payload.release.releaseNr}`;
            const fullName = `${payload.objectName} Release: ${payload.release.releaseNr}'`;
            this.openHistoryTab(draft, component, name, fullName, payload, panelId);
        });
        setState(newState);
    }


    @Action(libraryActions.TrashButtonClicked)
    openTrash(
        { getState, setState }: StateContext<LayoutStateModel>) {
        const newState = produce(getState(), draft => {
            this.openEditor(draft, 'TrashComponent', 'Trash', 'Trash');
        });
        setState(newState);
        LayoutState.simResultOpen = false;
    }

    @Action(dockableStackActions.TabClicked)
    tabClicked(
        { getState, setState }: StateContext<LayoutStateModel>,
        { payload }: dockableStackActions.TabClicked) {
        const nodeType = payload.panelId.split(':')[0];
        LayoutState.simResultOpen = nodeType === 'SimulationResultComponent' ? true : false;
        const newState = produce(getState(), draft => {
            const stack = LayoutState.findStackById(draft.content, payload.stackId);
            this.setSelected(stack, payload.panelId);
        });
        setState(newState);
    }

    @Action(dockableStackActions.TabCloseClicked)
    tabCloseClicked(
        { getState, setState }: StateContext<LayoutStateModel>,
        { payload }: dockableStackActions.TabCloseClicked) {
        const newState = produce(getState(), draft => {
            const stack = LayoutState.findStackById(draft.content, payload.stackId);
            const wasSelected = stack.selected === payload.panelId;
            stack.panels = stack.panels.filter(panel => panel.id !== payload.panelId);
            const nodeType = payload.panelId.split(':')[0];
            LayoutState.simResultOpen = !(nodeType === 'SimulationResultComponent');
            if (wasSelected) {
                this.setSelected(stack, null);
            }
            LayoutState.adjustStackNames(stack);
        });
        setState(newState);
    }

    @Action(layoutActions.InvalidateEditorTabNames)
    refreshEditorTabNames(
        { getState, setState }: StateContext<LayoutStateModel>) {

        const newState = produce(getState(), draft => {
            const stack = LayoutState.findStackById(draft.content, EDITOR_STACK_ID);
            const arrayLength = stack.panels.length;
            for (let i = 0; i < arrayLength; i++) {
                stack.panels[i].useFullName = false;
                this.store.selectOnce(TreeState.nodeFullPathById).pipe(map(byId => byId(stack.panels[i].args.nodeId))).forEach(node => { stack.panels[i].fullName = node; });
                for (let j = 0; j < arrayLength; j++) {
                    if (i !== j && stack.panels[i].name === stack.panels[j].name) {
                        stack.panels[i].useFullName = true;
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
            const stack = LayoutState.findStackById(draft.content, EDITOR_STACK_ID);
            const arrayLength = stack.panels.length;
            for (let i = 0; i < arrayLength; i++) {
                stack.panels[i].useFullName = false;
                if (('args' in stack.panels[i]) && ('nodeId' in stack.panels[i].args)) {
                    if (stack.panels[i].args.nodeId === payload.nodeId) {
                        stack.panels[i].name = payload.newName;
                        this.store.selectOnce(TreeState.nodeFullPathById).pipe(map(byId => byId(payload.nodeId))).forEach(node => { stack.panels[i].fullName = node; });
                    }
                    // FIXME: unify with adjustStackNames
                    for (let j = 0; j < arrayLength; j++) {
                        if (('args' in stack.panels[j]) && ('nodeId' in stack.panels[j].args)) {
                            const name: string = (stack.panels[j].args.nodeId === payload.nodeId) ? payload.newName : stack.panels[j].name;
                            if (i !== j && stack.panels[i].name === name) {
                                stack.panels[i].useFullName = true;
                                break;
                            }
                        }
                    }
                }
            }
        });
        setState(newState);
    }

    @Action(ReleaseSelected)
    selectRelease(
        { getState, setState }: StateContext<LayoutStateModel>,
        { payload: { nodeId, releaseNr } }: ReleaseSelected) {

        const newState = produce(getState(), draft => {
            const stack = LayoutState.findStackById(draft.content, EDITOR_STACK_ID);
            const arrayLength = stack.panels.length;
            for (let i = 0; i < arrayLength; i++) {
                stack.panels[i].useFullName = false;
                if (('args' in stack.panels[i]) && ('nodeId' in stack.panels[i].args)) {
                    if (stack.panels[i].args.nodeId === nodeId) {
                        stack.panels[i].args = { ...stack.panels[i].args, releaseNr: releaseNr };
                        this.setSelected(stack, stack.panels[i].id);
                    }

                }
            }
        });
        setState(newState);
    }

    @Action(graphEditorActions.OpenGraphModelRef)
    openGraphModelRefTab(
        { getState, setState }: StateContext<LayoutStateModel>,
        { payload: { graphModelId, releaseNr } }: graphEditorActions.OpenGraphModelRef) {
        const newState = produce(getState(), draft => {
            const tni = this.store.selectSnapshot(TreeNodeTrackingState.id(graphModelId));
            const fullName = `${tni.pathName}/${tni.name}`;
            // by fixing the panelId an already existing panel can be re-used
            // if we want to open a release in a new panel, the release info
            // will have to be added to the panelid
            this.openEditor(draft, 'GraphModelEditorComponent', tni.name, fullName, { nodeId: graphModelId, releaseNr: releaseNr }, `GraphModelEditorComponent:nodeId:${graphModelId}`);
        });
        setState(newState);
    }
}
