import { Component, Input, OnChanges } from '@angular/core';
import { EChartOption } from 'echarts';
import { SimulationNode } from '@cpt/capacity-planning-simulation-types';

@Component({
    selector: 'app-srs-viz-stacked-chart',
    templateUrl: './simulation-result-stacked-chart.component.html',
    styleUrls: ['../sr-chart.common.css', './simulation-result-stacked-chart.component.css']
})
export class SimulationResultStackedChartComponent implements OnChanges {
    @Input() simResultData: SimulationNode;
    @Input() title: string;
    @Input() isDisplayedRelativeValues;
    @Input() aggregatedReportIndex;
    @Input() dataType: string;
    formatWithUnitPipe;

    scenarioId: string;
    chartOption: EChartOption;

    constructor() { }

    ngOnChanges() {
        // only dealing with one scenarion for no so getting the first scenario in the aggregated report
        this.scenarioId = Object.keys(this.simResultData.aggregatedReport)[this.aggregatedReportIndex];
        this.scenarioId = this.scenarioId ? this.scenarioId : Object.keys(this.simResultData.aggregatedReport)[0];
        const chartKeys = Object.keys(this.simResultData.aggregatedReport[this.scenarioId]);
        const chartDataRaw = Object.values(this.simResultData.aggregatedReport[this.scenarioId]) as any;

        const chartSeries = [];
        const yAxisValue = [];
        const subVarBreakdowns = {};
        const subVarBreakdownsPercentage = {};
        const unit = '';
        const breakdownName = this.title;

        chartDataRaw.forEach((date: any) => {
            const data = date[this.dataType] ? date[this.dataType] : date;
            const aspect = data.AVG.aspects.find(aspect => aspect.name = this.simResultData.name);
            const slices = aspect.slices;
            const slicesSum = data.AVG.value;
            for (const sliceName in slices) {
                if (sliceName) {
                    const slicePercentage = (slices[sliceName] / slicesSum) * 100;
                    if (subVarBreakdowns[sliceName]) {
                        subVarBreakdowns[sliceName].push(slices[sliceName].toFixed(2));
                    } else {
                        subVarBreakdowns[sliceName] = [slices[sliceName].toFixed(2)];
                    }
                    // get relative values
                    if (subVarBreakdownsPercentage[sliceName]) {
                        subVarBreakdownsPercentage[sliceName].push(slicePercentage.toFixed(2));
                    } else {
                        subVarBreakdownsPercentage[sliceName] = [slicePercentage.toFixed(2)];
                    }
                }
            }
        });

        if (!this.isDisplayedRelativeValues || this.dataType === 'response') {
            Object.keys(subVarBreakdowns).forEach(subVarTitle => {
                chartSeries.push({
                    name: subVarTitle,
                    type: 'bar',
                    stack: 'stack',
                    label: {
                        title: subVarTitle,
                        normal: {
                            show: true,
                            position: 'inside',
                            formatter: (params) => {
                                return params.seriesName;
                            }
                        }
                    },
                    data: subVarBreakdowns[subVarTitle]
                });
            });
            yAxisValue.push({
                name: unit,
                type: 'value',
            });
        } else {
            Object.keys(subVarBreakdownsPercentage).forEach(subVarTitle => {
                chartSeries.push({
                    name: subVarTitle,
                    type: 'bar',
                    stack: 'stack',
                    label: {
                        title: subVarTitle,
                        normal: {
                            show: true,
                            position: 'inside',
                            formatter: (params) => {
                                return params.seriesName;
                            }
                        }
                    },
                    data: subVarBreakdownsPercentage[subVarTitle]
                });
            });
            yAxisValue.push({
                name: '%',
                type: 'value',
            });
        }

        this.chartOption = {
            title: {
                text: breakdownName,
                left: 'center',
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'shadow'
                }
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '3%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: chartKeys
            },
            yAxis: yAxisValue,
            series: chartSeries
        };
    }
}
