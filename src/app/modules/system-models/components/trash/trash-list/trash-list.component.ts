import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Select, Store, Actions, ofActionSuccessful } from '@ngxs/store';
import { TrashState } from '@system-models/state/trash.state';
import { Observable } from 'rxjs';
import { TreeNode } from '@app/core_module/interfaces/tree-node';
import * as trashActions from '@system-models/state/trash.actions';
import * as libraryActions from '@system-models/state/library.actions';
import * as librarySearchResultActions from '@system-models/state/library-search-result.actions';
import { untilDestroyed } from 'ngx-take-until-destroy';

@Component({
    selector: 'app-trash-list',
    templateUrl: './trash-list.component.html',
    styleUrls: ['./trash-list.component.css']
})
export class TrashListComponent implements OnInit, OnDestroy {
    @Input() trashedNodes;
    @Select(TrashState.searchString) searchString$: Observable<string>;
    @Select(TrashState.selected) selected$: Observable<TreeNode>;
    constructor(private store: Store, private actions$: Actions) { }

    ngOnInit() {
        // deselect selected trash node if node in library is selected
        this.actions$.pipe(ofActionSuccessful(libraryActions.FolderClicked,
            libraryActions.GraphModelClicked, libraryActions.GraphModelTemplateClicked,
            librarySearchResultActions.FolderClicked, librarySearchResultActions.GraphModelClicked,
            librarySearchResultActions.GraphModelTemplateClicked), untilDestroyed(this)).subscribe(() => {
                this.store.dispatch(new trashActions.LibraryNodeClicked());
            });
    }

    ngOnDestroy() {

    }

    selectTrashedNode(selectedNode: TreeNode) {
        this.store.dispatch(new trashActions.TrashedNodeRowClicked(selectedNode));
    }

}
