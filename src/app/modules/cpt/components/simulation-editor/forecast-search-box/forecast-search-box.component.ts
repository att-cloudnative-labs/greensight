import {
    Component,
    Input,
    Output,
    EventEmitter,
    ViewChildren,
    QueryList,
    ViewChild, ElementRef, OnInit, OnDestroy
} from '@angular/core';
import { DOWN_ARROW, ENTER, UP_ARROW } from '@angular/cdk/keycodes';
import { ActiveDescendantKeyManager } from '@angular/cdk/a11y';
import { ForecastSearchListEntryComponent } from '@cpt/components/simulation-editor/forecast-search-box/entry/forecast-search-list-entry.component';
import { TreeService } from '@cpt/services/tree.service';
import { TreeNodeInfo } from '@cpt/interfaces/tree-node-tracking';
import Timer = NodeJS.Timer;
import { Observable } from 'rxjs';
import { untilDestroyed } from 'ngx-take-until-destroy';


@Component({
    selector: 'forecast-search-box',
    templateUrl: './forecast-search-box.component.html',
    styleUrls: ['./forecast-search-box.component.css']
})
export class ForecastSearchBoxComponent implements OnInit, OnDestroy {
    @Input() siblingReference: string;
    @Input() dropList: string[];
    @Input() placeholder = 'select an item';
    @Input('visible') visible$: Observable<boolean>;
    @Output() itemSelected = new EventEmitter();
    @ViewChildren(ForecastSearchListEntryComponent) resultComponents: QueryList<ForecastSearchListEntryComponent>;
    @ViewChild('liveSearchField', { static: false }) searchField: ElementRef;
    @ViewChild('liveSearchResultField', { static: false }) resultField: ElementRef;

    showSearch = false;
    searchString = '';
    searchResults = [];
    siblingsAll: TreeNodeInfo[] = [];
    pendingSearchClose: Timer;

    readonly PAGE_SIZE = 5;
    queryPage = -1;
    hasMorePages = true;

    private keyManager: ActiveDescendantKeyManager<ForecastSearchListEntryComponent>;


    get siblingResults(): TreeNodeInfo[] {
        const availableSiblings = this.siblingsAll.filter(s => !this.dropList.find(e => e === s.id));
        if (!this.searchString) {
            return availableSiblings;
        } else {
            return availableSiblings.filter(sib => sib.name.includes(this.searchString));
        }
    }

    constructor(private treeService: TreeService, private _el: ElementRef) {
    }

    addPage() {
        this.cancelClose();
        this.queryPage++;
        this.updateSearchNodes();
    }

    get combinedResultCount(): number {
        return this.siblingResults.length + this.searchResults.length;
    }

    ngOnInit(): void {
        this.treeService.search({ siblingReference: this.siblingReference, nodeTypes: ['FC_SHEET'] }).subscribe(results => {
            this.siblingsAll = results;
        });

        this.visible$.pipe(untilDestroyed(this)).subscribe((visible) => {
            if (!visible) {
                this.closeSearchDisplay();
            }
        });
    }

    ngOnDestroy(): void {
        if (this.resultField && this.resultField.nativeElement) {
            this.resultField.nativeElement.remove();
        }
    }

    openSearchDisplay() {
        if (!this.showSearch) {
            this.showSearch = true;
            this.searchResults = [];
            this.searchString = '';
            this.queryPage = -1;
            this.hasMorePages = true;
            // sets up keyboard navigation for result list
            this.keyManager = new ActiveDescendantKeyManager(this.resultComponents).withWrap();

        }
    }

    closeSearchDisplay() {
        this.showSearch = false;
        this.searchString = '';
        this.searchResults = [];
    }

    onSelectResult(result) {
        this.itemSelected.emit(result);
        this.closeSearchDisplay();
    }

    navigateList(event) {
        if (event.keyCode === ENTER) {
            if (this.keyManager.activeItem) {
                this.onSelectResult(this.keyManager.activeItem.item);
            }
            this.closeSearchDisplay();
        } else if (event.keyCode === UP_ARROW || event.keyCode === DOWN_ARROW) {
            this.keyManager.onKeydown(event);
            if (this.keyManager.activeItem) {
                this.keyManager.activeItem.resultElement.nativeElement.scrollIntoView({ block: 'nearest' });
            }
        }
    }

    /**
     * Performs a ranked search on the items to find results that
     * best match the value in the search input field
     * @param event the input event where the input field's string can be retrieved
     */

    updateSearchNodes() {
        const searchTerm = this.searchString.trim().toLowerCase();
        const queryPage = this.queryPage;
        if (this.queryPage > -1) {
            this.treeService.search({
                searchTerm: searchTerm,
                nodeTypes: ['FC_SHEET'],
                size: this.PAGE_SIZE,
                page: queryPage
            }).subscribe(sheets => {
                this.hasMorePages = sheets.length >= this.PAGE_SIZE;
                const nonSiblings = sheets.filter(m => m.id !== this.siblingReference && !this.siblingsAll.find(sib => sib.id === m.id));
                const withoutDropList = nonSiblings.filter(n => !this.dropList.find(e => e === n.id));
                if (queryPage > 0) {
                    this.searchResults.push(...withoutDropList);
                } else {
                    this.searchResults = withoutDropList;
                }
            });
        }
    }

    cancelClose() {
        if (this.pendingSearchClose) {
            clearTimeout(this.pendingSearchClose);
            this.searchField.nativeElement.focus();
        }
        this.pendingSearchClose = null;
    }

    searchBlurred() {
        this.pendingSearchClose = setTimeout(() => { this.closeSearchDisplay(); }, 100);
    }
    searchList(event) {
        if (event instanceof KeyboardEvent && event.keyCode !== ENTER && event.keyCode !== DOWN_ARROW && event.keyCode !== UP_ARROW) {
            if (!this.showSearch) {
                this.openSearchDisplay();
            }
            if (this.searchString.trim().length) {
                this.queryPage = 0;
                this.updateSearchNodes();
            } else {
                this.hasMorePages = true;
                this.searchResults = [];
                this.queryPage = -1;
            }
        }
    }


}
