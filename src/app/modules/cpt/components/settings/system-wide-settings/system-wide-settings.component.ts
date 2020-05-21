import { Component, OnDestroy, OnInit } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { VariableUnitState } from '@cpt/state/variable-unit.state';
import { UnitAdd } from '@cpt/state/variable-unit.actions';
import { Observable } from 'rxjs';
import { Unit } from '@cpt/interfaces/unit';

;

@Component({
    selector: 'system-wide-settings',
    templateUrl: './system-wide-settings.component.html',
    styleUrls: ['./system-wide-settings.component.css']
})
export class SystemWideSettingsComponent implements OnInit, OnDestroy {
    @Select(VariableUnitState.units) units$: Observable<Unit[]>;

    newUnitName: string;

    ngOnInit(): void {
    }

    ngOnDestroy(): void {
    }

    constructor(private store: Store) {
    }

    addUnit() {
        if (this.newUnitName && this.newUnitName.trim().length > 0) {
            this.store.dispatch(new UnitAdd({ title: this.newUnitName }));
            this.newUnitName = '';
        }
    }

    keyPressed(event) {
        if (event instanceof KeyboardEvent && event.key === 'Enter') {
            this.addUnit();
        }
    }
}
