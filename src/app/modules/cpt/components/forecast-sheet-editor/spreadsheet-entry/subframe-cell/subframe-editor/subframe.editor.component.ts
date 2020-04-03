import { Component, Input, Output, ViewChild, EventEmitter, ElementRef, HostListener, OnInit, AfterViewInit } from '@angular/core';
import { Utils } from '@cpt/lib/utils';

@Component({
    selector: 'subframe-editor',
    templateUrl: './subframe.editor.component.html',
    styleUrls: ['./subframe.editor.component.css']
})
export class SubframeEditorComponent implements OnInit, AfterViewInit {
    @Input('value') value;
    @Input('fwdKeyEvent') fwdKeyEvent;
    @Output('onEnter') onEnter = new EventEmitter();
    @Output('onEscape') onEscape = new EventEmitter();
    @ViewChild('inputSubVariable', { static: false }) SubvariableInputElement: ElementRef;

    keyboardEvents = ['.', 'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];

    constructor(private _el: ElementRef) {
    }

    ngOnInit() {
        this.value = parseFloat((this.value * 100).toFixed(Utils.getCurrentUserSettings().BREAKDOWN_DECIMAL));
    }

    ngAfterViewInit() {
        if (this.fwdKeyEvent !== undefined) {
            const numKey = Number(this.fwdKeyEvent.key);
            if (numKey >= 0 && numKey <= 9) {
                setTimeout(() => {
                    this.SubvariableInputElement.nativeElement.focus();
                    this.value = this.fwdKeyEvent.key;
                }, 0);
            }
        } else {
            setTimeout(() => {
                this.SubvariableInputElement.nativeElement.focus();
                this.SubvariableInputElement.nativeElement.select();
            }, 0);
        }
    }

    /**
    * Emits an escape event if a click event occurs outside of the frame editor
    */
    @HostListener('document:click', ['$event', '$event.target'])
    clickOutside(event: MouseEvent, targetElement: HTMLElement): void {
        if (!targetElement) {
            return;
        }
        const clickedInside = this._el.nativeElement.contains(targetElement);
        if (!clickedInside) {
            this.onEnter.emit(this.value);
        }
    }

    /*
    * keydown handler for sub-frame input value
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

        if (isNaN(Number(event.key))) {
            if (this.keyboardEvents.find(x => x === event.key) === undefined) {
                console.log(`Preventing default keydown behavior for "${event.key}" in constant.edit.component.ts#onKeydown()`);
                event.preventDefault();
            }
        }

        if (event.key === 'Escape') {
            event.preventDefault();
            this.onEscape.emit();
        }
    }

    /**
     * Keydown handler for constant edit component
     * @param event
     */
    @HostListener('document:keydown', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent) {
        if (event.key === 'Tab' || event.key === 'Enter') {
            event.preventDefault();
            this.onEnter.emit(this.value);
        } else if (isNaN(Number(event.key))) {
            if (this.keyboardEvents.find(x => x === event.key) === undefined) {
                console.log(`Preventing default keydown behavior for "${event.key}" in subframe.editor.component#onKeydown()`);
                event.stopPropagation();
            }
        } else if (event.key === 'Escape') {
            event.preventDefault();
            this.onEscape.emit();
        }

    }

    /**
     * listens for a backspace key press and emits an event whenever this occurs
     */
    @HostListener('document:keydown.backspace', ['$event'])
    onBackspacePressed(event) {
        event.stopImmediatePropagation();
    }

}
