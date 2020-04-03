import { Component, EventEmitter, Output } from '@angular/core';
import { ForecastVariable } from '@app/modules/cpt/interfaces/forecast-variable';
import { Unit } from '@app/modules/cpt/interfaces/unit';
import { Modal } from 'ngx-modialog-7/plugins/bootstrap';

// TODO: Uncomment when units are added to projection library
// import { Unit } from '@cpt/capacity-planning-projection/lib';

@Component({
    selector: 'real-type',
    templateUrl: './real.type.component.html',
    styleUrls: ['./real.type.component.css']
})
export class RealTypeComponent {
    @Output() save = new EventEmitter();
    variable: ForecastVariable;
    allVariables: Array<ForecastVariable>;
    units: Unit[] = new Array<Unit>();

    constructor(
        private modalDialog: Modal
    ) { }

    updateAssociations(associatedForecastVariables) {
        this.variable.content.breakdownIds = associatedForecastVariables.map(afv => afv.id);
        this.variable.content.unit = (!this.variable.content.unit || this.variable.content.unit === '') ? null : this.variable.content.unit;
        this.save.emit(this.variable);
    }

    onChangeUnit() {
        this.variable.content.unit = (!this.variable.content.unit || this.variable.content.unit === '') ? null : this.variable.content.unit;
        this.save.emit(this.variable);
    }
}
