import { Component, Input, EventEmitter, Output } from '@angular/core';
import { ForecastVariable } from '@app/core_module/interfaces/forecast-variable';
import { Unit } from '../../../../../../../interfaces/unit';
import { Modal } from 'ngx-modialog/plugins/bootstrap';

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
        this.save.emit(this.variable);
    }

    onChangeUnit() {
        this.save.emit(this.variable);
    }
}
