import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, OnInit, OnChanges } from '@angular/core';
import { ForecastVariable } from '@app/modules/cpt/interfaces/forecast-variable';
import { Unit } from '@app/modules/cpt/interfaces/unit';
import { ForecastVariableProjection } from '@app/modules/cpt/interfaces/forecastVariableProjections';
import { Store, ofActionSuccessful, Actions } from '@ngxs/store';
import { EnteredVariableTitle } from '@app/modules/cpt/state/forecast-sheet.action';

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
    @ViewChild('inputVariableName', { static: false }) inputNameField: ElementRef;
    @Input('variable') variable: ForecastVariable;
    @Input('projection') projection: ForecastVariableProjection;
    @Input('allVariables') allVariables = [];
    @Input('isExpanded') isExpanded: Boolean = false;
    @Input('units') units: Array<Unit>;
    @Input('startDate') startDate: string;
    @Input('sheetId') sheetId: string;
    @Input() readonly: boolean;
    @Output('onExpandToggle') expandToggle = new EventEmitter();
    @Output('onOpenInspector') onOpenInspector = new EventEmitter();
    @Output('onVariableNameClicked') variableNameClicked = new EventEmitter();
    @Output('onUpdateVariable') updateVariable = new EventEmitter();
    @Output('onDeleteVariable') deleteVariable = new EventEmitter();
    @Output('onUpdateVariableTitle') updateVariableTitle = new EventEmitter();

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
        private store: Store,
        private actions$: Actions
    ) { }


    ngOnInit() {
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
        this.originalTitle = this.variable.title;

    }

    /**
     * Emits an event whenever the variable cell is expanded/collapsed
     */
    onExpandToggle() {
        this.expandToggle.emit();
    }

    openNameEditor() {
        if (this.readonly) {
            return;
        }
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
        if (this.readonly) {
            return;
        }
        this.deleteVariable.emit(variable);
    }

    onUpdateVariable(variable) {
        this.updateVariable.emit(variable);
    }

    /**
     * Checks if the new name entered in the the input field is valid before updating the variable with the new name
     */
    onUpdateVariableTitle(newTitle: string) {
        if (this.readonly) {
            return;
        }
        this.editName = false;
        // dont need to save if the name wasnt changed
        if (newTitle === this.originalTitle) {
            return;
        }
        this.store.dispatch(new EnteredVariableTitle({ sheetId: this.sheetId, variableId: this.variable.id, variableTitle: newTitle })),
            this.updateVariableTitle.emit(this.variable)
    }
}
