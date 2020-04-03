import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';

@Component({
    selector: 'app-typeahead-combobox',
    templateUrl: './typeahead-combobox.component.html',
    styleUrls: ['./typeahead-combobox.component.css']
})
export class TypeaheadComboboxComponent implements OnChanges {
    @Input() itemList: any[];
    @Input() selectedItem;
    @Input() selectedKey = 'name';
    @Input() searchKey = 'name';
    @Input() placeholder = 'select an item';
    @Output() itemSelected = new EventEmitter();
    showSearch = false;
    selectedLabel;
    selectedIndex = 0;

    ngOnChanges() {
        if (this.selectedItem === undefined || this.selectedItem === null) {
            this.selectedLabel = this.placeholder;
        } else {
            this.selectedLabel = this.selectedItem[this.selectedKey];
            this.selectedIndex = this.itemList.findIndex(item => item[this.searchKey] === this.selectedItem[this.searchKey]);
        }
    }

    openSearchDisplay() {
        this.showSearch = true;
    }

    closeSearchDisplay() {
        this.showSearch = false;
    }

    onSelectResult(result) {
        this.selectedLabel = result[this.selectedKey];
        this.itemSelected.emit(result);
    }
}
