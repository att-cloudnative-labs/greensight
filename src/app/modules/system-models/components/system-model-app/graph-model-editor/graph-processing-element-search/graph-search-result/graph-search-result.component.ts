import { Component, EventEmitter, Input, HostBinding, Output, ElementRef, ViewChild } from '@angular/core';
import { Highlightable } from '@angular/cdk/a11y';
import { Store } from '@ngxs/store';
import { TreeState } from '@system-models/state/tree.state';
import { map } from 'rxjs/operators';

@Component({
    selector: '[app-graph-search-result]',
    templateUrl: './graph-search-result.component.html',
    styleUrls: ['./graph-search-result.component.css']
})
export class GraphSearchResultComponent implements Highlightable {
    @Input() item;
    @Input() currentParentId;
    @Input() isControlBar;
    @Input() filterIds;
    @Output() resultSelected = new EventEmitter();
    @ViewChild('resultElement') resultElement: ElementRef;
    private _isActive = false;

    @HostBinding('class.active') get isActive() {
        return this._isActive;
    }

    get itemName() {
        if (this.isGraphModel && this.item.parentId !== this.currentParentId) {
            let fullName = '';
            this.store.select(TreeState.nodeFullPathById).pipe(map(byId => byId(this.item.id))).forEach(node => { fullName = node; });
            return fullName;
        } else {
            return this.item.name;
        }
    }

    get isGraphModel() {
        return this.item.type === 'MODEL';
    }

    get isCircularDependencies() {
        return (this.filterIds.indexOf(this.item.id) > -1) && this.isControlBar;
    }

    constructor(private store: Store) { }

    setActiveStyles() {
        this._isActive = true;
    }

    setInactiveStyles() {
        this._isActive = false;
    }

    selectResult() {
        if (this.isCircularDependencies) {
            return false;
        } else {
            this.resultSelected.emit(this.item);
        }
    }

}
