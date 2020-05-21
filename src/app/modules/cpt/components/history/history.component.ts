import { Component, OnInit, OnDestroy, HostBinding } from '@angular/core';
import { Select, Store, ofActionSuccessful, Actions } from '@ngxs/store';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { TreeNode } from '@app/modules/cpt/interfaces/tree-node';
import { HElement, HistoryItem } from '@app/modules/cpt/models/history-item';
import { Observable } from 'rxjs';
import * as historyActions from '@app/modules/cpt/state/history.actions';
import { HistoryState } from '@app/modules/cpt/state/history.state';
import { Utils } from '@app/modules/cpt/lib/utils';
import { SelectionState, Selection } from '@app/modules/cpt/state/selection.state';
import { TreeNodeVersion } from '@app/modules/cpt/interfaces/tree-node-version';
import { TreeNodeRelease } from '@app/modules/cpt/interfaces/tree-node-release';
import { GraphModel, Process, SimulationConfiguration } from '@cpt/capacity-planning-simulation-types/lib';
import { TreeState } from '@app/modules/cpt/state/tree.state';
import { filter, map, switchMap } from 'rxjs/operators';


interface SelectionWObject extends Selection {
    object: TreeNode;
}


@Component({
    selector: 'app-history',
    templateUrl: './history.component.html',
    styleUrls: ['./history.component.css']
})

export class HistoryComponent implements OnInit, OnDestroy {
    @Select(HistoryState.nodes) historyNodes$: Observable<HistoryItem[]>;
    @Select(HistoryState.combined) history$: Observable<{ v: TreeNodeVersion[], r: TreeNodeRelease[] }>;
    @Select(SelectionState) selection$: Observable<Selection[]>;
    @Select(HistoryState.hasLoaded) historyHasLoaded$: Observable<boolean>;
    @HostBinding('class.isLoading') historyIsLoading = false;

    filterOptions = [
        { name: 'Versions' },
        { name: 'Releases' }
    ];
    selectedFilter = this.filterOptions.map(fo => fo.name);
    selectedElement: HElement;
    historyItems: HistoryItem[] = [];
    displayFields = ['action'];
    searchString: string = "";

    constructor(private store: Store) { }

    getSelectionNodeId(s: Selection) {
        return s.type === 'TreeNode' ? s.id : s.context;
    }

    selectedVersionChanged(el1: HElement, el2: HElement): boolean {
        if (el1.type == 'SIMULATION' || el1.type == 'PROCESS') {
            if (el2.type == 'SIMULATION' || el2.type == 'PROCESS') {
                return el1.versionId !== el2.versionId;
            }
        }
        return false;
    }

    ngOnInit() {
        this.historyHasLoaded$.subscribe(historyHasLoaded => this.historyIsLoading = !historyHasLoaded);

        const getNodeForId = (id: string) => this.store.select(TreeState.nodeById).pipe(map(byId => byId(id)));
        const getNodeForSelection = (selection: Selection) => getNodeForId(this.getSelectionNodeId(selection)).pipe(map(tn => ({ tn: tn, selection: selection })));

        this.selection$.pipe(
            untilDestroyed(this),
            filter(selections => selections.length === 1),
            map(selections => selections[0]),
            switchMap(selection => getNodeForSelection(selection))).subscribe(({ tn, selection }) => {
                const curElement: HElement = this.extractHistoryElement({ ...selection, object: tn });

                if (curElement) {

                    if (!this.selectedElement || (curElement.nodeId !== this.selectedElement.nodeId || curElement.type !== this.selectedElement.type || this.selectedVersionChanged(curElement, this.selectedElement))) {
                        this.store.dispatch(new historyActions.GetHistory({ id: curElement.nodeId }));
                        this.selectedElement = curElement;
                        this.selectedFilter = ['Releases'];
                        if (this.selectedElement.type === 'GRAPH_MODEL' || this.selectedElement.type === 'FC_SHEET') {
                            this.selectedFilter.push('Versions');
                        }
                        this.searchString = '';
                    }

                } else {
                    this.historyItems = [];
                    this.selectedElement = null;
                }

            });


        this.history$.pipe(untilDestroyed(this)).subscribe((history) => {
            this.historyItems = [];
            const versions = history.v;
            const releases = history.r;
            for (let i = 0; i < versions.length; i++) {
                const v = versions[i];
                this.historyItems.push({
                    time: Utils.convertUTCToUserTimezone(v.timestamp),
                    user: v.ownerName,
                    action: v.description ? v.description : v.versionId === 0 ? 'Created' : '',
                    icon: 'fa fa-file',
                    currentUserAccessPermissions: v.currentUserAccessPermissions,
                    version: v,
                    element: this.selectedElement,
                    timestamp: v.timestamp

                });
            }
            for (let i = 0; i < releases.length; i++) {
                const r = releases[i];
                this.historyItems.push({
                    time: Utils.convertUTCToUserTimezone(r.timestamp),
                    user: r.ownerName,
                    action: 'Published Release #' + r.releaseNr,
                    icon: 'fa fa-file-archive',
                    currentUserAccessPermissions: r.currentUserAccessPermissions,
                    version: null,
                    release: r,
                    element: this.selectedElement,
                    timestamp: r.timestamp
                });
            }
            this.historyItems.sort((h1, h2) => h2.timestamp.localeCompare(h1.timestamp));
        });
    }

    extractHistoryElement(s: SelectionWObject): HElement {
        if (s && s.object) {
            if (s.type === 'TreeNode' && s.object.type === 'MODEL') {
                return {
                    type: 'GRAPH_MODEL',
                    nodeId: s.id,
                    nodeName: s.object.name
                };
            }
            if ((s.type === 'TreeNode' || s.type === 'VariableCell') && s.object.type === 'FC_SHEET') {
                return {
                    type: 'FC_SHEET',
                    nodeId: s.object.id,
                    nodeName: s.object.name,
                    versionId: String(s.object.version)
                }
            }
            if (s.type === 'Process' && s.object.type === 'MODEL' && s.object.content) {
                // for now don't show process history. just keep the parent model info up.
                return {
                    type: 'GRAPH_MODEL',
                    nodeId: s.object.id,
                    nodeName: s.object.name
                };
            }
        }
        return null;
    }

    ngOnDestroy() { }

    enableUserInput() {

    }

    disableUserInput() {

    }

    isFilteredForDisplay(hi: HistoryItem): boolean {
        const itemType = !hi.release ? 'Versions' : 'Releases';
        const filtered = this.selectedFilter.find(f => f === itemType) != null;
        if (filtered) {
            if (this.searchString.trim().length > 0 && hi.action) {
                return hi.action.toLowerCase().includes(this.searchString.trim().toLowerCase());
            }
            return true;
        }
        return false;

    }

    filterSelectionUpdated(selectionsEvent) {
        console.log(selectionsEvent);
        this.selectedFilter = selectionsEvent;
    }

    isSelectedNodeATreeNode(): boolean {
        return !!this.selectedElement;
    }


    get breakpoints() {
        return {
            100: ['icon', 'action'],
            300: ['icon', 'time', 'action'],
            400: ['icon', 'time', 'action', 'user'],
        };
    }

    sizeChanged({ width, height }) {
        const keys = Object.keys(this.breakpoints).map(Number);
        if (width > Math.min(...keys)) {
            const availableWidths = keys.filter(x => x <= width);
            const widthKey = Math.max(...availableWidths);

            this.displayFields = this.breakpoints[widthKey];

        } else {
            this.displayFields = ['icon'];
        }
    }


}
