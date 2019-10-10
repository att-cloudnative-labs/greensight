import { Component, Output, EventEmitter, Input, OnInit } from '@angular/core';

@Component({
    selector: 'app-filter-dropdown',
    templateUrl: './filter-dropdown.component.html',
    styleUrls: ['./filter-dropdown.component.css']
})
export class FilterDropdownComponent implements OnInit {
    // array of objects that represent the selectable options in the filter dropdown
    @Input() options: any[] = [];
    // the key of the object of which its value is to be used as a label in the dropdown list
    @Input() labelKey;
    @Input() isOpen = false;
    @Output() selectionsUpdated = new EventEmitter();
    @Input() selections: any[] = [];
    labels: string[] = [];

    ngOnInit() {
        this.getLabels();
    }

    /**
     * Changes whether the dropdown list is visible based on the current
     * visibility state of the dropdown
     */
    toggleVisibilty() {
        this.isOpen = !this.isOpen;
    }

    /**
    * Retrieves the labels to be used in the filter dropdown from the objects using the
    * provided labelKey
    */
    getLabels() {
        if (this.options.length > 0) {
            for (const option of this.options) {
                this.labels.push(option[this.labelKey]);
            }
        }
    }

    /**
     * Indicates that the checked options in the dropdown list has been updated
     * @param newSelections the array of labels that are checked in the dropdown list
     */
    onSelectionsUpdated(newSelections) {
        this.selections = newSelections;
        this.selectionsUpdated.emit(this.selections);
    }
}
