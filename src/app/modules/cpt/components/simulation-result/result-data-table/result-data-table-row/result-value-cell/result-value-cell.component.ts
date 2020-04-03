import { Component, Input, OnChanges, HostBinding } from '@angular/core';
import { SimulationNodeAggregatedReport } from '@cpt/capacity-planning-simulation-types';


@Component({
    selector: '[app-result-value-cell]',
    templateUrl: './result-value-cell.component.html',
    styleUrls: ['./result-value-cell.component.css']
})

export class ResultValueCellComponent implements OnChanges {
    @Input() resultData: { [stepDate: string]: SimulationNodeAggregatedReport };
    @HostBinding('class.selected') @Input() selected = false;
    value;
    unit;

    ngOnChanges() {
        // special case for displaying error rates
        if (this.resultData && this.resultData.type === 'MESSAGES') {
            this.value = this.resultData.values[0].rate;
            this.unit = 'percentage';
        } else if (this.resultData && this.resultData.type === 'RATE') {
            this.value = this.resultData.value;
            this.unit = 'percentage';
        } else if (this.resultData) {
            this.value = this.resultData.value;
            this.unit = this.resultData.unit;
        }
    }
}
