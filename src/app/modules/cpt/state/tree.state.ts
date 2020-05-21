import { Action, createSelector, Selector, State, StateContext, Store } from '@ngxs/store';
import { append, patch, updateItem } from '@ngxs/store/operators';
import * as treeActions from './tree.actions';
import * as libraryActions from './library.actions';
import * as graphControlBarActions from './graph-control-bar.actions';
import * as graphEditorActions from './graph-editor.actions';
import * as simulationActions from './simulation.actions';
import * as forecastVariableActions from '@cpt/state/forecast-values.actions';
import { GraphModelInterfaceUpdated } from './simulation.actions';
import * as simulationResultScreenActions from './simulation-result-screen.actions';
import * as trashActions from './trash.actions';
import * as fcActions from './forecast-sheet.action';
import * as gmProcessDetailsActions from './gm-process-details.actions';
import * as gmInportDetailsActions from './gm-inport-details.actions';
import * as gmOutportDetailsActions from './gm-outport-details.actions';
import * as gmProcessInportDetailsActions from './gm-process-inport-details.actions';
import * as gmProcessOutportDetailsActions from './gm-process-outport-details.actions';
import * as gmVariablePickerActions from './gm-variable-picker.actions';
import * as gmVariableReferenceDetailsActions from '@cpt/state/gm-variable-reference-details.actions';
import { TreeService } from '@cpt/services/tree.service';
import { buildPatch, TreeNode, TreeNodeType } from '@cpt/interfaces/tree-node';
import { asapScheduler, combineLatest, Observable, of, throwError, forkJoin } from 'rxjs';
import { catchError, map, mergeMap, switchMap, tap } from 'rxjs/operators';
import { Utils } from '@cpt/lib/utils';
import produce from 'immer';
import { v4 as uuid } from 'uuid';
import { GraphModel, Inport, Outport, ParamType, SimulationConfiguration, ProcessInterfaceDescription, SimulationResult } from '@cpt/capacity-planning-simulation-types';
import * as moment from 'moment';
import { unix } from 'moment';
import * as gmOps from '@cpt/lib/graph-model-ops';
import * as tnOps from '@cpt/lib/tree-node-ops';
import * as simOps from '@cpt/lib/simulation-ops';
import * as clipboardActions from '@cpt/state/clipboard.actions';
import { detailedDiff } from 'deep-object-diff';
import {
    pidFromGraphModelNode
} from '@cpt/models/graph-model.model';
import { ProcessingElementState } from '@cpt/state/processing-element.state';
import { UpdatedGraphModel, UpdatedGraphModelName } from '@cpt/state/processing-element.actions';
import { SRSDatatableProperties } from '@cpt/models/srs-datatable-properties';

import { ForecastVariableModel } from '@cpt/interfaces/forecast-variable';
import {
    bdHasAssociatedVariables,
    isReferencedVariables,
    removeBreakdownReferences, sanitizeTimeSegments,
    setVariableType
} from '@cpt/lib/variable-ops';
import { Expression, VariableType } from '@cpt/capacity-planning-projection/lib';
import { FailedToDeleteVariable } from './forecast-sheet.action';
import { runSyncGraphModel } from '@cpt/lib/synchronize-graph-model';
import { extractDependencies } from '@cpt/lib/graph-model-ops';
import { ForecastSheetReference } from '@cpt/capacity-planning-simulation-types/lib';
import { GraphModelInterfaceState } from '@cpt/state/graph-model-interface.state';
import { AddCurrentPid } from '@cpt/state/graph-model-interface.actions';
import { CreatedTreeNode, CreateTreeNode, DuplicateFolder } from './tree.actions';
import { TreeNodeTrackingState } from '@cpt/state/tree-node-tracking.state';
import {
    RenameFolderClicked, RenameForecastSheetClicked,
    RenameGraphModelClicked,
    RenameSimulationClicked,
    RenameSimulationResultClicked
} from './library.actions';

export class TreeStateModel {
    public nodes: TreeNode[];
    public loaded: boolean;
    public loading: boolean;
}

@State<TreeStateModel>({
    name: 'tree',
    defaults: {
        nodes: [],
        loading: false,
        loaded: false
    }
})
export class TreeState {

    constructor(
        private treeService: TreeService,
        private store: Store) {
    }

    @Selector()
    static hasLoaded(state: TreeStateModel) {
        return state.loaded;
    }

    @Selector()
    static nodes(state: TreeStateModel) {
        return state.nodes;
    }

    @Selector()
    static nodeById(state: TreeStateModel) {
        return (id: string) => {
            return state.nodes.find(node => node.id === id);
        };
    }

    @Selector()
    static nodeFullPathById(state: TreeStateModel) {
        return (id: string) => {
            let fullPath: string;
            let nextNode = state.nodes.find(node => node.id === id);
            if (nextNode) {
                fullPath = nextNode.name;
                while (nextNode && nextNode.parentId) {
                    nextNode = state.nodes.find(node => node.id === nextNode.parentId);
                    if (nextNode && nextNode.parentId) {
                        fullPath = nextNode.name + '/' + fullPath;
                    }
                }
                return fullPath;
            }
        };
    }

    @Selector()
    static childNodes(state: TreeStateModel) {
        return (parentId: string) => {
            return state.nodes.filter(node => node.parentId === parentId).sort((currentNode, followingNode) => currentNode.name.localeCompare(followingNode.name));
        };
    }

    @Selector()
    static nonRootNodes(state: TreeStateModel) {
        return state.nodes.filter(node => node.id !== 'root');
    }

    static nodesOfType(type: TreeNodeType) {
        return createSelector([TreeState], (state: TreeStateModel) => {
            return state.nodes.filter(node => node.type === type);
        });
    }

    @Selector()
    static nodeOfId(state: TreeStateModel) {
        return (id: string) => {
            return state.nodes.find(node => node.id === id);
        };
    }

    @Selector()
    static simulationModelReference(state: TreeStateModel) {
        return (id: string) => {
            const simNode = state.nodes.find(node => node.id === id);
            if (simNode && simNode.content) {
                const modelnode = state.nodes.find(node => node.id === simNode.content.ref);
                return modelnode;
            }
        };
    }

    private static getUniqueNameInScope(state: TreeStateModel, id: string, name: string): string {
        const scopedNodes = state.nodes.filter(node => node.parentId === id);
        return tnOps.generateUnique(scopedNodes.map(n => n.name), name);
    }

    // load all nodes up to three levels deep
    // in sparse mode.
    @Action(treeActions.LoadTree)
    loadTree({ patchState, getState }: StateContext<TreeStateModel>) {
        // don't overwrite the existing nodes with sparse nodes
        if (getState().nodes.length === 0) {
            this.treeService.getTree3('root').subscribe(folders => {
                patchState({
                    nodes: [...folders, ...getState().nodes],
                    loaded: true,
                    loading: false
                });
            });
        }
    }

    @Action(treeActions.LoadSimulationResultContent)
    @Action(simulationResultScreenActions.RefreshButtonClicked)
    loadSimulationResultNodeContent(ctx: StateContext<TreeStateModel>,
        { payload }: treeActions.LoadSimulationResultContent) {
        return this.loadNodeContent(ctx, 'SIMULATIONRESULT', payload);
    }


    @Action(treeActions.LoadGraphModelContent)
    loadGraphModelNodeContent(ctx: StateContext<TreeStateModel>,
        { payload }: treeActions.LoadSimulationContent) {
        return this.loadNodeContent(ctx, 'MODEL', payload).pipe(
            mergeMap(() => {
                const newNode = ctx.getState().nodes.find(n => n.id === payload.id);
                const pid = pidFromGraphModelNode(newNode);
                return ctx.dispatch(new AddCurrentPid({ pid: pid }));
            }
            ));
    }

    @Action(treeActions.LoadForecastSheetContent)
    loadForecastSheetNodeContent(ctx: StateContext<TreeStateModel>,
        { payload }: treeActions.LoadForecastSheetContent) {
        return this.loadNodeContent(ctx, 'FC_SHEET', payload);
    }

    @Action(treeActions.LoadSimulationContent)
    loadSimulationNodeContent(ctx: StateContext<TreeStateModel>,
        { payload }: treeActions.LoadSimulationContent) {
        return this.loadNodeContent(ctx, 'SIMULATION', payload);
    }

    loadNodeContent(ctx: StateContext<TreeStateModel>, mainNodeType: TreeNodeType,
        payload: { id: string }) {
        const catchTrashError = catchError(e => {

            if (e.status === 410) {
                this.store.dispatch(new treeActions.TreeNodeTrashed(payload));
                return of('dispatched trashed handler');
            }
            return throwError('failed to patch');
        });

        const currentNodes = ctx.getState().nodes;

        const updateOrAppend = (node: TreeNode) => {
            if (ctx.getState().nodes.findIndex(n => n.id === node.id) > -1) {
                ctx.setState(patch<TreeStateModel>({ nodes: updateItem<TreeNode>(tn => tn.id === node.id, node) }));
            } else {
                ctx.setState(patch({ nodes: append([node]) }));
            }
        };

        const sparseChildren = !(mainNodeType === 'FC_SHEET' || mainNodeType === 'SIMULATIONRESULT');
        const currentNode = currentNodes.find(n => n.id === payload.id);
        let forceSparse = false;
        if (currentNode && currentNode.content) {
            if (mainNodeType === 'SIMULATIONRESULT') {
                const simResult: SimulationResult = currentNode.content;
                if (simResult.state === 'DONE') {
                    forceSparse = true;
                }
            } else {
                // Always reload when opening an editor so that edits made by other users can be fetched
                // return;
            }
        }

        return this.treeService.getTree3(payload.id, forceSparse, true, sparseChildren).pipe(
            tap<TreeNode[]>(nodes => {

                let mainNode: TreeNode = nodes.find(n => n.id === payload.id);
                if (!forceSparse) {
                    updateOrAppend(mainNode);
                } else {
                    mainNode = currentNode;
                }
                const mainNodeIsSimulationResult = mainNode.type === 'SIMULATIONRESULT';
                let hasMeta = false;
                const initialProps: SRSDatatableProperties = {
                    tableEntries: [],
                    selectedRows: [],
                    selectedScenario: mainNodeIsSimulationResult ? Object.keys((mainNode.content as SimulationResult).scenarios)[0] : '',
                    expansionStateVariables: {}
                };

                for (let i = 0; i < nodes.length; i++) {
                    const node = nodes[i];
                    if (node.id !== payload.id) {
                        updateOrAppend(node);
                        if (node.type === 'META' && mainNodeIsSimulationResult) {
                            hasMeta = true;
                            const loadedProps = node.content as SRSDatatableProperties;
                            if (loadedProps && loadedProps.selectedScenario) {
                                ctx.dispatch(new simulationResultScreenActions.UpdateSimulationResultMetaState(payload.id, loadedProps));
                            } else {
                                ctx.dispatch(new simulationResultScreenActions.UpdateSimulationResultMetaState(payload.id, initialProps));
                            }
                        }
                    }

                }

                // add a metanode that carries the display information for results
                // don't add a meta node if we don't have a scenario yet (i.e.: bc the simulation didnt fully run yet)
                if (mainNodeIsSimulationResult && !hasMeta && !!initialProps.selectedScenario) {
                    ctx.dispatch(new simulationResultScreenActions.UpdateSimulationResultMetaState(payload.id, initialProps));
                    if (Utils.getUserRoleId() === 'READ_ONLY') {
                        // read only users are not allowed to create nodes on the BE. so we just fake it.
                        const fakeMetaNode: TreeNode = {
                            accessControl: 'PRIVATE',
                            name: 'meta',
                            parentId: payload.id,
                            type: 'META',
                            id: uuid(),
                            content: initialProps
                        };
                        ctx.setState(patch({ nodes: append([fakeMetaNode]) }));
                    } else {
                        this.treeService.createTreeNode({
                            accessControl: 'PRIVATE',
                            name: 'meta',
                            parentId: payload.id,
                            type: 'META',
                            content: initialProps
                        }).subscribe(newMetaNode => {
                            ctx.setState(patch({ nodes: append([newMetaNode]) }));
                        });
                    }
                }
            }),
            catchTrashError);
    }

    @Action(treeActions.FCSheetEndDateChanged)
    updateFCSheetEndDate(ctx: StateContext<TreeStateModel>, { payload: { nodeId, endDate } }: treeActions.FCSheetEndDateChanged) {
        return this.updateTreeNodeSparse(ctx, nodeId, draftNode => {
            draftNode.content.endTime = endDate;
        }, true);
    }

    @Action(treeActions.FCSheetStartDateChanged)
    updateFCSheetStartDate(ctx: StateContext<TreeStateModel>, { payload: { nodeId, startDate } }: treeActions.FCSheetStartDateChanged) {
        return this.updateTreeNodeSparse(ctx, nodeId, draftNode => {
            draftNode.content.startTime = startDate;
        }, true);
    }

    @Action(treeActions.CreateTreeNode)
    createTreeNode(
        { getState, patchState }: StateContext<TreeStateModel>,
        { payload }: treeActions.CreateTreeNode
    ) {
        patchState({ loading: true });
        const state = getState();
        const id = uuid();
        let newPermissions = ['READ', 'CREATE', 'MODIFY', 'DELETE'];
        if (payload.type !== 'FOLDER') {
            const parent = state.nodes.find(n => n.id === payload.parentId);
            if (parent) {
                newPermissions = JSON.parse(JSON.stringify(parent.currentUserAccessPermissions));
            }
        }
        const newTreeNode: TreeNode = {
            id: id,
            accessControl: payload.type === 'FOLDER' ? 'PRIVATE' : 'INHERIT',
            currentUserAccessPermissions: newPermissions,
            ...payload,
            version: 0
        };
        let branch: TreeNode;

        // TODO: This needs to be thought out better once we know more about graph model schema
        if (payload.type === 'MODEL') {
            newTreeNode.content = {
                objectId: newTreeNode.id,
                objectType: 'GRAPH_MODEL',
                metadata: {},
                inports: {},
                outports: {},
                processes: {},
                connections: {},
                variables: {}
            } as GraphModel;
            newTreeNode.processDependencies = [];
            newTreeNode.processInterface = pidFromGraphModelNode(newTreeNode);
            const newPid = pidFromGraphModelNode(newTreeNode);
            const parentNode = state.nodes.find(n => n.id === payload.parentId);
            if (parentNode) {
                newPid.pathName = parentNode.name;
            }
            this.store.dispatch(new UpdatedGraphModel(newPid));
        } else if (payload.type === 'FC_SHEET') {
            const currentDate = new Date();
            currentDate.setDate(1);
            currentDate.setHours(0, 0, 0, 0);
            // FIXME: i don't think this branch thing is still necessary
            branch = {
                id: newTreeNode.id,
                type: 'FC_SHEET',
                accessControl: newTreeNode.accessControl,
                name: newTreeNode.name,
                description: null,
                parentId: payload.parentId,
                content: {
                    projectId: payload.parentId,
                    isMaster: false,
                    startTime: unix(currentDate.getTime() / 1000).add(-2, 'months').toDate(),
                    endTime: unix(currentDate.getTime() / 1000).add(10, 'months').toDate(),
                    variables: {}
                },
                version: newTreeNode.version
            };
        } else if (payload.type === 'SIMULATION') {
            const graphModelTrackingInfo = this.store.selectSnapshot(TreeNodeTrackingState.id(payload.ref));
            const inports = {};
            const inportInfo: { [inportId: string]: { types: ParamType[], name: string } } = {};

            const newScenarioId = uuid();

            const scenarioObject = {
                name: 'Scenario 1',
                scenarioId: newScenarioId,
                objectId: newScenarioId,
                inports: inports,
                objectType: 'SIMULATION_SCENARIO',
            };
            newTreeNode.content = {
                objectId: newTreeNode.id,
                objectType: 'SIMULATION_CONFIGURATION',
                metadata: {},
                modelName: graphModelTrackingInfo.name,
                modelVersion: undefined,
                tracking: 'LATEST_RELEASE',
                releaseNr: undefined,
                scenarios: {},
                ref: payload.ref,
                reportType: 'AGGREGATED',
                monteCarloIterations: 20,
                stepStart: moment().format('YYYY-MM'),
                stepLast: moment().add(6, 'M').format('YYYY-MM'),
                inports: inportInfo
            } as SimulationConfiguration;
            newTreeNode.content.scenarios[newScenarioId] = scenarioObject;
            newTreeNode.processDependencies = [payload.ref];
            delete newTreeNode['ref'];
        }

        patchState({
            nodes: [...state.nodes, newTreeNode],
            loaded: true,
            loading: false
        });
        return this.treeService.createTreeNode(payload.type === 'FC_SHEET' ? branch : newTreeNode)
            .pipe(
                map(response => {
                    if (response) {
                        patchState({
                            nodes: [...state.nodes, {
                                ...newTreeNode, name: response.name,
                                currentUserAccessPermissions: response.currentUserAccessPermissions
                            }], loading: false, loaded: true
                        });
                        this.store.dispatch(new treeActions.
                            CreatedTreeNode({ nodeId: id, nodeType: payload.type }));
                    } else {
                        patchState({ nodes: state.nodes, loading: false, loaded: true });
                    }
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

    @Action(treeActions.UpdateTreeNode)
    handleUpdateTreeNode(
        ctx: StateContext<TreeStateModel>,
        { payload }: treeActions.UpdateTreeNode
    ) {

        return this.updateTreeNodeContent(ctx, payload.id, (tn) => payload, true);
    }

    @Action(treeActions.ForceUpdateTreeNode)
    handleForceUpdateTreeNode(
        ctx: StateContext<TreeStateModel>,
        { payload }: treeActions.ForceUpdateTreeNode
    ) {

        return this.updateTreeNodeContent(ctx, payload.id, (tn) => payload, true, true);
    }

    @Action(libraryActions.RenameFolderCommitted)
    @Action(libraryActions.RenameGraphModelCommitted)
    @Action(libraryActions.RenameGraphModelTemplateCommitted)
    @Action(libraryActions.RenameSimulationCommitted)
    @Action(libraryActions.RenameSimulationResultCommitted)
    @Action(libraryActions.RenameForecastSheetCommitted)
    renameTreeNode(ctx: StateContext<TreeStateModel>,
        { payload: { nodeId, newName } }: libraryActions.RenameFolderCommitted) {
        return this.updateTreeNodeSparse(ctx, nodeId, draftNode => {
            draftNode.name = newName;
        }, true);
    }

    // fixme: find a way to check if the folder content
    // actually was updated before loading it over the network
    @Action(libraryActions.FolderAccessed)
    @Action(libraryActions.FolderClicked)
    loadFolderChildren(ctx: StateContext<TreeStateModel>, payload: libraryActions.FolderAccessed) {
        return this.treeService.getTree3(payload.treeNode.id).subscribe(nodes => {
            const currentNodes = ctx.getState().nodes;
            const newNodes = nodes.filter(n => !currentNodes.find(cn => cn.id === n.id));
            // FIXME: shouldn't we also delete nodes that disappeared? what if another user deleted an object?
            ctx.setState(patch({ nodes: append(newNodes) }));
        });
    }

    @Action(treeActions.DescriptionChanged)
    updateDescription(ctx: StateContext<TreeStateModel>, { payload: { nodeId, newDescription } }: treeActions.DescriptionChanged) {
        return this.updateTreeNodeSparse(ctx, nodeId, draftNode => {
            draftNode.description = newDescription;
        }, true);
    }

    @Action(treeActions.SendFolderToTrash)
    @Action(treeActions.SendGraphModelToTrash)
    @Action(treeActions.SendGraphModelTemplateToTrash)
    @Action(treeActions.SendSimulationToTrash)
    @Action(treeActions.SendSimulationResultToTrash)
    @Action(treeActions.SendForecastSheetToTrash)
    trashTreeNode(
        { getState, patchState, dispatch }: StateContext<TreeStateModel>,
        { trashNode }: treeActions.SendFolderToTrash) {
        const state = getState();
        patchState({
            loading: true
        });
        return this.treeService
            .trashTreeNode(trashNode.id, String(trashNode.version))
            .pipe(
                map((deletedNodeIds) => {
                    const remainingNodes = getState().nodes.filter(n => deletedNodeIds.findIndex(dnId => dnId === n.id) < 0);
                    patchState({ loading: false, loaded: true, nodes: remainingNodes });
                    const trashedNodes = state.nodes.filter(n => deletedNodeIds.findIndex(dnId => dnId === n.id) >= 0);
                    dispatch(trashedNodes.map(n => new treeActions.TrashedTreeNode(n)));

                }),
                catchError(error => {
                    asapScheduler.schedule(() => {
                        console.error(error);
                        patchState({ loading: false, loaded: true });
                    });
                    if (error.status === 409) {
                        this.store.dispatch([
                            new treeActions.TreeNodeDeleteConflict({ trashedNode: trashNode }),
                            new treeActions.ReloadSingleTreeNode(trashNode.id)
                        ]);
                        return of('dispatched conflict handler');
                    } else if (error.status === 410) {
                        this.store.dispatch(new treeActions.TreeNodeTrashed({ id: trashNode.id }));
                        return of('dispatched trashed handler');
                    } else if (error.status === 424) {
                        this.store.dispatch(new treeActions.TreeNodeFailedDependency());
                        return of('dispatched failed dependency handler');
                    }
                    return throwError('failed to delete');
                }
                )
            );
    }

    @Action(trashActions.RestoreButtonClicked)
    recoverTreeNode({ getState, patchState, dispatch }: StateContext<TreeStateModel>,
        { trashNode }: trashActions.RestoreButtonClicked) {
        const state = getState();
        return this.treeService
            .recoverTreeNode(trashNode.id, String(trashNode.version))
            .pipe(
                map(response => {
                    if (response.data) {
                        patchState({ nodes: [...state.nodes, { ...trashNode, name: response.data.name, version: response.data.version, currentUserAccessPermissions: response.data.currentUserAccessPermissions }], loading: false, loaded: true });
                    }
                    else {
                        patchState({ nodes: [...state.nodes, { ...trashNode, version: trashNode.version + 1 }], loading: false, loaded: true });
                    }
                    dispatch(new treeActions.GetTreeNode(trashNode.id));
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

    @Action(simulationActions.SimulationResultCreated)
    @Action(treeActions.GetTreeNode)
    getTreeNode(ctx: StateContext<TreeStateModel>,
        { payload }: treeActions.GetTreeNode) {
        const state = ctx.getState();
        const oldState = ctx.getState();
        return this.treeService
            .getTree3(payload, false, true)
            .pipe(
                map((nodesData: TreeNode[]) => {
                    const mainNode = nodesData.find(n => n.id === payload);
                    if (mainNode.type === 'FOLDER' || mainNode.type === 'SIMULATION') {
                        const children = nodesData.filter(node => node.parentId === payload);
                        ctx.patchState({ nodes: [...state.nodes, ...children] });
                    } else {
                        ctx.setState(produce(oldState, draft => {
                            const nodeIndex = draft.nodes.findIndex(node => node.id === payload);
                            // if node is already in state, update the existing node, else patch node into state
                            if (nodeIndex !== -1) {
                                draft.nodes[nodeIndex] = nodesData[0];
                            } else {
                                draft.nodes.push(nodesData[0]);
                            }
                        }));
                    }
                }),
                catchError(error =>
                    of(
                        asapScheduler.schedule(() => {
                            console.error(error);
                            ctx.patchState({ nodes: state.nodes, loading: false, loaded: true });
                        })
                    )
                )
            );
    }

    @Action(treeActions.ReloadSingleTreeNode)
    reloadTreeNode(ctx: StateContext<TreeStateModel>,
        { payload }: treeActions.ReloadSingleTreeNode) {
        return this.treeService
            .getSingleTreeNode(payload)
            .pipe(
                tap((treeNode: TreeNode) => {
                    const curNode = ctx.getState().nodes.find(n => n.id === treeNode.id);
                    if (curNode) {
                        ctx.setState(patch<TreeStateModel>({ nodes: updateItem<TreeNode>(tn => tn.id === payload, treeNode) }));
                    } else {
                        ctx.setState(patch<TreeStateModel>({ nodes: append<TreeNode>([treeNode]) }));
                    }
                })
            );
    }

    /*
    * Graph Editor related action handlers and utility functions
    */
    // only update the global state after the call to the BE Service was successful.
    // this is only used when elements are removed from a graph model
    updateTreeNodeDeferred(ctx: StateContext<TreeStateModel>, nodeId: string, fn, updateState: boolean = true): Observable<TreeNode> {
        const oldState = ctx.getState();
        const newState = produce(ctx.getState(), fn);

        if (oldState === newState) {
            return;
        }

        const treeNode = newState.nodes.find(node => node.id === nodeId);
        return this.treeService
            .updateTreeNode2(treeNode, treeNode.version.toString(), false)
            .pipe(
                tap(n => {
                    if (updateState) {
                        ctx.setState(
                            produce(newState, fn => {
                                const node = fn.nodes.find(node => node.id === nodeId);
                                ++node.version;
                            })
                        );
                    }
                })
            );
    }

    // fixme: define a return type
    updateTreeNodeSparse(ctx: StateContext<TreeStateModel>, nodeId: string, fn: (tn: TreeNode) => void, ignoreVersionConflict?: boolean) {
        const oldState = ctx.getState();
        const oldNodeIdx = oldState.nodes.findIndex(tn => tn.id === nodeId);
        if (oldNodeIdx < 0) {
            throw new Error('tried to update non existing treenode');
        }
        const oldNode = oldState.nodes[oldNodeIdx];
        const updatedNode = produce(oldNode, fn);
        if (!updatedNode) {
            throw new Error('tried to update treenode without supplying data');
        }
        if (oldNode.version !== updatedNode.version) {
            throw new Error('tried to update treenode from invalid version');
        }

        const rollbackAndCatchTrashError = catchError(e => {
            asapScheduler.schedule(() => {
                ctx.setState(patch({ nodes: updateItem<TreeNode>(tn => tn.id === nodeId, oldNode) }));
            });
            if (e.status === 409) {
                if (e.error.errorMessage.includes("Please choose a different name")) {
                    this.store.dispatch(new treeActions.TreeNodeNameConflicted({
                        orgNode: oldNode,
                        conflictedNode: updatedNode
                    }));
                } else {
                    this.store.dispatch(new treeActions.TreeNodeConflicted({
                        orgNode: oldNode,
                        conflictedNode: updatedNode
                    }));
                }
                return of('dispatched conflict handler');
            } else if (e.status === 410) {
                this.store.dispatch(new treeActions.TreeNodeTrashed({ id: oldNode.id }));
                return of('dispatched trashed handler');
            }
            return throwError('failed to update');
        });

        const updateToReturnedVersion = tap<TreeNode>(t => {
            if (t.version !== updatedNode.version + 1 && ignoreVersionConflict) {
                ctx.setState(patch<TreeStateModel>({
                    nodes: updateItem<TreeNode>(tn => tn.id === nodeId, {
                        ...t,
                        content: oldNode.content
                    })
                }));
            }
        });

        const version = String(oldNode.version);
        // update the state instantly so the user doesnt have to wait for the network op
        // to complete
        ctx.setState(patch<TreeStateModel>({
            nodes: updateItem<TreeNode>(tn => tn.id === nodeId, {
                ...updatedNode,
                version: updatedNode.version + 1,
                content: oldNode.content
            })
        }));
        if (updatedNode.type === 'MODEL') {
            this.store.dispatch(new UpdatedGraphModelName({ objectId: updatedNode.id, name: updatedNode.name }));
        }
        return this.treeService.updateTreeNode2({
            ...updatedNode,
            content: null
        }, version, true).pipe(updateToReturnedVersion, rollbackAndCatchTrashError);
    }


    updateTreeNodeContent(ctx: StateContext<TreeStateModel>, nodeId: string, fn: (t: TreeNode) => void, forceFullUpdate?: boolean, ignoreVersionConflict?: boolean) {
        const oldState = ctx.getState();
        const oldNodeIdx = oldState.nodes.findIndex(tn => tn.id === nodeId);
        if (oldNodeIdx < 0) {
            throw new Error('tried to update non existing treenode');
        }
        const oldNode = oldState.nodes[oldNodeIdx];
        const editedNode = produce(oldNode, fn);
        const updatedNode = produce(editedNode, t => {
            t.processInterface = pidFromGraphModelNode(t);
        });
        if (!updatedNode) {
            throw new Error('tried to update treenode without supplying data');
        }
        if (oldNode.version !== updatedNode.version && !forceFullUpdate) {
            throw new Error('tried to update treenode from invalid version');
        }
        if (oldNode === updatedNode) {
            return of('no changes');
        }
        // update the state instantly so the user doesnt have to wait for the network op
        // to complete
        ctx.setState(patch<TreeStateModel>({
            nodes: updateItem<TreeNode>(tn => tn.id === nodeId, {
                ...updatedNode,
                version: oldNode.version + 1
            })
        }));
        if (updatedNode.type === 'MODEL') {
            this.store.dispatch(new UpdatedGraphModel(pidFromGraphModelNode({
                ...updatedNode,
                version: oldNode.version + 1
            })));
        }

        const rollbackAndThrow = catchError(e => {
            // roll back changes first
            asapScheduler.schedule(() => {
                ctx.setState(patch({ nodes: updateItem<TreeNode>(tn => tn.id === nodeId, oldNode) }));
                this.store.dispatch(new UpdatedGraphModel(pidFromGraphModelNode(oldNode)));
            });
            // if it was a version conflict inform the user about it
            if (e) {
                if (e.status === 409) {
                    if (e.error.errorMessage.includes('Please choose a different name')) {
                        this.store.dispatch(new treeActions.TreeNodeNameConflicted({
                            orgNode: oldNode,
                            conflictedNode: updatedNode
                        }));
                    } else {
                        this.store.dispatch(new treeActions.TreeNodeConflicted({
                            orgNode: oldNode,
                            conflictedNode: updatedNode
                        }));
                    }
                    return of('dispatched conflict handler');
                } else if (e.status === 410) {
                    this.store.dispatch(new treeActions.TreeNodeTrashed({ id: oldNode.id }));
                    return of('dispatched trashed handler');
                } else if (e.status === 424) {
                    this.store.dispatch(new treeActions.TreeNodeFailedDependency());
                    return of('dispatched failed dependency handler');
                } else if (e.status === 403) {
                    this.store.dispatch(new treeActions.TreeNodePermissionException(updatedNode));
                    return of('dispatched exceeded permissions handler');
                }
                return throwError('failed to patch');
            }
        });

        const updateToReturnedVersion = tap<TreeNode>(t => {
            if (t.version !== updatedNode.version + 1 && ignoreVersionConflict) {
                ctx.setState(patch<TreeStateModel>({ nodes: updateItem<TreeNode>(tn => tn.id === nodeId, t) }));
            }
        });


        // check if we can do a patch update
        if (oldNode.content && updatedNode.content && !forceFullUpdate) {
            const nodeDiff = detailedDiff(oldNode.content, updatedNode.content) as { added: any, updated: any, deleted: any };
            const patchSet = buildPatch(nodeDiff);
            return this.treeService.patchTreeNode(nodeId, patchSet, String(oldNode.version)).pipe(rollbackAndThrow);
        } else {
            // fallback to oldskool full node update
            const version = ignoreVersionConflict ? undefined : String(oldNode.version);
            return this.treeService.updateTreeNode2(updatedNode, version).pipe(updateToReturnedVersion, rollbackAndThrow);
        }

    }

    @Action(graphEditorActions.ItemDropped)
    addPort(
        ctx: StateContext<TreeStateModel>,
        { payload: { graphModelId, dropData, position } }: graphEditorActions.ItemDropped
    ) {
        return this.updateTreeNodeContent(ctx, graphModelId, draftNode => {
            const id = uuid();
            switch (dropData) {
                case 'NEW_INPORT':
                    draftNode.content.inports[id] = {
                        objectId: id,
                        objectType: 'INPORT',
                        name: tnOps.generateUniqueName(draftNode.content.inports, 'Input'),
                        requiredTypes: [],
                        desiredUnits: [],
                        generatesResponse: 'PASSTHROUGH',
                        metadata: {
                            x: position.x,
                            y: position.y
                        }
                    } as Inport;
                    break;
                case 'NEW_OUTPORT':
                    draftNode.content.outports[id] = {
                        objectId: id,
                        objectType: 'OUTPORT',
                        name: tnOps.generateUniqueName(draftNode.content.outports, 'Output'),
                        types: [],
                        generatesResponse: 'PASSTHROUGH',
                        metadata: {
                            x: position.x,
                            y: position.y
                        }
                    } as Outport;
                    break;
            }
        });
    }


    @Action(graphEditorActions.UndoPerformed)
    @Action(graphEditorActions.RedoPerformed)
    undoRedoPerformed(
        ctx: StateContext<TreeStateModel>,
        { payload: { graphModelId, graphModelNode } }: graphEditorActions.RedoPerformed
    ) {
        const fullUpdate = true;
        return this.updateTreeNodeContent(ctx, graphModelId, draftNode => {
            Object.assign(draftNode, graphModelNode);
        }, fullUpdate);
    }



    @Action(graphControlBarActions.ProcessingElementSearchResultSelected)
    processingElementSearchResultSelected(
        ctx: StateContext<TreeStateModel>,
        { payload: { graphModelId, graphModelOrProcessInterface, position, label } }: graphControlBarActions.ProcessingElementSearchResultSelected
    ) {
        // need to force full update to update the process dependencies as well
        const forceFullUpdate = true;
        return this.updateTreeNodeContent(ctx, graphModelId, draftNode => {
            const processData = gmOps.processingElementToProcess(graphModelOrProcessInterface);
            draftNode.content.processes[processData.objectId] = processData;
            draftNode.content.processes[processData.objectId].label = label;
            draftNode.content.processes[processData.objectId].metadata = {
                x: position.x,
                y: position.y
            };
            if (graphModelOrProcessInterface.implementation === 'GRAPH_MODEL') {
                draftNode.content.processes[processData.objectId].tracking = 'LATEST_RELEASE';
                draftNode.processDependencies = extractDependencies(draftNode.content);
            }
        }, forceFullUpdate);
    }


    @Action(GraphModelInterfaceUpdated)
    updateGraphModelInterfaceForSimulation(ctx: StateContext<TreeStateModel>, { payload }: GraphModelInterfaceUpdated) {
        return this.updateTreeNodeContent(ctx, payload.simulationId, draftNode => {
            simOps.updateSimulationGraphModel(draftNode, payload.pid);
            draftNode.content.releaseNr = payload.releaseNr;
        });
    }


    @Action(graphEditorActions.Drop)
    graphEditorDrop(
        ctx: StateContext<TreeStateModel>,
        { payload: { graphModelId, draggedList } }: graphEditorActions.Drop
    ) {
        if (!draggedList.length) {
            return;
        }
        return this.updateTreeNodeContent(ctx, graphModelId, draftNode => {
            draggedList.forEach(dragItem => {
                // REFACTOR: Need a generic way of getting items of various types from a graph
                const id = dragItem.node.id;
                const node = gmOps.findGmChild(draftNode, id);
                node.metadata = {
                    ...node.metadata,
                    ...dragItem.destination
                };
            });
        });
    }

    @Action(graphEditorActions.CablePullComplete)
    graphEditorCablePullComplete(
        ctx: StateContext<TreeStateModel>,
        { payload: { graphModelId, newConnection } }: graphEditorActions.CablePullComplete
    ) {
        return this.updateTreeNodeContent(ctx, graphModelId, draftNode => {
            newConnection.objectId = uuid();
            newConnection.objectType = 'CONNECTION';
            draftNode.content.connections[newConnection.objectId] = newConnection;
        });
    }

    @Action(graphEditorActions.RemoveRefModel)
    @Action(graphEditorActions.DeleteKeyPressed)
    graphEditorDeleteKeyPressed(
        ctx: StateContext<TreeStateModel>,
        { payload: { graphModelId, selection } }: graphEditorActions.DeleteKeyPressed
    ) {
        ctx.dispatch(new clipboardActions.ClipboardDataCleared());
        return this.updateTreeNodeContent(ctx, graphModelId, draftNode => {
            selection.forEach(selected => {
                gmOps.deleteGraphModelNodeBySelection(draftNode, selected);
            });
        }, false);
    }

    @Action(graphEditorActions.PortPinShiftClicked)
    graphEditorPortPinShiftClicked(
        ctx: StateContext<TreeStateModel>,
        { payload: { graphModelId, portId } }: graphEditorActions.PortPinShiftClicked
    ) {
        return this.updateTreeNodeContent(ctx, graphModelId, draftNode => {
            gmOps.deleteGraphModelConnectionsByPortId(draftNode, portId);
        });
    }

    @Action(graphEditorActions.AddPortTemplateButtonClicked)
    addPortTemplate(
        ctx: StateContext<TreeStateModel>,
        { payload: { graphModelId, processId, portTemplate } }: graphEditorActions.AddPortTemplateButtonClicked
    ) {
        return this.updateTreeNodeContent(ctx, graphModelId, draftNode => {
            const process = draftNode.content.processes[processId];
            const templateGroupId = uuid();
            const templateId = portTemplate.id;
            Object.values(portTemplate.inportTemplates).forEach((inportTemplate: any) => {
                process.inports[uuid()] = {
                    ref: inportTemplate.objectId,
                    templateId,
                    templateGroupId
                };
            });
            Object.values(portTemplate.outportTemplates).forEach((outportTemplate: any) => {
                process.outports[uuid()] = {
                    ref: outportTemplate.objectId,
                    templateId,
                    templateGroupId
                };
            });
        });
    }

    /*
    * Details Panels
    */
    @Action(gmInportDetailsActions.RequiredTypeOptionToggled)
    gmInportRequiredTypeToggled(
        ctx: StateContext<TreeStateModel>,
        { payload: { graphModelId, inportId, checked, requiredType } }: gmInportDetailsActions.RequiredTypeOptionToggled
    ) {
        return this.updateTreeNodeContent(ctx, graphModelId, draftNode => {
            gmOps.patchGmChild(draftNode, inportId, (inport) => {
                if (checked) {
                    inport.requiredTypes.push(requiredType);
                } else {
                    inport.requiredTypes.splice(inport.requiredTypes.findIndex(x => x === requiredType), 1);
                }
                if (inport.defaultParam && inport.defaultParam.type && inport.requiredTypes.length) {
                    if (inport.requiredTypes.indexOf(inport.defaultParam.type) < 0) {
                        inport.defaultParam = {};
                    }
                }
            });
        });
    }

    @Action(gmProcessDetailsActions.LabelChanged)
    gmProcessLabelChanged(
        ctx: StateContext<TreeStateModel>,
        { payload: { graphModelId, processId, label } }: gmProcessDetailsActions.LabelChanged
    ) {
        return this.updateTreeNodeContent(ctx, graphModelId, draftNode => {
            gmOps.patchGmChild(draftNode, processId, (process) => process.label = label);
        });
    }

    @Action(gmProcessDetailsActions.TrackingUpdated)
    gmProcessTrackingUpdated(
        ctx: StateContext<TreeStateModel>,
        { payload: { graphModelId, processId, trackingMode, releaseNr } }: gmProcessDetailsActions.TrackingUpdated
    ) {
        return this.updateTreeNodeContent(ctx, graphModelId, draftNode => {
            gmOps.patchGmChild(draftNode, processId, (process) => {
                process.tracking = trackingMode;
                process.releaseNr = releaseNr;
            });
            runSyncGraphModel(draftNode, p => GraphModelInterfaceState.findPid(this.store, p));
            const newDeps = extractDependencies(draftNode.content);
            draftNode.processDependencies = newDeps;
        });
    }

    @Action(gmVariableReferenceDetailsActions.VariableLabelChanged)
    gmVariableLabelChanged(
        ctx: StateContext<TreeStateModel>,
        { payload: { graphModelId, variableId, label } }: gmVariableReferenceDetailsActions.VariableLabelChanged
    ) {
        return this.updateTreeNodeContent(ctx, graphModelId, draftNode => {
            gmOps.patchGmChild(draftNode, variableId, (variable) => variable.label = label);
        });
    }

    @Action(gmInportDetailsActions.NameChanged)
    gmInportNameChanged(
        ctx: StateContext<TreeStateModel>,
        { payload: { graphModelId, inportId, name } }: gmInportDetailsActions.NameChanged
    ) {
        return this.updateTreeNodeContent(ctx, graphModelId, draftNode => {
            gmOps.patchGmChild(draftNode, inportId, (inport) => inport.name = name);
        });
    }

    @Action(gmInportDetailsActions.DefaultParamValueChanged)
    gmInportDefaultParamValueUpdated(
        ctx: StateContext<TreeStateModel>,
        { payload: { graphModelId, inportId, defaultValue } }: gmInportDetailsActions.DefaultParamValueChanged
    ) {
        return this.updateTreeNodeContent(ctx, graphModelId, draftNode => {
            gmOps.patchGmChild(draftNode, inportId, (inport) => inport.defaultParam.value = defaultValue);
        });
    }

    @Action(gmInportDetailsActions.DefaultParamTypeChanged)
    gmInportDefaultParamTypeChanged(
        ctx: StateContext<TreeStateModel>,
        { payload: { graphModelId, inportId, defaultType } }: gmInportDetailsActions.DefaultParamTypeChanged
    ) {
        return this.updateTreeNodeContent(ctx, graphModelId, draftNode => {
            gmOps.patchGmChild(draftNode, inportId, (inport) => {
                switch (defaultType) {
                    case 'NUMBER':
                        inport.defaultParam = { type: 'NUMBER', value: 0 };
                        break;
                    case 'BOOLEAN':
                        inport.defaultParam = { type: 'BOOLEAN', value: true };
                        break;
                    case 'STRING':
                        inport.defaultParam = { type: 'STRING', value: '' };
                        break;
                    case 'DATE':
                        inport.defaultParam = { type: 'DATE', value: new Date().toJSON() };
                        break;
                    case 'BREAKDOWN':
                        inport.defaultParam = {
                            type: 'ASPECT',
                            value: {
                                type: 'BREAKDOWN',
                                name: '',
                                slices: {}
                            }
                        };
                        break;
                    default:
                        inport.defaultParam = undefined;
                }
            });
        });
    }

    @Action(gmOutportDetailsActions.NameChanged)
    gmOutportNameChanged(
        ctx: StateContext<TreeStateModel>,
        { payload: { graphModelId, outportId, name } }: gmOutportDetailsActions.NameChanged
    ) {
        return this.updateTreeNodeContent(ctx, graphModelId, draftNode => {
            gmOps.patchGmChild(draftNode, outportId, (outport) => outport.name = name);
        });
    }


    @Action(gmProcessInportDetailsActions.DefaultParamChanged)
    gmProcessInportDefaultParamChanged(
        ctx: StateContext<TreeStateModel>,
        { payload: { graphModelId, processInportId, defaultParam, defaultSelected } }: gmProcessInportDetailsActions.DefaultParamChanged
    ) {
        return this.updateTreeNodeContent(ctx, graphModelId, draftNode => {
            const processInport = gmOps.findGmChild(draftNode, processInportId);
            processInport.param = undefined;
            processInport.defaultParam = defaultParam && defaultSelected ? {
                type: defaultParam.type,
                value: defaultParam.value
            } : undefined;
            processInport.defaultSelected = defaultSelected;
        });
    }

    @Action(gmProcessInportDetailsActions.ParamTypeChanged)
    gmProcessInportParamTypeChanged(
        ctx: StateContext<TreeStateModel>,
        { payload: { graphModelId, processInportId, paramType, defaultParam } }: gmProcessInportDetailsActions.ParamTypeChanged
    ) {
        return this.updateTreeNodeContent(ctx, graphModelId, draftNode => {
            const processInport = gmOps.findGmChild(draftNode, processInportId);
            switch (paramType) {
                case 'DEFAULT':
                    processInport.param = { type: defaultParam.type, value: defaultParam.value };
                    break;
                case 'NUMBER':
                    processInport.param = { type: 'NUMBER', value: 0 };
                    break;
                case 'BOOLEAN':
                    processInport.param = { type: 'BOOLEAN', value: true };
                    break;
                case 'STRING':
                    processInport.param = { type: 'STRING', value: '' };
                    break;
                case 'DATE':
                    processInport.param = { type: 'DATE', value: new Date().toJSON() };
                    break;
                case 'BREAKDOWN':
                    processInport.param = {
                        type: 'ASPECT',
                        value: {
                            type: 'BREAKDOWN',
                            name: '',
                            slices: {}
                        }
                    };
                    break;
                default:
                    processInport.param = null;
            }
        });
    }

    @Action(gmProcessInportDetailsActions.ParamValueChanged)
    gmProcessInportParamValueChanged(
        ctx: StateContext<TreeStateModel>,
        { payload: { graphModelId, processInportId, paramValue } }: gmProcessInportDetailsActions.ParamValueChanged
    ) {
        const nodeId = graphModelId;
        return this.updateTreeNodeContent(ctx, graphModelId, draftNode => {
            const processInport = gmOps.findGmChild(draftNode, processInportId);
            processInport.param.value = paramValue;
        });
    }

    @Action(gmProcessOutportDetailsActions.ConfigChanged)
    gmProcessOutportConfigChanged(
        ctx: StateContext<TreeStateModel>,
        { payload: { graphModelId, processOutportId, config } }: gmProcessOutportDetailsActions.ConfigChanged
    ) {
        const nodeId = graphModelId;
        return this.updateTreeNodeContent(ctx, nodeId, draftNode => {
            const processOutport = gmOps.findGmChild(draftNode, processOutportId);
            processOutport.config = config;
        });
    }

    @Action(gmVariablePickerActions.AddBroadcastVariableClicked)
    gmVariablePickerAddBroadcastVariableClicked(
        ctx: StateContext<TreeStateModel>,
        { payload: { graphModelId, originPortId, x, y } }: gmVariablePickerActions.AddBroadcastVariableClicked
    ) {
        const nodeId = graphModelId;
        return this.updateTreeNodeContent(ctx, nodeId, draftNode => {
            const variableId = uuid();
            const referenceId = uuid();
            const label = 'New';
            draftNode.content.variables[variableId] = {
                objectId: variableId,
                objectType: 'BROADCAST_VARIABLE',
                label: label,
                metadata: {
                    references: [
                        {
                            portId: variableId,
                            portType: 'destination',
                            metadata: {
                                x,
                                y
                            },
                            id: referenceId
                        }
                    ]
                }
            };
            const connectionId = uuid();
            draftNode.content.connections[connectionId] = {
                objectType: 'CONNECTION',
                objectId: connectionId,
                source: originPortId,
                destination: variableId,
                metadata: {
                    referenceDestination: referenceId
                }
            };
        });
    }

    @Action(gmVariablePickerActions.AddNamedVariableClicked)
    gmVariablePickerAddNamedVariableClicked(
        ctx: StateContext<TreeStateModel>,
        { payload: { graphModelId, originPortId, x, y } }: gmVariablePickerActions.AddNamedVariableClicked
    ) {
        const nodeId = graphModelId;
        return this.updateTreeNodeContent(ctx, nodeId, draftNode => {
            const variableId = uuid();
            const referenceId = uuid();
            let label = 'Named Variable';
            let variables = [];
            variables = Object.values(draftNode.content.variables);
            while (variables.find(varia => varia.label === label)) {
                label = label + '_1';
            }
            draftNode.content.variables[variableId] = {
                objectId: variableId,
                objectType: 'NAMED_VARIABLE',
                label: label,
                metadata: {
                    references: [
                        {
                            portId: variableId,
                            portType: 'destination',
                            metadata: {
                                x,
                                y
                            },
                            id: referenceId
                        }
                    ]
                }
            };
            const connectionId = uuid();
            draftNode.content.connections[connectionId] = {
                objectType: 'CONNECTION',
                objectId: connectionId,
                source: originPortId,
                destination: variableId,
                metadata: {
                    referenceDestination: referenceId
                }
            };
        });
    }

    @Action(gmVariablePickerActions.LinkToVariableClicked)
    gmVariablePickerLinkToVariableClicked(
        ctx: StateContext<TreeStateModel>,
        { payload: { graphModelId, originPortId, originPortType, variableId, x, y } }: gmVariablePickerActions.LinkToVariableClicked
    ) {
        const nodeId = graphModelId;
        return this.updateTreeNodeContent(ctx, nodeId, draftNode => {
            const variable = gmOps.findGmChild(draftNode, variableId);
            const referenceId = uuid();
            variable.metadata.references.push({
                portId: variable.id,
                portType: originPortType === 'source' ? 'destination' : 'source',
                metadata: {
                    x,
                    y
                },
                id: referenceId
            });
            const connectionId = uuid();
            const prop = originPortType === 'source' ? 'referenceDestination' : 'referenceSource';
            draftNode.content.connections[connectionId] = {
                objectType: 'CONNECTION',
                objectId: connectionId,
                source: originPortType === 'source' ? originPortId : variableId,
                destination: originPortType === 'source' ? variableId : originPortId,
                metadata: {
                    [prop]: referenceId
                }
            };
        });
    }

    /* **** SIMULATION **** */


    @Action(simulationActions.MonteCarloUpdated)
    simulationMonteCarloUpdated(
        ctx: StateContext<TreeStateModel>,
        { payload: { id, newMonteCarloValue } }: simulationActions.MonteCarloUpdated
    ) {
        const nodeId = id;
        return this.updateTreeNodeContent(ctx, nodeId, draftNode => {
            draftNode.content.monteCarloIterations = newMonteCarloValue;
        });
    }

    @Action(simulationActions.InportScenarioUpdated)
    @Action(simulationActions.InportScenarioVariableUpdated)
    simulationInportScenarioUpdated(
        ctx: StateContext<TreeStateModel>,
        { payload: { simulationId, newScenarioInport, inportId, scenarioId } }: simulationActions.InportScenarioUpdated
    ) {
        const nodeId = simulationId;
        return this.updateTreeNodeContent(ctx, nodeId, draftNode => {
            draftNode.content.scenarios[scenarioId].inports[inportId] = newScenarioInport;
        });
    }

    @Action(simulationActions.StartDateUpdated)
    simulationStartDateUpdated(
        ctx: StateContext<TreeStateModel>,
        { payload: { simulationId, stepStart } }: simulationActions.StartDateUpdated
    ) {
        const nodeId = simulationId;
        return this.updateTreeNodeContent(ctx, nodeId, draftNode => {
            draftNode.content.stepStart = stepStart;
        });
    }

    @Action(simulationActions.EndDateUpdated)
    simulationEndDateUpdated(
        ctx: StateContext<TreeStateModel>,
        { payload: { simulationId, stepLast } }: simulationActions.EndDateUpdated
    ) {
        const nodeId = simulationId;
        return this.updateTreeNodeContent(ctx, nodeId, draftNode => {
            draftNode.content.stepLast = stepLast;
        });
    }

    @Action(simulationActions.AddScenarioButtonClicked)
    simulationScenarioAdded(
        ctx: StateContext<TreeStateModel>,
        { payload: { simulationId, newScenario } }: simulationActions.AddScenarioButtonClicked
    ) {
        return this.updateTreeNodeContent(ctx, simulationId, draftNode => {
            newScenario.name = this.getScenarioUniqueNameOnCreation(draftNode.content.scenarios, newScenario.name);
            draftNode.content.scenarios[newScenario.scenarioId] = newScenario;
        });
    }

    @Action(simulationActions.RemoveScenarioButtonClicked)
    simulationScenarioRemoved(
        ctx: StateContext<TreeStateModel>,
        { payload: { simulationId, scenarioId } }: simulationActions.RemoveScenarioButtonClicked
    ) {
        return this.updateTreeNodeContent(ctx, simulationId, draftNode => {
            delete draftNode.content.scenarios[scenarioId];
        });
    }


    @Action(simulationActions.RenameScenarioClicked)
    simulationScenarioRenameClicked(
        ctx: StateContext<TreeStateModel>,
        { payload: { simulationId, scenarioId, updatedName } }: simulationActions.RenameScenarioClicked
    ) {
        return this.updateTreeNodeContent(ctx, simulationId, draftNode => {
            if (!this.isScenarioNameDuplicated(draftNode.content.scenarios, updatedName)) {
                draftNode.content.scenarios[scenarioId].name = updatedName;
            }
        });
    }

    @Action(simulationActions.AddedForecastSheetClicked)
    simulationAddForecastSheetClicked(
        ctx: StateContext<TreeStateModel>,
        { payload: { simulationId, forecastSheetId, releaseNr, label } }: simulationActions.AddedForecastSheetClicked
    ) {
        return this.updateTreeNodeContent(ctx, simulationId, draftNode => {
            const simConf: SimulationConfiguration = draftNode.content;

            const sheetRef: ForecastSheetReference = {
                objectId: uuid(),
                objectType: 'FC_SHEET_REF',
                ref: forecastSheetId,
                tracking: 'LATEST_RELEASE',
                releaseNr: releaseNr,
                label: label
            };
            if (!simConf.forecasts) {
                simConf.forecasts = {};
            }
            simConf.forecasts[sheetRef.objectId] = sheetRef;
        });
    }

    @Action(simulationActions.RemoveForecastSheetClicked)
    simulationRemoveForecastSheetClicked(
        ctx: StateContext<TreeStateModel>,
        { payload: { simulationId, forecastSheetReferenceId } }: simulationActions.RemoveForecastSheetClicked
    ) {
        return this.updateTreeNodeContent(ctx, simulationId, draftNode => {
            const simConf: SimulationConfiguration = draftNode.content;

            if (simConf.forecasts && simConf.forecasts[forecastSheetReferenceId]) {
                delete simConf.forecasts[forecastSheetReferenceId];
            }
        });
    }

    @Action(simulationActions.ForecastSheetTrackingUpdateClicked)
    simulationForecastSheetTrackingUpdateClicked(
        ctx: StateContext<TreeStateModel>,
        { payload: { simulationId, forecastSheetReferenceId, tracking } }: simulationActions.ForecastSheetTrackingUpdateClicked
    ) {
        return this.updateTreeNodeContent(ctx, simulationId, draftNode => {
            const simConf: SimulationConfiguration = draftNode.content;

            if (simConf.forecasts && simConf.forecasts[forecastSheetReferenceId]) {
                const sheetRef = simConf.forecasts[forecastSheetReferenceId];
                sheetRef.tracking = tracking.tracking;
                sheetRef.releaseNr = tracking.releaseNr;
            }
        });
    }

    @Action(simulationActions.GraphModelTrackingUpdateClicked)
    simulationGraphModelTrackingUpdateClicked(
        ctx: StateContext<TreeStateModel>,
        { payload: { simulationId, tracking, pid } }: simulationActions.GraphModelTrackingUpdateClicked
    ) {
        return this.updateTreeNodeContent(ctx, simulationId, draftNode => {
            const simConf: SimulationConfiguration = draftNode.content;

            simConf.tracking = tracking.tracking;
            simConf.releaseNr = tracking.tracking === 'FIXED' ? tracking.releaseNr : undefined;
            if (pid) {
                simOps.updateSimulationGraphModel(draftNode, pid);
            }
            if (tracking.tracking === 'CURRENT_VERSION') {
                simConf.modelVersion = undefined;
            }
        });
    }

    isScenarioNameDuplicated(scenariosList: any, newName: string): boolean {
        let isDuplicated = false;
        Object.keys(scenariosList).forEach(key => {
            if (scenariosList[key].name === newName) {
                isDuplicated = true;
            }
        });
        return isDuplicated;
    }

    getScenarioUniqueNameOnCreation(scenariosList: any, name: string): string {
        let maxRetries = 100;
        Object.keys(scenariosList).forEach(key => {
            if (scenariosList[key].name === name) {
                if (maxRetries === 0) {
                    console.error('Exceeded name incrementation, cancelling scenario creation operation');
                    return;
                }
                const regexp = /\s\d+$/;
                const increment = name.match(regexp);
                if (increment) {
                    const newIncrement = parseInt(increment[0], 0) + 1;
                    name = name.replace(regexp, ` ${newIncrement}`);
                } else {
                    name = name.replace(/$/, ' 1');
                }
                maxRetries--;
            }
        });

        return name;
    }

    // persist the simulation result screen state to the special meta node
    @Action(simulationResultScreenActions.NewSimulationResultState)
    newSimulationResultScreenState(
        ctx: StateContext<TreeStateModel>,
        { simResultId, props }: simulationResultScreenActions.NewSimulationResultState
    ) {
        // silently drop requests from read only users
        // as this will fail anyway
        if (Utils.getUserRoleId() === 'READ_ONLY') {
            return;
        }
        const state = ctx.getState();
        const storedNodeIdx = state.nodes.findIndex(n => n.parentId === simResultId);
        const metaStateNode = state.nodes[storedNodeIdx];
        const updateState = false;
        if (storedNodeIdx > -1) {
            const updatedNode = this.updateTreeNodeDeferred(ctx, metaStateNode.id, draftState => {
                const metaNode = Object.assign({}, metaStateNode);
                metaNode.version = -1;
                metaNode.content = {
                    tableEntries: props.tableEntries ? props.tableEntries : [],
                    expansionStateVariables: props.expansionStateVariables ? props.expansionStateVariables : {},
                    selectedScenario: props.selectedScenario
                };
                draftState.nodes = Object.assign([...state.nodes], { [storedNodeIdx]: metaNode });
            }, updateState);
            if (updatedNode) {
                updatedNode.pipe(catchError(e => of('failed to persist meta node'))).subscribe();
            }
        }
    }

    /** Forecast Sheet Editor **/
    @Action(fcActions.UpdateVariable)
    @Action(fcActions.AddVariable)
    updateForecastVariable(
        ctx: StateContext<TreeStateModel>,
        { payload: { folderId, folderName, sheetId, sheetName, variableId, variableName, variableContent } }: fcActions.AddVariable
    ) {
        // FIXME: there is a problem with the delta update mechanism
        // which fails to update list structures at times
        const forceFullUpdate = false;
        return this.updateTreeNodeContent(ctx, sheetId, t => {
            if (!t.content.variables) {
                t.content.variables = {};
            }
            t.content.variables[variableId] = variableContent;
            const allVariables = Object.values<ForecastVariableModel>(t.content.variables);
            sanitizeTimeSegments(allVariables);
        }, forceFullUpdate);
    }

    @Action(fcActions.DeleteVariable)
    deleteForecastVariable(
        ctx: StateContext<TreeStateModel>,
        { payload: { sheetId, variableId, force } }: fcActions.DeleteVariable
    ) {
        const sheetNode = ctx.getState().nodes.find(n => n.id === sheetId);
        const allVariables = Object.values<ForecastVariableModel>(sheetNode.content.variables);
        if ((isReferencedVariables(variableId, allVariables) || bdHasAssociatedVariables(variableId, allVariables)) && !force) {
            return ctx.dispatch(new FailedToDeleteVariable({ sheetId: sheetId, variableId: variableId, reason: 'Variable is still referenced in other Variables.' }))
        }
        return this.updateTreeNodeContent(ctx, sheetId, t => {
            delete t.content.variables[variableId];
            removeBreakdownReferences(variableId, Object.values<ForecastVariableModel>(t.content.variables));
        });
    }

    @Action(fcActions.EnteredVariableTitle)
    updateVariableTitle(
        ctx: StateContext<TreeStateModel>,
        { payload: { sheetId, variableId, variableTitle } }: fcActions.EnteredVariableTitle
    ) {
        const sheet = ctx.getState().nodes.find(n => n.id === sheetId);
        const variables = Object.values<ForecastVariableModel>(sheet.content.variables);
        const dispatchErr = (msg: string) => this.store.dispatch(new fcActions.VariableTitleError({ sheetId: sheetId, variableId: variableId, message: msg }));
        if (!variableTitle) {
            return dispatchErr('No title given.');
        }
        const sameTitleVariable = variables.find(v => v.title === variableTitle);
        if (sameTitleVariable) {
            return dispatchErr('Title already used.');
        }

        if (variableTitle.match(/[^0-9a-zA-Z_]/)) {
            return dispatchErr('Title can only include Alphabetical characters, numbers and underscores.');
        }

        if (variableTitle.match(/^[0-9_]+$/)) {
            return dispatchErr('Variable names cannot include numbers or underscores only');
        }


        return this.updateTreeNodeContent(ctx, sheetId, t => {
            const variable = t.content.variables[variableId] as ForecastVariableModel;
            if (variable) {
                variable.title = variableTitle;
                const refNameUpdate: { [refId: string]: string } = {};
                refNameUpdate[variableId] = variableTitle;
                for (const v of Object.values(t.content.variables) as ForecastVariableModel[]) {
                    if (v.timeSegments) {
                        for (const ts of v.timeSegments) {
                            if (ts.expression) {
                                const exp = ts.expression;
                                const e = Expression.deserialize(exp);
                                if (e instanceof Expression) {
                                    e.updateRefNames(refNameUpdate);
                                }
                            }
                        }
                    }
                }
            }
        });

    }

    @Action(fcActions.SelectedVariableType)
    updateVariableType(
        ctx: StateContext<TreeStateModel>,
        { payload: { sheetId, variableId, variableType, force } }: fcActions.SelectedVariableType
    ) {
        const sheet = ctx.getState().nodes.find(n => n.id === sheetId);
        const curVariable = sheet.content.variables[variableId] as ForecastVariableModel;
        const allVariables = Object.values<ForecastVariableModel>(sheet.content.variables);
        const dispatchErr = (msg: string) => this.store.dispatch(new fcActions.VariableTitleError({ sheetId: sheetId, variableId: variableId, message: msg }));

        const hasBreakdownReferences = curVariable.variableType === VariableType.Breakdown && bdHasAssociatedVariables(curVariable.objectId, allVariables);
        // if the variable was a breakdown and now is something else, make sure no associations get messed up
        if (hasBreakdownReferences && !force) {
            return throwError('Still associations');
        }


        return this.updateTreeNodeContent(ctx, sheetId, t => {
            const variable = t.content.variables[variableId] as ForecastVariableModel;
            const allVariables = Object.values<ForecastVariableModel>(t.content.variables);
            if (hasBreakdownReferences && force) {
                removeBreakdownReferences(variableId, allVariables);
            }
            setVariableType(variable, variableType);
        });

    }

    /** Copy & Paste **/
    @Action(DuplicateFolder)
    duplicateFolder(
        ctx: StateContext<TreeStateModel>,
        { payload: { nodeId } }: DuplicateFolder
    ) {
        return this.treeService.copyFolder(nodeId).pipe(tap(tn => {
            ctx.setState(patch({ nodes: append([tn]) }));
            this.store.dispatch([
                new CreatedTreeNode({ nodeId: tn.id, nodeType: tn.type }),
                new RenameFolderClicked(tn)
            ]);
        }));
    }

    @Action(clipboardActions.PastePerformed)
    performPastingNode(
        ctx: StateContext<TreeStateModel>,
        { payload: { targetNodeId, clipboardData, position } }: clipboardActions.PastePerformed
    ) {

        const state = ctx.getState();
        // handle cut/paste action on library
        if (clipboardData.action === 'CUT' && clipboardData.selections[0].context === 'Library') {
            const nodeId = clipboardData.selections[0].id;
            const node = ctx.getState().nodes.find(n => n.id === nodeId);
            let newPermissions = ['READ', 'CREATE', 'MODIFY', 'DELETE'];
            if (node.type !== 'FOLDER') {
                const parent = state.nodes.find(n => n.id === targetNodeId);
                if (parent) newPermissions = JSON.parse(JSON.stringify(parent.currentUserAccessPermissions));
            }
            return this.treeService.moveNode(node.id, node.version.toString(), targetNodeId).pipe(
                tap(r => {
                    if (r.status === 'OK') {
                        if (r.data) {
                            ctx.setState(patch<TreeStateModel>({
                                nodes: updateItem<TreeNode>(tn => tn.id === node.id, {
                                    ...node,
                                    name: r.data.name,
                                    version: r.data.version,
                                    parentId: targetNodeId,
                                    currentUserAccessPermissions: r.data.currentUserAccessPermissions
                                })
                            }));
                        } else {
                            ctx.setState(patch<TreeStateModel>({
                                nodes: updateItem<TreeNode>(tn => tn.id === node.id, {
                                    ...node,
                                    version: node.version + 1,
                                    parentId: targetNodeId,
                                    currentUserAccessPermissions: newPermissions
                                })
                            }));
                        }
                        ctx.dispatch(new clipboardActions.NodePasteCommitted(targetNodeId));
                        ctx.dispatch(new forecastVariableActions.LoadForecastUnits());
                    }
                }),
                catchError(error => {
                    if (error.hasOwnProperty('status') && error.status === 409) {
                        return ctx.dispatch(new treeActions.TreeNodeNameConflicted({ orgNode: null, conflictedNode: null }))
                    }
                    return of('failed to copy');
                }
                )
            );

            // handle copy/paste action on library
        } else if (clipboardData.action === 'COPY' && clipboardData.selections[0].context === 'Library') {
            const nodeId = clipboardData.selections[0].id;
            const node = state.nodes.find(n => n.id === nodeId);
            if (node.type !== 'FOLDER') {
                return this.treeService.copyNode(nodeId, node.version.toString(), targetNodeId).pipe(tap(tn => {
                    ctx.setState(patch({ nodes: append([tn]) }));
                    // this can prob made simpler...
                    const renameAction = tn.type === 'MODEL' ? new RenameGraphModelClicked(tn) :
                        tn.type === 'SIMULATION' ? new RenameSimulationClicked(tn) :
                            tn.type === 'SIMULATIONRESULT' ? new RenameSimulationResultClicked(tn) :
                                tn.type === 'FC_SHEET' ? new RenameForecastSheetClicked(tn) : new RenameGraphModelClicked(tn);
                    this.store.dispatch([new CreatedTreeNode({ nodeId: tn.id, nodeType: tn.type }), renameAction]);
                }),
                    catchError(error => {
                        if (error.hasOwnProperty('status') && error.status === 409) {
                            return ctx.dispatch(new treeActions.TreeNodeNameConflicted({ orgNode: null, conflictedNode: null }))
                        }
                        return of('failed to copy');
                    }
                    )
                );
            }


        } else if (clipboardData.selections[0].context !== 'Library') {
            // handle copy/paste action on Graph editor
            const sourceGraphModel = state.nodes.find(node => node.id === clipboardData.selections[0].context);
            const connections = tnOps.cloneProperty(sourceGraphModel.content.connections);
            const selectionIds = [];
            const newSelections: any = [];
            clipboardData.selections.forEach(sel => {
                selectionIds.push(sel.id);
            });
            return this.updateTreeNodeContent(ctx, targetNodeId, draftNode => {
                const connectionPorts = [];
                const copiedVars: any = {};

                // set new inports, outports and processes
                clipboardData.selections.forEach(sel => {
                    const newId = uuid();
                    if (sel.type === 'Inport') {
                        tnOps.pasteNewInportOutport(newId, draftNode.content.inports, sourceGraphModel.content.inports, sel.id, position, connectionPorts);
                        tnOps.editConnectionProperties(connections, sel.id, newId);
                    } else if (sel.type === 'Outport') {

                        tnOps.pasteNewInportOutport(newId, draftNode.content.outports, sourceGraphModel.content.outports, sel.id, position, connectionPorts);
                        tnOps.editConnectionProperties(connections, sel.id, newId);
                    } else if (sel.type === 'Process') {
                        const newProcess = Object.assign({}, sourceGraphModel.content.processes[sel.id]);
                        newProcess.objectId = newId;
                        if (sourceGraphModel.content.processes[sel.id].label) {
                            newProcess.label = tnOps.generateUniqueLabel(draftNode.content.processes, sourceGraphModel.content.processes[sel.id].label);
                        }
                        // it will re-generate uuid for inports and outports in processes
                        const newProcessInports: any = {};
                        const newProcessOutports: any = {};
                        Object.keys(newProcess.inports).forEach(inportId => {
                            const newInportId = uuid();
                            newProcessInports[newInportId] = newProcess.inports[inportId];
                            connectionPorts.push(newInportId);
                            // edit connection source and destination
                            tnOps.editConnectionProperties(connections, inportId, newInportId);
                        });
                        Object.keys(newProcess.outports).forEach(outportId => {
                            const newOutportId = uuid();
                            newProcessOutports[newOutportId] = newProcess.outports[outportId];
                            connectionPorts.push(newOutportId);
                            // edit connection source and destination
                            tnOps.editConnectionProperties(connections, outportId, newOutportId);
                        });
                        draftNode.content.processes[newId] = newProcess;
                        draftNode.content.processes[newId].inports = newProcessInports;
                        draftNode.content.processes[newId].outports = newProcessOutports;
                        draftNode.content.processes[newId].metadata = {
                            x: position.x + sourceGraphModel.content.processes[sel.id].metadata.x,
                            y: position.y + sourceGraphModel.content.processes[sel.id].metadata.y
                        };
                    } else if (sel.type === 'VariableReference') {
                        // get copied variables
                        Object.values(sourceGraphModel.content.variables).forEach(vari => {
                            const variable: any = Object.assign({}, vari);
                            variable.metadata.references.forEach(ref => {
                                if (ref.id === sel.id) {
                                    copiedVars[variable.objectId] = variable;
                                }
                            });
                        });
                    }
                    if (sel.type !== 'VariableReference') {
                        tnOps.pushNewSelections(newSelections, sel.type, newId, targetNodeId);
                    }
                });

                // set new variables properties
                Object.keys(copiedVars).forEach(key => {
                    const refs = copiedVars[key].metadata.references.filter(x => selectionIds.indexOf(x.id) !== -1);
                    const newVarId = uuid();
                    const newRefs: any = [];
                    let variables: any = {};
                    // set new references for variable metadata and connection metadata
                    if (targetNodeId !== sourceGraphModel.id) {
                        // if source model and target model are different
                        refs.forEach(ref => {
                            const newRefId = uuid();
                            tnOps.setNewRefForVarAndConnection(ref, newRefs, newRefId, newVarId, connections, position);
                            tnOps.pushNewSelections(newSelections, 'VariableReference', newRefId, targetNodeId);
                        });
                        variables = copiedVars[key];
                        variables.objectId = newVarId;
                        variables.label = tnOps.generateUniqueLabel(draftNode.content.variables, copiedVars[key].label);
                        variables.metadata = {
                            references: newRefs
                        };
                        draftNode.content.variables[newVarId] = variables;
                        connectionPorts.push(newVarId);
                        tnOps.editConnectionProperties(connections, key, newVarId);
                    } else {
                        // if it's pasted in the same model, connect variables instead of creating new ones.
                        copiedVars[key].metadata.references.forEach(refe => {
                            newRefs.push(refe);
                        });
                        refs.forEach(ref => {
                            const newRefId = uuid();
                            tnOps.setNewRefForVarAndConnection(ref, newRefs, newRefId, key, connections, position);
                            tnOps.pushNewSelections(newSelections, 'VariableReference', newRefId, targetNodeId);
                        });
                        draftNode.content.variables[key].metadata = {
                            references: newRefs
                        };
                        connectionPorts.push(key);
                    }
                });

                // set new connections
                Object.keys(connections).forEach(key => {
                    const conn: any = Object.assign({}, connections[key]);
                    if (connectionPorts.indexOf(conn.source) !== -1 && connectionPorts.indexOf(conn.destination) !== -1) {
                        draftNode.content.connections[conn.objectId] = conn;
                    }
                });
            }).subscribe(() => {
                setTimeout(() => {
                    newSelections.forEach(selection => {
                        ctx.dispatch(new graphEditorActions.NodeSelected(selection));
                    });
                }, 0);
            });
        }
    }


}
