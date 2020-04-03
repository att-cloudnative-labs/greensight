import { Component, HostListener, ElementRef, Output, EventEmitter, Input } from '@angular/core';

@Component({
    selector: 'app-filter-dropdown-list',
    templateUrl: './filter-dropdown-list.component.html',
    styleUrls: ['./filter-dropdown-list.component.css']
})
export class FilterDropdownListComponent {
    @Input() labels: string[] = [];
    @Input() selections = [];
    @Output() dropdownClosed = new EventEmitter;
    @Output() selectionsUpdated = new EventEmitter;

    constructor(private _el: ElementRef) { }

    /**
     * Emits an event to close the dropdown if a click occurs outside of the filter dropdown control
     * @param event the click event
     * @param targetElement the element that was clicked on
     */
    @HostListener('document:click', ['$event', '$event.target'])
    clickOutside(event: MouseEvent, targetElement: HTMLElement): void {
        const clickedInside = this._el.nativeElement.contains(targetElement) || targetElement.closest('#filter-dropdown-button');
        if (!clickedInside) {
            this.dropdownClosed.emit();
        }
    }

    /**
     * Updates the current selections by adding/removing a label depending on whether a checkbox
     * is checked or unchecked
     * @param event used to determine if the option checkbox was checked/unchecked
     * @param label the label associated with the checkbox
     */
    toggleSelection(event, label) {
        if (event.currentTarget.checked) {
            this.selections.push(label);
        } else {
            this.selections = this.selections.filter(selected => selected !== label);
        }
        this.selectionsUpdated.emit(this.selections);
    }
}
