import { Component, Input, ElementRef, Output, EventEmitter, OnInit, AfterViewInit, ViewChildren, QueryList, ViewChild } from '@angular/core';
import * as Sifter from 'sifter';
import { ENTER, UP_ARROW, DOWN_ARROW } from '@angular/cdk/keycodes';
import { ActiveDescendantKeyManager } from '@angular/cdk/a11y';
import { TypeaheadSearchResultComponent } from './typeahead-search-result/typeahead-search-result.component';

@Component({
    selector: 'app-typeahead-search',
    templateUrl: './typeahead-search.component.html',
    styleUrls: ['./typeahead-search.component.css']
})
export class TypeaheadSearchComponent implements OnInit, AfterViewInit {
    @Input() itemList: any[];
    // the key of the item that is to used for searching
    @Input() searchKey = 'name';
    // the index of the item that is to be initially highlighted
    @Input() selectedIndex = 0;
    @Output() closeSearch = new EventEmitter();
    @Output() resultSelected = new EventEmitter();
    @ViewChild('searchField') searchField: ElementRef;
    @ViewChildren(TypeaheadSearchResultComponent) resultComponents: QueryList<TypeaheadSearchResultComponent>;
    searchString = '';
    searchResults = [];
    private keyManager: ActiveDescendantKeyManager<TypeaheadSearchResultComponent>;


    constructor(private _el: ElementRef) { }

    ngOnInit() {
        this.searchResults = [...this.itemList];
    }

    ngAfterViewInit() {
        // sets up keyboard navigation for result list
        this.keyManager = new ActiveDescendantKeyManager(this.resultComponents).withWrap();
        // sets selected item as highlighted using its index, otherwise it highlights the first item
        setTimeout(() => {
            this.keyManager.setActiveItem(this.selectedIndex);
            this.keyManager.activeItem.resultElement.nativeElement.scrollIntoView({ block: 'nearest' });
            this.searchField.nativeElement.focus();
        }, 0);
    }

    navigateList(event) {
        if (event.keyCode === ENTER) {
            this.onSelectResult(this.keyManager.activeItem.item);
            this.closeSearch.emit();
        } else if (event.keyCode === UP_ARROW || event.keyCode === DOWN_ARROW) {
            this.keyManager.onKeydown(event);
            this.keyManager.activeItem.resultElement.nativeElement.scrollIntoView({ block: 'nearest' });
        }
    }

    /**
    * Performs a ranked search on the items to find results that
    * best match the value in the search input field
    * @param event the input event where the input field's string can be retrieved
    */
    searchList(event) {
        if (event.keyCode !== ENTER && event.keyCode !== DOWN_ARROW && event.keyCode !== UP_ARROW) {
            const sifter = new Sifter(this.itemList);
            const sifterResults = sifter.search(this.searchString, {
                fields: [this.searchKey],
                sort: [{ field: this.searchKey, direction: 'asc' }],
            });
            this.searchResults = sifterResults.items.map(item => {
                return this.itemList[item.id];
            });
            // give search list element time to appear before setting the first item active
            setTimeout(() => {
                this.keyManager.setFirstItemActive();
                this.keyManager.activeItem.resultElement.nativeElement.scrollIntoView({ block: 'nearest' });
            }, 0);
        }
    }

    /**
    * @param selectedItem the item that was selected from the result list
    */
    onSelectResult(selectedItem) {
        this.searchString = '';
        this.resultSelected.emit(selectedItem);
    }

    closeSearchDisplay(event) {
        event.stopPropagation();
        event.cancelBubble = true;
        this.closeSearch.emit();
    }
}
