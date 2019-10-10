import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, OnInit } from '@angular/core';
import { Utils } from '../../../../../../../utils_module/utils';
import { SubvariableLineComponent } from '../../variable-editor/types/breakdown/subvariable-line/subvariable.line.component';



@Component({
    selector: 'inline-edit',
    templateUrl: './inline-edit.component.html',
    styleUrls: ['./inline-edit.component.css']
})

export class InlineEditComponent implements OnInit {
    @Input('value') value = '';
    @Input('displayValue') displayValue = '';
    @Input('type') type = '';
    @Output('onSave') save = new EventEmitter();
    @ViewChild('editInput') editInput: ElementRef;
    keyboardEvents = ['.', 'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];

    initialValue = '';
    inputValue = '';
    isEditing = false;


    constructor(private subvariableLine: SubvariableLineComponent) { }

    ngOnInit() {
        this.initialValue = this.value;
        this.inputValue = this.value;
    }

    handleKeyUp(event) {
        if (event.key === 'Escape') {
            this.initialValue = this.value;
            this.inputValue = this.value;
            event.preventDefault();
            event.stopImmediatePropagation();
            this.editInput.nativeElement.blur();
            this.isEditing = false;
        }
    }

    verifyInputValue() {
        const verifyingSubVarName = this.subvariableLine.subVariables.filter(newVar => newVar.name === this.inputValue);
        if (this.inputValue.length === 0) {
            this.initialValue = this.value;
            this.inputValue = this.value;
        } else if (verifyingSubVarName.length > 0 && this.inputValue !== this.initialValue) {
            this.initialValue = this.value;
            this.inputValue = this.value;
        } else if (/\s/.test(this.inputValue)) {
            this.initialValue = this.value;
            this.inputValue = this.value;
        } else if (this.inputValue.match(/[^0-9a-zA-Z_]/)) {
            this.initialValue = this.value;
            this.inputValue = this.value;
        } else if (this.inputValue.match(/^[0-9_]+$/)) {
            this.initialValue = this.value;
            this.inputValue = this.value;
        }
    }

    handleKeyDown(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            this.editInput.nativeElement.blur();
        }

        if (event.key === 'Home') {
            event.preventDefault();
            event.target.setSelectionRange(0, 0);
        }

        if (event.key === 'End') {
            event.preventDefault();
            event.target.setSelectionRange(event.target.value.length, event.target.value.length);
        }

        if (isNaN(Number(event.key)) && this.type === 'number') {
            if (this.keyboardEvents.find(x => x === event.key) === undefined) {
                console.log(`Preventing default keydown behavior for "${event.key}" in inline-edit.component#onKeydown()`);
                event.preventDefault();
            }
        }
    }

    handleFocusOut() {
        if (this.displayValue) {
            this.onSave(this.inputValue);
            this.displayValue = (parseFloat(this.inputValue) * 100 / 100).toFixed(Utils.getCurrentUserSettings().BREAKDOWN_DECIMAL) + '%';
            this.editInput.nativeElement.blur();
            this.isEditing = false;
        } else {
            this.verifyInputValue();
            this.onSave(this.inputValue);
            this.editInput.nativeElement.blur();
            this.isEditing = false;
        }
    }

    activateEdit() {
        this.isEditing = true;
        setTimeout(() => { this.editInput.nativeElement.focus(); }, 0.5);
    }

    onSave(value) {
        this.save.emit({ 'initialValue': this.initialValue, 'newValue': value });
    }
}
