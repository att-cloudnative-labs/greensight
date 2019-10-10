import { OnInit, Component, Input } from '@angular/core';
import { Select } from '@ngxs/store';
import { TreeState } from '@system-models/state/tree.state';
import { LibraryState } from '@system-models/state/library.state';
import { TreeNode } from '@app/core_module/interfaces/tree-node';
import { Observable, combineLatest } from 'rxjs';
import * as Sifter from 'sifter';

@Component({
    selector: 'app-library-search',
    templateUrl: './library-search.component.html',
    styleUrls: ['./library-search.component.css']
})
export class LibrarySearchComponent implements OnInit {
    @Select(TreeState.nonRootNodes) nodes$: Observable<TreeNode[]>;
    @Select(LibraryState.searchString) searchString$: Observable<string>;

    filteredNodes: TreeNode[];
    constructor() { }

    ngOnInit() {
        const combinedObservables = combineLatest(this.nodes$, this.searchString$);
        combinedObservables.subscribe(
            ([nodes, searchString]) => {
                const sifter = new Sifter(nodes);
                const sifterResults = sifter.search(searchString, {
                    fields: ['name'],
                    sort: [{ field: 'name', direction: 'asc' }],
                });
                this.filteredNodes = sifterResults.items.map(item => {
                    return nodes[item.id];
                });
            }
        );
    }
}
