import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Utils } from '@cpt/lib/utils';
import { getMonths } from '@cpt/capacity-planning-projection/lib/date';
import { DistributionType } from '@cpt/capacity-planning-projection/lib/distribution';
import { PercentileResult } from '@app/modules/cpt/interfaces/PercentileResult';
import { EChartOption } from 'echarts';
import { Store } from '@ngxs/store';
import { SettingsState } from '@cpt/state/settings.state';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { UserSettings } from '@cpt/interfaces/user-settings';
import { ForecastVariableProjection } from '@cpt/interfaces/forecastVariableProjections';


@Component({
    selector: 'forecast-graph',
    templateUrl: './forecast.graph.component.html',
    styleUrls: ['./forecast.graph.component.css']
})
export class ForecastGraphComponent implements OnInit, OnDestroy {
    @Input('uiProjections') uiProjections: ForecastVariableProjection[];
    @Input('startDate') startDate: string;
    @Input('endDate') endDate: string;

    showDistributionLines: Boolean = false;
    showBreakdownLines: Boolean = false;
    projectionKeys = [];
    chartSeries: EChartOption.SeriesLine[] = [];
    // Hide the graph while the sidebar is being expanded/collapsed
    hide = false;
    settings: UserSettings;
    chartOptions: EChartOption;
    echartsInstance;


    constructor(private store: Store) { }


    ngOnInit() {
        this.settings = this.store.selectSnapshot(SettingsState.userSettings);

        this.store.select(SettingsState.userSettings).pipe(untilDestroyed(this)).subscribe(s => {
            this.settings = s;
        });
        if (this.uiProjections.length !== 0) {
            console.log('Generating graph');
            this.updateChartData();
        }
    }

    ngOnDestroy(): void {
    }

    updateProjections(uiProjections, startDate, endDate) {
        this.startDate = startDate;
        this.endDate = endDate;
        this.uiProjections = uiProjections;
        console.log('Updating graph');
        this.updateChartData();
    }
    onChartInit(ec) {
        this.echartsInstance = ec;
    }

    updateChart() {
        if (this.echartsInstance) {
            this.echartsInstance.resize();
        }

    }

    updateChartData() {
        this.projectionKeys = getMonths(this.startDate, this.endDate);

        this.generateChartData();



        if (this.hide) { this.hide = false; }
    }

    toggleDisplayTypes(displayLines) {
        this.showDistributionLines = displayLines.distributionLines;
        this.showBreakdownLines = displayLines.breakdownLines;

        this.generateChartData();
    }

    hideGraph() {
        this.hide = true;
    }

    generateChartData() {
        this.chartSeries = [];

        for (let index = 0; index < this.uiProjections.length; index++) {
            const projection = this.uiProjections[index];
            const format = (n: number) => {
                let decimals = 0;
                const variableType = projection.variable.variableType;
                if (variableType === 'BREAKDOWN') {
                    decimals = this.settings.BREAKDOWN_DECIMAL;
                } else if (variableType === 'REAL') {
                    decimals = this.settings.VARIABLE_DECIMAL;
                }
                return parseFloat((n.toFixed(decimals)));
            };
            if (projection.display) {
                const dataValues = [];
                let x_Index = 0;
                for (const frame of projection.frames) {
                    if (frame.actualValue === undefined && frame.projectedValue === undefined) {
                        dataValues.push({ x: x_Index });
                        x_Index++;
                        continue;
                    }


                    if (frame.actualValue !== undefined) {
                        dataValues.push({ x: x_Index, y: format(frame.actualValue) });
                        x_Index = x_Index + 1;
                        continue;
                    }
                    if (frame.projectedValue !== undefined) {
                        dataValues.push({ x: x_Index, y: format(frame.projectedValue) });
                        x_Index = x_Index + 1;

                    }
                }
                if (dataValues.length > 0) {


                    this.chartSeries.push({
                        name: projection.variable.content.title,
                        type: 'line',
                        smooth: true,
                        lineStyle: {
                            color: projection.color
                        },
                        data: dataValues.map(d => d.y)
                    });
                }

                // Plot breakdown subvariable lines
                if (this.showBreakdownLines && projection.subframeNames != null && projection.subframeNames.length > 0) {
                    this.plotBreakdownLines(projection);
                }

                // Plot distribution lines
                if (this.showDistributionLines) {
                    this.plotDistributionLines(projection);
                }
            }
        }


        this.chartOptions = {
            backgroundColor: '#404040',
            tooltip: {
                trigger: 'axis'
            },
            xAxis: {
                type: 'category',
                data: getMonths(this.startDate, this.endDate)
            },
            yAxis: {
                type: 'value'
            },
            series: this.chartSeries
        };

    }

    plotBreakdownLines(projection) {
        for (const subFrameName of projection.subframeNames) {
            const dataValues = [];
            let x_Index = 0;

            for (const frame of projection.frames) {
                const subFrameIndex = frame.subFrames.findIndex(x => x.name === subFrameName);
                const subFrameValue = frame.subFrames[subFrameIndex].value;
                dataValues.push({ x: x_Index, y: subFrameValue });
                x_Index = x_Index + 1;
            }

            this.chartSeries.push({
                name: projection.variable.content.title + '.' + subFrameName,
                type: 'line',
                smooth: true,
                lineStyle: {
                    color: Utils.getRGBShadeOfColor(projection.color, 0.5)
                },
                data: dataValues.map(d => d.y)
            });

        }
    }

    plotDistributionLines(projection) {
        const percentiles = this.settings.SIGMA;

        for (const percentile of percentiles) {
            const upperValues = [];
            const lowerValues = [];

            let x_Index = 0;
            for (const frame of projection.frames) {
                if (typeof frame.distribution !== 'undefined' && frame.distribution.distributionType === DistributionType.Gaussian) {
                    const mean = frame.projectedValue;
                    const stdValue = frame.distribution.stdDev;
                    const values = Utils.getPercentiles(mean, stdValue, (percentile / 100)) as PercentileResult;

                    upperValues.push({ x: x_Index, y: values.upper });
                    lowerValues.push({ x: x_Index, y: values.lower });
                } else {
                    upperValues.push({ x: x_Index, y: undefined });
                    lowerValues.push({ x: x_Index, y: undefined });
                }
                x_Index = x_Index + 1;
            }


            const upperIndex = upperValues.findIndex(values => typeof values.y !== 'undefined');
            const lowerIndex = lowerValues.findIndex(values => typeof values.y !== 'undefined');

            if (upperIndex !== -1 && lowerIndex !== -1) {

                this.chartSeries.push({
                    name: projection.variable.content.title + ': Percentile ' + percentile + ' - Upper',
                    type: 'line',
                    smooth: true,
                    lineStyle: {
                        type: 'dashed',
                        color: Utils.getRGBShadeOfColor(projection.color, (percentile / 100) / 1.5)
                    },
                    data: upperValues.map(d => d.y)
                });

                this.chartSeries.push({
                    name: projection.variable.content.title + ': Percentile ' + percentile + ' - Lower',
                    type: 'line',
                    smooth: true,
                    lineStyle: {
                        type: 'dashed',
                        color: Utils.getRGBShadeOfColor(projection.color, (percentile / 100) / 1.5)
                    },
                    data: lowerValues.map(d => d.y)
                });
            }
        }


    }

}
