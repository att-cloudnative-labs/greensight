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
import { map } from 'rxjs/operators';
import { untilDestroyed } from 'ngx-take-until-destroy';

@Component({
    selector: 'app-graph-processing-element-search',
    templateUrl: './graph-processing-element-search.component.html',
    styleUrls: ['./graph-processing-element-search.component.css']
})
export class GraphProcessingElementSearchComponent implements OnInit, AfterViewInit, OnDestroy {
    @Select(ProcessingElementState.processingElements) processingElements$: Observable<any[]>;
    @Select(TreeState.nodesOfType('MODEL')) graphModelNodes$: Observable<TreeNode[]>;
    @ViewChildren(GraphSearchResultComponent) items: QueryList<GraphSearchResultComponent>;
    @Input() placeholder = 'Add...';
    // Only searches for graph models
    @Input() onlyGraphs = false;
    @Input() isControlBar = false;
    // Displays the name of the selected result in the input field
    @Input() fillField = false;
    @Input() graphModel: TreeNode;
    @Input() simulation;
    @Output() resultSelected = new EventEmitter();
    showSearchResults = false;
    @Input() searchString = '';
    searchResults = [];
    graphsAndProcessingElements = [];
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
        if (!this.onlyGraphs) {
            const combinedObservables = combineLatest(this.graphModelNodes$, this.processingElements$);
            combinedObservables.pipe(untilDestroyed(this)).subscribe(
                ([graphModelNodes, processingElements]) => {
                    this.graphsAndProcessingElements = [...graphModelNodes, ...processingElements];
                    // FIXME: this check for the existence of our graphmodel node is necessary
                    // to avoid a race condition when deleting a folder with graph model nodes
                    // inside. find a better way!
                    const currentGraphModelNode = this.graphsAndProcessingElements.find(element => element.id === this.graphModel.id);
                    if (currentGraphModelNode) {
                        this.currentParentId = this.graphsAndProcessingElements.find(element => element.id === this.graphModel.id).parentId;
                        // exclude the node itself
                        this.graphsAndProcessingElements = this.graphsAndProcessingElements.filter(element => element.id !== this.graphModel.id);
                        // exclude circular dependent graphs
                        const graphModels = this.graphsAndProcessingElements.filter(element => element.type && element.type === 'MODEL');
                        this.graphModelIdsForFiltering = [];
                        this.findDependentGraphModelIds(graphModels, [this.graphModel.id]);
                    }
                }
            );
        } else {
            if (this.simulation) {
                this.currentParentId = this.simulation.parentId;
            }
            // get the selected simulation
            this.graphModelNodes$.pipe(untilDestroyed(this)).subscribe(graphModelNodes => {
                this.graphsAndProcessingElements = [...graphModelNodes];
            });
        }
    }

    ngOnDestroy() { }

    navigateList(event) {
        if (event.keyCode === ENTER) {
            if (this.graphModelIdsForFiltering.indexOf(this.keyManager.activeItem.item.id) > -1 && this.isControlBar) {
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
            const processEls = searchResultsRough.filter(res => res.objectType === 'PROCESS_INTERFACE_DESCRIPTION');
            const graphsUnderSameFolder = searchResultsRough.filter(res2 => res2.type === 'MODEL' && res2.parentId === this.currentParentId);
            const graphsOutside = searchResultsRough.filter(res3 => res3.type === 'MODEL' && res3.parentId !== this.currentParentId);
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
    findDependentGraphModelIds(graphModels, dependentGraphIds) {
        const graphDeps = [];
        dependentGraphIds.forEach(graphDe => {
            this.graphModelIdsForFiltering.push(graphDe);
            graphModels.forEach(graph => {
                if (graph.processDependencies && graph.processDependencies.length) {
                    if (graph.processDependencies.findIndex(id => id === graphDe) > -1) {
                        graphDeps.push(graph.id);
                    }
                }
            });
        });
        if (graphDeps.length !== 0) {
            this.findDependentGraphModelIds(graphModels, graphDeps);
        }
    }

    itemName(result) {
        if (result.type === 'MODEL') {
            let fullName = '';
            this.store.select(TreeState.nodeFullPathById).pipe(map(byId => byId(result.id))).forEach(node => { fullName = node; });
            return fullName;
        } else {
            return result.name;
        }
    }
}
