import { Component, Input } from '@angular/core';

/**
* Represents a blank row in the spreadsheet.
* Optionally shows a "Create Variable" link
*/
@Component({
    selector: 'blank-cell',
    templateUrl: './blank.cell.component.html',
    styleUrls: ['./blank.cell.component.css']
})
export class BlankCellComponent {
    @Input('isPast') isPast: boolean;
}
