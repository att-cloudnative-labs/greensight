import { Component, OnInit, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { Utils } from '../../../utils_module/utils';
import { Branch } from '../../../core_module/interfaces/branch';

@Component({
    selector: 'app-core-branch-combo',
    templateUrl: './branch.combo.component.html',
    styleUrls: ['./branch.combo.component.css']
})
/**
 * A dropdown that allows for the selection of branches along with links to the relevant
 * add/manage pages for branches
 * This is to be updated to also facilitate the selection of system models and
 * simulations.
 */
export class ComboComponent implements OnInit, OnChanges {
    // the items to be displayed in the dropdown menu
    @Input('isForecast') isForecast = false;
    @Input('list') itemList: any;
    // the type of the items that are in the dropdown (used )
    @Input('item-type') itemType = '';
    // the item currently selected in the dropdown menu
    // @Input('selected-item') selectedItem: Branch = null;
    @Input('selected-item') selectedItem: any;
    // an event indicating that a new item has been selected from the dropdown menu
    @Output('item-selected') itemSelected = new EventEmitter();

    currentProjectId = '';

    ngOnInit() {
        if (this.itemType === 'Version') {
            this.itemList = Array<Branch>();
        }
    }

    /**
     * Whenever the inputed item list changes, update the currently selected project
     */
    ngOnChanges() {
        this.currentProjectId = Utils.getActiveProject();
    }

    /**
     * Changes the currently selected item to the one that has been clicked on the dropdown
     * @param item the item that has been selected from the dropdown
     */
    onItemSelected(item) {
        this.selectedItem = item;
        this.itemSelected.emit(item);
    }

    /**
     * Checks if an item is currently selected in the dropdown menu
     * @param itemId the id of the item tah
     * @returns true if the currently selected item has the specified id, false otherwise
     */
    isSelectedItem(itemId: string): boolean {
        if (this.selectedItem != null && this.selectedItem.id === itemId) {
            return true;
        } else {
            return false;
        }
    }

}
