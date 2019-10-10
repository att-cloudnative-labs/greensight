import { Component, Input, OnInit } from '@angular/core';
import { TreeNode } from '@app/core_module/interfaces/tree-node';
import { Store, Select } from '@ngxs/store';
import * as librarySearchResultActions from '@system-models/state/library-search-result.actions';
import { Observable } from 'rxjs';
import { LibraryState } from '@system-models/state/library.state';
import { TreeState } from '@system-models/state/tree.state';
import { map } from 'rxjs/operators';




@Component({
    selector: 'app-library-search-result',
    templateUrl: './library-search-result.component.html',
    styleUrls: ['./library-search-result.component.css']
})
export class LibrarySearchResultsComponent implements OnInit {
    @Input() node: TreeNode;
    @Input() filteredNodes;
    @Select(LibraryState.searchString) searchString$: Observable<string>;

    isDoubleClick = false;
    constructor(private store: Store) { }

    ngOnInit() { }

    get nodeName() {
        if (this.node.parentId !== 'root') {
            let fullName = '';
            this.store.select(TreeState.nodeFullPathById).pipe(map(byId => byId(this.node.id))).forEach(node => { fullName = node; });
            return fullName;
        } else {
            return this.node.name;
        }
    }

    get isFolder() {
        return this.node.type === 'FOLDER';
    }

    get isGraphModel() {
        return this.node.type === 'MODEL';
    }

    get isGraphModelTemplate() {
        return this.node.type === 'MODELTEMPLATE';
    }

    get isSimulation() {
        return this.node.type === 'SIMULATION';
    }

    get isSimulationResult() {
        return this.node.type === 'SIMULATIONRESULT';
    }

    get showLock() {
        return this.node.type === 'FOLDER' && this.node.accessControl === 'PRIVATE';
    }

    itemClicked() {
        this.isDoubleClick = false;
        // Wait to see if a double click event has occurred
        setTimeout(() => {
            if (this.isDoubleClick) {
                return;
            } else {
                switch (this.node.type) {
                    case 'FOLDER':
                        this.store.dispatch(new librarySearchResultActions.FolderClicked(this.node));
                        break;
                    case 'MODEL':
                        this.store.dispatch(new librarySearchResultActions.GraphModelClicked(this.node));
                        break;
                    case 'MODELTEMPLATE':
                        this.store.dispatch(new librarySearchResultActions.GraphModelTemplateClicked(this.node));
                        break;
                    case 'SIMULATION':
                        this.store.dispatch(new librarySearchResultActions.SimulationClicked(this.node));
                        break;
                    case 'SIMULATIONRESULT':
                        this.store.dispatch(new librarySearchResultActions.SimulationResultClicked(this.node));
                        break;
                }
            }
        }, 200);
    }

    itemDoubleClicked() {
        this.isDoubleClick = true;

        if (this.node.type === 'FOLDER') {
            this.store.dispatch(new librarySearchResultActions.FolderDoubleClicked(this.node));
        } else if (this.node.type === 'MODEL') {
            this.store.dispatch(new librarySearchResultActions.GraphModelDoubleClicked(this.node));
        } else if (this.node.type === 'MODELTEMPLATE') {
            this.store.dispatch(new librarySearchResultActions.GraphModelTemplateDoubleClicked(this.node));
        } else if (this.node.type === 'SIMULATION') {
            this.store.dispatch(new librarySearchResultActions.SimulationDoubleClicked(this.node));
        } else if (this.node.type === 'SIMULATIONRESULT') {
            this.store.dispatch(new librarySearchResultActions.SimulationResultDoubleClicked(this.node));
        }
    }
}
