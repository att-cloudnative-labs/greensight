import { Component, Input, Output, EventEmitter, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Modal } from 'ngx-modialog-7/plugins/bootstrap';

@Component({
    selector: 'app-breakdown-editor-row',
    templateUrl: './breakdown-editor-row.component.html',
    styleUrls: ['./breakdown-editor-row.component.css']
})
export class BreakdownEditorRowComponent implements OnInit {
    @Input() slice;
    @Input() slices;
    @Input() disabled = false;
    @Output() onChange = new EventEmitter();
    @Output() onRemove = new EventEmitter();
    @Output() onAddingSlice = new EventEmitter();
    @ViewChild('sliceNameInput', { static: false }) sliceNameInput: ElementRef;
    keyboardEvents = ['.', ',', 'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab'];
    sliceKey = 'sliceKey';
    sliceValue = 'sliceValue';
    eventName = undefined;

    constructor(private modal: Modal) { }

    ngOnInit() {
        const sliceIndex = this.slices.indexOf(this.slice);
        if (this.slice.key === '') {
            setTimeout(() => {
                $('#sliceKey' + sliceIndex).select();
            }, 0);
        }
    }

    changeKey(event) {

        this.slice.key = event.target.value;
        if (this.slice.key.match(/^[0-9_]+$/)) {
            const dialog = this.modal
                .alert()
                .title('Error')
                .isBlocking(true)
                .body('Failed to update slice. Slice names cannot include numbers or underscores only.')
                .open();
            dialog.result.then(result => {
                this.slice.key = '';
                this.sliceNameInput.nativeElement.select();
            });
        } else {
            this.onChange.emit(this.slice);
            const sliceIndex = this.slices.indexOf(this.slice);
            if (this.eventName === 'Tab') {
                setTimeout(() => { $('#sliceValue' + sliceIndex).select(); }, 0);
            } else if (this.eventName === 'ShiftTab' && sliceIndex !== 0) {
                setTimeout(() => { $('#sliceValue' + (sliceIndex - 1)).select(); }, 0);
            }
        }
    }

    changeValue(event) {
        this.slice.value = event.target.value;
        this.onChange.emit(this.slice);
        const sliceIndex = this.slices.indexOf(this.slice);
        if (this.eventName === 'Tab') {
            setTimeout(() => { $('#sliceKey' + (sliceIndex + 1)).select(); }, 0);
        } else if (this.eventName === 'ShiftTab') {
            setTimeout(() => { $('#sliceKey' + sliceIndex).select(); }, 0);
        }
    }

    removeSlice() {
        this.onRemove.emit();
    }

    /*
    * keydown handler for slice value input
    */
    onKeyDown(event) {
        if (event.key === 'Home') {
            event.preventDefault();
            event.target.setSelectionRange(0, 0);
        }

        if (event.key === 'End') {
            event.preventDefault();
            event.target.setSelectionRange(event.target.value.length, event.target.value.length);
        }

        if (event.key === 'Tab' && !event.shiftKey) {
            this.eventName = 'Tab';
            const sliceIndex = this.slices.indexOf(this.slice);
            if (sliceIndex === this.slices.length - 1) {
                this.slice.value = event.target.value;
                this.onAddingSlice.emit();
                event.preventDefault();
            }
        } else if (event.key === 'Tab' && event.shiftKey) {
            this.eventName = 'ShiftTab';
        } else {
            this.eventName = undefined;
        }

        if (isNaN(Number(event.key))) {
            if (this.keyboardEvents.find(x => x === event.key) === undefined) {
                console.log(`Preventing default keydown behavior for "${event.key}" in breakdown-editor-row.component.ts#onKeydown()`);
                event.preventDefault();
            }
        }
    }

    handleKeydownOnNameInput(event) {
        const sliceIndex = this.slices.indexOf(this.slice);
        if (event.key === 'Tab' && event.shiftKey) {
            this.eventName = 'ShiftTab';
            if (sliceIndex === 0) {
                event.preventDefault();
            }
        } else if (event.key === 'Tab' && !event.shiftKey) {
            this.eventName = 'Tab';
        } else if (event.key === 'Enter') {
            setTimeout(() => { $('#sliceValue' + sliceIndex).select(); }, 0);
        } else {
            this.eventName = undefined;
        }
    }
}
