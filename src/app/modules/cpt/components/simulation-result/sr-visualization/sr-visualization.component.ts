import { Component, Input, OnChanges, OnDestroy, OnInit } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { ProcessingElementState } from '@cpt/state/processing-element.state';
import { Observable } from 'rxjs';
import { SRSState } from '@cpt/state/simulation-result-screen.state';
import { map } from 'rxjs/operators';
import { untilDestroyed } from 'ngx-take-until-destroy';
import {
    Aggregate,
    AggregationMethods,
    SimulationNode,
    SimulationNodeAggregatedReport,
    SimulationNodeDataAggregate,
    SimulationResult
} from '@cpt/capacity-planning-simulation-types/lib';
import { SelectedRowProperties, SRSDatatableProperties } from '@cpt/models/srs-datatable-properties';

export interface ResultNodeDataSet {
    data: { [date: string]: SimulationNodeDataAggregate };
    mainData: { [date: string]: Aggregate };
    aggregationMethod: AggregationMethods;
    date?: string;
    title: string;
    unit: string;
}


enum ChartType {
    PIE = 'PIE',
    HISTOGRAM = 'HISTOGRAM',
    LINE = 'LINE',
    VALUE = 'VALUE',
    STACKED = 'STACKED',
    MULTIBAR = 'MULTIBAR',
    MULTIBARVALUE = 'MULTIBARVALUE'
}

@Component({
    selector: 'app-sr-visualization',
    templateUrl: './sr-visualization.component.html',
    styleUrls: ['./sr-visualization.component.css']
})
export class SrVisualizationComponent implements OnInit, OnDestroy, OnChanges {
    @Input() simulationResult: SimulationResult;
    @Input() isDisplayedRelativeValues;
    @Select(ProcessingElementState.errorWarningProcessingElements) errorWarningProcessingElements$: Observable<any[]>;
    errorWarningPes = [];
    title: string;
    chartType: ChartType;
    selectedDate: string;

    allSelectedNodeIds: string[] = [];
    message: string;
    selectedNode: SimulationNode;
    selectedNodeId: string;
    hasData: boolean;
    simulationResultProperties$: Observable<SRSDatatableProperties>;
    selectedScenarioId: string;

    selections: SelectedRowProperties[];
    mainSelection: SelectedRowProperties;

    selectedNodeDataSets: ResultNodeDataSet[] = [];

    constructor(private store: Store) { }

    ngOnInit() {
        this.simulationResultProperties$ = this.store.select(SRSState.resultById).pipe(map(byId => byId((this.simulationResult.objectId))));
        this.simulationResultProperties$.pipe(untilDestroyed(this)).subscribe(simulationResultProperties => {
            if (simulationResultProperties) {
                this.selections = simulationResultProperties.selectedRows;
                this.selectedScenarioId = simulationResultProperties.selectedScenario;
                this.hasData = false;
                if (this.selections && this.selections.length > 0) {
                    this.allSelectedNodeIds = this.selections.map(s => s.objectId);
                    this.mainSelection = this.selections[0];
                    this.selectedNodeId = this.mainSelection.objectId;
                    this.selectedNode = this.simulationResult.nodes[this.selectedNodeId];
                    this.hasData = this.hasResults(this.selectedNode, this.mainSelection.dataType as 'data' | 'response');
                    this.handleGraphSelections();
                    this.selectedNodeDataSets = this.selections.map(selection => {
                        const node = this.simulationResult.nodes[selection.objectId];
                        const nodeReports: { [date: string]: SimulationNodeAggregatedReport } = node.aggregatedReport[this.selectedScenarioId];
                        if (!nodeReports) {
                            return null;
                        }
                        const reportData: { [date: string]: SimulationNodeDataAggregate } = {};
                        const mainReportData: { [date: string]: Aggregate } = {};
                        const availableAggregationMethods = this.availableAggregationMethods(node, selection.dataType as 'data' | 'response');
                        let aggregationMethod = selection.aggregationMethod as AggregationMethods;
                        if (!availableAggregationMethods.includes(aggregationMethod) && availableAggregationMethods.length > 0) {
                            aggregationMethod = availableAggregationMethods[0]
                        }
                        let dataSelection = aggregationMethod;
                        if (this.chartType === 'HISTOGRAM') {
                            dataSelection = 'HISTOGRAM';
                        }
                        Object.keys(nodeReports).forEach(date => {
                            const report = nodeReports[date];
                            mainReportData[date] = report[selection.dataType as 'response' | 'data'][dataSelection];
                            reportData[date] = report[selection.dataType as 'response' | 'data'];
                        });
                        const firstMonthAggregate = mainReportData[Object.keys(reportData)[0]];
                        const unit = this.getUnit(firstMonthAggregate);
                        const rds: ResultNodeDataSet = {
                            date: selection.month,
                            mainData: mainReportData,
                            data: reportData,
                            aggregationMethod: aggregationMethod,
                            title: this.getChartTitle(selection.objectId),
                            unit: unit
                        };
                        return rds;
                    });

                }

            }
        });
        this.errorWarningProcessingElements$.subscribe(errorWarningPes => {
            this.errorWarningPes = [...errorWarningPes];
        });
    }

    getUnit(a: Aggregate | null): string {
        if (a && a.hasOwnProperty('unit')) {
            return (a as any).unit as string;
        }
        return 'undefined';
    }

    ngOnChanges() {

    }

    ngOnDestroy() { }

    hasResults(node: SimulationNode, dataType: 'data' | 'response'): boolean {
        const aggregatedReport = node ? node.aggregatedReport[this.selectedScenarioId] : null;
        const firstMonthReport = aggregatedReport ? aggregatedReport[Object.keys(aggregatedReport)[0]] : null;
        const firstMonthContent = firstMonthReport ? firstMonthReport[dataType] : null;
        const sliceContent = firstMonthContent ? firstMonthContent.AVG : null;
        const hasSlice: boolean = sliceContent && node.type === 'SLICE';
        const isBreakdown: boolean = sliceContent && node.type === 'BREAKDOWN';
        return firstMonthContent && JSON.stringify(firstMonthContent) !== '{}' || hasSlice || isBreakdown;
    }

    availableAggregationMethods(node: SimulationNode, dataType: 'data' | 'response'): AggregationMethods[] {
        const aggregatedReport = node ? node.aggregatedReport[this.selectedScenarioId] : null;
        const firstMonthReport = aggregatedReport ? aggregatedReport[Object.keys(aggregatedReport)[0]] : null;
        const firstMonthContent = firstMonthReport ? firstMonthReport[dataType] : null;
        return firstMonthContent ? Object.keys(firstMonthContent) as AggregationMethods[] : [];
    }

    handleGraphSelections() {
        this.title = undefined;
        if (this.selections === undefined) {
            this.chartType = undefined;
            this.message = 'no data selected';
            return;
        }

        if (this.selections.length === 1 && this.selections[0].month) {
            this._getCellChartType(this.selections[0]);
        } else if (this.selections.length > 0) {
            this._getRowChartType(this.selections);
        } else {
            this.chartType = undefined;
            this.message = 'no data selected';
        }
    }

    /**
     * Determines the chart that should be displayed based on the types of rows
     * that are selected. If there is no corresponding chart for a particular selection, a message
     * is displayed instead
     */
    _getRowChartType(rowSelections: SelectedRowProperties[]) {
        // cannot have more that 2 rows selected at the moment
        if (rowSelections.length > 2) {
            this.chartType = undefined;
            this.message = 'Too many rows selected';
        } else if (rowSelections.length > 1 && this._hasBreakdownSelected(rowSelections)) {
            // cannot have a breakdown in a multi selection
            this.chartType = undefined;
            this.message = 'cannot include breakdowns in multi selection';
        } else {
            this.title = this.getChartTitle(this.selectedNodeId);
            if (this.selectedNode.type === 'BREAKDOWN') {
                if (rowSelections[0].dataType === 'response') {
                    this.chartType = ChartType.MULTIBAR;
                } else {
                    this.chartType = ChartType.STACKED;
                }
            } else {
                this.chartType = ChartType.LINE;
            }
        }
    }

    /**
    * Determines the chart that should be displayed based on the types of cell
    * that is selected.
    */
    _getCellChartType(selectedCell: SelectedRowProperties) {
        this.title = this.getChartTitle(this.selectedNodeId);
        if (this.selectedNode.type === 'BREAKDOWN') {
            if (selectedCell.dataType === 'response') {
                this.chartType = ChartType.MULTIBARVALUE;
                this.selectedDate = selectedCell.month;
            } else {
                this.chartType = ChartType.PIE;
            }
        } else if (this._isErrorWarningPe(this.selectedNode)) {
            this.chartType = ChartType.VALUE;
        } else {
            // other types are time series which will display a histogram if included in the report
            const availableAggMethods = this.availableAggregationMethods(this.selectedNode, selectedCell.dataType as 'data' | 'response');
            if (availableAggMethods.includes('HISTOGRAM')) {
                this.chartType = ChartType.HISTOGRAM;
            } else {
                this.chartType = ChartType.VALUE;
            }
        }
    }


    getChartTitle(resultNodeId: string): string {
        function nodeName(n: SimulationNode): string { return n.name || n.ref };
        const parentId = this.simulationResult.nodes[resultNodeId].parentInstanceId;
        const parentVariable = this.simulationResult.nodes[parentId];
        const resultNode = this.simulationResult.nodes[resultNodeId];
        if (parentVariable.type === 'BREAKDOWN') {
            return nodeName(parentVariable) + '.' + this.getChartTitle(parentId);
        } else {
            return nodeName(resultNode);
        }
    }

    /**
     * checks if one of the selected rows is of type breakdown
     */
    _hasBreakdownSelected(rowSelections) {
        for (const row of rowSelections) {
            const resultVariable = this.simulationResult.nodes[row.objectId];
            if (resultVariable.type === 'BREAKDOWN') {
                return true;
            }
        }
        return false;
    }

    _isErrorWarningPe(resultVariable) {
        return this.errorWarningPes.findIndex(el => el.objectId === resultVariable.ref) !== -1;
    }
}
