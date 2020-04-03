import { Component, OnInit, HostBinding, OnDestroy } from '@angular/core';
import { Select, Store, ofActionSuccessful, Actions } from '@ngxs/store';
import { TreeState } from '@app/modules/cpt/state/tree.state';
import { LibraryState } from '@app/modules/cpt/state/library.state';
import { TreeNode } from '@app/modules/cpt/interfaces/tree-node';
import * as libraryActions from '@app/modules/cpt/state/library.actions';
import * as treeActions from '@app/modules/cpt/state/tree.actions';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Utils } from '@app/modules/cpt/lib/utils';
import { v4 as uuid } from 'uuid';
import { TrashedNodeRowClicked } from '../../state/trash.actions';
import { untilDestroyed } from 'ngx-take-until-destroy';

@Component({
    selector: 'app-library',
    templateUrl: './library.component.html',
    styleUrls: ['./library.component.css']
})
export class LibraryComponent implements OnInit, OnDestroy {
    @Select(LibraryState.searchString) searchString$: Observable<string>;
    @Select(TreeState.hasLoaded) treeHasLoaded$: Observable<boolean>;
    topLevelNodes$: Observable<TreeNode[]>;
    @HostBinding('class.isLoading') treeIsLoading = false;

    constructor(private store: Store, private actions$: Actions) { }

    ngOnInit() {
        this.store.dispatch(new treeActions.LoadTree());
        this.actions$.pipe(ofActionSuccessful(TrashedNodeRowClicked),
            untilDestroyed(this)).subscribe(() => {
                this.store.dispatch(new libraryActions.TrashRowClicked());
            });
        this.treeHasLoaded$.subscribe(treeHasLoaded => this.treeIsLoading = !treeHasLoaded);
        this.topLevelNodes$ = this.store
            .select(TreeState.childNodes)
            .pipe(
                map(byId => byId('root'))
            );
    }

    ngOnDestroy() {
        this.store.dispatch(new libraryActions.LibraryDestroyed());
    }

    enableUserInput() {

    }

    disableUserInput() {

    }

    addNewFolder() {
        this.store.dispatch(new treeActions.CreateTreeNode({
            id: uuid(),
            name: 'New Folder',
            parentId: 'root',
            type: 'FOLDER',
            ownerName: Utils.getUserName()
        }));
    }


    openTrashTab() {
        this.store.dispatch(new libraryActions.TrashButtonClicked());
    }

    scrollToNode(nodeElement) {
        nodeElement.nativeElement.scrollIntoView({
            block: 'nearest'
        });
    }
}
