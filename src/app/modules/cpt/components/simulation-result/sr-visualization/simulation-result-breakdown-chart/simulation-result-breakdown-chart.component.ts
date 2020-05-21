import { Component, Input, OnChanges } from '@angular/core';
import { EChartOption } from 'echarts';
import { ResultNodeDataSet } from '@cpt/components/simulation-result/sr-visualization/sr-visualization.component';
import { NumberParam } from '@cpt/capacity-planning-simulation-types/lib';

@Component({
    selector: 'app-srs-viz-breakdown-chart',
    templateUrl: './simulation-result-breakdown-chart.component.html',
    styleUrls: ['../sr-chart.common.css', './simulation-result-breakdown-chart.component.css']
})
export class SimulationResultBreakdownChartComponent implements OnChanges {
    @Input() dataSet: ResultNodeDataSet;
    chartOption: EChartOption;
    scenarioId: string;

    constructor() { }

    ngOnChanges() {
        const monthData = this.dataSet.mainData[this.dataSet.date] as NumberParam;
        const aspect = monthData.aspects.find(aspect => aspect.name === this.dataSet.title);
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
        const chartName = this.dataSet.title + ' - ' + this.dataSet.date;

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
