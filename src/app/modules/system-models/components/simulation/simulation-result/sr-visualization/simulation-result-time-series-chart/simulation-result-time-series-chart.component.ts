import { Component, Input, OnInit, OnChanges } from '@angular/core';
import { EChartOption } from 'echarts';
import { SimulationNode, SimulationNodeAggregatedReport, Aggragate, SimulationMessageRate } from '@cpt/capacity-planning-simulation-types';

@Component({
    selector: 'app-srs-visualization-time-series',
    templateUrl: './simulation-result-time-series-chart.component.html',
    styleUrls: ['../sr-chart.common.css', './simulation-result-time-series-chart.component.css']
})

export class SimulationResultTimeSeriesChartComponent implements OnChanges {
    @Input() simResultData;
    @Input() variableSelections = [];
    @Input() title;
    @Input() dataType: string;
    @Input() aggregatedReportIndex;
    @Input() selectedScenarioId;

    secondTitle;
    resultVariable;
    scenarioId: string;

    chartOptions: EChartOption;
    chartLegend: string[] = [];

    constructor() { }

    ngOnChanges() {
        this.secondTitle = undefined;
        const chartSeries = [];
        let chartKeys = [];
        let color;
        let yAxisValues = [];
        let chartTitle;
        this.chartLegend.push(this.title);
        const duelAxis = this.isDuelAxis();
        for (let index = 0; index < this.variableSelections.length; index++) {
            const varId = this.variableSelections[index].objectId;
            if (index > 0) {
                // i think this needs a different name?
                this.resultVariable = this.simResultData[varId];
                this.defineSecondTitle(varId);
            }
            const variable: SimulationNode = this.simResultData[varId];
            if (this.hasResults(variable)) {
                // only dealing with one scenario for now so hard coding id as the first scenario
                this.scenarioId = Object.keys(variable.aggregatedReport)[this.aggregatedReportIndex];
                this.scenarioId = this.scenarioId ? this.scenarioId : Object.keys(variable.aggregatedReport)[0];
                const aggregationMethod = this.variableSelections[index].aggregationMethod;
                const dataType = this.variableSelections[index].dataType;
                chartKeys = Object.keys(variable.aggregatedReport[this.scenarioId]);
                const chartDataRaw = Object.values(variable.aggregatedReport[this.scenarioId]) as any;
                const chartData = [];
                // get unit if its stored in a data field or on the month field
                let unit = chartDataRaw[0][dataType] ? chartDataRaw[0][dataType][aggregationMethod].unit : chartDataRaw[0][aggregationMethod].unit;
                let yAxisIndex;

                chartDataRaw.forEach((date: any) => {
                    // get aggregate depending on whether the month result is stored in a data field or on the month field
                    const monthdata: Aggragate = date ? date[dataType][aggregationMethod] : date[aggregationMethod];
                    if (monthdata.type === 'MESSAGES') {
                        const errorWarningData: SimulationMessageRate = monthdata.values[0];
                        chartData.push(errorWarningData.rate.toFixed(2));
                    } else if (monthdata.type === 'NUMBER') {
                        chartData.push(monthdata.value.toFixed(2)); // may need to use unit formatter here?
                    } else if (monthdata.type === 'RATE') {
                        chartData.push(monthdata.value.toFixed(2)); // may need to use unit formatter here?
                        unit = 'percentage';
                    }
                });

                // Hardcoded to 2 colors for the moment
                if (index === 0) {
                    chartTitle = this.title;
                    color = '#D33C3E';
                } else {
                    color = '#015DD5';
                }

                if (duelAxis) {
                    yAxisIndex = index;

                    yAxisValues.push({
                        name: this.simResultData[varId].name + ' (' + unit + ')',
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
                    name: this.secondTitle === undefined ? chartTitle : this.secondTitle,
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
                data: chartKeys
            },
            yAxis: yAxisValues,
            series: chartSeries
        };
    }

    hasResults(node: any): boolean {

        const aggregatedReportData = node ? node.aggregatedReport[this.selectedScenarioId] : null;
        const aggregatedReportDataDataIndex = aggregatedReportData ? Object.keys(aggregatedReportData)[0] : null;
        const dataContent = aggregatedReportData ? aggregatedReportData[aggregatedReportDataDataIndex][this.dataType] : null;
        const sliceContent = dataContent ? dataContent.AVG : null;
        const hasSlice = sliceContent && node.type === 'SLICE';
        const isBreakdown = sliceContent && node.type === 'BREAKDOWN';
        return dataContent && JSON.stringify(dataContent) !== '{}' || hasSlice || isBreakdown;
    }

    defineSecondTitle(id: string) {
        const parentId = this.simResultData[id].parentInstanceId;
        const parentVariable = this.simResultData[parentId];
        if (parentVariable.type === 'BREAKDOWN') {
            this.secondTitle = parentVariable.name || parentVariable.ref;
            this.defineSecondTitle(parentId);
        } else if (parentId === 'root') {
            this.secondTitle = this.resultVariable.name || this.resultVariable.ref;
        } else {
            this.secondTitle = this.secondTitle !== undefined ?
                (parentVariable.name || parentVariable.ref) + '.' + this.secondTitle + '.' + (this.resultVariable.name || this.resultVariable.ref) :
                (parentVariable.name || parentVariable.ref) + '.' + (this.resultVariable.name || this.resultVariable.ref);
        }
        this.chartLegend.push(this.secondTitle);
    }

    isDuelAxis() {
        if (this.variableSelections.length > 1) {
            let prevUnit;
            for (const selectedVar of this.variableSelections) {
                const varId = selectedVar.objectId;
                const aggregationMethod = selectedVar.aggregationMethod;
                // only dealing with one scenario for now so hard coding id as the first scenario
                const scenarioId = Object.keys(this.simResultData[varId].aggregatedReport)[0];
                const chartDataRaw = Object.values(this.simResultData[varId].aggregatedReport[scenarioId]) as any;
                // get unit if its stored in a data field or on the month field
                const unit = chartDataRaw[0].data ? chartDataRaw[0].data[aggregationMethod].unit : chartDataRaw[0][aggregationMethod].unit;
                if (prevUnit) {
                    if (unit !== prevUnit) {
                        return true;
                    }
                } else {
                    prevUnit = unit ? unit : 'undefined';
                }
            }
            return false;
        } else {
            return false;
        }
    }
}
