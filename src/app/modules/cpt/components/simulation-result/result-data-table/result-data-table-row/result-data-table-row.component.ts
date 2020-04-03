import { Component, Input, OnInit, Output, EventEmitter, HostBinding, OnChanges } from '@angular/core';
import { Select } from '@ngxs/store';
import { ProcessingElementState } from '@cpt/state/processing-element.state';
import { Observable } from 'rxjs';
import { SimulationResult } from '@cpt/capacity-planning-simulation-types';

@Component({
    selector: '[app-result-data-table-row]',
    templateUrl: './result-data-table-row.component.html',
    styleUrls: ['./result-data-table-row.component.css']
})
export class ResultDataTableRowComponent implements OnInit, OnChanges {
    @Input() simResult: SimulationResult;
    // the id and aggregation method of the result variable
    @Input() resultVariableRef;
    @Input() dataType: string;
    @Input() selectedCell;
    @Input() aggregatedReportIndex;
    @Input() selectedScenarioId;
    @HostBinding('class.selected') @Input('selected') selected = true;
    @Output() rowClicked = new EventEmitter();
    @Output() rowShiftClicked = new EventEmitter();
    @Output() rowCtrlClicked = new EventEmitter();
    @Output() cellClicked = new EventEmitter();
    @Output() aggregationMethodChanged = new EventEmitter();
    @Select(ProcessingElementState.errorWarningProcessingElements) errorWarningProcessingElements$: Observable<any[]>;
    // only dealing with one scenario for now so hardcoding the scenario Id
    selectedScenario = 'default';
    resultVariable;
    resultVariableReport = [];
    isResponse = false;

    hasData: boolean;
    isErrorWarningPe;

    usableAggregationMethods: string[] = [];
    selectedAggregationMethod: string;

    ngOnInit() {
        this.isResponse = this.dataType === 'response';
    }

    ngOnChanges() {
        const dataType = this.dataType;
        this.resultVariable = this.simResult.nodes[this.resultVariableRef.objectId];
        // only dealing with one scenario for no so getting the first scenario in the aggregated report
        let aggregatedReport = this.resultVariable.aggregatedReport[this.selectedScenarioId];
        aggregatedReport = aggregatedReport ? aggregatedReport : this.resultVariable.aggregatedReport[Object.keys(this.resultVariable.aggregatedReport)[0]];
        this.hasData = Object.keys(this.resultVariable['aggregatedReport']).findIndex(key => key === this.selectedScenarioId) !== -1 && this.hasResults(this.resultVariable);

        const dataContent = this.getDataContent(this.resultVariable);
        //FIXME: there seems to be an intermediate state where variables
        // that should be disabled are still passed.
        if (!dataContent) {
            return;
        }
        this.usableAggregationMethods = this.resultVariable.aggregationMethods.filter(method => dataContent[method]);
        this.selectedAggregationMethod = this.resultVariableRef.aggregationMethod;
        if (this.usableAggregationMethods.findIndex(method => method === this.selectedAggregationMethod) < 0) {
            this.selectedAggregationMethod = this.usableAggregationMethods.pop();
        }

        // turn the report object into an array
        this.resultVariableReport = Object.keys(aggregatedReport).map(function(month) {
            // get month result if its stored in a data field or on the month field
            const data = aggregatedReport[month][dataType] ? aggregatedReport[month][dataType] : aggregatedReport[month];
            return { month: month, data: data };
        });

        this.errorWarningProcessingElements$.subscribe(errorWarningPes => {
            this.isErrorWarningPe = errorWarningPes.findIndex(el => el.objectId === this.resultVariable.ref) !== -1;
        });
    }

    private getDataContent(node: any): any {
        const aggregatedReportData = node ? node.aggregatedReport[this.selectedScenarioId] : null;
        const aggregatedReportDataDataIndex = aggregatedReportData ? Object.keys(aggregatedReportData)[0] : null;
        return aggregatedReportData ? aggregatedReportData[aggregatedReportDataDataIndex][this.dataType] : null;

    }

    hasResults(node: any): boolean {
        const dataContent = this.getDataContent(node);
        const sliceContent = dataContent ? dataContent.AVG : null;
        const hasSlice = sliceContent && node.type === 'SLICE';
        const isBreakdown = sliceContent && node.type === 'BREAKDOWN';
        return dataContent && JSON.stringify(dataContent) !== '{}' || hasSlice || isBreakdown;
    }

    onVariableNameClicked(event: MouseEvent) {
        if (event.ctrlKey || event.metaKey) {
            this.rowCtrlClicked.emit({
                objectId: this.resultVariableRef.objectId,
                aggregationMethod: this.resultVariableRef.aggregationMethod,
                dataType: this.dataType
            });
        } else if (event.shiftKey) {
            this.rowShiftClicked.emit();
        } else {
            this.rowClicked.emit({
                objectId: this.resultVariableRef.objectId,
                aggregationMethod: this.resultVariableRef.aggregationMethod,
                dataType: this.dataType
            });
        }
    }

    /**
     * Emits information relating to the cell in the row that was clicked that can be used to determine
     * the type of chart to display.
     * @param month the month that the value belongs to
     */
    onValueClicked(month) {
        this.cellClicked.emit({
            month: month,
            objectId: this.resultVariableRef.objectId,
            aggregationMethod: this.resultVariableRef.aggregationMethod,
            dataType: this.dataType
        });
    }

    /**
     * Determines if a specifed cell is currently selected
     * @param month the month that the cell corresponds to
     */
    isSelectedCell(month) {
        return (this.selectedCell !== undefined && this.selectedCell.month === month &&
            this.selectedCell.objectId === this.resultVariableRef.objectId && this.selectedCell.dataType === this.dataType);
    }

    // TODO: We might not need this once we stop using a fixture,
    onAggregationMethodChange(newAggMethod) {
        // this.resultVariableRef.aggregationMethod = newAggMethod;
        this.aggregationMethodChanged.emit({ ...this.resultVariableRef, aggregationMethod: newAggMethod });
    }

    get isAResponse() {
        if (this.isResponse) {
            return 'Response';
        } else {
            return 'Load';
        }
    }
}
