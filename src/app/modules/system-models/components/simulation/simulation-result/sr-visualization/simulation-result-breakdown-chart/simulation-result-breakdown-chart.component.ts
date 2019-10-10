import { Component, Input, OnChanges } from '@angular/core';
import { EChartOption } from 'echarts';
import { SimulationNode } from '@cpt/capacity-planning-simulation-types';

@Component({
    selector: 'app-srs-viz-breakdown-chart',
    templateUrl: './simulation-result-breakdown-chart.component.html',
    styleUrls: ['../sr-chart.common.css', './simulation-result-breakdown-chart.component.css']
})
export class SimulationResultBreakdownChartComponent implements OnChanges {
    @Input() simResultData;
    @Input() month: string;
    @Input() title;
    @Input() dataType: string;
    @Input() aggregatedReportIndex;
    chartOption: EChartOption;
    scenarioId: string;

    constructor() { }

    ngOnChanges() {
        // only dealing with one scenarion for no so getting the first scenario in the aggregated report
        this.scenarioId = Object.keys(this.simResultData.aggregatedReport)[this.aggregatedReportIndex];
        this.scenarioId = this.scenarioId ? this.scenarioId : Object.keys(this.simResultData.aggregatedReport)[0];
        const report = this.simResultData.aggregatedReport[this.scenarioId];
        const monthData = report[this.month][this.dataType] ? report[this.month][this.dataType] : report[this.month];
        const aspect = monthData.AVG.aspects.find(aspect => aspect.name = this.simResultData.name);
        const slices = aspect.slices;
        const chartLegend = [];
        const chartSeriesData = [];
        for (const sliceName in slices) {
            if (sliceName) {
                chartLegend.push(sliceName);
                chartSeriesData.push({
                    value: slices[sliceName].toFixed(2),
                    name: sliceName
                });
            }
        }
        const chartName = this.title + ' - ' + this.month;

        this.chartOption = {
            title: {
                text: chartName,
                left: 'center'
            },
            tooltip: {
                trigger: 'item',
                formatter: '{a} <br/>{b} : {c} ({d}%)'
            },
            legend: {
                orient: 'vertical',
                left: 'left',
                data: chartLegend
            },
            series: [
                {
                    name: 'AVG',
                    type: 'pie',
                    radius: '55%',
                    center: ['50%', '60%'],
                    data: chartSeriesData,
                    itemStyle: {
                        emphasis: {
                            shadowBlur: 10,
                            shadowOffsetX: 0,
                            shadowColor: 'rgba(0, 0, 0, 0.5)'
                        }
                    }
                }
            ]
        };
    }
}
