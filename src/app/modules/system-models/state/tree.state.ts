import { State, Action, StateContext, Selector, createSelector, Store } from '@ngxs/store';
import { patch, append, updateItem } from '@ngxs/store/operators';
import * as treeActions from './tree.actions';
import * as libraryActions from './library.actions';
import * as graphControlBarActions from './graph-control-bar.actions';
import * as graphEditorActions from './graph-editor.actions';
import * as simulationActions from './simulation.actions';
import * as simulationResultScreenActions from './simulation-result-screen.actions';
import * as trashActions from './trash.actions';
import * as gmProcessDetailsActions from './gm-process-details.actions';
import * as gmInportDetailsActions from './gm-inport-details.actions';
import * as gmOutportDetailsActions from './gm-outport-details.actions';
import * as gmProcessInportDetailsActions from './gm-process-inport-details.actions';
import * as gmProcessOutportDetailsActions from './gm-process-outport-details.actions';
import * as gmVariablePickerActions from './gm-variable-picker.actions';
import * as gmVariableReferenceDetailsActions from '@system-models/state/gm-variable-reference-details.actions';
import { TreeService } from '@app/core_module/service/tree.service';
import { TreeNode, TreeNodeType, buildPatch, generatePid } from '@app/core_module/interfaces/tree-node';
import { asapScheduler, of, Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Utils } from '@app/utils_module/utils';
import produce from 'immer';
import { v4 as uuid } from 'uuid';
import { ALL_PARAM_TYPES, GraphParam, ParamType } from '@system-models/interfaces/graph.interface';
import * as moment from 'moment';
import * as clipboardActions from '@system-models/state/clipboard.actions';
import { Inport, Outport, GraphModel, SimulationConfiguration, Process } from '@cpt/capacity-planning-simulation-types';
import { detailedDiff } from 'deep-object-diff';


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
        private store: Store) { }

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
                const modelnode = state.nodes.find(node => node.id === simNode.content.modelRef);
                return modelnode;
            }
        };
    }

    static getUniqueNameInScope(state: TreeStateModel, id: string, name: string): string {
        let maxRetries = 100;
        const scopedNodes = state.nodes.filter(node => node.parentId === id);
        while (scopedNodes.find(x => x.name === name)) {
            if (maxRetries === 0) {
                console.error('Exceeded tree node name incrementation, cancelling tree node creation operation');
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
        return name;
    }

    static generateUniqueName(existingItems, baseName: string): string {
        let maxRetries = 100;
        let name = baseName;

        while (Object.keys(existingItems).some(key => existingItems[key].name === name)) {
            if (maxRetries === 0) {
                console.error('Exceeded unique name incrementation, cancelling operation');
                return name;
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
        return name;
    }

    static generateUniqueLabel(existingItems, baseLabel: string): string {
        let maxRetries = 100;
        let name = baseLabel;

        while (Object.keys(existingItems).some(key => existingItems[key].label === name)) {
            if (maxRetries === 0) {
                console.error('Exceeded unique name incrementation, cancelling operation');
                return name;
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
        return name;
    }

    // load all nodes up to three levels deep
    // in sparse mode.
    @Action(treeActions.LoadTree)
    loadTree({ patchState, getState }: StateContext<TreeStateModel>) {
        // don't overwrite the existing nodes with sparse nodes
        if (getState().nodes.length === 0) {
            patchState({ loading: true, loaded: false });
            return this.treeService.getTree2('root', true, 4).subscribe(nodes => {
                patchState({
                    nodes: nodes,
                    loaded: true,
                    loading: false
                });
            });
        }
    }

    /* load the content of the simulation result node
     * also check if there are any meta nodes that hold
     * the data table configuration.
     * create the meta nodes if it can't be found.
     */
    @Action(treeActions.LoadSimulationResultContent)
    @Action(simulationResultScreenActions.RefreshButtonClicked)
    loadSimulationResultContent(ctx: StateContext<TreeStateModel>,
        { payload }: treeActions.LoadSimulationResultContent) {
        const state = ctx.getState();
        if (payload && payload.content === null) {
            return this.treeService.getTree2(payload.id).pipe(map(nodes => {
                const metaResponseIndex = nodes.findIndex(node => node.type === 'META');
                const simulationResponseIndex = nodes.findIndex(node => node.id === payload.id);
                ctx.setState(patch({ nodes: updateItem<TreeNode>(tn => tn.id === payload.id, nodes[simulationResponseIndex]) }));
                if (metaResponseIndex > -1) {
                    ctx.dispatch(new simulationResultScreenActions.UpdateSimulationResultMetaState(payload.id, nodes[metaResponseIndex].content));
                    ctx.setState(patch({ nodes: updateItem<TreeNode>(tn => tn.type === 'META' && tn.parentId === payload.id, nodes[metaResponseIndex]) }));

                } else if (Utils.getUserRoleId() === 'READ_ONLY') {
                    // read only users are not allowed to create nodes on the BE. so we just fake it.
                    const fakeMetaNode: TreeNode = { accessControl: 'PRIVATE', name: 'meta', parentId: payload.id, type: 'META', id: uuid() };
                    ctx.setState(patch({ nodes: append([fakeMetaNode]) }));


                } else {
                    this.treeService.createTreeNode2({ accessControl: 'PRIVATE', name: 'meta', parentId: payload.id, type: 'META' }).subscribe(newMetaNode => {
                        ctx.setState(patch({ nodes: append([newMetaNode]) }));
                    });
                }

            }));
        }
    }

    // as everything is just in sparse form after the initial load
    // the actual content of data nodes will be fetched when instructed
    // through this action
    @Action(treeActions.LoadGraphModelContent)
    @Action(treeActions.LoadSimulationContent)
    loadNodeContent(ctx: StateContext<TreeStateModel>,
        { payload }: treeActions.LoadSimulationResultContent) {
        const catchTrashError = catchError(e => {

            if (e.status === 410) {
                this.store.dispatch(new treeActions.TreeNodeTrashed({ trashedNode: payload }));
                return of('dispatched trashed handler');
            }
            return throwError('failed to patch');
        });

        if (payload && payload.content === null) {
            return this.treeService.getTree2(payload.id).pipe(
                tap<TreeNode[]>(nodes => {
                    const resultResponseIndex = nodes.findIndex(node => node.id === payload.id);
                    ctx.setState(patch({ nodes: updateItem<TreeNode>(tn => tn.id === payload.id, nodes[resultResponseIndex]) }));
                }), catchTrashError
            );
        }
    }

    @Action(treeActions.CreateTreeNode)
    createTreeNode(
        { getState, patchState }: StateContext<TreeStateModel>,
        { payload }: treeActions.CreateTreeNode
    ) {
        patchState({ loading: true });
        const state = getState();
        const id = uuid();
        const newTreeNode: TreeNode = {
            id: id,
            accessControl: payload.type === 'FOLDER' ? 'PRIVATE' : 'INHERIT',
            version: 1,
            currentUserAccessPermissions: ['READ', 'CREATE', 'MODIFY', 'DELETE'],
            ...payload,
            name: TreeState.getUniqueNameInScope(state, payload.parentId, payload.name),
        };

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
            newTreeNode.processInterface = generatePid(newTreeNode);
        } else if (payload.type === 'MODELTEMPLATE') {
            newTreeNode.content = {
                objectId: newTreeNode.id,
                objectType: 'GRAPH_MODEL_TEMPLATE',
                metadata: {},
                inports: {},
                outports: {},
                processes: {},
                connections: {},
                variables: {}
            };
        } else if (payload.type === 'SIMULATION') {
            const graphModel = getState().nodes.find(node => node.id === payload.modelRef);
            const inports = {};
            for (const inportId of Object.keys(graphModel.processInterface.inports)) {
                inports[inportId] = this.getScenarioInitialInportValue(graphModel.processInterface.inports[inportId]);
            }
            const newScenarioId = uuid();

            const scenarioObject = {
                name: 'Scenario 1',
                scenarioId: newScenarioId,
                objectId: newScenarioId,
                inports: inports,
                objectType: 'SIMULATION_SCENARIO'
            };
            newTreeNode.content = {
                objectId: newTreeNode.id,
                objectType: 'SIMULATION_CONFIGURATION',
                metadata: {},
                modelRef: payload.modelRef,
                scenarios: {},
                reportType: 'AGGREGATED',
                monteCarloIterations: 20,
                stepStart: moment().format('YYYY-MM'),
                stepLast: moment().add(6, 'M').format('YYYY-MM'),
            } as SimulationConfiguration;
            newTreeNode.content.scenarios[newScenarioId] = scenarioObject;
        }

        patchState({
            nodes: [...state.nodes, newTreeNode],
            loaded: true,
            loading: false
        });

        return this.treeService
            .createTreeNode(newTreeNode)
            .pipe(
                map(() => {
                    patchState({ loading: false, loaded: true });
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
    renameTreeNode(ctx: StateContext<TreeStateModel>,
        { payload: { nodeId, newName } }: libraryActions.RenameFolderCommitted) {
        return this.updateTreeNodeSparse(ctx, nodeId, draftNode => {
            draftNode.name = newName;
        }, true);
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
                        this.store.dispatch(new treeActions.TreeNodeTrashed({ trashedNode: trashNode }));
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
        patchState({
            nodes: [...state.nodes, { ...trashNode, version: trashNode.version + 1 }],
            loading: true
        });
        return this.treeService
            .recoverTreeNode(trashNode.id)
            .pipe(
                map(() => {
                    patchState({ loading: false, loaded: true });
                    if (trashNode.type === 'FOLDER' || trashNode.type === 'SIMULATION') {
                        dispatch(new treeActions.GetTreeNode(trashNode.id));
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

    @Action(simulationActions.SimulationResultCreated)
    @Action(treeActions.GetTreeNode)
    getTreeNode(ctx: StateContext<TreeStateModel>,
        { payload }: treeActions.GetTreeNode) {
        const state = ctx.getState();
        const oldState = ctx.getState();
        return this.treeService
            .getTreeNode(payload)
            .pipe(
                map((response: any) => {
                    const nodesData = response.data;
                    if (nodesData[0].type === 'FOLDER' || nodesData[0].type === 'SIMULATION') {
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
                map((treeNode: TreeNode) => {
                    ctx.setState(patch<TreeStateModel>({ nodes: updateItem<TreeNode>(tn => tn.id === payload, treeNode) }));

                }),
                catchError(error =>
                    of('failed to reload treenode')
                )
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
            .updateTreeNode(treeNode)
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
                this.store.dispatch(new treeActions.TreeNodeConflicted({ orgNode: oldNode, conflictedNode: updatedNode }));
                return of('dispatched conflict handler');
            } else if (e.status === 410) {
                this.store.dispatch(new treeActions.TreeNodeTrashed({ trashedNode: oldNode }));
                return of('dispatched trashed handler');
            }
            return throwError('failed to update');
        });

        const updateToReturnedVersion = tap<TreeNode>(t => {
            if (t.version !== updatedNode.version + 1 && ignoreVersionConflict) {
                ctx.setState(patch<TreeStateModel>({ nodes: updateItem<TreeNode>(tn => tn.id === nodeId, { ...t, content: oldNode.content }) }));
            }
        });

        const version = ignoreVersionConflict ? undefined : String(oldNode.version);
        // update the state instantly so the user doesnt have to wait for the network op
        // to complete
        ctx.setState(patch<TreeStateModel>({ nodes: updateItem<TreeNode>(tn => tn.id === nodeId, { ...updatedNode, version: updatedNode.version + 1, content: oldNode.content }) }));
        return this.treeService.updateTreeNode2({ ...updatedNode, content: null }, version, true).pipe(updateToReturnedVersion, rollbackAndCatchTrashError);
    }



    updateTreeNodeContent(ctx: StateContext<TreeStateModel>, nodeId: string, fn: (t: TreeNode) => void, forceFullUpdate?: boolean, ignoreVersionConflict?: boolean) {
        const oldState = ctx.getState();
        const oldNodeIdx = oldState.nodes.findIndex(tn => tn.id === nodeId);
        if (oldNodeIdx < 0) {
            throw new Error('tried to update non existing treenode');
        }
        const oldNode = oldState.nodes[oldNodeIdx];
        const editedNode = produce(oldNode, fn);
        const updatedNode = produce(editedNode, t => { t.processInterface = generatePid(t); });
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
        ctx.setState(patch<TreeStateModel>({ nodes: updateItem<TreeNode>(tn => tn.id === nodeId, { ...updatedNode, version: oldNode.version + 1 }) }));


        const rollbackAndThrow = catchError(e => {
            // roll back changes first
            asapScheduler.schedule(() => {
                ctx.setState(patch({ nodes: updateItem<TreeNode>(tn => tn.id === nodeId, oldNode) }));
            });
            // if it was a version conflict inform the user about it
            if (e.status === 409) {
                this.store.dispatch(new treeActions.TreeNodeConflicted({ orgNode: oldNode, conflictedNode: updatedNode }));
                return of('dispatched conflict handler');
            } else if (e.status === 410) {
                this.store.dispatch(new treeActions.TreeNodeTrashed({ trashedNode: oldNode }));
                return of('dispatched trashed handler');
            } else if (e.status === 424) {
                this.store.dispatch(new treeActions.TreeNodeFailedDependency());
                return of('dispatched failed dependency handler');
            } else if (e.status === 403) {
                this.store.dispatch(new treeActions.TreeNodePermissionException(updatedNode));
                return of('dispatched exceeded permissions handler');
            }
            return throwError('failed to patch');
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
                        name: TreeState.generateUniqueName(draftNode.content.inports, 'Input'),
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
                        name: TreeState.generateUniqueName(draftNode.content.outports, 'Output'),
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
    undoredoPerformed(
        ctx: StateContext<TreeStateModel>,
        { payload: { graphModelId, graphModelNode } }: graphEditorActions.RedoPerformed
    ) {
        const fullUpdate = true;
        return this.updateTreeNodeContent(ctx, graphModelId, draftNode => {
            Object.assign(draftNode, graphModelNode);
        }, fullUpdate);
    }

    private serializePorts(ports) {
        return Object.keys(ports).reduce((ports, ref) => {
            return {
                [uuid()]: {
                    ref
                },
                ...ports
            };
        }, {});
    }

    private processingElementToProcess(pe) {
        const inports = this.serializePorts(pe.inports);
        const outports = this.serializePorts(pe.outports);
        return {
            objectId: uuid(),
            objectType: 'PROCESS',
            type: 'PROCESSING_ELEMENT',
            ref: pe.objectId,
            inports,
            outports,
            metadata: {
                x: 200,
                y: 100
            }
        } as Process;
    }

    private graphModelToProcess(graphModel) {
        const inports = this.serializePorts(graphModel.processInterface.inports);
        const outports = this.serializePorts(graphModel.processInterface.outports);
        return {
            objectId: uuid(),
            objectType: 'PROCESS',
            type: 'GRAPH_MODEL',
            ref: graphModel.id,
            inports,
            outports,
            metadata: {
                x: 200,
                y: 100
            },
        } as Process;
    }

    @Action(graphControlBarActions.ProcessingElementSearchResultSelected)
    processingElementSearchResultSelected(
        ctx: StateContext<TreeStateModel>,
        { payload: { graphModelId, graphModelOrProcessInterface, position, label } }: graphControlBarActions.ProcessingElementSearchResultSelected
    ) {
        return this.updateTreeNodeContent(ctx, graphModelId, draftNode => {
            const serializer = graphModelOrProcessInterface.type === 'MODEL' ? this.graphModelToProcess.bind(this) : this.processingElementToProcess.bind(this);
            const processData = serializer(graphModelOrProcessInterface);
            draftNode.content.processes[processData.objectId] = processData;
            draftNode.content.processes[processData.objectId].label = label;
            draftNode.content.processes[processData.objectId].metadata = {
                x: position.x,
                y: position.y
            };
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
                const node = this.findGmChild(draftNode, id);
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

    private isConnectionToVariableReference(connection) {
        return (
            connection.metadata
            && (connection.metadata.referenceSource || connection.metadata.referenceDestination)
        );
    }

    private deleteGraphModelConnectionsByPortId(graphModel, portId) {
        Object.keys(graphModel.content.connections).forEach(connectionId => {
            const connection = graphModel.content.connections[connectionId];
            if (connection.source === portId || connection.destination === portId) {
                if (this.isConnectionToVariableReference(connection)) {
                    if (connection.source === portId) {
                        this.deleteGraphModelNodeBySelection(graphModel, { type: 'VariableReference', id: connection.metadata.referenceDestination });
                    } else if (connection.destination === portId) {
                        this.deleteGraphModelNodeBySelection(graphModel, { type: 'VariableReference', id: connection.metadata.referenceSource });
                    } else {
                        return; // never delete these by port id!
                    }
                } else {
                    delete graphModel.content.connections[connectionId];
                }
            }
        });
    }

    private deleteGraphModelConnectionsByVariableReference(graphModel, reference) {
        Object.keys(graphModel.content.connections).forEach(connectionId => {
            const connection = graphModel.content.connections[connectionId];
            if (connection.metadata && (connection.metadata.referenceSource === reference.id || connection.metadata.referenceDestination === reference.id)) {
                delete graphModel.content.connections[connectionId];
            }
        });
    }

    private deleteGraphModelConnectionsByProcess(graphModel, process) {
        const inportIds = Object.keys(process.inports);
        const outportIds = Object.keys(process.outports);
        inportIds.concat(outportIds).forEach(id => {
            this.deleteGraphModelConnectionsByPortId(graphModel, id);
        });
    }

    private deletePortsByTemplateGroup(graphModel, templateGroupId) {
        Object.values(graphModel.content.processes).forEach((process: any) => {
            ['inports', 'outports'].forEach(prop => {
                Object.keys(process[prop]).forEach(portId => {
                    const port = process[prop][portId];
                    if (port.templateGroupId === templateGroupId) {
                        this.deleteGraphModelConnectionsByPortId(graphModel, portId);
                        delete process[prop][portId];
                    }
                });
            });
        });
    }

    private deleteGraphModelNodeBySelection(graphModel, { type, id }) {
        switch (type) {
            case 'Inport':
                this.deleteGraphModelConnectionsByPortId(graphModel, id);
                delete graphModel.content.inports[id];
                break;
            case 'Outport':
                this.deleteGraphModelConnectionsByPortId(graphModel, id);
                delete graphModel.content.outports[id];
                break;
            case 'Process':
                this.deleteGraphModelConnectionsByProcess(graphModel, graphModel.content.processes[id]);
                delete graphModel.content.processes[id];
                break;
            case 'ProcessInport':
                Object.values(graphModel.content.processes).forEach((process: any) => {
                    const port = process.inports[id];
                    // It's only possible to delete a process port if it's dynamic
                    // Only dynamic ports have templateGroupIds
                    if (port && port.templateGroupId) {
                        this.deleteGraphModelConnectionsByPortId(graphModel, id);
                        this.deletePortsByTemplateGroup(graphModel, port.templateGroupId);
                    }
                });
                break;
            case 'ProcessOutport':
                Object.values(graphModel.content.processes).forEach((process: any) => {
                    const port = process.outports[id];
                    // It's only possible to delete a process port if it's dynamic
                    // Only dynamic ports have templateGroupIds
                    if (port && port.templateGroupId) {
                        this.deleteGraphModelConnectionsByPortId(graphModel, id);
                        this.deletePortsByTemplateGroup(graphModel, port.templateGroupId);
                    }
                });
                break;
            case 'VariableReference':
                Object.keys(graphModel.content.variables).forEach(variableId => {
                    const variable = graphModel.content.variables[variableId];
                    const referenceIndex = variable.metadata.references.findIndex(x => x.id === id);
                    if (referenceIndex > -1) {
                        const reference = variable.metadata.references[referenceIndex];
                        this.deleteGraphModelConnectionsByVariableReference(graphModel, reference);
                        variable.metadata.references.splice(referenceIndex, 1);
                    }
                    if (variable.metadata.references.length === 0) {
                        delete graphModel.content.variables[variableId];
                    }
                });
                break;
        }
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
                this.deleteGraphModelNodeBySelection(draftNode, selected);
            });
        }, false);
    }

    @Action(graphEditorActions.PortPinShiftClicked)
    graphEditorPortPinShiftClicked(
        ctx: StateContext<TreeStateModel>,
        { payload: { graphModelId, portId } }: graphEditorActions.PortPinShiftClicked
    ) {
        return this.updateTreeNodeContent(ctx, graphModelId, draftNode => {
            this.deleteGraphModelConnectionsByPortId(draftNode, portId);
        });
    }

    @Action(graphControlBarActions.GraphModelVersionCommentCommitted)
    saveVersionComment(
        ctx: StateContext<TreeStateModel>,
        { payload: { id, comment } }: graphControlBarActions.GraphModelVersionCommentCommitted
    ) {
        const oldState = ctx.getState();
        const node = oldState.nodes.find(node => node.id === id);
        return this.treeService
            .updateTreeNodeVersionComment(node.id, node.version, { comment: comment })
            .pipe(
                catchError(e => {
                    // roll back changes first
                    asapScheduler.schedule(() => {
                        ctx.patchState({ nodes: oldState.nodes });
                    });
                    if (e.status === 403) {
                        this.store.dispatch(new treeActions.TreeNodePermissionException(node));
                    }
                    return throwError('failed to patch');
                }));
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
            this.patchGmChild(draftNode, inportId, (inport) => {
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
            this.patchGmChild(draftNode, processId, (process) => process.label = label);
        });
    }

    @Action(gmVariableReferenceDetailsActions.VariableLabelChanged)
    gmVariableLabelChanged(
        ctx: StateContext<TreeStateModel>,
        { payload: { graphModelId, variableId, label } }: gmVariableReferenceDetailsActions.VariableLabelChanged
    ) {
        return this.updateTreeNodeContent(ctx, graphModelId, draftNode => {
            this.patchGmChild(draftNode, variableId, (variable) => variable.label = label);
        });
    }

    @Action(gmInportDetailsActions.NameChanged)
    gmInportNameChanged(
        ctx: StateContext<TreeStateModel>,
        { payload: { graphModelId, inportId, name } }: gmInportDetailsActions.NameChanged
    ) {
        return this.updateTreeNodeContent(ctx, graphModelId, draftNode => {
            this.patchGmChild(draftNode, inportId, (inport) => inport.name = name);
        });
    }

    @Action(gmInportDetailsActions.DefaultParamValueChanged)
    gmInportDefaultParamValueUpdated(
        ctx: StateContext<TreeStateModel>,
        { payload: { graphModelId, inportId, defaultValue } }: gmInportDetailsActions.DefaultParamValueChanged
    ) {
        return this.updateTreeNodeContent(ctx, graphModelId, draftNode => {
            this.patchGmChild(draftNode, inportId, (inport) => inport.defaultParam.value = defaultValue);
        });
    }

    @Action(gmInportDetailsActions.DefaultParamTypeChanged)
    gmInportDefaultParamTypeChanged(
        ctx: StateContext<TreeStateModel>,
        { payload: { graphModelId, inportId, defaultType } }: gmInportDetailsActions.DefaultParamTypeChanged
    ) {
        return this.updateTreeNodeContent(ctx, graphModelId, draftNode => {
            this.patchGmChild(draftNode, inportId, (inport) => {
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
            this.patchGmChild(draftNode, outportId, (outport) => outport.name = name);
        });
    }

    private patchGmChild(gmn: TreeNode, id: string, fnPatch: (orgChild) => any) {
        fnPatch(this.findGmChild(gmn, id));
    }

    private findGmChild(gmn, id) {
        return (
            this.findInport(gmn, id)
            || this.findOutport(gmn, id)
            || this.findProcess(gmn, id)
            || this.findProcessInport(gmn, id)
            || this.findProcessOutport(gmn, id)
            || this.findVariable(gmn, id)
            || this.findVariableReference(gmn, id)
        );
    }

    private findInport(gmn, id) {
        return gmn.content.inports[id];
    }

    private findOutport(gmn, id) {
        return gmn.content.outports[id];
    }

    private findProcess(gmn, id) {
        return gmn.content.processes[id];
    }

    private findProcessInport(gmn, id) {
        return this.gmProcessInports(gmn)[id];
    }

    private findProcessOutport(gmn, id) {
        return this.gmProcessOutports(gmn)[id];
    }

    private findVariable(gmn, id) {
        return gmn.content.variables[id];
    }

    private findVariableReference(gmn, id) {
        return this.gmVariableReferences(gmn).find(x => x.id === id);
    }

    private gmProcessInports(gmn) {
        return Object.keys(gmn.content.processes).reduce((a, id) => {
            const b = gmn.content.processes[id];
            return {
                ...a,
                ...b.inports
            };
        }, {});
    }

    private gmProcessOutports(gmn) {
        return Object.keys(gmn.content.processes).reduce((a, id) => {
            const b = gmn.content.processes[id];
            return {
                ...a,
                ...b.outports
            };
        }, {});
    }

    private gmVariableReferences(gmn) {
        return Object.keys(gmn.content.variables).reduce((a, id) => {
            const b = gmn.content.variables[id];
            return a.concat(b.metadata.references);
        }, []);
    }

    @Action(gmProcessInportDetailsActions.DefaultParamChanged)
    gmProcessInportDefaultParamChanged(
        ctx: StateContext<TreeStateModel>,
        { payload: { graphModelId, processInportId, defaultParam, defaultSelected } }: gmProcessInportDetailsActions.DefaultParamChanged
    ) {
        return this.updateTreeNodeContent(ctx, graphModelId, draftNode => {
            const processInport = this.findGmChild(draftNode, processInportId);
            processInport.param = undefined;
            processInport.defaultParam = defaultParam && defaultSelected ? { type: defaultParam.type, value: defaultParam.value } : undefined;
            processInport.defaultSelected = defaultSelected;
        });
    }

    @Action(gmProcessInportDetailsActions.ParamTypeChanged)
    gmProcessInportParamTypeChanged(
        ctx: StateContext<TreeStateModel>,
        { payload: { graphModelId, processInportId, paramType, defaultParam } }: gmProcessInportDetailsActions.ParamTypeChanged
    ) {
        return this.updateTreeNodeContent(ctx, graphModelId, draftNode => {
            const processInport = this.findGmChild(draftNode, processInportId);
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
                    // Calling `delete processInport.param` does not produce expected UI results.
                    processInport.param = undefined;
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
            const processInport = this.findGmChild(draftNode, processInportId);
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
            const processOutport = this.findGmChild(draftNode, processOutportId);
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
            const variable = this.findGmChild(draftNode, variableId);
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

    @Action(simulationActions.GraphModelUpdated)
    simulationGraphModelUpdated(
        ctx: StateContext<TreeStateModel>,
        { payload: { simulationId, graphModelId } }: simulationActions.GraphModelUpdated
    ) {
        if (Utils.getUserRoleId() === 'READ_ONLY') {
            return;
        }
        const nodeId = simulationId;
        return this.updateTreeNodeContent(ctx, nodeId, simulation => {
            const graphModel = ctx.getState().nodes.find(node => node.id === graphModelId);

            if (Object.keys(simulation.content.scenarios).length !== 0) {
                for (const key of Object.keys(simulation.content.scenarios)) {
                    const scenario = simulation.content.scenarios[key];

                    // Add any graph inports to the scenario inports if not found
                    Object.keys(graphModel.processInterface.inports).forEach(inportId => {
                        if (!scenario.inports[inportId]) {
                            const requiredTypes = graphModel.processInterface.inports[inportId].requiredTypes;
                            const inportValue = this.getDefaultScenarioInportValue(requiredTypes[0]);

                            scenario.inports[inportId] = {
                                type: requiredTypes[0],
                                value: inportValue
                            };
                        }
                    });

                    // Update existing scenario inports
                    Object.keys(graphModel.processInterface.inports).forEach(inportId => {
                        let requiredTypes = [];
                        if (graphModel.processInterface.inports[inportId].requiredTypes.length) {
                            requiredTypes = graphModel.processInterface.inports[inportId].requiredTypes;
                        } else {
                            requiredTypes = ALL_PARAM_TYPES;
                        }

                        const scenarioInport = scenario.inports[inportId];
                        const includesBreakdown = requiredTypes.findIndex(type => type === 'BREAKDOWN') !== -1;
                        const includesNumber = requiredTypes.findIndex(type => type === 'NUMBER') !== -1;
                        if (!includesBreakdown && !includesNumber && scenarioInport.type === 'FORECAST_VAR_REF') {
                            const inportValue = this.getDefaultScenarioInportValue(requiredTypes[0]);
                            scenario.inports[inportId] = {
                                type: requiredTypes[0],
                                value: inportValue
                            };
                        } else if (scenarioInport && scenarioInport.type === 'FORECAST_VAR_REF' && scenarioInport.displayType === 'FORECAST_VAR_REF' && includesBreakdown && !includesNumber) {
                            const inportValue = this.getDefaultScenarioInportValue(requiredTypes[0]);
                            scenario.inports[inportId] = {
                                type: requiredTypes[0],
                                value: inportValue
                            };
                        } else if (scenarioInport && scenarioInport.displayType === 'BREAKDOWN' && !includesBreakdown) {
                            const inportValue = this.getDefaultScenarioInportValue(requiredTypes[0]);
                            scenario.inports[inportId] = {
                                type: requiredTypes[0],
                                value: inportValue
                            };
                        }
                        if (scenarioInport && scenarioInport.type !== 'FORECAST_VAR_REF') {
                            const index = requiredTypes.findIndex(x => x === scenarioInport.type);
                            // If the scenarioInport.type is not found in the requiredTypes
                            if (index === -1) {
                                const inportValue = this.getDefaultScenarioInportValue(requiredTypes[0]);
                                scenario.inports[inportId] = {
                                    type: requiredTypes[0],
                                    value: inportValue
                                };
                            }
                        }
                    });



                    // Remove any scenario inports if not found in graph model inports
                    Object.keys(scenario.inports).forEach(scenarioInportId => {
                        if (!graphModel.processInterface.inports[scenarioInportId]) {
                            delete scenario.inports[scenarioInportId];
                        }
                    });
                }
            }
        });
    }


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

    getScenarioInitialInportValue(inport): GraphParam {
        let allowedTypes: ParamType[] = ['NUMBER', 'STRING', 'BOOLEAN', 'BREAKDOWN', 'DATE'];
        if (inport.requiredTypes.length) {
            allowedTypes = inport.requiredTypes;
        }

        if (inport.defaultParam && inport.defaultParam.type && allowedTypes.findIndex(t => t === inport.defaultParam.type) > -1) {
            return {
                type: inport.defaultParam.type,
                value: inport.defaultParam.value
            } as GraphParam;
        } else {
            let initialType = allowedTypes[0];
            switch (initialType) {
                case 'NUMBER':
                    return { type: 'NUMBER', value: 0 };
                case 'STRING':
                    return { type: 'STRING', value: '' };
                case 'BOOLEAN':
                    return { type: 'BOOLEAN', value: false };
                case 'BREAKDOWN':
                    return { type: 'ASPECT', value: { type: 'BREAKDOWN', name: '', slices: {} } };
                case 'DATE': {
                    return { type: 'DATE', value: new Date() };
                }
            }
        }
    }

    getDefaultScenarioInportValue(firstRequiredType) {
        let inportValue: any;
        switch (firstRequiredType) {
            case 'BOOLEAN': {
                inportValue = false;
                break;
            }
            case 'NUMBER': {
                inportValue = 0;
                break;
            }
            case 'FORECAST_VAR_REF': {
                inportValue = '';
                break;
            }
        }
        return inportValue;
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

    isScenarioNameDuplicated(scenariosList: any, newName: string): boolean {
        let isDuplicated: boolean;
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
                metaNode.content = {
                    tableEntries: props.tableEntries ? props.tableEntries : [],
                    expansionStateVariables: props.expansionStateVariables ? props.expansionStateVariables : {},
                    selectedScenario: props.selectedScenario
                };
                const updatedNodes = Object.assign([...state.nodes], { [storedNodeIdx]: metaNode });
                draftState.nodes = updatedNodes;
            }, updateState);
            if (updatedNode) {
                updatedNode.pipe(catchError(e => of('failed to persist meta node'))).subscribe();
            }
        }
    }

    @Action(clipboardActions.PastePerformed)
    performPastingNode(
        ctx: StateContext<TreeStateModel>,
        { payload: { targetNodeId, clipboardData, position } }: clipboardActions.PastePerformed
    ) {
        const state = ctx.getState();
        const targetNode = state.nodes.find(node => node.id === targetNodeId);
        // handle pasting with cut and copy action on library and graph editor
        if (clipboardData.action === 'CUT' && clipboardData.selections[0].context === 'Library') {
            // handle cut/paste action on library
            const nodeId = clipboardData.selections[0].id;
            return this.updateTreeNodeSparse(ctx, nodeId, draftNode => {
                draftNode.parentId = targetNodeId;
                draftNode.name = TreeState.getUniqueNameInScope(state, targetNodeId, draftNode.name);
            });
        } else if (clipboardData.action === 'COPY' && clipboardData.selections[0].context === 'Library') {
            // handle copy/paste action on library
            const nodeId = clipboardData.selections[0].id;
            const nodeToCopy = state.nodes.find(node => node.id === nodeId);
            if (nodeToCopy && nodeToCopy.content === null) {
                return this.treeService
                    .getSingleTreeNode(nodeToCopy.id)
                    .pipe(map(copiedNodeWithContent => {
                        return this.createACopyNode(ctx, copiedNodeWithContent, targetNode);
                    }));
            } else {
                return this.createACopyNode(ctx, nodeToCopy, targetNode);
            }
        } else if (clipboardData.selections[0].context !== 'Library') {
            // handle copy/paste action on Graph editor
            const sourceGraphModel = state.nodes.find(node => node.id === clipboardData.selections[0].context);
            const connections = this.cloneProperty(sourceGraphModel.content.connections);
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
                        this.pasteNewInportOutport(newId, draftNode.content.inports, sourceGraphModel.content.inports, sel.id, position, connectionPorts);
                        this.editConnectionProperties(connections, sel.id, newId);
                    } else if (sel.type === 'Outport') {

                        this.pasteNewInportOutport(newId, draftNode.content.outports, sourceGraphModel.content.outports, sel.id, position, connectionPorts);
                        this.editConnectionProperties(connections, sel.id, newId);
                    } else if (sel.type === 'Process') {
                        const newProcess = Object.assign({}, sourceGraphModel.content.processes[sel.id]);
                        newProcess.objectId = newId;
                        if (sourceGraphModel.content.processes[sel.id].label) {
                            newProcess.label = TreeState.generateUniqueLabel(draftNode.content.processes, sourceGraphModel.content.processes[sel.id].label);
                        }
                        // it will re-generate uuid for inports and outports in processes
                        const newProcessInports: any = {};
                        const newProcessOutports: any = {};
                        Object.keys(newProcess.inports).forEach(inportId => {
                            const newInportId = uuid();
                            newProcessInports[newInportId] = newProcess.inports[inportId];
                            connectionPorts.push(newInportId);
                            // edit connection source and destination
                            this.editConnectionProperties(connections, inportId, newInportId);
                        });
                        Object.keys(newProcess.outports).forEach(outportId => {
                            const newOutportId = uuid();
                            newProcessOutports[newOutportId] = newProcess.outports[outportId];
                            connectionPorts.push(newOutportId);
                            // edit connection source and destination
                            this.editConnectionProperties(connections, outportId, newOutportId);
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
                        this.pushNewSelections(newSelections, sel.type, newId, targetNodeId);
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
                            this.setNewRefForVarAndConnection(ref, newRefs, newRefId, newVarId, connections, position);
                            this.pushNewSelections(newSelections, 'VariableReference', newRefId, targetNodeId);
                        });
                        variables = copiedVars[key];
                        variables.objectId = newVarId;
                        variables.label = TreeState.generateUniqueLabel(draftNode.content.variables, copiedVars[key].label);
                        variables.metadata = {
                            references: newRefs
                        };
                        draftNode.content.variables[newVarId] = variables;
                        connectionPorts.push(newVarId);
                        this.editConnectionProperties(connections, key, newVarId);
                    } else {
                        // if it's pasted in the same model, connect variables instead of creating new ones.
                        copiedVars[key].metadata.references.forEach(refe => {
                            newRefs.push(refe);
                        });
                        refs.forEach(ref => {
                            const newRefId = uuid();
                            this.setNewRefForVarAndConnection(ref, newRefs, newRefId, key, connections, position);
                            this.pushNewSelections(newSelections, 'VariableReference', newRefId, targetNodeId);
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

    /**
     * Create a new node with cloned data of copied node
     * @param getState
     * @param patchState
     * @param nodeToCopy
     * @param targetNode
     */
    createACopyNode({ getState, patchState }: StateContext<TreeStateModel>, nodeToCopy, targetNode) {
        const state = getState();
        // creating a new treeNode with cloned properties
        const newTreeNode: TreeNode = Object.assign({}, nodeToCopy);
        newTreeNode.id = uuid();
        newTreeNode.parentId = targetNode.id;
        newTreeNode.ownerId = targetNode.ownerId;
        newTreeNode.ownerName = targetNode.ownerName;
        newTreeNode.name = TreeState.getUniqueNameInScope(state, targetNode.id, nodeToCopy.name);
        newTreeNode.content = Object.assign({}, nodeToCopy.content);
        newTreeNode.version = 1;

        if (nodeToCopy.type === 'MODEL') {
            const newConns = this.cloneProperty(nodeToCopy.content.connections);
            const newInports = this.cloneProperty(nodeToCopy.content.inports, newConns);
            const newOutports = this.cloneProperty(nodeToCopy.content.outports, newConns);
            const newVariables = this.cloneProperty(nodeToCopy.content.variables, newConns);
            const newProcesses = this.cloneProperty(nodeToCopy.content.processes);

            // it will re-generate uuid for inports and outports in processes
            Object.values(newProcesses).forEach(proc => {
                const process: any = Object.assign({}, proc);
                const newProcessInports: any = {};
                const newProcessOutports: any = {};
                Object.keys(process.inports).forEach(inportId => {
                    const newInportId = uuid();
                    newProcessInports[newInportId] = process.inports[inportId];
                    // edit connection source and destination
                    if (newConns) {
                        this.editConnectionProperties(newConns, inportId, newInportId);
                    }
                });
                Object.keys(process.outports).forEach(outportId => {
                    const newOutportId = uuid();
                    newProcessOutports[newOutportId] = process.outports[outportId];
                    // edit connection source and destination
                    if (newConns) {
                        this.editConnectionProperties(newConns, outportId, newOutportId);
                    }
                });
                newProcesses[process.objectId].inports = newProcessInports;
                newProcesses[process.objectId].outports = newProcessOutports;
            });
            newTreeNode.content.objectId = newTreeNode.id;
            newTreeNode.content.inports = newInports;
            newTreeNode.content.outports = newOutports;
            newTreeNode.content.processes = newProcesses;
            newTreeNode.content.connections = newConns;
            newTreeNode.content.variables = newVariables;
        } else if (nodeToCopy.type === 'SIMULATION') {
            const newScenarios = this.cloneProperty(nodeToCopy.content.scenarios);
            newTreeNode.content.objectId = newTreeNode.id;
            newTreeNode.content.scenarios = newScenarios;
        }

        const newState = { nodes: [...state.nodes, newTreeNode], loaded: true, loading: false };
        patchState(newState);

        return this.treeService
            .createTreeNode(newTreeNode)
            .subscribe(() => {
                patchState({ loading: false, loaded: true });
            });
    }

    /**
     * Cloning content properties
     * @param props
     * @param conns
     */
    cloneProperty(props, conns?) {
        const cloneValues: any = {};
        Object.values(props).forEach(prop => {
            const propId = uuid();
            const propObj: any = Object.assign({}, prop);
            const cloneProp: any = Object.assign({}, prop);
            cloneProp.objectId = propId;
            if (cloneProp.scenarioId) {
                cloneProp.scenarioId = propId;
            }
            cloneValues[propId] = cloneProp;

            // edit connection source and destination
            if (conns) {
                this.editConnectionProperties(conns, propObj.objectId, propId);
            }
        });
        return cloneValues;
    }

    /**
     * replace source and destination of connections with new ones
     * @param newConns
     * @param oldId
     * @param newId
     */
    editConnectionProperties(newConns: any, oldId: string, newId: string) {
        Object.values(newConns).forEach(conn => {
            const connection: any = Object.assign({}, conn);
            if (connection.source === oldId) {
                newConns[connection.objectId].source = newId;
            }
            if (connection.destination === oldId) {
                newConns[connection.objectId].destination = newId;
            }
        });
    }

    /**
     * set new references for Variables and connections
     * @param ref
     * @param newRefs
     * @param newRefId
     * @param newVarId
     * @param connections
     * @param position
     */
    setNewRefForVarAndConnection(ref: any, newRefs: any, newRefId: string, newVarId: string, connections: any, position: any) {
        newRefs.push({
            portId: ref.portId ? newVarId : undefined,
            id: newRefId,
            metadata: {
                x: position.x + ref.metadata.x,
                y: position.y + ref.metadata.y
            },
            portType: ref.portType
        });
        Object.keys(connections).forEach(key => {
            const connection: any = Object.assign({}, connections[key]);
            if (connection.metadata && connection.metadata.referenceDestination && connection.metadata.referenceDestination === ref.id) {
                connections[connection.objectId].metadata = {
                    referenceDestination: newRefId
                };
            }
            if (connection.metadata && connection.metadata.referenceSource && connection.metadata.referenceSource === ref.id) {
                connections[connection.objectId].metadata = {
                    referenceSource: newRefId
                };
            }
        });
    }

    /**
     * push pasted elements to newSelections array for selecting after pasting
     * @param newSelections
     * @param nodeType
     * @param newId
     * @param nodeId
     */
    pushNewSelections(newSelections: any, nodeType: string, newId: string, nodeId: string) {
        newSelections.push({
            nodeType: nodeType,
            nodeId: newId,
            graphModelId: nodeId,
            modifierKeys: ['Shift']
        });
    }

    /**
     * create new inport/outport and set their properties: objectId, name, metadata
     * @param newId
     * @param desInOutports
     * @param sourceInOutports
     * @param seletedId
     * @param position
     * @param connectionPorts
     */
    pasteNewInportOutport(newId: string, desInOutports: any, sourceInOutports: any, seletedId: string, position: any, connectionPorts: any) {
        const destinationInOutport = Object.assign({}, sourceInOutports[seletedId]);
        destinationInOutport.objectId = newId;
        destinationInOutport.metadata = {
            x: position.x + sourceInOutports[seletedId].metadata.x,
            y: position.y + sourceInOutports[seletedId].metadata.y
        };
        destinationInOutport.name = TreeState.generateUniqueName(desInOutports, sourceInOutports[seletedId].name);
        desInOutports[newId] = destinationInOutport;
        connectionPorts.push(newId);
    }

}
