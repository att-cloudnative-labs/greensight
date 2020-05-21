import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Unit } from '@cpt/interfaces/unit';
import { Store } from '@ngxs/store';
import { UnitDelete } from '@cpt/state/variable-unit.actions';

@Component({
    selector: 'variable-unit-entry',
    templateUrl: './variable-unit-entry.component.html',
    styleUrls: ['./variable-unit-entry.component.css']
})
export class VariableUnitEntryComponent {
    @Input() unit: Unit;

    constructor(private store: Store) {
    }

    deleteUnit() {
        this.store.dispatch(new UnitDelete(this.unit));
    }
}
