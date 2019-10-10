import { Component, OnInit, Input, Output, EventEmitter, HostListener, OnChanges, OnDestroy, ChangeDetectorRef } from '@angular/core';
import * as moment from 'moment';
import { Store } from '@ngxs/store';
import * as simulationResultScreenActions from '@system-models/state/simulation-result-screen.actions';
import { TableEntryProperties, SRSDatatableProperties } from '@app/modules/system-models/models/srs-datatable-properties';
import { SimulationNode } from '@cpt/capacity-planning-simulation-types';
import { SRSState } from '@system-models/state/simulation-result-screen.state';
import { SelectionState } from '@system-models/state/selection.state';
import { TreeState } from '@system-models/state/tree.state';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, filter, take } from 'rxjs/operators';
import { untilDestroyed } from 'ngx-take-until-destroy';

interface FlatNode {
    result: any;
    level: number;
    expandable: boolean;
    expanded: boolean;
}

@Component({
    selector: 'app-result-data-table',
    templateUrl: './result-data-table.component.html',
    styleUrls: ['./result-data-table.component.css']
})
export class ResultDataTableComponent implements OnInit, OnChanges, OnDestroy {
    @Input() simResult;
    @Input() simResultId;
    @Input() aggregatedReportIndex;
    @Input() selectedScenarioId;
    @Output() rowSelectionUpdated = new EventEmitter();
    @Output() cellSelectionUpdated = new EventEmitter();
    // the months which the simulation ran for
    months = [];
    selectedRows = [];
    selectedCell = undefined;
    selection = new Array<any>();
    selectionPosition: number[] = [];
    simulationResultProperties$: Observable<SRSDatatableProperties>;


    tableEntries = [];

    tableEntries$$: BehaviorSubject<TableEntryProperties[]> = new BehaviorSubject([]);
    tableEntries$: Observable<TableEntryProperties[]> = this.tableEntries$$.asObservable();

    flatNodes: FlatNode[] = [];
    PRIORITIES = {
        'PROCESS_INPORT': 0,
        'PROCESS_OUTPORT': 1,
        'GRAPH_MODEL': 2,
        'PROCESSING_ELEMENT': 3,
    };
    nodesToRemove = [];
    hasData: boolean;
    simProperties: any;
    isFocused = false;

    constructor(private store: Store, private changeDetector: ChangeDetectorRef) {
    }

    ngOnInit() {
        this.simulationResultProperties$ = this.store.select(SRSState.resultById).pipe(map(byId => byId(this.simResultId)));
        this.simulationResultProperties$.pipe(untilDestroyed(this)).subscribe(simulationResultProperties => {
            if (simulationResultProperties) {
                this.simProperties = simulationResultProperties;
                this.reConfigDataEntries();
            }
        });

        // see if we're focused so we only process
        // keys when needed
        this.store.select(SelectionState).pipe(
            untilDestroyed(this)).subscribe(selection => {
                let focused = false;
                if (selection.length === 1) {
                    if (selection[0].id === this.simResultId) {
                        focused = true;
                    }
                }
                this.isFocused = focused;
            });
    }

    ngOnChanges() {
        const resultArray: SimulationNode[] = Object.values(this.simResult.nodes);
        for (let index = 0; index < resultArray.length; index++) {
            const scenarioIds = Object.keys(resultArray[index].aggregatedReport);
            const scenarioIdIndex = scenarioIds.findIndex(id => id === this.selectedScenarioId);
            if (scenarioIdIndex === -1 && resultArray[index].processNodeId !== 'root' && (resultArray[index].type === 'BREAKDOWN' || resultArray[index].type === 'SLICE')) {
                this.nodesToRemove.push(resultArray[index]);
            }
        }
        this.nodesToRemove.forEach(node => {
            resultArray.splice(resultArray.findIndex(x => x === node), 1);
        });
        this.nodesToRemove = [];
        const root = resultArray.find(node => node.processNodeId === 'root');
        this.flatNodes = this.flatten(resultArray, root, 0);
        this.reConfigDataEntries();
        this.months = [];
        this.getResultMonths();
    }

    ngOnDestroy() { }

    reConfigDataEntries() {
        this.hasData = false;
        if (this.simProperties) {
            this.tableEntries = this.simProperties.tableEntries;
            this.simProperties = this.simProperties;
            if (this.simProperties.selectedRows.length === 1 && this.simProperties.selectedRows[0].month) {
                this.selectedCell = JSON.parse(JSON.stringify(this.simProperties.selectedRows[0]));
            } else if (this.simProperties.selectedRows.length > 0) {
                this.selectedRows = JSON.parse(JSON.stringify(this.simProperties.selectedRows));
            }
        }
        this.tableEntries.forEach(entry => {
            if (!this.hasResults(this.flatNodes.find(x => x.result.objectId === entry.objectId), entry.dataType)) {
                if (this.selectedRows.find(selectedRow => selectedRow.objectId === entry.objectId) && entry.aggregationMethod !== 'MESSAGES') {
                    this.selectedRows = this.selectedRows.filter(selectedRow => selectedRow.objectId !== entry.objectId);
                    this.rowSelectionUpdated.emit(this.selectedRows);
                }
                this.hasData = this.hasData ? this.hasData : false;
                this.hasData = entry.aggregationMethod === 'MESSAGES' || this.hasData ? true : false;
            } else if (this.hasResults(this.flatNodes.find(x => x.result.objectId === entry.objectId), entry.dataType) || entry.aggregationMethod === 'MESSAGES') {
                this.hasData = true;
            }
        });
    }

    @HostListener('document:keydown', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent) {
        if (!this.isFocused) {
            return;
        }
        const modalOpen = $('.modal-open');
        // handle Tab key selection event
        if (event.key === 'Tab' && this.selection.length) {
            event.preventDefault();
            if (modalOpen.length === 0) {
                this.handleDatatableKeyboardEvents(event);
            }
        }
        // handle Delete key selection event
        if ((event.key === 'Delete' || event.key === 'Backspace') && this.selection.length) {
            event.preventDefault();
            if (modalOpen.length === 0) {
                this.handleDatatableKeyboardEvents(event);
            }
        }
        if (event.which === 37 || event.which === 38 || event.which === 39 || event.which === 40) {
            event.preventDefault();
            if (this.selection.length && modalOpen.length === 0) {
                this.handleDatatableKeyboardEvents(event);
            }
        }
    }

    handleDatatableKeyboardEvents(event) {
        let nextPosition = Object.assign([], this.selectionPosition);
        let switchToCell = false;
        if (this.selectionPosition.length === 0) {
            return;
        } else {
            switch (event.which) {
                case 37: {
                    if (nextPosition[1] !== 0) {
                        nextPosition[1]--;
                    } else {
                        this.onRowSelected(this.tableEntries[nextPosition[0]], nextPosition[0]);
                    }
                    break;
                }
                case 38: {
                    if (nextPosition[0] !== 0) {
                        nextPosition[0]--;
                    }
                    break;
                }
                case 39: {
                    if (nextPosition[1] < this.months.length - 1 && this.selection[0].month === undefined) {
                        switchToCell = true;
                    } else if (nextPosition[1] < this.months.length - 1) {
                        nextPosition[1]++;
                    }
                    break;
                }
                case 40: {
                    if (nextPosition[0] < this.tableEntries.length - 1) {
                        nextPosition[0]++;
                    }
                    break;
                }
                case 8: {
                    this.removeSelectedRows();
                    break;
                }
                case 46: {
                    this.removeSelectedRows();
                    break;
                }
                case 9: {
                    if (event.shiftKey) {
                        if (nextPosition[1] !== 0) {
                            nextPosition[1]--;
                        } else {
                            this.onRowSelected(this.tableEntries[nextPosition[0]], nextPosition[0]);
                        }
                    } else {
                        if (nextPosition[1] < this.months.length - 1 && this.selection[0].month === undefined) {
                            switchToCell = true;
                        } else if (nextPosition[1] < this.months.length - 1) {
                            nextPosition[1]++;
                        }
                    }
                    break;
                }
                default: {
                    break;
                }

            }
        }
        nextPosition = this.getNextSelectableFrame(nextPosition, event);
        if (nextPosition) {
            this.selectionPosition = nextPosition[0] >= 0 ? nextPosition : undefined;
            const nextRow = this.tableEntries[nextPosition[0]];
            if (this.selection[0].month && nextRow || switchToCell) {
                switchToCell = false;
                const month = moment(this.months[nextPosition[1]], 'MMM-YY').format('YYYY-MM');
                this.onCellSelected({ month: month, objectId: nextRow.objectId, aggregationMethod: nextRow.aggregationMethod, dataType: nextRow.dataType }, nextPosition[0]);
            } else if (event.which === 38 || event.which === 40 && nextRow) {
                this.onRowSelected(nextRow, nextPosition[0]);
            }
        }
    }

    /**
     * Checks if the frame at the specified coordinates is a selectable one
     */
    getNextSelectableFrame(frameCoordinates: number[], event) {
        while (frameCoordinates[0] >= 0 && frameCoordinates[0] <= this.tableEntries.length - 1) {
            if (this.hasResults(this.flatNodes.find(x => x.result.objectId === this.tableEntries[frameCoordinates[0]].objectId), this.tableEntries[frameCoordinates[0]].dataType)) {
                return frameCoordinates;
            } else {
                if (event.which === 38 || event.which === 37) {
                    frameCoordinates[0]--;
                } else if (event.which === 40 || event.which === 39) {
                    frameCoordinates[0]++;
                }
            }
        }
        return;
    }
    /**
     * determines the months that the simulation ran for using the step start
     * and step last months defined in the simulation configuration
     */
    getResultMonths() {
        let startDate = moment(this.simResult.stepStart, 'YYYY-MM');
        const endDate = moment(this.simResult.stepLast, 'YYYY-MM').add(1, 'month');

        while (startDate.isBefore(endDate)) {
            this.months.push(startDate.format('MMM-YY'));
            startDate = startDate.add(1, 'month');
        }
    }

    /**
     * adds a row to the list of currently selected rows
     * if the shift key isnt pressed, all selected rows are cleared before adding the newly selected row
     * @param row the id of the variable that belongs to the selected row and the currently selected aggregation method for that row
     * @param isShiftClick if the shift key was held down when the selection was made
     */
    onRowSelected(row, rowIndex, isCtrlClick?) {
        // deselect any selected cell
        if (!isCtrlClick) {
            this.selectedCell = undefined;
            this.selectedRows = [];
            this.store.dispatch(new simulationResultScreenActions.DatatableSingleRowSelected(
                {
                    simulationId: this.simResultId,
                    nodeId: row.objectId,
                    aggregationMethod: row.aggregationMethod,
                    dataType: row.dataType
                }));
        } else {
            this.store.dispatch(new simulationResultScreenActions.DatatableMultiRowSelected(
                {
                    simulationId: this.simResultId,
                    nodeId: row.objectId,
                    aggregationMethod: row.aggregationMethod,
                    dataType: row.dataType
                }));
        }
        this.selection.splice(0, this.selection.length);
        this.selection.push(row);
        this.selectionPosition = [rowIndex, 0];
        this.rowSelectionUpdated.emit(this.selectedRows);
    }

    /**
     * selects all rows between the previous selection and the latest selection
     * @param clickedRowIndex the index of the row that was selected
     */
    onRowShiftSelected(clickedRowIndex) {
        const anchor = this.selectedRows[this.selectedRows.length - 1];
        const anchorIndex = this.tableEntries.findIndex(tableEntry =>
            tableEntry.objectId === anchor.objectId);
        const start = Math.min(anchorIndex, clickedRowIndex);
        const end = Math.max(anchorIndex, clickedRowIndex);
        for (let i = start; i <= end; i++) {
            const row = this.tableEntries[i];
            const rowIndex = this.selectedRows.findIndex(selectedRow =>
                selectedRow.objectId === row.objectId);
            if (rowIndex === -1) {
                this.selectedRows.push(row);
            }

            this.store.dispatch(new simulationResultScreenActions.DatatableMultiRowSelected(
                {
                    simulationId: this.simResultId,
                    nodeId: row.objectId,
                    aggregationMethod: row.aggregationMethod,
                    dataType: row.dataType
                }));
        }
        this.rowSelectionUpdated.emit(this.selectedRows);
    }

    /**
     * Selects a cell in the data table.
     * Only one cell can be selected at a time so any new selection replaces the previous selection.
     * If the cell is already selected, the selection is cleared
     * @param cellData the cell's month and the id of the variable that the cell belongs to
     */
    onCellSelected(cellData, rowIndex: number) {
        this.selectedRows = [];
        this.selectedCell = cellData;
        this.selection.splice(0, this.selection.length);
        this.selection.push(this.selectedCell);
        this.selectionPosition = [rowIndex, this.months.indexOf(moment(this.selectedCell.month).format('MMM-YY'))];
        this.cellSelectionUpdated.emit(this.selectedCell);
        this.store.dispatch(new simulationResultScreenActions.DatatableCellSelected(
            {
                simulationId: this.simResultId,
                nodeId: this.selectedCell.objectId,
                month: this.selectedCell.month,
                aggregationMethod: this.selectedCell.aggregationMethod,
                dataType: this.selectedCell.dataType
            }));
    }

    /**
     * Determines if a row in the data table is one of the currently selected rows
     * @param tableEnty table entryvof the variable belonging to the row to be
     * checked if its selected
     */
    isSelectedRow(tableEntry: TableEntryProperties) {
        return this.selectedRows.find(selectedRow => selectedRow.objectId === tableEntry.objectId && selectedRow.dataType === tableEntry.dataType) !== undefined;
    }

    handleDrop(dragItem) {
        // This should dispatch an NGXS action when we're hooked up to the backend.
        // For now we mutate local state.
        const selection = dragItem.data;
        selection.forEach(node => {
            const result = node.result;
            // FIXME: hard coding the first scenario, will remove before merging
            const aggregatedReportData = node.result.aggregatedReport[this.selectedScenarioId];
            const aggregatedReportDataIndex = aggregatedReportData ? Object.keys(aggregatedReportData)[0] : null;
            const dataContent = aggregatedReportData ? aggregatedReportData[aggregatedReportDataIndex][node.dataType] : null;
            const sliceContent = dataContent ? dataContent.AVG : null;
            const hasSlice = sliceContent && node.result.type === 'SLICE';
            const isBreakdown = sliceContent && node.result.type === 'BREAKDOWN';
            // we can't add results that don't have an aggregation report.
            if (!result.aggregationMethods || result.aggregationMethods.length === 0 ||
                !result.aggregatedReport || Object.keys(result.aggregatedReport).length === 0 ||
                (JSON.stringify(dataContent) === '{}' || JSON.stringify(dataContent) === undefined && !hasSlice && !isBreakdown)) {
                return;
            }
            this.hasData = true;
            const { objectId } = result;
            const existing = this.tableEntries.find(x => x.objectId === objectId && x.dataType === node.dataType);
            if (!existing) {
                // select the first aggregation method that isnt a histogram
                const aggregationMethod = result.aggregationMethods.find(method => method !== 'HISTOGRAM');
                this.store.dispatch(new simulationResultScreenActions.DatatableEntryAdded({ simulationId: this.simResultId, nodeId: objectId, aggregationMethod: aggregationMethod, dataType: node.dataType }));
            }
        });
    }

    /**
     * Updates the aggregation method on selected rows
     * @param newRow the object id of the the variable belonging to the row
     * its new aggregation method
     */
    updateSelectedAggregationMethod(newRow) {
        this.store.dispatch(new simulationResultScreenActions.DatatableRowAggregationMethodChanged(
            {
                simulationId: this.simResultId,
                nodeId: newRow.objectId,
                aggregationMethod: newRow.aggregationMethod,
                dataType: newRow.dataType
            }));
        const oldRow = this.selectedRows.find(row => row.objectId === newRow.objectId);
        if (this.selectedCell && newRow.objectId === this.selectedCell.objectId && newRow.dataType === this.selectedCell.dataType) {
            this.selectedCell.aggregationMethod = newRow.aggregationMethod;
            this.onCellSelected(this.selectedCell, this.selectionPosition[0]);
        }
        if (oldRow) {
            oldRow.aggregationMethod = newRow.aggregationMethod;
            this.rowSelectionUpdated.emit(this.selectedRows);
        }
    }

    removeSelectedRows() {
        this.store.dispatch(new simulationResultScreenActions.DatatableEntryRemoved({ simulationId: this.simResultId, selectedRows: this.selectedRows }));

        this.selectedRows = [];
        this.rowSelectionUpdated.emit(this.selectedRows);
    }

    private flatten(nodes, current, level): FlatNode[] {
        let out: FlatNode[] = [];

        const children = Object.values(nodes).filter((x: any) => {
            return (
                x.parentInstanceId === current.objectId
                && (x.aggregatedReport || x.subNodeInstanceIds)
            );
        }).sort((a: any, b: any) => {
            return this.PRIORITIES[a.type] - this.PRIORITIES[b.type];
        });
        // ignoring Connection result nodes for now
        if (current.type !== 'CONNECTION') {
            out.push({
                result: current,
                level,
                expandable: !!children.length,
                expanded: level === 0
            });
        }
        children.forEach(child => {
            out = out.concat(this.flatten(nodes, child, level + 1));
        });

        return out;
    }

    hasResults(node: FlatNode, dataType: string): boolean {
        const aggregatedReportData = node ? node.result.aggregatedReport[this.selectedScenarioId] : null;
        const aggregatedReportDataDataIndex = aggregatedReportData ? Object.keys(aggregatedReportData)[0] : null;
        const dataContent = aggregatedReportData ? aggregatedReportData[aggregatedReportDataDataIndex][dataType] : null;
        const sliceContent = dataContent ? dataContent.AVG : null;
        const hasSlice = sliceContent && node.result.type === 'SLICE';
        const isBreakdown = sliceContent && node.result.type === 'BREAKDOWN';
        return dataContent && JSON.stringify(dataContent) !== '{}' || hasSlice || isBreakdown;
    }
}
