import { State, Selector, Action, StateContext, Store, createSelector } from '@ngxs/store';
import * as trashActions from './trash.actions';

import { TreeService } from '@app/modules/cpt/services/tree.service';
import { tap } from 'rxjs/operators';

import { ReleaseCreated } from '@cpt/state/release.actions';
import { TreeNodeInfo } from '@cpt/interfaces/tree-node-tracking';
import { LoadTrackingInfo } from '@cpt/state/tree-node-tracking.actions';
import { CreatedTreeNode, CreateTreeNode } from '@cpt/state/tree.actions';
import { RenameFolderCommitted } from '@cpt/state/library.actions';


export class TreeNodeTrackingStateModel {
    public tracking: TreeNodeInfo[] = [];
    public lastUpdate: Date;
    public loaded: boolean;
}

@State<TreeNodeTrackingStateModel>({
    name: 'treeNodeTracking',
    defaults: {
        tracking: [],
        lastUpdate: new Date(0),
        loaded: false,
    }
})
export class TreeNodeTrackingState {

    constructor(
        private treeService: TreeService) { }

    @Selector()
    static all(state: TreeNodeTrackingStateModel) {
        return state.tracking;
    }

    @Selector()
    static graphModels(state: TreeNodeTrackingStateModel) {
        return state.tracking.filter(nti => nti.type === 'MODEL');
    }

    @Selector()
    static forecastSheets(state: TreeNodeTrackingStateModel) {
        return state.tracking.filter(nti => nti.type === 'FC_SHEET');
    }

    @Selector()
    static byId(state: TreeNodeTrackingStateModel) {
        return (id: string) => {
            return state.tracking.find(tni => tni.id === id);
        };
    }

    static id(treeNodeId: string) {
        return createSelector(
            [TreeNodeTrackingState],
            (state: TreeNodeTrackingStateModel) => {
                return state.tracking.find(tnti => tnti.id === treeNodeId);
            }
        );
    }


    @Action(LoadTrackingInfo)
    @Action(trashActions.RemoveTrashedNode)
    @Action(trashActions.AddTrashedNode)
    @Action(ReleaseCreated)
    @Action(CreatedTreeNode)
    @Action(CreateTreeNode)
    @Action(RenameFolderCommitted)
    loadTracking(
        { patchState }: StateContext<TreeNodeTrackingStateModel>,
    ) {
        return this.treeService.getTrackingInfo().pipe(tap(ti => {
            patchState({ tracking: ti, lastUpdate: this.treeService.getLastTrackingUpdate(), loaded: true });
        }));
    }

}
