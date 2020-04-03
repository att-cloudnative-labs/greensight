import { Component, ElementRef, EventEmitter, HostListener, Input, OnInit, Output, ViewChild } from '@angular/core';
import { ModalDialogService } from '@app/modules/cpt/services/modal-dialog.service';

@Component({
    selector: 'variable-creator',
    templateUrl: './variable.creator.component.html',
    styleUrls: ['./variable.creator.component.css']
})
export class VariableCreatorComponent implements OnInit {
    @ViewChild('inputNewVariableName', { static: false }) inputNewVariableNameField: ElementRef;
    newVariableTitle: string;
    processingCreation = false;
    @Output('onVariableCreate') variableCreated = new EventEmitter();
    @Output('onVariableNameClicked') variableNameClicked = new EventEmitter();
    @Input('variableList') variableList;

    constructor(
        private modal: ModalDialogService
    ) { }

    ngOnInit() {
    }

    /**
     * Listen for clicking event to create a new variable
     */
    onCreateVariable() {
        this.processingCreation = !this.processingCreation;
        if (this.processingCreation === true) {
            setTimeout(() => { this.inputNewVariableNameField.nativeElement.focus(); }, 50);
        }
    }

    onVariableNameClicked() {
        this.variableNameClicked.emit();
    }

    /**
     * Listen for an enter button press and emit an event whenever this occurs
     */
    processingVariableCreation() {
        const verifyingVarName = this.variableList.filter(newVar => (newVar.content ? newVar.content.title : newVar.name) === this.newVariableTitle);

        if (verifyingVarName.length > 0) {
            this.modal.showError('Failed to create variable. A variable with name "' + this.newVariableTitle + '" already exists');
        } else if (!this.newVariableTitle || this.newVariableTitle.length === 0) {
            this.modal.showError('Failed to create variable. The variable name cannot be an empty string!');
        } else if (/\s/.test(this.newVariableTitle)) {
            this.modal.showError('Failed to create variable. The variable name should not contain a space!');
        } else if (this.newVariableTitle.match(/[^0-9a-zA-Z_]/)) {
            this.modal.showError('Failed to create variable. Names can only include Alphabetical characters and underscores');
        } else if (this.newVariableTitle.match(/^[0-9_]+$/)) {
            this.modal.showError('Failed to create variable. Variable names cannot include numbers or underscores only.');
        } else {
            this.variableCreated.emit(this.newVariableTitle);
            this.processingCreation = !this.processingCreation;
            this.newVariableTitle = '';
        }
    }

    /**
     * listens for a esc button press and emits an event whenever this occurs
     */
    @HostListener('document:keydown.esc', ['$event'])
    onEscPressed() {
        this.processingCreation = false;
        this.newVariableTitle = '';
    }
}
