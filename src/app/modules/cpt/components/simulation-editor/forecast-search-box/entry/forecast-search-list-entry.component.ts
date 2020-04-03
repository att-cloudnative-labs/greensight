import { Component, EventEmitter, Input, HostBinding, Output, ElementRef, ViewChild, OnInit } from '@angular/core';
import { Highlightable } from '@angular/cdk/a11y';
import { TreeNodeInfo } from '@cpt/interfaces/tree-node-tracking';

@Component({
    selector: '[live-result-list-entry]',
    templateUrl: './forecast-search-list-entry.component.html',
    styleUrls: ['./forecast-search-list-entry.component.css']
})
export class ForecastSearchListEntryComponent implements Highlightable, OnInit {
    @Input() item: TreeNodeInfo;
    // the key of the object that represents the name of the result
    @Output() resultSelected = new EventEmitter();
    @ViewChild('resultElement', { static: false }) resultElement: ElementRef;
    private _isActive = false;
    itemName = '';

    ngOnInit() {
        // get the name of the object using the specified key
        this.itemName = this.item.pathName + '/' + this.item.name;
    }

    @HostBinding('class.active') get isActive() {
        return this._isActive;
    }

    setActiveStyles() {
        this._isActive = true;
    }

    setInactiveStyles() {
        this._isActive = false;
    }

    selectResult() {
        this.resultSelected.emit(this.item);
    }
}
