import { Component, Input, OnInit, OnChanges } from '@angular/core';
import { EChartOption } from 'echarts';
import { SimulationNode, SimulationNodeAggregatedReport, Aggregate, SimulationMessageRate } from '@cpt/capacity-planning-simulation-types';
import { ResultNodeDataSet } from '@cpt/components/simulation-result/sr-visualization/sr-visualization.component';

@Component({
    selector: 'app-srs-visualization-time-series',
    templateUrl: './simulation-result-time-series-chart.component.html',
    styleUrls: ['../sr-chart.common.css', './simulation-result-time-series-chart.component.css']
})

export class SimulationResultTimeSeriesChartComponent implements OnChanges {
    @Input() dataSets: ResultNodeDataSet[];

    chartOptions: EChartOption;
    chartLegend: string[] = [];

    constructor() { }

    ngOnChanges() {
        const chartSeries = [];
        let color;
        let yAxisValues = [];
        const dualAxis = this.isDualAxis();
        for (let dataSetIndex = 0; dataSetIndex < this.dataSets.length; dataSetIndex++) {
            const dataSet = this.dataSets[dataSetIndex];
            let unit = dataSet.unit;
            this.chartLegend.push(dataSet.title);
            const chartData = [];
            let yAxisIndex;

            for (const month of Object.keys(dataSet.data)) {
                const monthData = dataSet.mainData[month];
                if (monthData.type === 'MESSAGES') {
                    const errorWarningData: SimulationMessageRate = monthData.values[0];
                    chartData.push(errorWarningData.rate.toFixed(2));
                } else if (monthData.type === 'NUMBER') {
                    chartData.push(monthData.value.toFixed(2)); // may need to use unit formatter here?
                } else if (monthData.type === 'RATE') {
                    chartData.push(monthData.value.toFixed(2)); // may need to use unit formatter here?
                    unit = 'percentage';
                }
            }
            // Hardcoded to 2 colors for the moment
            if (dataSetIndex === 0) {
                color = '#D33C3E';
            } else {
                color = '#015DD5';
            }

            if (dualAxis) {
                yAxisIndex = dataSetIndex;

                yAxisValues.push({
                    name: dataSet.title + ' (' + unit + ')',
                    axisLine: {
                        lineStyle: {
                            color: color
                        }
                    }
                });
            } else {
                yAxisValues = [{
                    name: unit
                }];
            }

            chartSeries.push($.extend({}, {
                name: dataSet.title,
                type: 'line',
                lineStyle: {
                    normal: {
                        color: color
                    }
                },
                smooth: true,
                data: chartData,
                yAxisIndex: yAxisIndex,
                itemStyle: { color: color },
            }));


        }

        this.chartOptions = {
            tooltip: {},
            legend: {
                orient: 'horizontal',
                left: 'left',
                data: this.chartLegend
            },
            animationDuration: 200,
            grid: {
                left: '3%',
                right: '4%',
                bottom: '3%',
                containLabel: true
            },
            xAxis: {
                data: []
            },
            yAxis: yAxisValues,
            series: chartSeries
        };
    }

    // if we have multiple data sets and they don't share the same unit we need
    // multiple axis
    isDualAxis() {

        if (this.dataSets.length > 1) {
            const ds0Unit = this.dataSets[0].unit;
            for (const ds of this.dataSets) {
                if (ds.unit !== ds0Unit)
                    return false;
            }
            return true;

        }
        return false;
    }
}
