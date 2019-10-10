import { Component, OnInit, Input } from '@angular/core';
import { Store } from '@ngxs/store';
import { TreeNode } from '@app/core_module/interfaces/tree-node';
import * as treeActions from '@system-models/state/tree.actions';
import { PermissionsObject } from '@app/shared/interfaces/permissions';
import { Utils } from '@app/utils_module/utils';


@Component({
    selector: 'app-tree-node-details',
    templateUrl: './tree-node-details.component.html',
    styleUrls: ['../details.common.css', './tree-node-details.component.css']
})
export class TreeNodeDetailsComponent implements OnInit {
    permissionsObj: PermissionsObject;
    description: string;
    _selectedNode;


    @Input() set selected(selected) {
        this._selectedNode = selected.object;
        this.permissionsObj = { permissions: 'MODIFY', accessObject: this.selectedNode };
        this.description = this.selectedNode && this.selectedNode.description;
    }

    get selectedNode(): TreeNode {
        return this._selectedNode;
    }

    constructor(private store: Store) { }

    ngOnInit() {
    }

    get displayAccess() {
        return this.selectedNode.ownerName === Utils.getUserName();
    }

    get isFolder() {
        return this.selectedNode.type === 'FOLDER';
    }

    get isGraphModel() {
        return this.selectedNode.type === 'MODEL';
    }

    get isGraphModelTemplate() {
        return this.selectedNode.type === 'MODELTEMPLATE';
    }

    get isSimulation() {
        return this.selectedNode.type === 'SIMULATION';
    }

    get isSimulationResult() {
        return this.selectedNode.type === 'SIMULATIONRESULT';
    }

    saveDescription() {
        if (this.selectedNode.description !== this.description) {
            this.store.dispatch(new treeActions.DescriptionChanged({
                nodeId: this.selectedNode.id,
                newDescription: this.description
            }));
        }
    }
}
