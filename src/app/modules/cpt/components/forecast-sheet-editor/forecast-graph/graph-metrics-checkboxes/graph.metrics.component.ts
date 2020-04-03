import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { Utils } from '@app/modules/cpt/lib/utils';

@Component({
    selector: 'graph-metrics',
    templateUrl: './graph.metrics.component.html',
    styleUrls: ['./graph.metrics.component.css']
})
export class GraphMetricsComponent implements OnInit {
    @Output('toggleDisplayLines') toggleDisplayLines = new EventEmitter();

    breakdownLines: Boolean = false;
    distributionLines: Boolean = false;
    settings = Utils.getCurrentUserSettings();

    ngOnInit() {
        // get the state of graph metric boxes from session storage
        if (Utils.getForecastDistributionSelected()) {
            this.distributionLines = Utils.getForecastDistributionSelected();
        }
        if (Utils.getForecastBreakdownSelected()) {
            this.breakdownLines = Utils.getForecastBreakdownSelected();
        }
    }

    toggleDistributionLines(event) {
        this.distributionLines = event.target.checked;
        Utils.setForecastDistributionSelected(event.target.checked);
        this.toggleDisplayLines.emit({ 'distributionLines': this.distributionLines, 'breakdownLines': this.breakdownLines });
    }

    toggleBreakdownLines(event) {
        this.breakdownLines = event.target.checked;
        Utils.setForecastBreakdownSelected(event.target.checked);
        this.toggleDisplayLines.emit({ 'distributionLines': this.distributionLines, 'breakdownLines': this.breakdownLines });
    }

    /**
     * Checks if percentiles, have been saved on the logged in user's settings
     */
    percentilesSaved(): boolean {
        return this.settings.SIGMA !== '';
    }

}
