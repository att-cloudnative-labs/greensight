import { Action, createSelector, State, StateContext, Store } from '@ngxs/store';
import { ReleaseService } from '@cpt/services/release.service';
import { TreeNodeRelease } from '@cpt/interfaces/tree-node-release';
import * as releaseActions from '@cpt/state/release.actions';
import { prepareReleaseOfTreeNode } from '@cpt/lib/release-ops';
import { catchError, map, tap } from 'rxjs/operators';
import { TreeState } from '@cpt/state/tree.state';
import {
    GraphModelReleaseFailedToPrepareException,
    GraphModelReleaseNeedsPinningException
} from '@cpt/state/release.actions';
import { TreeService } from '@cpt/services/tree.service';
import { of } from 'rxjs';
import { append, patch } from '@ngxs/store/operators';


export class ReleaseStateModel {
    public releases: TreeNodeRelease[] = [];
}

@State<ReleaseStateModel>({
    name: 'release',
    defaults: {
        releases: []
    }
})
export class ReleaseState {

    constructor(
        private releaseService: ReleaseService,
        private treeService: TreeService,
        private store: Store) { }


    static id(treeNodeId: string, releaseNr: number) {
        return createSelector(
            [ReleaseState],
            (state: ReleaseStateModel) => {
                return state.releases.find(release => release.id === treeNodeId && release.releaseNr === releaseNr);
            }
        );
    }

    @Action(releaseActions.ReleaseFetch)
    fetchRelease(ctx: StateContext<ReleaseStateModel>, { payload: { nodeId, releaseNr } }: releaseActions.ReleaseFetch) {
        const releases = ctx.getState().releases;
        const release = releases.find(r => r.objectId === nodeId && r.releaseNr === releaseNr);
        if (release) {
            return of(release);
        } else {
            return this.treeService.getSingleTreeNode(nodeId, releaseNr).pipe(map(tn => {
                const tnr: TreeNodeRelease = {
                    currentUserAccessPermissions: tn.currentUserAccessPermissions,
                    // fixme: real release id needed
                    id: tn.id,
                    objectId: tn.id,
                    ownerId: tn.ownerId,
                    ownerName: tn.ownerName,
                    timestamp: '',
                    versionId: tn.version,
                    treeNode: tn,
                    releaseNr: releaseNr
                };
                tnr.treeNode.releaseNr = releaseNr;
                ctx.setState(patch({ releases: append([tnr]) }));
            }));
        }
    }

    @Action(releaseActions.ReleaseCreateClicked)
    @Action(releaseActions.ReleaseAddedPinning)
    prepareRelease(ctx: StateContext<ReleaseStateModel>, { payload: { nodeId, version, pinningDecisions } }: releaseActions.ReleaseAddedPinning) {
        const nodes = this.store.selectSnapshot(TreeState.nodes);
        const toBeReleasedNode = nodes.find(n => n.id === nodeId && n.version === version);
        if (!toBeReleasedNode) {
            throw new Error('no such treenode to release');
        }
        return prepareReleaseOfTreeNode(this.store, toBeReleasedNode, pinningDecisions ? pinningDecisions : []).pipe(
            map(release => {
                return this.store.dispatch(new releaseActions.ReleasePrepared({ nodeId: nodeId, version: version, release: release }));
            }),
            catchError(e => {
                if (e instanceof GraphModelReleaseNeedsPinningException) {
                    return this.store.dispatch(new releaseActions.ReleaseNeedsPinning({ nodeId: nodeId, version: version, toBePinnedProcesses: e.payload.toBePinnedProcesses, pinningSuggestions: e.payload.pinningSuggestions }));
                }
                if (e instanceof GraphModelReleaseFailedToPrepareException) {
                    return this.store.dispatch(new releaseActions.ReleaseFailedToPrepare({ nodeId: nodeId, version: version, failedProcesses: e.payload.failedProcesses }));
                }
            })
        );
    }

    @Action(releaseActions.ReleaseAddedDescription)
    createRelease(ctx: StateContext<ReleaseStateModel>, { payload: { nodeId, version, release, description } }: releaseActions.ReleaseAddedDescription) {
        return this.releaseService.createRelease({ ...release, description: description }).pipe(
            tap(r => {
                this.store.dispatch(new releaseActions.ReleaseCreated({ id: nodeId, release: r }));
            })
        );
    }
}
