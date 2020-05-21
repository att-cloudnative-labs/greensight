import { OnInit, Component, Input } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { TreeState } from '@app/modules/cpt/state/tree.state';
import { LibraryState } from '@app/modules/cpt/state/library.state';
import { TreeNode } from '@app/modules/cpt/interfaces/tree-node';
import { Observable } from 'rxjs';
import * as Sifter from 'sifter';
import { TreeService } from '@cpt/services/tree.service';
import { TreeNodeInfo } from '@cpt/interfaces/tree-node-tracking';
import { debounceTime, distinct, mergeMap } from 'rxjs/operators';

@Component({
    selector: 'app-library-search',
    templateUrl: './library-search.component.html',
    styleUrls: ['./library-search.component.css']
})
export class LibrarySearchComponent implements OnInit {
    @Select(TreeState.nonRootNodes) nodes$: Observable<TreeNode[]>;
    @Select(LibraryState.searchString) searchString$: Observable<string>;

    filteredNodes: TreeNodeInfo[] = [];
    constructor(private treeService: TreeService, private store: Store) { }

    ngOnInit() {
        this.searchString$.pipe(debounceTime(200)).pipe(mergeMap((s) => this.store.selectOnce(LibraryState.searchResults(s)))).subscribe(searchResults => {
            this.filteredNodes = searchResults ? searchResults : [];
        });
    }
}
