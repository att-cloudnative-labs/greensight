
import { Component, OnInit, HostBinding, OnDestroy } from '@angular/core';
import { Store, Select } from '@ngxs/store';
import * as trashActions from '@app/modules/cpt/state/trash.actions';
import { TrashState } from '@app/modules/cpt/state/trash.state';
import { Observable } from 'rxjs';
import { TreeNode } from '@app/modules/cpt/interfaces/tree-node';

@Component({
    selector: 'app-trash',
    templateUrl: './trash.component.html',
    styleUrls: ['./trash.component.css']
})

export class TrashComponent implements OnInit, OnDestroy {
    @Select(TrashState.hasLoaded) trashHasLoaded$: Observable<boolean>;
    @HostBinding('class.isLoading') trashIsLoading = false;
    searchResults = [];
    @Select(TrashState.selected) selected$: Observable<TreeNode>;
    selectedTrashedNode;

    constructor(private store: Store) { }

    ngOnInit() {
        this.trashHasLoaded$.subscribe(trashHasLoaded => this.trashIsLoading = !trashHasLoaded);
        this.store.dispatch(new trashActions.LoadTrash());
    }

    /**
     * Deselect the selected trash node when trash panel closes
     */
    ngOnDestroy() {
        this.store.dispatch(new trashActions.TrashPanelClosed());
    }

    enableUserInput() {

    }

    disableUserInput() {

    }

    setSearchResults(results) {
        this.searchResults = results;
        this.selected$.subscribe(selected => {
            this.selectedTrashedNode = selected;
        });
    }

    onRestoreClicked() {
        this.store.dispatch(new trashActions.RestoreButtonClicked(this.selectedTrashedNode));
    }
}
