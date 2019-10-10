import { Component, Input, OnInit, OnChanges, Output, EventEmitter } from '@angular/core';
import { TreeNode } from '@app/core_module/interfaces/tree-node';


@Component({
    selector: 'app-simulation-scenario-table',
    templateUrl: './simulation-scenario-table.component.html',
    styleUrls: ['./simulation-scenario-table.component.css']
})
export class SimulationScenarioTableComponent implements OnInit, OnChanges {
    @Input() selectedModel: TreeNode;
    @Input() simulation: TreeNode;
    @Input() scenarioId: string;
    @Input() scenario;
    @Input() scenarioIds;
    @Output('onDeleteScenario') onDeleteScenario = new EventEmitter();
    @Output() renameScenario = new EventEmitter();


    scenarioInportIds = [];
    scenarioInports = {};
    isExpanded = true;
    deleteDisabled: boolean;
    showEdit = false;


    ngOnInit() {

    }

    ngOnChanges() {
        this.deleteDisabled = this.scenarioId !== this.scenarioIds[0];
        this.scenarioInportIds = Object.keys(this.scenario.inports);
        this.scenarioInports = this.scenario.inports;
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
