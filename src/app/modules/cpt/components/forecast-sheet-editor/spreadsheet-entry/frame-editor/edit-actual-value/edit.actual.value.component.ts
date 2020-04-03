import { Component, ViewChild, ElementRef, AfterViewInit, Input, OnInit, Output, EventEmitter, HostListener } from '@angular/core';

@Component({
    selector: 'edit-actual-value',
    templateUrl: './edit.actual.value.component.html',
    styleUrls: ['./edit.actual.value.component.css']
})
export class EditActualValueComponent implements OnInit, AfterViewInit {
    @Input('value') value = '';
    @Input('fwdKeyEvent') fwdKeyEvent;
    @Input('sheetId') sheetId: string;
    @Output('enterPressed') enterPressed = new EventEmitter();
    @ViewChild('inputActual', { static: false }) actualInputElement: ElementRef;

    keyboardEvents = ['.', ',', 'Backspace', 'Delete'];
    invalid: Boolean = false;

    constructor(private _el: ElementRef) {
    }

    ngOnInit() {
        if (this.value === undefined) {
            this.value = '';
        }
    }

    ngAfterViewInit() {
        this.actualInputElement.nativeElement.focus();
        setTimeout(() => { this.actualInputElement.nativeElement.select(); }, 0);
    }

    @HostListener('document:keydown.enter', ['$event'])
    onEnterPressed() {
        let actualValue = this.value;
        if (typeof actualValue === 'string') {
            actualValue = actualValue.replace(/,/g, '');
        }
        this.value = actualValue;
        this.enterPressed.emit(this.value);
    }


    onKeyDown(event) {
        if (isNaN(Number(event.key))) {
            if (event.key === '=') {
                event.preventDefault();

                // Remove commas from value if it is a string
                const actualValue = (typeof this.value === 'string' ? this.value.replace(/,/g, '') : this.value);

                if (this.actualInputElement.nativeElement.selectionStart === 0 && !isNaN(Number(actualValue))) {
                    this.value = actualValue;
                } else {
                    this.invalid = true;
                    setTimeout(() => { this.invalid = false; }, 500);
                }
            } else if (event.which === 37 || event.which === 38 || event.which === 39 || event.which === 40) {
                // Handle the keyboard arrow events
                event.stopPropagation();
            } else if (this.keyboardEvents.find(x => x === event.key) === undefined) {
                event.preventDefault();
            }
        }
    }

    @HostListener('document:keydown', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent) {
        if (event.which === 37 || event.which === 38 || event.which === 39 || event.which === 40 || event.which === 9 || event.which === 13) {
            event.preventDefault();
            this.onEnterPressed();
        }
    }

    /**
     * Emits a save event if a click event occurs outside of the frame editor
     */
    @HostListener('document:click', ['$event', '$event.target'])
    clickOutside(event: MouseEvent, targetElement: HTMLElement): void {
        if (!targetElement) {
            return;
        }
        const clickedInside = this._el.nativeElement.contains(targetElement) || targetElement.closest('#editor-target-' + this.sheetId)
            || targetElement.closest('.actual-projected-selector');
        if (!clickedInside) {
            this.onEnterPressed();
        }
    }
}
