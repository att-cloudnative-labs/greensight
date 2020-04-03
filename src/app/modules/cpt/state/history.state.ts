import { State, Action, StateContext, Selector } from '@ngxs/store';
import { HistoryItem } from '@app/modules/cpt/models/history-item';
import { TreeService } from '@app/modules/cpt/services/tree.service';
import * as historyActions from '@app/modules/cpt/state/history.actions';
import { map, tap } from 'rxjs/operators';
import { TreeNodeVersion } from '@app/modules/cpt/interfaces/tree-node-version';
import { ReleaseService } from "@app/modules/cpt/services/release.service";
import { TreeNodeRelease } from "@app/modules/cpt/interfaces/tree-node-release";
import { patch, updateItem } from "@ngxs/store/operators";
import { combineLatest } from 'rxjs';
import { ReleaseCreated } from '@cpt/state/release.actions';



export class HistoryStateModel {
    public nodes: HistoryItem[];
    public versions: TreeNodeVersion[];
    public releases: TreeNodeRelease[];
    public loaded: boolean;
    public loading: boolean;
    public cachedNodes: { [nodeId: string]: HistoryItem[] };
    public currentNodeId: string;
}

@State<HistoryStateModel>({
    name: 'history',
    defaults: {
        nodes: [],
        loading: false,
        loaded: false,
        currentNodeId: undefined,
        versions: [],
        releases: [],
        cachedNodes: {}
    }
})

export class HistoryState {
    constructor(private treeService: TreeService, private releaseService: ReleaseService) { }

    @Selector()
    static hasLoaded(state: HistoryStateModel) {
        return state.loaded;
    }

    @Selector()
    static nodes(state: HistoryStateModel) {
        return state.nodes;
    }

    @Selector()
    static versions(state: HistoryStateModel) {
        return state.versions;
    }

    @Selector()
    static releases(state: HistoryStateModel): TreeNodeRelease[] {
        return state.releases;
    }

    @Selector()
    static combined(state: HistoryStateModel): { r: TreeNodeRelease[], v: TreeNodeVersion[] } {
        return { r: state.releases, v: state.versions };
    }

    @Action(historyActions.UpdateVersionDescription)
    updateVersionDescription({ patchState, getState, setState }: StateContext<HistoryStateModel>, { payload }: historyActions.UpdateVersionDescription) {
        return this.treeService.updateTreeNodeVersionDescription(payload.version.objectId, payload.version.versionId, { description: payload.description }).pipe(
            tap(() => {
                setState(patch({ versions: updateItem<TreeNodeVersion>(v => v.id == payload.version.id, { ...payload.version, description: payload.description }) }));
            })
        );
    }

    @Action(historyActions.UpdateReleaseDescription)
    updateReleaseDescription({ patchState, getState, setState }: StateContext<HistoryStateModel>, { payload }: historyActions.UpdateReleaseDescription) {
        return this.releaseService.updateRelease(payload.release.id, payload.description).pipe(
            tap(() => {
                setState(patch({ releases: updateItem<TreeNodeRelease>(r => r.id == payload.release.id, { ...payload.release, description: payload.description }) }));
            })
        );
    }


    @Action(ReleaseCreated)
    @Action(historyActions.GetHistory)
    loadHistoryNode({ patchState, getState }: StateContext<HistoryStateModel>,
        { payload }: historyActions.GetHistory) {
        patchState({ loading: true, loaded: false });
        return combineLatest(this.releaseService.getReleases(payload.id, true), this.treeService.getNodeVersionInfo(payload.id)).pipe(
            map(([releases, versions]) => {
                patchState({ loading: false, loaded: true, versions: versions, currentNodeId: payload.id, releases: releases });
            })
        );
    }
}
