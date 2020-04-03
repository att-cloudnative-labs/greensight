import { Component, Input, OnInit, OnChanges, Output, EventEmitter } from '@angular/core';
import { TreeNode } from '@cpt/interfaces/tree-node';
import { ForecastVariableRefParam, InportParam } from '@cpt/capacity-planning-simulation-types/lib';
import { ForecastVariableDescriptor } from '@cpt/interfaces/forecast-variable-descriptor';
import { Observable } from 'rxjs';


@Component({
    selector: 'app-simulation-scenario-table',
    templateUrl: './simulation-scenario-table.component.html',
    styleUrls: ['./simulation-scenario-table.component.css']
})
export class SimulationScenarioTableComponent implements OnInit, OnChanges {
    @Input() simulation: TreeNode;
    @Input() scenarioId: string;
    @Input() scenario;
    @Input() deleteDisabled: boolean;
    @Input() reloadOnChange: boolean;
    @Input() variableDescriptors: Observable<ForecastVariableDescriptor[]>;
    @Output('onDeleteScenario') onDeleteScenario = new EventEmitter();
    @Output() renameScenario = new EventEmitter();


    scenarioInportIds = [];
    scenarioInports = {};
    graphModelInportInfos: { [inportId: string]: InportParam | ForecastVariableRefParam } = {};
    isExpanded = true;
    showEdit = false;
    rowReload = false;


    ngOnInit() {

    }

    ngOnChanges() {

        this.graphModelInportInfos = this.simulation.content.inports || {};
        const scenarioInportIds = Object.keys(this.scenario.inports) || [];
        const graphModelInportIds = Object.keys(this.graphModelInportInfos) || [];
        const availableInportIds = scenarioInportIds.filter(id => graphModelInportIds.find(i => i === id));

        this.scenarioInportIds = availableInportIds;
        this.scenarioInports = this.scenario.inports;

        if (this.reloadOnChange !== this.rowReload) {
            this.rowReload = this.reloadOnChange;
        }
    }

    handleExpandClick(event) {
        event.preventDefault();
        this.isExpanded = !this.isExpanded;
    }

    removeScenario(event) {
        this.onDeleteScenario.emit(event);
    }

    onEdit() {
        this.showEdit = true;
    }

    onRenameScenario(event) {
        this.showEdit = false;
        if (event !== this.scenario.name && event !== '') {
            this.renameScenario.emit(event);
        }
    }

    onCancelRename() {
        this.showEdit = false;
    }
}
