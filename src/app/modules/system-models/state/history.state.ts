import { State, Action, StateContext, Selector } from '@ngxs/store';
import { HistoryItem } from '@system-models/models/history-item';
import { TreeService } from '@app/core_module/service/tree.service';
import * as historyActions from '@system-models/state/history.actions';
import { map } from 'rxjs/operators';
import { TrashStateModel } from '@system-models/state/trash.state';
import { patch, append, removeItem, insertItem, updateItem } from '@ngxs/store/operators';
import { TreeNodeVersion } from '@app/core_module/interfaces/tree-node-version';


export class HistoryStateModel {
    public nodes: HistoryItem[];
    public versions: TreeNodeVersion[];
    public loaded: boolean;
    public loading: boolean;
    public cachedNodes: { [nodeId: string]: HistoryItem[] };
}

@State<HistoryStateModel>({
    name: 'history',
    defaults: {
        nodes: [],
        loading: false,
        loaded: false,
        versions: [],
        cachedNodes: {}
    }
})

export class HistoryState {
    constructor(private treeService: TreeService) { }

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




    @Action(historyActions.GetHistory)
    loadHistoryNode({ patchState, getState }: StateContext<HistoryStateModel>,
        { payload }: historyActions.GetHistory) {
        let o = getState();
        patchState({ loading: true, loaded: false });
        return this.treeService.getNodeVersionInfo(payload.id).pipe(
            map((versions: TreeNodeVersion[]) => {
                patchState({ loading: false, loaded: true, versions: versions });
            })
        );
    }
}
