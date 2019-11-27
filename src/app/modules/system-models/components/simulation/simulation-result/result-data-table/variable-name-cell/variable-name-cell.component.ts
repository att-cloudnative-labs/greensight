import { Component, Input, OnInit, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { SimulationResult, SimulationNode } from '@cpt/capacity-planning-simulation-types';
import { getPreviousOrParentTNode } from '@angular/core/src/render3/state';

@Component({
    selector: 'app-variable-name-cell',
    templateUrl: './variable-name-cell.component.html',
    styleUrls: ['./variable-name-cell.component.css']
})
export class VariableNameCellComponent implements OnInit, OnChanges {
    @Input() aggregationMethod: string;
    @Input() availableAggregationMethods: string[];
    @Input() resultVariable;
    @Input() simResult: SimulationResult;
    @Input() isErrorWarning = false;
    @Input() isResponse = false;
    @Output() aggregationChanged = new EventEmitter();
    name: string;
    hasAggMethod = true;
    fullPathName: string;
    aggregationOptions: string[] = [];
    errorWarningIcon: string;
    ICONS = {
        'GRAPH_MODEL': 'fa-cube',
        'PROCESS_INPORT': 'fa-long-arrow-alt-right',
        'PROCESS_OUTPORT': 'fa-long-arrow-alt-left',
        'PROCESSING_ELEMENT': 'fa-microchip',
        'BREAKDOWN': 'fa-chart-pie',
        'SLICE': 'fa-chart-line',
        'BROADCAST_VARIABLE': 'fa-wifi',
        'NAMED_VARIABLE': 'fa-angle-double-right'
    };
    ErrorWarninIcons = {
        'Error': 'fa-times'
    };

    aggregationMethodsMap = {
        'AVG': 'AVG',
        'MIN': 'MIN',
        'MAX': 'MAX',
        'NINETIETH': 'P90',
        'NINETIEFIFTH': 'P95',
        'NINETIENINTH': 'P99'
    };

    ngOnInit() {

    }

    ngOnChanges(changes: SimpleChanges): void {
        this.aggregationMethodsMap = {
            'AVG': 'AVG',
            'MIN': 'MIN',
            'MAX': 'MAX',
            'NINETIETH': 'P90',
            'NINETIEFIFTH': 'P95',
            'NINETIENINTH': 'P99'
        };
        this.getSelectableAggMethods();
        this.name = this.getNodeName(this.resultVariable.objectId, false);
        this.fullPathName = this.getNodeName(this.resultVariable.objectId, true);
        if (this.isErrorWarning) {
            this._getErrorWarningIcon();
        }
        this.hasAggMethod = (Object.keys(this.aggregationMethodsMap).length !== 0);
    }

    getNodeName(id: string, withRoot: boolean): string {
        const parentId = this.simResult.nodes[id].parentInstanceId;
        const parentVariable = this.simResult.nodes[parentId];
        const currentVariable = this.simResult.nodes[id];
        const thisVariableName = currentVariable.name || currentVariable.ref;
        if (parentVariable && currentVariable) {
            if (parentVariable.processNodeId !== 'root') {
                return this.getNodeName(parentId, withRoot) + "." + thisVariableName;
            } else {
                if (withRoot) {
                    return (parentVariable.name || parentVariable.ref) + "." + thisVariableName;
                } else {
                    return thisVariableName;
                }

            }
        } else {
            return "";
        }
    }

    // To stop the row from being selected when the aggregation dropdown is clicked
    onAggregationClick(event) {
        event.stopPropagation();
    }

    // TODO: We might not need this once we stop using a fixture,
    // we could probably update the table entries array on the result in the state
    onAggregationChange(event) {
        this.aggregationChanged.emit(this.aggregationMethod);
    }

    /**
     * TODO: only ignoring Histogram for now, may need to be updated hide other
     * aggregation methods that are not relevant to the datatable
     */
    getSelectableAggMethods() {
        this.aggregationOptions = this.availableAggregationMethods.filter(method => method !== 'HISTOGRAM' && method !== 'ASPECTS');
        Object.keys(this.aggregationMethodsMap).forEach(k => {
            const index = this.aggregationOptions.findIndex(x => x === k);
            if (index === -1) {
                delete this.aggregationMethodsMap[k];
            }
        });
    }

    /**
     * TODO: hard-coding error and warning PEs for now. Prob need a better solution for getting the icons
     */
    _getErrorWarningIcon() {
        if (this.resultVariable.ref === '41c22bcb-f966-406a-8814-a7b8e187b508') {
            this.errorWarningIcon = 'fa-times';
        } else {
            this.errorWarningIcon = 'fa-exclamation-triangle';
        }
    }
}
