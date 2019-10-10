import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, OnInit, OnChanges } from '@angular/core';
import { ForecastVariable } from '@app/core_module/interfaces/forecast-variable';
import { Unit } from '../../../../../interfaces/unit';
import { Modal } from 'ngx-modialog/plugins/bootstrap';
import { ForecastVariableProjection } from '@app/core_module/interfaces/forecastVariableProjections';

/**
* Displays variable name: non-breaking, overflow ellipses
* Shows an expansion icon if the variable's projection contains any subframes
* Shows a 'downward-arrow' icon button which is used to toggle the visibility of the variable-editor
*/
@Component({
    selector: 'variable-cell',
    templateUrl: './variable.cell.component.html',
    styleUrls: ['./variable.cell.component.css']
})
export class VariableCellComponent implements OnInit, OnChanges {
    @ViewChild('inputVariableName') inputNameField: ElementRef;
    @Input('variable') variable: ForecastVariable;
    @Input('projection') projection: ForecastVariableProjection;
    @Input('allVariables') allVariables = [];
    @Input('isExpanded') isExpanded: Boolean = false;
    @Input('units') units: Array<Unit>;
    @Input('startDate') startDate: string;
    @Output('onColumnResize') onColumnResize = new EventEmitter();
    @Output('onExpandToggle') expandToggle = new EventEmitter();
    @Output('onOpenInspector') onOpenInspector = new EventEmitter();
    @Output('onVariableNameClicked') variableNameClicked = new EventEmitter();
    @Output('onUpdateVariable') updateVariable = new EventEmitter();
    @Output('onDeleteVariable') deleteVariable = new EventEmitter();

    // the name of the icon which indicates if the variable can be expanded/collapsed
    iconName: String;
    editName: Boolean = false;
    showEdit: Boolean = false;
    editNameInputStyle = {
        'color': 'black',
        'background-color': 'white',
        'text-align': 'left',
        'width': '100%',
        'white-space': 'nowrap',
        'overflow': 'hidden',
        'text-overflow': 'ellipsis',
        'cursor': 'pointer',
        'border-radius': '4px',
        'border': '1px solid transparent'
    };
    originalTitle: string;

    constructor(
        private modalDialog: Modal,
    ) { }


    ngOnInit() {
        this.originalTitle = this.variable.content.title;
    }

    /**
     * Checks if the variable is expandable ie if it should display a plus button to allow its
     * subvariables to be visible
     */
    get isExpandable(): boolean {
        return this.projection.subframeNames && this.projection.subframeNames.length > 0;
    }

    /**
     * Update the expand/collapse icon whenever the expand state of the variable cell changes
     */
    ngOnChanges() {
        this.iconName = this.isExpanded ? 'minus' : 'plus';
    }

    /**
     * Emits an event whenever the variable cell is expanded/collapsed
     */
    onExpandToggle() {
        this.expandToggle.emit();
    }

    openNameEditor() {
        this.editName = true;
        this.onOpenInspector.emit();
    }

    toggleEdit() {
        this.showEdit = !this.showEdit;
        if (this.showEdit) {
            this.onOpenInspector.emit();
        }
    }

    closeEdit() {
        this.showEdit = false;
    }

    onDeleteVariable(variable) {
        this.deleteVariable.emit(variable);
    }

    onUpdateVariable(variable) {
        this.updateVariable.emit(variable);
    }

    /**
     * Checks if the new name entered in the the input field is valid before updating the variable with the new name
     */
    onUpdateVariableName(newName) {
        this.editName = false;
        // dont need to save if the name wasnt changed
        if (newName === this.originalTitle) {
            return;
        }
        const dialog = this.modalDialog
            .alert()
            .title('Error')
            .isBlocking(true);
        const nameExists = this.allVariables.some(variable => variable.content.title === newName);
        if (newName.length === 0) {
            dialog
                .body('Failed to update variable. The variable name cannot be an empty string!')
                .open();
        } else if (nameExists && newName !== this.originalTitle) {
            dialog
                .body('Failed to update variable. A variable with name "' + newName + '" already exists')
                .open();
        } else if (/\s/.test(newName)) {
            dialog
                .body('Failed to update variable. The variable name should not contain a space')
                .open();
        } else if (newName.match(/[^0-9a-zA-Z_]/)) {
            dialog
                .body('Failed to update variable. Names can only include Alphabetical characters, numbers and underscores')
                .open();
        } else if (newName.match(/^[0-9_]+$/)) {
            dialog
                .body('Failed to update variable. Variable names cannot include numbers or underscores only')
                .open();
        } else {
            this.variable.content.title = newName;
            this.originalTitle = this.variable.content.title;
            this.onUpdateVariable(this.variable);
        }
    }
}
