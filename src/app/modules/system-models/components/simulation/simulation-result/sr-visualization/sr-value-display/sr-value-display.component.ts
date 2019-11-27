import { Component, OnChanges, Input } from '@angular/core';
import { SimulationNodeAggregatedReport, SimulationNode, SimulationNodeDataAggregate } from '@cpt/capacity-planning-simulation-types';
import { ResultNodeDataSet } from '@system-models/components/simulation/simulation-result/sr-visualization/sr-visualization.component';


@Component({
    selector: 'app-srs-value-display',
    templateUrl: './sr-value-display.component.html',
    styleUrls: ['./sr-value-display.component.css']
})

export class SrValueDisplayComponent implements OnChanges {
    @Input() dataSet: ResultNodeDataSet;
    data;

    ngOnChanges() {
        const curData = this.dataSet.mainData[this.dataSet.date];
        if (curData.type === 'MESSAGES') {
            this.data = { value: curData.values[0].rate, unit: 'percentage' };
        } else if (this.dataSet.aggregationMethod === 'RATE' && curData.type === 'NUMBER') {
            this.data = { value: curData.value, unit: 'percentage' };
        } else {
            this.data = curData;
        }
    }
}
