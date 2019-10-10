import { Component, Input, OnInit, OnChanges } from '@angular/core';
import * as moment from 'moment';

/**
 * Represents the cells that show the months in the top row of the spreadsheet
 * Displays month in 'MMM-YY' format
 */
@Component({
    selector: 'header-cell',
    templateUrl: './header.cell.component.html',
    styleUrls: ['./header.cell.component.css']
})
export class HeaderCellComponent implements OnInit, OnChanges {
    @Input('date') date;

    formattedDate = (moment(this.date).format('MMM-YY')).toString();

    constructor() { }

    ngOnInit() { }

    /**
     * Whenever the inputted date changes, it ensures that is is in the correct format
     */
    ngOnChanges() {
        this.formattedDate = (moment(this.date).format('MMM-YY')).toString();
    }
}
