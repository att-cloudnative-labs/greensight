import { Component, OnInit, Input, OnChanges } from '@angular/core';
import { EChartOption } from 'echarts';
import * as echarts from 'echarts';

@Component({
    selector: 'app-srs-viz-histogram',
    templateUrl: './simulation-result-histogram.component.html',
    styleUrls: ['../sr-chart.common.css', './simulation-result-histogram.component.css']
})
export class SimulationResultHistogramComponent implements OnChanges {
    @Input() simResultData;
    @Input() month: string;
    @Input() aggregationMethod: string;
    @Input() title;
    @Input() aggregatedReportIndex;
    chartOption: EChartOption;
    scenarioId: string;
    @Input() dataType: string;

    constructor() { }

    ngOnChanges() {
        const chartName = this.title + ' - ' + this.month;
        this.scenarioId = Object.keys(this.simResultData.aggregatedReport)[this.aggregatedReportIndex];
        this.scenarioId = this.scenarioId ? this.scenarioId : Object.keys(this.simResultData.aggregatedReport)[0];
        const bins = [];
        const binAG = [];
        const monthReport = this.simResultData.aggregatedReport[this.scenarioId][this.month];
        const data = monthReport[this.dataType];
        const maxValueOfCount = data.HISTOGRAM ? Math.max(...data.HISTOGRAM.buckets.map(o => o.count), 0) + 2 : data.AVG.value;
        const avg = data[this.aggregationMethod].value;
        const histogramData = data.HISTOGRAM ? data.HISTOGRAM.buckets : [];
        histogramData.forEach(bucket => {
            if (Object.keys(bucket).length) {
                bins.push([bucket.min, bucket.max, bucket.count]);
            }
        });
        binAG.push([avg, avg, maxValueOfCount, this.aggregationMethod]);

        // Histogram
        this.chartOption = {
            title: {
                text: chartName,
                left: 'center'
            },
            tooltip: {
            },
            xAxis: {
                scale: true,
                name: this.simResultData.name,
                nameLocation: 'middle'
            },
            yAxis: {
                type: 'value',
                name: 'Frequency',
                nameLocation: 'middle',
            },
            series: [{
                type: 'custom',
                renderItem: function renderItem(params, api) {
                    const yValue = api.value(2);
                    const start = api.coord([api.value(0), yValue]);
                    const size = api.size([api.value(1) - api.value(0), yValue]);
                    const style = api.style();

                    return {
                        type: 'rect',
                        shape: {
                            x: start[0],
                            y: start[1],
                            width: size[0],
                            height: size[1]
                        },
                        style: style
                    };
                },
                itemStyle: {
                    normal: {
                        color: new echarts.graphic.LinearGradient(
                            0, 0, 0, 1,
                            [
                                { offset: 0, color: '#14c8d4' },
                                { offset: 1, color: '#43eec6' }
                            ]
                        )
                    }
                },
                dimensions: ['min', 'max', 'count'],
                encode: {
                    x: [0, 1],
                    y: 2,
                    tooltip: [0, 1, 2],
                    itemName: 3
                },
                markLine: {
                    symbolSize: 10,
                    itemStyle: {
                        normal: {
                            color: '#c0322a'
                        },
                        width: 10,
                    },
                    silent: true,
                    lineStyle: {
                        normal: {
                            type: 'dashed'
                        }
                    },
                    data: [
                        [
                            {
                                // Use the same name with starting and ending point
                                name: this.aggregationMethod,
                                coord: [avg, '0']
                            },
                            {
                                coord: [avg, maxValueOfCount]
                            }
                        ]
                    ]
                },
                data: bins
            },
            {
                type: 'bar',
                barGap: '-100%',
                barWidth: 5,
                itemStyle: {
                    normal: {
                        color: new echarts.graphic.LinearGradient(
                            0, 0, 0, 1,
                            [
                                { offset: 0, color: 'rgba(20,200,212,0.5)' },
                                { offset: 0.2, color: 'rgba(20,200,212,0.2)' },
                                { offset: 1, color: 'rgba(20,200,212,0)' }
                            ]
                        )
                    }
                },
                dimensions: [this.aggregationMethod],
                encode: {
                    x: [0, 1],
                    y: 2,
                    tooltip: [0],
                    itemName: 3
                },
                z: -12,
                data: binAG
            }]
        };
    }
}
