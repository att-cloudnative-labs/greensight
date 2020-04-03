import { Component, OnInit, Output, EventEmitter, OnDestroy } from '@angular/core';
import * as trashActions from '@app/modules/cpt/state/trash.actions';
import { TreeNode } from '@app/modules/cpt/interfaces/tree-node';
import { TrashState } from '@app/modules/cpt/state/trash.state';
import { Store, Select, Actions, ofActionSuccessful } from '@ngxs/store';
import { Observable, combineLatest } from 'rxjs';
import * as Sifter from 'sifter';
import { SendFolderToTrash, SendGraphModelTemplateToTrash, SendGraphModelToTrash, SendSimulationToTrash, SendSimulationResultToTrash, SendForecastSheetToTrash } from '@app/modules/cpt/state/tree.actions';
import { untilDestroyed } from 'ngx-take-until-destroy';

@Component({
    selector: 'app-trash-search-filter',
    templateUrl: './trash-search-filter.component.html',
    styleUrls: ['./trash-search-filter.component.css']
})
export class TrashSearchFilterComponent implements OnInit, OnDestroy {
    @Output() searchResultsChange = new EventEmitter();
    @Select(TrashState.typeFilter) typeFilter$: Observable<string[]>;
    @Select(TrashState.searchString) searchString$: Observable<string>;
    @Select(TrashState.nodesOfTypes) filteredNodes$: Observable<TreeNode[]>;
    selectedTypes = [];
    filterOptions = [{ nodeType: 'FOLDER', name: 'Folder' },
    { nodeType: 'MODEL', name: 'Model' },
    { nodeType: 'MODELTEMPLATE', name: 'Model Template' },
    { nodeType: 'SIMULATION', name: 'Simulation' },
    { nodeType: 'SIMULATIONRESULT', name: 'Simulation Result' },
    { nodeType: 'FC_SHEET', name: 'Forecast Sheet' }];

    constructor(private store: Store, private actions$: Actions) { }

    ngOnInit() {
        /* Whenever the action to trash a node is made to the tree state,
        add that trashed node to the trashed nodes list in the trash state */
        this.actions$.pipe(ofActionSuccessful(SendFolderToTrash, SendGraphModelTemplateToTrash, SendGraphModelToTrash,
            SendSimulationToTrash, SendSimulationResultToTrash, SendForecastSheetToTrash),
            untilDestroyed(this)).subscribe(({ trashNode }) => {
                this.store.dispatch(new trashActions.AddTrashedNode(trashNode));
            });
        this.actions$.pipe(ofActionSuccessful(trashActions.RestoreButtonClicked), untilDestroyed(this)).subscribe(({ trashNode }) => {
            this.store.dispatch(new trashActions.RemoveTrashedNode(trashNode));
        });
        this.typeFilter$.subscribe(typeFilter => {
            for (const selectedType of typeFilter) {
                // get the label for each each selected type
                const filterOption = this.filterOptions.find(
                    filterOption => filterOption.nodeType === selectedType);
                if (filterOption !== undefined) {
                    this.selectedTypes.push(filterOption.name);
                }
            }
        });

        const combinedObservables = combineLatest(this.filteredNodes$, this.searchString$);
        combinedObservables.subscribe(
            ([nodes, searchString]) => {
                // TODO: move this functionality as it is to be resued in other search fields
                const sifter = new Sifter(nodes);
                const sifterResults = sifter.search(searchString, {
                    fields: ['name'],
                    sort: [{ field: 'name', direction: 'asc' }],
                });
                const searchResults = sifterResults.items.map(item => {
                    return nodes[item.id];
                });
                this.searchResultsChange.emit(searchResults);
            }
        );
    }

    ngOnDestroy() { }

    /**
     * determines the selected types based on the selected options from the dropdown list
     * and pushes the selected node types to the trash state
     * @param selectedFilters the labels of the the options that are selected in the dropdown
     */
    setSelectedFilters(selectedFilters: string[]) {
        const selectedTypes = [];
        for (const selected of selectedFilters) {
            const selectedType = this.filterOptions.find(x => x.name === selected);
            selectedTypes.push(selectedType.nodeType);
        }
        this.store.dispatch(new trashActions.UpdateTrashTypeFilter(selectedTypes));
    }

    /**
     * gets the current string from the search input field and pesists this string in the trash state
     */
    onSearchChange(event) {
        const newSearchString = event.target.value;
        this.store.dispatch(new trashActions.UpdateSearchString(newSearchString));
    }
}
