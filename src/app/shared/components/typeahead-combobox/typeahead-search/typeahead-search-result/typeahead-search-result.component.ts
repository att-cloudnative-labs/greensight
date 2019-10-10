import { Component, EventEmitter, Input, HostBinding, Output, ElementRef, ViewChild, OnInit } from '@angular/core';
import { Highlightable } from '@angular/cdk/a11y';

@Component({
    selector: '[app-typeahead-search-result]',
    templateUrl: './typeahead-search-result.component.html',
    styleUrls: ['./typeahead-search-result.component.css']
})
export class TypeaheadSearchResultComponent implements Highlightable, OnInit {
    @Input() item;
    // the key of the object that represents the name of the result
    @Input() itemNameKey;
    @Output() resultSelected = new EventEmitter();
    @ViewChild('resultElement') resultElement: ElementRef;
    private _isActive = false;
    itemName = '';

    ngOnInit() {
        // get the name of the object using the specified key
        this.itemName = this.item[this.itemNameKey];
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
