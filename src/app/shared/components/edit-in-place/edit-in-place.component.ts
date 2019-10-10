import { Component, Input, HostListener, ElementRef, Output, EventEmitter, OnInit, AfterViewInit, ViewChild, ViewEncapsulation } from '@angular/core';

@Component({
    selector: 'app-edit-in-place',
    templateUrl: './edit-in-place.component.html',
    styleUrls: ['./edit-in-place.component.css']
})
export class EditInPlaceComponent implements OnInit, AfterViewInit {
    @Input() value;
    @Input() inputStyle;
    @Output('onSubmit') onSubmitValue = new EventEmitter();
    @Output('onCancel') onCancelEdit = new EventEmitter();
    @ViewChild('inputElement') inputElement: ElementRef;
    newValue: string;
    constructor(private _el: ElementRef) { }

    ngOnInit() {
        this.newValue = this.value;
    }

    ngAfterViewInit() {
        this.inputElement.nativeElement.focus();
        setTimeout(() => { this.inputElement.nativeElement.select(); }, 0);
    }

    @HostListener('document:mousedown', ['$event', '$event.target'])
    clickOutside(_, targetElement: HTMLElement): void {
        const clickedInside = this._el.nativeElement.contains(targetElement);
        if (!clickedInside) {
            this.onSubmitValue.emit(this.newValue);
        }
    }

    onSubmit() {
        this.onSubmitValue.emit(this.newValue);
    }

    onCancel() {
        this.onCancelEdit.emit();
    }
}
