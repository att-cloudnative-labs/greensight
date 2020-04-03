import {
    Component,
    Output,
    EventEmitter,
    OnInit,
    ElementRef,
    ViewChild
} from '@angular/core';
import { ForecastVariable } from '@app/modules/cpt/interfaces/forecast-variable';

@Component({
    selector: 'breakdown-type',
    templateUrl: './breakdown.type.component.html',
    styleUrls: ['./breakdown.type.component.css']
})
export class BreakdownTypeComponent implements OnInit {
    @Output() save = new EventEmitter();
    @ViewChild('valueInput', { static: false }) valueInputRef: ElementRef;

    variable: ForecastVariable;
    allVariables: Array<ForecastVariable>;
    newSubvariable = { 'name': '', 'percentage': '' };
    subVariables = [];
    subVariableCounter = 0;
    errorMessage = '';
    keyboardEvents = ['.', 'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];

    constructor() { }


    ngOnInit() {
        if (this.variable.variableModel.defaultBreakdown != null) {
            const keys = Object.keys(this.variable.variableModel.defaultBreakdown);
            this.subVariableCounter = 0;
            for (const key of keys) {
                this.subVariables.push({ 'id': this.subVariableCounter, 'name': key, 'value': this.variable.variableModel.defaultBreakdown[key] });
                this.subVariableCounter = this.subVariableCounter + 1;
            }
            this.subVariables.sort((a, b) => (a.name > b.name) ? 1 : -1);
        }
        setTimeout(() => { if (this.valueInputRef) { this.valueInputRef.nativeElement.focus(); } }, 0);

    }

    addNewSubVar() {
        if (this.newSubvariable.name === '') {
            return;
        }
        const index = this.subVariables.findIndex(x => x.name === this.newSubvariable.name);
        if (index !== -1) {
            this.errorMessage = 'Value already exists';
        } else if (/\s/.test(this.newSubvariable.name)) {
            this.errorMessage = 'Breakdown values can only include alphabetical characters and underscores';
        } else if (this.newSubvariable.name.match(/[^0-9a-zA-Z_]/)) {
            this.errorMessage = 'Breakdown values can only include alphabetical characters and underscores';
        } else if (this.newSubvariable.name.match(/^[0-9_]+$/)) {
            this.errorMessage = 'Breakdown values can only include alphabetical characters and underscores';
        } else {
            const decimalValue = 0;
            this.subVariables.push({ 'id': this.subVariableCounter, 'name': this.newSubvariable.name, 'value': decimalValue });
            this.subVariableCounter = this.subVariableCounter + 1;
            // add the new subvariable to the existing timesegments
            if (this.variable.variableModel.timeSegments !== undefined) {
                for (const timeSeg of this.variable.variableModel.timeSegments) {
                    timeSeg.breakdown[this.newSubvariable.name] = decimalValue;
                }
            }
            this.newSubvariable.name = '';
            this.onSave();
        }
    }

    deleteSubVariable(subVariable) {
        const index = this.subVariables.findIndex(x => x.id === subVariable.id);
        this.subVariables.splice(index, 1);

        for (const timeSeg of (this.variable.variableModel.timeSegments || [])) {
            delete timeSeg.breakdown[subVariable.name];
        }
        this.onSave();
    }

    onCommit(newSubVariable) {
        this.onSave();
    }

    editSubVariable(values) {
        if (this.variable.variableModel.timeSegments !== undefined) {
            for (const timeSeg of this.variable.variableModel.timeSegments) {
                const keys = Object.keys(timeSeg.breakdown);
                for (let index = 0; index < keys.length; index++) {
                    if (keys[index] === values.initialValue) {
                        timeSeg.breakdown = JSON.parse(JSON.stringify(timeSeg.breakdown).replace(keys[index], values.newValue));
                    }
                }
            }
        }
    }

    onSave() {
        const editedVar = new ForecastVariable(JSON.parse(JSON.stringify(this.variable.variableModel)));
        editedVar.variableModel.defaultBreakdown = {};
        this.subVariables.sort((a, b) => (a.name > b.name) ? 1 : -1);
        for (const subVar of this.subVariables) {
            editedVar.variableModel.defaultBreakdown[subVar.name] = subVar.value;
        }
        this.save.emit(editedVar);
    }

    clickable() {
        return this.newSubvariable.name !== '';
    }

    /*
    * keydown handler for breakdown input value
    */
    onKeyDown(event) {
        if (event.key === 'Enter') {
            this.addNewSubVar();
        } else {
            this.errorMessage = '';
        }
    }

    onInput(event) {
        this.errorMessage = '';
    }
}
