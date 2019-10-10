import { Component, Input, OnInit, OnDestroy, OnChanges } from '@angular/core';
import { Select } from '@ngxs/store';
import { ProcessingElementState } from '@app/modules/system-models/state/processing-element.state';
import { Observable } from 'rxjs';
import { TreeNode } from '@app/core_module/interfaces/tree-node';
import { Store } from '@ngxs/store';
import { SRSState } from '@system-models/state/simulation-result-screen.state';
import { map } from 'rxjs/operators';
import { untilDestroyed } from 'ngx-take-until-destroy';

export interface Selection {
    objectId: string;
    aggregationMethod?: string;
    month?: string;
    dataType?: string;
}

enum ChartType {
    BREAKDOWN = 'BREAKDOWN',
    HISTOGRAM = 'HISTOGRAM',
    LINE = 'LINE',
    VALUE = 'VALUE',
    STACKED = 'STACKED'
}

@Component({
    selector: 'app-sr-visualization',
    templateUrl: './sr-visualization.component.html',
    styleUrls: ['./sr-visualization.component.css']
})
export class SrVisualizationComponent implements OnInit, OnDestroy, OnChanges {
    @Input() simulationResult: TreeNode;
    @Input() simResultId: string;
    @Input() selectedScenarioId;
    @Input() isDisplayedRelativeValues;
    @Input() aggregatedReportIndex;
    @Select(ProcessingElementState.errorWarningProcessingElements) errorWarningProcessingElements$: Observable<any[]>;
    errorWarningPes = [];
    title;
    chartType;
    id;
    ids = [];
    message;
    resultVariable;
    hasData: boolean;
    simulationResultProperties$: Observable<any>;

    selections: Selection[];

    constructor(private store: Store) { }

    ngOnInit() {
        this.simulationResultProperties$ = this.store.select(SRSState.resultById).pipe(map(byId => byId(this.simResultId)));
        this.simulationResultProperties$.pipe(untilDestroyed(this)).subscribe(simulationResultProperties => {
            if (simulationResultProperties) {
                this.selections = simulationResultProperties.selectedRows;
                this.hasData = this.selections.length !== 0;
                this.handleGraphSelections();
            }
        });
        this.errorWarningProcessingElements$.subscribe(errorWarningPes => {
            this.errorWarningPes = [...errorWarningPes];
        });
    }

    ngOnChanges() {
        this.hasData = this.selections !== undefined;
        if (this.selections && this.selections.length > 0) {
            this.selections.forEach(node => {
                const nodeId = node.objectId;
                this.resultVariable = this.simulationResult.content.nodes[nodeId];
                this.hasData = Object.keys(this.resultVariable['aggregatedReport']).findIndex(key => key === this.selectedScenarioId) !== -1 && this.hasResults(this.resultVariable);
            });
        }
    }

    ngOnDestroy() { }

    hasResults(node: any): boolean {
        const aggregatedReportData = node ? node.aggregatedReport[this.selectedScenarioId] : null;
        const aggregatedReportDataDataIndex = aggregatedReportData ? Object.keys(aggregatedReportData)[0] : null;
        const dataContent = aggregatedReportData ? aggregatedReportData[aggregatedReportDataDataIndex].data : null;
        const sliceContent = aggregatedReportData ? aggregatedReportData[aggregatedReportDataDataIndex].AVG : null;
        const hasSlice = sliceContent && node.type === 'SLICE';
        const isBreakdown = sliceContent && node.type === 'BREAKDOWN';
        return dataContent && JSON.stringify(dataContent) !== '{}' || hasSlice || isBreakdown;
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
     * that are selected. If there is no corresponding chart for a paricular selection, a message
     * is displayed instead
     */
    _getRowChartType(rowSelections) {
        // cannot have more that 2 rows selected at the moment
        if (rowSelections.length > 2) {
            this.chartType = undefined;
            this.message = 'Too many rows selected';
        } else if (rowSelections.length > 1 && this._hasBreakdownSelected(rowSelections)) {
            // cannot have a breakdown in a multi selection
            this.chartType = undefined;
            this.message = 'cannot include breakdowns in multiselection';
        } else {
            this.ids = [];
            for (const row of rowSelections) {
                this.ids.push(row.objectId);
            }
            this.id = this.ids[0];
            this.resultVariable = this.simulationResult.content.nodes[this.ids[0]];
            this._defineChartTitle(this.id);
            if (this.resultVariable.type === 'BREAKDOWN') {
                this.chartType = ChartType.STACKED;
            } else {
                this.chartType = ChartType.LINE;
            }
        }
    }

    /**
    * Determines the chart that should be displayed based on the types of cell
    * that is selected.
    */
    _getCellChartType(selectedCell) {
        this.id = selectedCell.objectId;
        this.resultVariable = this.simulationResult.content.nodes[this.id];
        this._defineChartTitle(this.id);
        if (this.resultVariable.type === 'BREAKDOWN') {
            this.chartType = ChartType.BREAKDOWN;
        } else if (this._isErrorWarningPe(this.resultVariable)) {
            this.chartType = ChartType.VALUE;
        } else {
            // other types are time series which will display a histogram if included in the report
            if (this.resultVariable.aggregationMethods.includes('HISTOGRAM')) {
                this.chartType = ChartType.HISTOGRAM;
            } else {
                this.chartType = ChartType.VALUE;
            }
        }
    }

    /**
    * trace back selected variable name to display full path name as chart title
    */
    _defineChartTitle(id: string) {
        const parentId = this.simulationResult.content.nodes[id].parentInstanceId;
        const parentVariable = this.simulationResult.content.nodes[parentId];
        if (parentVariable.type === 'BREAKDOWN') {
            this.title = parentVariable.name || parentVariable.ref;
            this._defineChartTitle(parentId);
        } else if (parentId === 'root') {
            this.title = this.resultVariable.name || this.resultVariable.ref;
        } else {
            this.title = this.title !== undefined ?
                (parentVariable.name || parentVariable.ref) + '.' + this.title + '.' + (this.resultVariable.name || this.resultVariable.ref) :
                (parentVariable.name || parentVariable.ref) + '.' + (this.resultVariable.name || this.resultVariable.ref);
        }
    }

    /**
     * checks if one of the selected rows is of type breakdown
     */
    _hasBreakdownSelected(rowSelections) {
        for (const row of rowSelections) {
            const resultVariable = this.simulationResult.content.nodes[row.objectId];
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
