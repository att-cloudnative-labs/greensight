import { Component, OnInit, Input, EventEmitter, Output, OnDestroy } from '@angular/core';
import { Store } from '@ngxs/store';

import { Variable, Connection } from '@system-models/models/graph-model.model';
import * as gmVariablePickerActions from '@system-models/state/gm-variable-picker.actions';

@Component({
    selector: 'app-gm-variable-picker',
    templateUrl: './gm-variable-picker.component.html',
    styleUrls: ['./gm-variable-picker.component.css']
})
export class GmVariablePickerComponent implements OnInit, OnDestroy {
    @Input() variables: Variable[] = [];
    @Input() connections: Connection[] = [];
    @Input() graphModelId: string;
    @Input() originPortId: string;
    @Input() originPortType: string;
    @Input() x;
    @Input() y;
    @Output() onPick = new EventEmitter();

    constructor(private store: Store) { }

    get availableVariables(): Variable[] {
        const connectionsToOriginPort = this.connections.filter(x => x.source === this.originPortId || x.destination === this.originPortId);

        connectionsToOriginPort.forEach(connection => {
            this.variables = this.variables.filter(xVar => xVar.objectId !== connection.source && xVar.objectId !== connection.destination);
        });
        if (this.originPortType === 'source') {
            return this.variables.filter(x => x.objectType === 'BROADCAST_VARIABLE' || (x.objectType === 'NAMED_VARIABLE' && !x.metadata.references.find(ref => ref.portType === 'destination')));
        } else {
            return this.variables;
        }
    }

    ngOnInit() {
        console.log('initializing the variable picker!');
    }

    ngOnDestroy() {
        console.log('destroying the variable picker!');
    }

    addNamedVariable() {
        const { graphModelId, originPortId, x, y } = this;
        this.store.dispatch(new gmVariablePickerActions.AddNamedVariableClicked({
            graphModelId,
            originPortId,
            x,
            y
        }));
        this.onPick.emit();
    }

    addBroadcastVariable() {
        const { graphModelId, originPortId, x, y } = this;
        this.store.dispatch(new gmVariablePickerActions.AddBroadcastVariableClicked({
            graphModelId,
            originPortId,
            x,
            y
        }));
        this.onPick.emit();
    }

    linkTo(variable: Variable) {
        console.log(this.x, this.y);
        const { graphModelId, originPortId, originPortType, x, y } = this;
        this.store.dispatch(new gmVariablePickerActions.LinkToVariableClicked({
            graphModelId,
            originPortId,
            originPortType,
            variableId: variable.id,
            x,
            y
        }));
        this.onPick.emit();
    }
}
