import {
    Component,
    OnInit,
    ViewChildren,
    QueryList,
    AfterViewInit,
    Output,
    EventEmitter,
    Input,
    OnDestroy
} from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { ProcessingElementState } from '@system-models/state/processing-element.state';
import { TreeState } from '@system-models/state/tree.state';
import { TreeNode } from '@app/core_module/interfaces/tree-node';
import { Observable, combineLatest } from 'rxjs';
import * as Sifter from 'sifter';
import { GraphSearchResultComponent } from './graph-search-result/graph-search-result.component';
import { ActiveDescendantKeyManager } from '@angular/cdk/a11y';
import { ENTER, UP_ARROW, DOWN_ARROW } from '@angular/cdk/keycodes';
import { map, tap } from 'rxjs/operators';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { ProcessInterfaceDescription } from '@cpt/capacity-planning-simulation-types/lib';

@Component({
    selector: 'app-graph-processing-element-search',
    templateUrl: './graph-processing-element-search.component.html',
    styleUrls: ['./graph-processing-element-search.component.css']
})
export class GraphProcessingElementSearchComponent implements OnInit, AfterViewInit, OnDestroy {
    @Select(ProcessingElementState.pids) pid$: Observable<ProcessInterfaceDescription[]>;
    @ViewChildren(GraphSearchResultComponent) items: QueryList<GraphSearchResultComponent>;
    @Input() placeholder = 'Add...';

    @Input() isControlBar = false;
    // Displays the name of the selected result in the input field
    @Input() fillField = false;
    @Input() graphModel: TreeNode;
    @Input() simulation;
    @Output() resultSelected = new EventEmitter();
    showSearchResults = false;
    @Input() searchString = '';
    searchResults = [];
    graphsAndProcessingElements: ProcessInterfaceDescription[] = [];
    graphModelIdsForFiltering = [];
    currentParentId: string;
    private keyManager: ActiveDescendantKeyManager<GraphSearchResultComponent>;

    constructor(private store: Store) { }

    ngAfterViewInit() {
        // sets up keyboard navigation for result list
        this.keyManager = new ActiveDescendantKeyManager(this.items).withWrap();
    }

    /**
     * gets the graph models and processing elements from their respective states
     * and combines them into an array
     */
    ngOnInit() {
        this.pid$.pipe(untilDestroyed(this)).subscribe(pids => {
            this.graphsAndProcessingElements = pids;
            const currentGraphModelNode = this.graphsAndProcessingElements.find(element => element.objectId === this.graphModel.id);
            if (currentGraphModelNode) {
                this.currentParentId = currentGraphModelNode.parentId;
                // exclude the node itself
                this.graphsAndProcessingElements = this.graphsAndProcessingElements.filter(element => element.objectType !== this.graphModel.id);
                // exclude circular dependent graphs
                const graphModels = this.graphsAndProcessingElements.filter(element => element.implementation && element.implementation === 'GRAPH_MODEL');
                this.graphModelIdsForFiltering = [];
                this.findDependentGraphModelIds(graphModels, [this.graphModel.id]);
            }
        });

    }

    ngOnDestroy() { }

    navigateList(event) {
        if (event.keyCode === ENTER) {
            if (this.graphModelIdsForFiltering.indexOf(this.keyManager.activeItem.item.objectId) > -1 && this.isControlBar) {
                return false;
            } else {
                this.onSelectResult(this.keyManager.activeItem.item);
                this.closeSearch();
            }
        } else if (event.keyCode === UP_ARROW || event.keyCode === DOWN_ARROW) {
            this.keyManager.onKeydown(event);
            this.keyManager.activeItem.resultElement.nativeElement.scrollIntoView({ block: 'nearest' });
        }
    }

    /**
     * Clears the search results and hides the search result list dropdown
     */
    closeSearch() {
        this.showSearchResults = false;
        this.searchResults = [];
        if (this.isControlBar) {
            this.searchString = '';
        }
    }

    /**
     * Displays initial list when user focus to the input search
     * Performs a ranked search on the processing elements and graph models to find results that
     * best match the value in the search input field
     * @param event the input event where the input field's string can be retrieved
     */
    searchList(event) {
        if (event.keyCode !== ENTER && event.keyCode !== DOWN_ARROW && event.keyCode !== UP_ARROW) {
            this.showSearchResults = true;
            const sifter = new Sifter(this.graphsAndProcessingElements);
            const sifterResults = sifter.search(this.searchString, {
                fields: ['name'],
                sort: [{ field: 'name', direction: 'asc' }],
            });
            const searchResultsRough = sifterResults.items.map(item => {
                return this.graphsAndProcessingElements[item.id];
            });
            const processEls = searchResultsRough.filter(res => res.implementation === 'PROCESSING_ELEMENT');

            // FIXME: the parentId is currently not available
            const graphsUnderSameFolder = searchResultsRough.filter(res2 => res2.implementation === 'GRAPH_MODEL' && res2.parentId === this.currentParentId);
            const graphsOutside = searchResultsRough.filter(res3 => res3.implementation === 'GRAPH_MODEL' && res3.parentId !== this.currentParentId);
            let graphsResults = [...graphsUnderSameFolder, ...graphsOutside];
            if (graphsResults.length > 20) {
                graphsResults = graphsResults.slice(0, 20);
            }
            this.searchResults = [...processEls, ...graphsResults];

            // give search list element time to appear before setting the first item active
            setTimeout(() => {
                this.keyManager.setFirstItemActive();
            }, 0);
        }
    }

    /**
    * @param selectedItem the processing element/graph model that was selected from the result list
    */
    onSelectResult(selectedItem) {
        this.searchString = this.fillField === true ? selectedItem.name : '';
        this.resultSelected.emit(selectedItem);
    }

    /**
     * assemble all IDs of graph models that are
     * dependent on this graph model.
     * the IDs will be used to filter those models out from the search box
     * @param graphModels: current models available
     * @param dependentGraphIds: the IDs of graphs that are dependent on this model
     */
    findDependentGraphModelIds(graphModels: ProcessInterfaceDescription[], dependentGraphIds) {
        const graphDeps = [];
        dependentGraphIds.forEach(graphDe => {
            this.graphModelIdsForFiltering.push(graphDe);
            graphModels.forEach(graph => {
                if (graph.dependencies && graph.dependencies.length) {
                    if (graph.dependencies.findIndex(id => id === graphDe) > -1) {
                        graphDeps.push(graph.objectId);
                    }
                }
            });
        });
        if (graphDeps.length !== 0) {
            this.findDependentGraphModelIds(graphModels, graphDeps);
        }
    }

    itemName(result) {
        if (result.hasOwnProperty('pathName')) {
            return result.pathName + '/' + result.name;
        } else {
            return result.name;
        }
    }
}
