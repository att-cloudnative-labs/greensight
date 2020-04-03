import {
    Component,
    Input,
    OnInit,
    EventEmitter,
    Output,
    OnChanges,
    OnDestroy,
    ElementRef,
    ViewChild
} from '@angular/core';
import { ForecastVariableProjection } from '@app/modules/cpt/interfaces/forecastVariableProjections';
import { interval, Subject } from 'rxjs';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { debounce } from 'rxjs/operators';


interface ProjectionItem { id: string; name: string; displayed: boolean; }

@Component({
    selector: 'app-variable-filter',
    templateUrl: './variable-filter.component.html',
    styleUrls: ['./variable-filter.component.css']
})
export class VariableFilterComponent implements OnInit, OnChanges, OnDestroy {
    @Input('variableProjections') variableProjections: ForecastVariableProjection[] = [];
    @Output('disableClick') disableClick = new EventEmitter();
    @Output('hiddenVariableIds') hiddenVariableIds = new EventEmitter<string[]>();
    @ViewChild('varSearch', { static: false }) varSearchRef: ElementRef;

    projectionItems: ProjectionItem[] = [];
    projectionDisplayItems: ProjectionItem[] = [];
    displayShowAllButton = false;

    searchText = '';
    showSearchResults = false;
    mouseInList = false;
    mouseInSearchBox = false;
    focus$: Subject<boolean> = new Subject<boolean>();
    _hiddenVariableIds = [];

    constructor() {
    }

    ngOnInit() {
        // hide the search list if the mouse leaves the search input box
        // or the list for more then 500ms.
        this.focus$.pipe(untilDestroyed(this), debounce(() => interval(500))).subscribe(
            focused => {
                if (!focused) {
                    this.closeSearch();
                }
            }
        );
    }

    ngOnChanges() {
        this.updateState();
    }

    // FIXME: somehow ngOnChanges is not run
    // when the variableProjections change.
    // use this clumsy manual state update to workaround this.
    updateState(silent?: boolean) {
        this.projectionItems = this.variableProjections.map(proj => {
            return {
                name: proj.variable.content ? proj.variable.content.title : proj.variable.variableModel.name,
                id: proj.variable.id,
                displayed: !this._hiddenVariableIds.find(v => v === proj.variable.id)
            }
        }).sort((a, b) => a.name > b.name ? 1 : -1);

        this.projectionDisplayItems = this.projectionItems.filter(i => this.searchText.length ? i.name.includes(this.searchText) : true);

        this.displayShowAllButton = this._hiddenVariableIds.length > 0;

        if (!silent) {
            this.hiddenVariableIds.emit(this._hiddenVariableIds);
        }

    }

    ngOnDestroy() {
    }

    hideAllVariables() {
        this.updateState(true);
        this._hiddenVariableIds = this.projectionItems.map(pi => pi.id);
        this.updateState();
    }

    showAllVariables() {
        this.updateState(true);
        this._hiddenVariableIds = [];
        this.updateState();
    }

    toggleSelection(event, node: ProjectionItem) {
        const hiddenVariableIds = this._hiddenVariableIds.filter(i => i !== node.id);
        if (!event.currentTarget.checked) {
            hiddenVariableIds.push(node.id);
        }
        this._hiddenVariableIds = hiddenVariableIds;
        this.updateState();
    }

    showItemList() {
        this.showSearchResults = true;
        this.disableClick.emit(true);
        this.updateState();
    }

    closeSearch() {
        this.disableClick.emit(false);
        this.showSearchResults = false;
        this.searchText = '';
        if (this.varSearchRef) {
            this.varSearchRef.nativeElement.blur();
        }
    }

    leaveSearchBox() {
        this.mouseInSearchBox = false;
        this.updateSearchBox();
    }
    enterSearchBox() {
        this.mouseInSearchBox = true;
        this.updateSearchBox();
    }
    leaveList() {
        this.mouseInList = false;
        this.updateSearchBox();
    }
    enterList() {
        this.mouseInList = true;
        this.updateSearchBox();
    }

    updateSearchBox() {
        if (!this.mouseInList && !this.mouseInSearchBox) {
            this.focus$.next(false);
        } else {
            this.focus$.next(true);
        }
    }

}
