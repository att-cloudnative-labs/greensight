import {
    Component,
    OnInit,
    ViewChildren,
    QueryList,
    AfterViewInit,
    Output,
    EventEmitter,
    Input,
    OnDestroy, ViewChild, ElementRef
} from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { ProcessingElementState } from '@cpt/state/processing-element.state';
import { Observable, combineLatest } from 'rxjs';
import { GraphSearchResultComponent } from './graph-search-result/graph-search-result.component';
import { ActiveDescendantKeyManager } from '@angular/cdk/a11y';
import { ENTER, UP_ARROW, DOWN_ARROW } from '@angular/cdk/keycodes';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { ProcessInterfaceDescription } from '@cpt/capacity-planning-simulation-types/lib';
import { TreeNodeTrackingState } from '@cpt/state/tree-node-tracking.state';
import { TreeNodeInfo } from '@cpt/interfaces/tree-node-tracking';
import { ProcessOption, processOptionFromTreeNodeInfo } from '@cpt/interfaces/process-option';
import { Utils } from '@cpt/lib/utils';
import { TreeService } from '@cpt/services/tree.service';
import Timer = NodeJS.Timer;

@Component({
    selector: 'app-graph-processing-element-search',
    templateUrl: './graph-processing-element-search.component.html',
    styleUrls: ['./graph-processing-element-search.component.css']
})
export class GraphProcessingElementSearchComponent implements OnInit, AfterViewInit, OnDestroy {
    @Select(TreeNodeTrackingState.graphModels) graphModelInfo$: Observable<TreeNodeInfo[]>;
    @Select(ProcessingElementState.processingElements) pes$: Observable<ProcessInterfaceDescription[]>;
    @ViewChildren(GraphSearchResultComponent) items: QueryList<GraphSearchResultComponent>;
    @ViewChild('graphSearch', { static: true }) searchField: ElementRef;
    @ViewChild('graphSearchResults', { static: false }) resultField: ElementRef;

    @Input() placeholder = 'Add...';
    @Input() graphModelId: string;
    @Input() parentNodeId: string;
    @Input('visible') visible$: Observable<boolean>;



    @Output() resultSelected = new EventEmitter();
    showSearchResults = false;
    @Input() searchString = '';
    peAll: ProcessOption[] = [];
    peImportant: ProcessOption[] = [];

    siblingsAll: ProcessOption[] = [];

    searchResults: ProcessOption[] = [];

    readonly PAGE_SIZE = 5;
    queryPage = -1;
    hasMorePages = true;
    showOnlyImportantPEs = true;

    closeTimeout: Timer;

    private keyManager: ActiveDescendantKeyManager<GraphSearchResultComponent>;

    constructor(private treeService: TreeService) { }

    ngAfterViewInit() {
        // sets up keyboard navigation for result list
        this.keyManager = new ActiveDescendantKeyManager(this.items).withWrap();
    }

    get peSearchResults(): ProcessOption[] {
        if (this.searchString.trim().length > 0) {
            return this.peAll.filter(pe => pe.processingElement.name.toLowerCase().includes(this.searchString.trim().toLowerCase()));
        } else {
            return this.showOnlyImportantPEs ? this.peImportant : this.peAll;
        }
    }

    get siblingSearchResults(): ProcessOption[] {
        if (this.searchString.trim().length > 0) {
            return this.siblingsAll.filter(sb => sb.graphModel.name.toLowerCase().includes(this.searchString.trim().toLowerCase()));
        } else {
            return this.siblingsAll;
        }
    }

    get displayShowAllPEs(): boolean {
        return this.searchString.trim().length === 0 && this.showOnlyImportantPEs;
    }

    get displayShowImportantPEs(): boolean {
        return this.searchString.trim().length === 0 && !this.showOnlyImportantPEs;
    }

    get combinedResultCount(): number {
        return this.peSearchResults.length + this.siblingSearchResults.length + this.searchResults.length;
    }



    /**
     * gets the graph models and processing elements from their respective states
     * and combines them into an array
     */
    ngOnInit() {

        this.pes$.pipe(untilDestroyed(this)).subscribe(pes => {
            this.peAll = pes.map(pe => ({ name: pe.name, processingElement: pe, implementation: 'PROCESSING_ELEMENT' } as ProcessOption));
            this.peImportant = this.peAll.filter(pe => Utils.importantProcessingElementIds.find(peid => peid === pe.processingElement.objectId));
        });

        this.visible$.pipe(untilDestroyed(this)).subscribe(visible => {
            if (!visible) {
                this._closeSearch();
            }
        });
    }

    ngOnDestroy() {
        this._closeSearch();
        if (this.resultField && this.resultField.nativeElement) {
            this.resultField.nativeElement.remove();
        }
    }

    navigateList(event) {
        if (event.keyCode === ENTER) {
            if (this.keyManager.activeItem.item.disabled) {
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
        this.closeTimeout = setTimeout(() => {
            this._closeSearch();
        }, 250);
    }
    _closeSearch() {
        this.showSearchResults = false;
        this.searchResults = [];
        this.searchString = '';
        this.showOnlyImportantPEs = true;
    }

    queryModels() {
        const searchTerm = this.searchString.trim().toLowerCase();
        const queryPage = this.queryPage;
        if (this.queryPage > -1) {
            this.treeService.search({
                searchTerm: searchTerm,
                nodeTypes: ['MODEL'],
                size: this.PAGE_SIZE,
                page: queryPage
            }).subscribe(models => {
                this.hasMorePages = models.length >= this.PAGE_SIZE;
                const modelsToAdd = models.filter(m => m.id !== this.graphModelId && !this.siblingsAll.find(sib => sib.graphModel.id === m.id));
                const processOptions = modelsToAdd.map(m => processOptionFromTreeNodeInfo(m, this.graphModelId));
                if (queryPage > 0) {
                    this.searchResults.push(...processOptions);
                } else {
                    this.searchResults = processOptions;
                }
            });
        }
    }
    cancelClose() {
        if (this.closeTimeout) {
            clearTimeout(this.closeTimeout);
            this.closeTimeout = null;
        }
        if (this.searchField) {
            this.searchField.nativeElement.focus();
        }
    }

    showAllPEs() {
        this.showOnlyImportantPEs = false;
        this.cancelClose();
    }

    showImportantPEs() {
        this.showOnlyImportantPEs = true;
        this.cancelClose();
    }

    addPage() {
        this.cancelClose();
        this.queryPage++;
        this.queryModels();
    }

    openSearchList() {
        if (!this.showSearchResults) {
            this.showSearchResults = true;
            this.hasMorePages = true;
            this.queryPage = -1;
            // run the sibling query only once every time the search is initiated
            this.treeService.search({ siblingReference: this.graphModelId, nodeTypes: ['MODEL'] }).subscribe(siblings => {
                this.siblingsAll = siblings.map(tni => processOptionFromTreeNodeInfo(tni, this.graphModelId));
            });
        }
    }

    searchListFocus($event) {
        if (this.closeTimeout) {
            clearTimeout(this.closeTimeout);
            this.closeTimeout = null;
        }
    }


    /**
     * Displays initial list when user focus to the input search
     * Performs a ranked search on the processing elements and graph models to find results that
     * best match the value in the search input field
     * @param event the input event where the input field's string can be retrieved
     */
    searchList(event) {
        if (event instanceof FocusEvent && event.type === 'focusin') {
            this.openSearchList();
        }
        if (event instanceof KeyboardEvent && event.keyCode !== ENTER && event.keyCode !== DOWN_ARROW && event.keyCode !== UP_ARROW) {
            if (!this.showSearchResults) {
                this.openSearchList();
            }
            if (this.searchString.trim().length) {
                this.queryPage = 0;
                this.queryModels();
            } else {
                this.searchResults = [];
            }

        }
    }

    /**
    * @param selectedItem the processing element/graph model that was selected from the result list
    */
    onSelectResult(selectedItem) {
        this.searchString = '';
        this.resultSelected.emit(selectedItem);
    }

    itemName(result) {
        if (result.hasOwnProperty('pathName')) {
            return result.pathName + '/' + result.name;
        } else {
            return result.name;
        }
    }
}
