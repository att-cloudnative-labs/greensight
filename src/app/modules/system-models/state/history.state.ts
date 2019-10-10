import { State, Action, StateContext, Selector } from '@ngxs/store';
import { HistoryItem } from '@system-models/models/history-item';
import { TreeService } from '@app/core_module/service/tree.service';
import * as historyActions from '@system-models/state/history.actions';
import { map } from 'rxjs/operators';
import { TrashStateModel } from '@system-models/state/trash.state';
import { patch, append, removeItem, insertItem, updateItem } from '@ngxs/store/operators';


export class HistoryStateModel {
    public nodes: HistoryItem[];
    public loaded: boolean;
    public loading: boolean;
    public searchString: string;
    public cachedNodes: { [nodeId: string]: HistoryItem[] };
}

@State<HistoryStateModel>({
    name: 'history',
    defaults: {
        nodes: [],
        loading: false,
        loaded: false,
        searchString: '',
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
    static searchString(state: HistoryStateModel) {
        return state.searchString;
    }



    @Action(historyActions.GetHistory)
    loadHistoryNode({ patchState, getState }: StateContext<HistoryStateModel>,
        { payload }: historyActions.GetHistory) {
        let o = getState();
        if (o.cachedNodes[payload.id]) {
            patchState({ nodes: o.cachedNodes[payload.id] });
            return this.treeService
                .getNodeHistory(payload)
                .pipe(
                    map((response: any) => {
                        let o = getState();
                        let history = response.data.previousVersions as HistoryItem[];
                        let cachedNode = o.cachedNodes[payload.id];
                        let historyVersion = history[history.length - 1].versionId;
                        let cachedVersion = cachedNode[cachedNode.length - 1].versionId
                        if (historyVersion !== cachedVersion) {
                            patchState({
                                nodes: history,
                                cachedNodes: { ...o.cachedNodes, [payload.id]: response.data.previousVersions as HistoryItem[] }
                            });
                        }
                    })
                );
        } else {
            patchState({ loading: true, loaded: false });
            return this.treeService
                .getNodeHistory(payload)
                .pipe(
                    map((response: any) => {
                        let o = getState();
                        patchState({
                            nodes: response.data.previousVersions as HistoryItem[],
                            loaded: true,
                            loading: false,
                            cachedNodes: { ...o.cachedNodes, [payload.id]: response.data.previousVersions as HistoryItem[] }
                        });
                    })
                );
        }
    }
}
