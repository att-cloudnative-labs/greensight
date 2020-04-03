import { State, Selector, StateContext, Store, Action, StateOperator } from '@ngxs/store';
import { Process, ProcessInterfaceDescription } from '@cpt/capacity-planning-simulation-types/lib';
import * as gmiActions from '@cpt/state/graph-model-interface.actions';
import { mergeMap, tap } from 'rxjs/operators';
import { append, patch, updateItem } from '@ngxs/store/operators';
import { of } from 'rxjs';
import { TreeService } from '@cpt/services/tree.service';
import { pidFromGraphModelNode } from '@cpt/models/graph-model.model';
import { ProcessingElementSearchResultSelected } from '@cpt/state/graph-control-bar.actions';
import { LoadGraphModelContent } from '@cpt/state/tree.actions';
import { LoadGraphModelDependencies } from '@cpt/state/processing-element.actions';
import { ProcessingElementState, ProcessingElementStateModel } from '@cpt/state/processing-element.state';
import { TreeNodeTrackingState, TreeNodeTrackingStateModel } from '@cpt/state/tree-node-tracking.state';
import { LoadReleasePid } from '@cpt/state/graph-model-interface.actions';

export class GraphModelInterfaceStateModel {
    currentVersion: { [refId: string]: ProcessInterfaceDescription };
    allReleases: ProcessInterfaceDescription[];
    latestRelease: { [refId: string]: ProcessInterfaceDescription };
}

@State<GraphModelInterfaceStateModel>({
    name: 'graphModelInterface',
    defaults: {
        currentVersion: {},
        latestRelease: {},
        allReleases: []
    }
})
export class GraphModelInterfaceState {

    static findPid(store: Store, proc: Process): ProcessInterfaceDescription {
        const gms = store.selectSnapshot(GraphModelInterfaceState) as GraphModelInterfaceStateModel;
        const pes = store.selectSnapshot(ProcessingElementState) as ProcessingElementStateModel;
        return GraphModelInterfaceState.findPidDirect(gms, pes, proc);
    }

    static findPidDirect(gms: GraphModelInterfaceStateModel, pes: ProcessingElementStateModel, proc: Process): ProcessInterfaceDescription {
        if (proc.type === 'GRAPH_MODEL') {
            if (proc.tracking === 'FIXED') {
                return gms.allReleases.find(pid => pid.objectId === proc.ref && pid.releaseNr === proc.releaseNr);
            } else if (proc.tracking === 'CURRENT_VERSION') {
                return gms.currentVersion[proc.ref];
            } else {
                const releasedPid = gms.latestRelease[proc.ref];
                return releasedPid ? releasedPid : gms.currentVersion[proc.ref];
            }
        } else {
            return pes.processingElements.find(pid => pid.objectId === proc.ref);
        }
    }

    constructor(private treeService: TreeService, private store: Store) {
    }

    @Selector()
    static currentVersions(state: GraphModelInterfaceStateModel) {
        return state.currentVersion;
    }

    @Selector()
    static releases(state: GraphModelInterfaceStateModel) {
        return state.allReleases;
    }

    @Selector()
    static combined(state: GraphModelInterfaceStateModel) {
        return { ...state.currentVersion, ...state.latestRelease };
    }

    addRelease(pid: ProcessInterfaceDescription): StateOperator<GraphModelInterfaceStateModel> {
        return (state) => {
            const curLatestRelease = state.latestRelease[pid.objectId];
            const curAllRelease = state.allReleases.find(r => r.objectId === pid.objectId && r.releaseNr === pid.releaseNr);
            const newReleaseEntry: { [refId: string]: ProcessInterfaceDescription } = {};
            newReleaseEntry[pid.objectId] = curLatestRelease ? (pid.releaseNr > curLatestRelease.releaseNr ? pid : curLatestRelease) : pid;
            return {
                currentVersion: state.currentVersion,
                allReleases: curAllRelease ? state.allReleases : [...state.allReleases, pid],
                latestRelease: { ...state.latestRelease, ...newReleaseEntry }
            };
        };
    }


    @Action(gmiActions.AddCurrentPid)
    addCurrentPid({ getState, setState }: StateContext<GraphModelInterfaceStateModel>, { payload: { pid } }: gmiActions.AddCurrentPid) {
        return setState(
            (patch(
                {
                    currentVersion: patch({ [pid.objectId]: pid })
                }
            )));
    }

    @Action(gmiActions.LoadReleasePid)
    loadReleasePid({ getState, setState }: StateContext<GraphModelInterfaceStateModel>, { payload: { nodeId, releaseNr } }: gmiActions.LoadReleasePid) {
        const currentPid = getState().allReleases.find(p => p.objectId === nodeId && p.releaseNr === releaseNr);
        if (currentPid) {
            return of(currentPid);
        } else {
            return this.treeService.getSingleTreeNode(nodeId, releaseNr).pipe(tap((gm => {
                const pid = pidFromGraphModelNode(gm);
                pid.releaseNr = releaseNr;
                setState(this.addRelease(pid));
            })));
        }
    }

    @Action(gmiActions.AugmentNewProcessWithPid)
    augmentProcessWithPid({ getState, setState }: StateContext<GraphModelInterfaceStateModel>, { payload: { graphModelId, tracking, label, position } }: gmiActions.AugmentNewProcessWithPid) {
        if (tracking.releaseNr) {
            return this.store.dispatch(new gmiActions.LoadReleasePid({ nodeId: tracking.id, releaseNr: tracking.releaseNr })).pipe(mergeMap(() => {
                const allReleases = getState().allReleases;
                const currentPid = allReleases.find(p => p.objectId === tracking.id && p.releaseNr === tracking.releaseNr);
                if (!currentPid) {
                    throw new Error('no such release pid found');
                }
                return this.store.dispatch(new ProcessingElementSearchResultSelected({ graphModelId: graphModelId, graphModelOrProcessInterface: currentPid, label: label, position: position }));
            }));
        } else {
            return this.store.dispatch(new LoadGraphModelContent({ id: tracking.id })).pipe(mergeMap(() => {
                const currentPid = getState().currentVersion[tracking.id];
                if (!currentPid) {
                    throw new Error('no such version pid found');
                }
                return this.store.dispatch(new ProcessingElementSearchResultSelected({ graphModelId: graphModelId, graphModelOrProcessInterface: currentPid, label: label, position: position }));
            }));
        }
    }

    @Action(LoadGraphModelDependencies)
    loadGraphModelDeps({ getState, setState }: StateContext<GraphModelInterfaceStateModel>, { payload: { dependencies } }: LoadGraphModelDependencies) {
        const pes = this.store.selectSnapshot(ProcessingElementState) as ProcessingElementStateModel;
        const gms = getState();
        const missingDeps = dependencies.filter(d => !GraphModelInterfaceState.findPidDirect(gms, pes, d));
        const actions = missingDeps.map(dep => {
            if (dep.tracking === 'FIXED') {
                return new LoadReleasePid({ nodeId: dep.ref, releaseNr: dep.releaseNr });
            }
            const trackingInfo = this.store.selectSnapshot(TreeNodeTrackingState.id(dep.ref));
            if (!trackingInfo) {
                return null;
            }
            switch (dep.tracking) {
                case 'CURRENT_VERSION':
                    return new LoadGraphModelContent({ id: dep.ref });
                case 'LATEST_RELEASE':
                    if (trackingInfo.releaseNr) {
                        return new LoadReleasePid({ nodeId: dep.ref, releaseNr: trackingInfo.releaseNr });
                    } else {
                        return new LoadGraphModelContent({ id: dep.ref });
                    }
            }
        });
        const filteredActions = actions.filter(a => a !== null);
        if (filteredActions.length) {
            return this.store.dispatch(filteredActions);
        } else {
            return of('done');
        }

    }





}
