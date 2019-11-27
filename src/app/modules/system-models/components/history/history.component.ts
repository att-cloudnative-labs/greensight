import { Component, OnInit, OnDestroy, HostBinding } from '@angular/core';
import { Select, Store, ofActionSuccessful, Actions } from '@ngxs/store';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { TreeState } from '@system-models/state/tree.state';
import { TreeNode } from '@app/core_module/interfaces/tree-node';
import { HistoryItem } from '@system-models/models/history-item';
import { Observable } from 'rxjs';
import * as historyActions from '@system-models/state/history.actions';
import { HistoryState } from '@system-models/state/history.state';
import { Utils } from '@app/utils_module/utils';
import { SelectionState } from '@system-models/state/selection.state';
import * as treeActions from '@system-models/state/tree.actions';
import * as graphControlBarActions from '@system-models/state/graph-control-bar.actions';
import { TrashState } from '@system-models/state/trash.state';
import { TreeNodeVersion } from '@app/core_module/interfaces/tree-node-version';

@Component({
    selector: 'app-history',
    templateUrl: './history.component.html',
    styleUrls: ['./history.component.css']
})

export class HistoryComponent implements OnInit, OnDestroy {
    @Select(HistoryState.nodes) historyNodes$: Observable<TreeNodeVersion[]>;
    @Select(HistoryState.versions) versions$: Observable<TreeNodeVersion[]>;
    @Select(SelectionState.withNodesContext) selection$: Observable<any>;
    @Select(HistoryState.hasLoaded) historyHasLoaded$: Observable<boolean>;
    @HostBinding('class.isLoading') historyIsLoading = false;
    private _currentSelected;

    filterOptions = [{ name: 'Versions' },
    { name: 'Releases' },
    { name: 'References' },
    { name: 'Simulations' }];
    selectedNode: TreeNode;
    historyItems: HistoryItem[] = [];
    displayFields = ['action'];
    historyResults = [];

    constructor(private store: Store, private actions$: Actions) { }

    ngOnInit() {
        this.historyHasLoaded$.subscribe(historyHasLoaded => this.historyIsLoading = !historyHasLoaded);

        this.selection$.pipe(untilDestroyed(this)).subscribe(selection => {
            // for now only take first
            const selected = selection[0];
            let ignoreUpdate = false;
            if (this.selectedNode && selected && selected.type !== 'TreeNode' && selected.context === this.selectedNode.id) {
                ignoreUpdate = true;
            }
            if (!(selected && selected.object && ((this.selectedNode && selected.object.id != this.selectedNode.id) || !this.selectedNode))) {
                ignoreUpdate = true;
            }

            if (!ignoreUpdate) {
                this.selectedNode = selected.object;
                this.extractHistoryItems();
            }
        });

        this.actions$
            .pipe(ofActionSuccessful(graphControlBarActions.GraphModelVersionCommentCommitted))
            .subscribe((node) => {
                if (node.payload.id === this.selectedNode.id) {
                    this.store.dispatch(new historyActions.GetHistory(this.selectedNode));
                }
            });

        this.versions$.pipe(untilDestroyed(this)).subscribe((versions: TreeNodeVersion[]) => {
            this.historyItems = [];
            for (let i = 0; i < versions.length; i++) {
                const v = versions[i];
                this.historyItems.push({
                    time: Utils.convertUTCToUserTimezone(v.timestamp),
                    user: v.userName,
                    action: v.versionId === 1 ? 'Created' : v.comment
                });
            }
        });
    }

    ngOnDestroy() { }

    enableUserInput() {

    }

    disableUserInput() {

    }

    extractHistoryItems() {
        if (this.isSelectedNodeATreeNode()) {
            this.store.dispatch(new historyActions.GetHistory(this.selectedNode));

        }
    }

    get breakpoints() {
        return {
            350: ['action'],
            400: ['action', 'user'],
            500: ['action', 'icon', 'user'],
            600: ['action', 'time', 'icon', 'user']
        };
    }

    sizeChanged({ width, height }) {
        const keys = Object.keys(this.breakpoints).map(Number);
        if (width > Math.min(...keys)) {
            const availableWidths = keys.filter(x => x <= width);
            const widthKey = Math.max(...availableWidths);

            this.displayFields = this.breakpoints[widthKey];

        } else {
            this.displayFields = ['action'];
        }
    }

    isSelectedNodeATreeNode() {
        return (this.selectedNode && (this.selectedNode.type === 'FOLDER' || this.selectedNode.type === 'MODEL' || this.selectedNode.type === 'MODELTEMPLATE' || this.selectedNode.type === 'SIMULATION' || this.selectedNode.type === 'SIMULATIONRESULT'));
    }
}
