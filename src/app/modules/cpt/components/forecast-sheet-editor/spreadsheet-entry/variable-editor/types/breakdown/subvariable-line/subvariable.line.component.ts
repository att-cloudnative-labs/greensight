import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { Utils } from '../../../../../../../lib/utils';
import { BreakdownTypeComponent } from '../breakdown.type.component';


@Component({
    selector: 'subvariable-line',
    templateUrl: './subvariable.line.component.html',
    styleUrls: ['./subvariable.line.component.css']
})
export class SubvariableLineComponent implements OnInit {
    @Input('subVariable') subVariable = { 'id': '', 'name': '', 'value': 0 };
    @Output('onDelete') deleteSubVariable = new EventEmitter();
    @Output('onCommit') onCommit = new EventEmitter();
    @Output() onEdit = new EventEmitter();

    formattedPercentage = '';
    formattedPercentageAsNumber = 0;
    settings = Utils.getCurrentUserSettings();
    subVariables = this.breakdown.subVariables;

    constructor(private breakdown: BreakdownTypeComponent) { }

    ngOnInit() {
        this.formattedPercentage = ((Utils.formatValue(this.subVariable.value, 'Breakdown')));
        this.formattedPercentageAsNumber = this.subVariable.value * 100;
    }

    onDelete() {
        this.deleteSubVariable.emit(this.subVariable);
    }

    onSave(values) {
        if (this.subVariable.name === values.initialValue) {
            this.subVariable.name = values.newValue;
        } else if (this.subVariable.value === values.initialValue / 100) {
            this.subVariable.value = (parseFloat(values.newValue) / 100);
        }
        this.onEdit.emit(values);
        this.onCommit.emit(this.subVariable);
    }
}
