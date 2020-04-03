import { Component, EventEmitter, Input, HostBinding, Output, ElementRef, ViewChild } from '@angular/core';
import { Highlightable } from '@angular/cdk/a11y';
import { Store } from '@ngxs/store';
import { TreeState } from '@cpt/state/tree.state';
import { map } from 'rxjs/operators';
import { ProcessTypes } from '@cpt/capacity-planning-simulation-types/lib';
import { ProcessOption } from '@cpt/interfaces/process-option';

@Component({
    selector: '[app-graph-search-result]',
    templateUrl: './graph-search-result.component.html',
    styleUrls: ['./graph-search-result.component.css']
})
export class GraphSearchResultComponent implements Highlightable {
    @Input() item: ProcessOption;
    @Input() itemName;
    @Input() disabled = false;
    @Output() resultSelected = new EventEmitter();
    @ViewChild('resultElement', { static: false }) resultElement: ElementRef;
    private _isActive = false;

    @HostBinding('class.active') get isActive() {
        return this._isActive;
    }

    get isGraphModel() {
        return this.item.implementation === 'GRAPH_MODEL';
    }

    get isCircularDependencies() {
        return (this.disabled);
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
