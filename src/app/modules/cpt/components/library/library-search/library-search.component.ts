import { OnInit, Component, Input } from '@angular/core';
import { Select } from '@ngxs/store';
import { TreeState } from '@app/modules/cpt/state/tree.state';
import { LibraryState } from '@app/modules/cpt/state/library.state';
import { TreeNode } from '@app/modules/cpt/interfaces/tree-node';
import { Observable, combineLatest } from 'rxjs';
import * as Sifter from 'sifter';
import { TreeService } from '@cpt/services/tree.service';
import { TreeNodeInfo } from '@cpt/interfaces/tree-node-tracking';

@Component({
    selector: 'app-library-search',
    templateUrl: './library-search.component.html',
    styleUrls: ['./library-search.component.css']
})
export class LibrarySearchComponent implements OnInit {
    @Select(TreeState.nonRootNodes) nodes$: Observable<TreeNode[]>;
    @Select(LibraryState.searchString) searchString$: Observable<string>;

    filteredNodes: TreeNodeInfo[] = [];
    constructor(private treeService: TreeService) { }

    ngOnInit() {
        this.searchString$.subscribe(sst => {
            if (sst.trim().length > 0) {
                this.treeService.search({ searchTerm: sst, nodeTypes: ['FC_SHEET', 'FOLDER', 'SIMULATION', 'MODEL'], page: 0, size: 50 }).subscribe(r => {
                    const sifter = new Sifter(r);
                    const sifterResults = sifter.search(sst, {
                        fields: ['name'],
                        sort: [{ field: 'name', direction: 'asc' }],
                    });
                    this.filteredNodes = sifterResults.items.map(item => {
                        return r[item.id];
                    });
                });
            } else {
                this.filteredNodes = [];
            }
        });
    }
}
