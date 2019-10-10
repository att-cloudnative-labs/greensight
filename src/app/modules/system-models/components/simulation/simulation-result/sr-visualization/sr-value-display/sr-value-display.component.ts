import { Component, OnChanges, Input } from '@angular/core';
import { SimulationNodeAggregatedReport, SimulationNode, SimulationNodeDataAggregate } from '@cpt/capacity-planning-simulation-types';


@Component({
    selector: 'app-srs-value-display',
    templateUrl: './sr-value-display.component.html',
    styleUrls: ['./sr-value-display.component.css']
})

export class SrValueDisplayComponent implements OnChanges {
    @Input() simResultData: SimulationNode;
    @Input() month: string;
    @Input() dataType: string;
    @Input() aggregationMethod: string;
    @Input() isErrorWarningPe = false;
    @Input() aggregatedReportIndex;
    scenarioId: string;
    data;

    // TODO this may need some rework when we begin to use real result data
    ngOnChanges() {
        // only dealing with one scenarion for no so getting the first scenario in the aggregated report
        this.scenarioId = Object.keys(this.simResultData.aggregatedReport)[this.aggregatedReportIndex];
        this.scenarioId = this.scenarioId ? this.scenarioId : Object.keys(this.simResultData.aggregatedReport)[0];
        const report: SimulationNodeAggregatedReport = this.simResultData.aggregatedReport[this.scenarioId];
        // Special case for errors and warnings
        if (this.isErrorWarningPe) {
            const errorVarningAggregate = report[this.month].data['MESSAGES'];
            this.data = { value: errorVarningAggregate.values[0].rate, unit: 'percentage' };
        } else if (this.aggregationMethod === 'RATE') {
            const rateAggregate = report[this.month].data['RATE'];
            this.data = { value: rateAggregate.value, unit: 'percentage' };
        } else {
            // TODO: do slices have aggregation methods?
            this.data = report[this.month].data ? report[this.month].data.AVG : report[this.month].AVG;
        }
    }
}
