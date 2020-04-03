import { Component, Input, OnChanges } from '@angular/core';
import { EChartOption } from 'echarts';
import { SimulationNode } from '@cpt/capacity-planning-simulation-types';
import { ResultNodeDataSet } from '@cpt/components/simulation-result/sr-visualization/sr-visualization.component';
import { AspectNumberParam, AspectsAggregate } from '@cpt/capacity-planning-simulation-types/lib';

@Component({
    selector: 'app-srs-viz-stacked-chart',
    templateUrl: './simulation-result-stacked-chart.component.html',
    styleUrls: ['../sr-chart.common.css', './simulation-result-stacked-chart.component.css']
})
export class SimulationResultStackedChartComponent implements OnChanges {
    @Input() isDisplayedRelativeValues;
    formatWithUnitPipe;
    @Input() dataSet: ResultNodeDataSet;
    chartOption: EChartOption;

    constructor() { }

    ngOnChanges() {

        const chartSeries = [];
        const yAxisValue = [];
        const subVarBreakdowns = {};
        const subVarBreakdownsPercentage = {};
        const unit = '';
        const breakdownName = this.dataSet.title;
        const chartKeys = Object.keys(this.dataSet.mainData);

        for (const date in this.dataSet.mainData) {
            const aggregate = this.dataSet.mainData[date] as AspectNumberParam;
            const aspect = aggregate.aspects.find(a => a.name === this.dataSet.title);
            const slices = aspect.slices;
            const slicesSum = aggregate.value;
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
        }


        if (!this.isDisplayedRelativeValues) {
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
