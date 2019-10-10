import { Component, Input, ViewChild, OnInit } from '@angular/core';
import { VariableProjections } from '@cpt/capacity-planning-projection/lib';
import { isEmpty } from 'rxjs/operators';
import { Utils } from '../../../../../utils_module/utils';
import * as moment from 'moment';
import { getMonths } from '@cpt/capacity-planning-projection/lib/date';
import { DistributionType } from '@cpt/capacity-planning-projection/lib/distribution';
import { PercentileResult } from '../../../../interfaces/PercentileResult';


@Component({
    selector: 'forecast-graph',
    templateUrl: './forecast.graph.component.html',
    styleUrls: ['./forecast.graph.component.css']
})
export class ForecastGraphComponent implements OnInit {
    @ViewChild('nvd3Component') nvd3Component;
    @Input('uiProjections') uiProjections;
    @Input('startDate') startDate: string;
    @Input('endDate') endDate: string;

    showDistributionLines: Boolean = false;
    showBreakdownLines: Boolean = false;
    projectionKeys = [];
    // minValue = 0;
    maxValue = 0;
    chartData: Array<any> = [];
    chartLabels = [];
    chartOptions;
    // Hide the graph while the sidebar is being expanded/collapsed
    hide = false;
    settings = Utils.getCurrentUserSettings();
    comma = this.settings.COMMA_CHECK === 'true' ? ',' : '';

    constructor() { }

    ngOnInit() {
        if (Utils.getForecastBreakdownSelected()) {
            this.showBreakdownLines = Utils.getForecastBreakdownSelected();
        }
        if (Utils.getForecastDistributionSelected()) {
            this.showDistributionLines = Utils.getForecastDistributionSelected();
        }
        if (this.uiProjections.length !== 0) {
            console.log('Generating graph');
            this.updateChartData();
        }
    }

    updateProjections(uiProjections, startDate, endDate) {
        this.startDate = startDate;
        this.endDate = endDate;
        this.uiProjections = uiProjections;
        console.log('Updating graph');
        this.updateChartData();
    }

    updateChart() {
        this.nvd3Component.chart.update();
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
        // this.minValue = 0;
        this.maxValue = 0;
        this.chartLabels = [];
        this.chartData = [];
        let chartIndex = 0;

        for (const date of this.projectionKeys) {
            this.chartLabels.push((moment(date).format('MMM-YY')).toString());
            chartIndex = chartIndex + 1;
        }

        for (let index = 0; index < this.uiProjections.length; index++) {
            const projection = this.uiProjections[index];
            if (projection.display) {
                const dataValues = [];
                let x_Index = 0;

                for (const frame of projection.frames) {
                    if (frame.actualValue === undefined && frame.projectedValue === undefined) {
                        x_Index++;
                        continue;
                    }


                    if (frame.actualValue !== undefined) {
                        if (Number(frame.actualValue) > this.maxValue) {
                            this.maxValue = frame.actualValue;
                        }

                        // FIXME: Display negative values
                        // if (frame.actualValue < 0) {
                        //     dataValues.push({ x: x_Index, y: 0 });
                        //     x_Index = x_Index + 1;
                        //     continue;
                        // } else {
                        dataValues.push({ x: x_Index, y: frame.actualValue });
                        x_Index = x_Index + 1;
                        continue;
                        // }
                    }
                    if (frame.projectedValue !== undefined) {
                        if (Number(frame.projectedValue) > this.maxValue) {
                            this.maxValue = frame.projectedValue;
                        }
                        // FIXME: Display negative values
                        // if (frame.projectedValue < 0) {
                        //     dataValues.push({ x: x_Index, y: 0 });
                        //     x_Index = x_Index + 1;
                        // } else {
                        dataValues.push({ x: x_Index, y: frame.projectedValue });
                        x_Index = x_Index + 1;
                        // }

                    }
                }
                if (dataValues.length > 0) {
                    this.chartData.push({
                        values: dataValues,
                        key: projection.variable.content.title,
                        color: projection.color
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

        if (this.maxValue === 0) {
            this.maxValue = 1;
        } else if (this.maxValue !== 1) {
            // Determine the ticks between the min and max values and add an additional tick
            const y = d3.scale.linear().domain([0, this.maxValue]);
            const ticks = y.ticks(),
                lastTick = ticks[ticks.length - 1],
                newLastTick = lastTick + (ticks[1] - ticks[0]);
            if (lastTick < y.domain()[1]) {
                ticks.push(newLastTick);
            }
            this.maxValue = newLastTick;
        }

        this.chartOptions = {
            chart: {
                type: 'lineChart',
                useInteractiveGuideline: true,
                callback: (chart) => {
                    /*
                    chart.dispatch.on('renderEnd', function() {
                        console.log('render complete: ', chart.interactiveLayer);
                    });*/
                    if (chart !== undefined) {
                        const tooltip = chart.interactiveLayer.tooltip;
                        tooltip.contentGenerator((d) => {
                            const series = d.series as [{ key: string, value: number, color: string }];
                            let tooltip = `
                                        <table>
                                    `;
                            for (let index = 0; index < series.length; index++) {
                                const object = series[index];
                                if (this.skipVariablesOnTooltip(object.key, object.value)) { continue; }
                                tooltip += `
                                    <tr>
                                        <td><div style='font-size: var(--small-font-size); width: 1em; height: 1em; background-color:${object.color}; border: solid 1px #000;'></div></td>
                                        <td style='font-size: var(--small-font-size); max-width: 200px; overflow:hidden; text-overflow: ellipsis;' >${object.key}</td>
                                        <td style='font-size: var(--small-font-size); text-align: right;'><strong>${object.value === undefined ? '-' : d3.format(this.comma + '.0' + this.settings.VARIABLE_DECIMAL + 'f')(object.value)}</strong></td>
                                    </tr>
                                    `;
                            }
                            tooltip += '</table>';
                            return tooltip;
                        });

                        chart.update();
                        return chart;
                    }
                },
                xAxis: {
                    axisLabel: '',
                    tickFormat: (d) => {
                        const date = this.chartLabels[d];
                        if (date === undefined) { return ''; }
                        return date;
                    }
                },
                yAxis: {
                    axisLabel: '',
                    tickFormat: function(d) {
                        return Utils.formatNumber(d);
                    },
                    axisLabelDistance: -10,
                    showMaxMin: false,
                },
                yDomain: [0, this.maxValue],
                showLegend: false
            }
        };
    }

    plotBreakdownLines(projection) {
        for (const subFrameName of projection.subframeNames) {
            const dataValues = [];
            let x_Index = 0;

            for (const frame of projection.frames) {
                const subFrameIndex = frame.subFrames.findIndex(x => x.name === subFrameName);
                const subFrameValue = frame.subFrames[subFrameIndex].value;

                // if (subFrameValue < this.minValue) this.minValue = subFrameValue;
                if (subFrameValue > this.maxValue) { this.maxValue = subFrameValue; }

                // FIXME: Display negative values
                // if (subFrameValue < 0) {
                //     dataValues.push({ x: x_Index, y: 0 });
                // } else {
                dataValues.push({ x: x_Index, y: subFrameValue });
                // }

                x_Index = x_Index + 1;
            }

            this.chartData.push({
                values: dataValues,
                key: subFrameName,
                color: Utils.getRGBShadeOfColor(projection.color, 0.5)
            });

        }
    }

    plotDistributionLines(projection) {
        let percentiles = this.settings.SIGMA;
        percentiles = percentiles.split(',');

        for (const percentile of percentiles) {
            const upperValues = [];
            const lowerValues = [];

            let x_Index = 0;
            for (const frame of projection.frames) {
                if (typeof frame.distribution !== 'undefined' && frame.distribution.distributionType === DistributionType.Gaussian) {
                    const mean = frame.projectedValue;
                    const stdValue = frame.distribution.stdDev;
                    const values = Utils.getPercentiles(mean, stdValue, (parseFloat(percentile) / 100)) as PercentileResult;

                    // if (values.lower < this.minValue) this.minValue = values.lower;
                    if (values.upper > this.maxValue) { this.maxValue = values.upper; }

                    // FIXME: Display negative values
                    // if (values.upper < 0) {
                    //      upperValues.push({ x: x_Index, y: 0 });
                    // } else {
                    upperValues.push({ x: x_Index, y: values.upper });
                    // }

                    // FIXME: Display negative values
                    // if (values.lower < 0) {
                    //     lowerValues.push({ x: x_Index, y: 0 });
                    // } else {
                    lowerValues.push({ x: x_Index, y: values.lower });
                    // }
                } else {
                    upperValues.push({ x: x_Index, y: undefined });
                    lowerValues.push({ x: x_Index, y: undefined });
                }
                x_Index = x_Index + 1;
            }

            const upperIndex = upperValues.findIndex(values => typeof values.y !== 'undefined');
            const lowerIndex = lowerValues.findIndex(values => typeof values.y !== 'undefined');

            if (upperIndex !== -1 && lowerIndex !== -1) {
                this.chartData.push({
                    values: upperValues,
                    key: projection.variable.content.title + ': Percentile ' + percentile + ' - Upper',
                    classed: 'dashed',
                    color: Utils.getRGBShadeOfColor(projection.color, (percentile / 100) / 1.5)
                });

                this.chartData.push({
                    values: lowerValues,
                    key: projection.variable.content.title + ': Percentile ' + percentile + ' - Lower',
                    classed: 'dashed',
                    color: Utils.getRGBShadeOfColor(projection.color, (percentile / 100) / 1.5)
                });
            }
        }
    }

    skipVariablesOnTooltip(title, value) {
        if (value === undefined) { return true; }
        if ((title.includes(': Percentile ') && title.includes(' - Upper'))
            || (title.includes(': Percentile ') && title.includes(' - Lower'))) {
            return true;
        } else {
            return false;
        }
    }
}
