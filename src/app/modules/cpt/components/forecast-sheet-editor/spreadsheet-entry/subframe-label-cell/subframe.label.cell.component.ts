import { Component, Input } from '@angular/core';

/**
 * Diplays the name of the subvariable
 * Inherits its background color from the variable the subframe is for (tinted darker by 15%)
 */
@Component({
    selector: 'subframe-label-cell',
    templateUrl: './subframe.label.cell.component.html',
    styleUrls: ['./subframe.label.cell.component.css'],
})
export class SubframeLabelCellComponent {
    @Input('label') label = '';
}
