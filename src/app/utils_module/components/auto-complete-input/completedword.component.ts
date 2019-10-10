import { Component, OnInit, Input, Output, EventEmitter, ElementRef } from '@angular/core';

@Component({
    selector: 'completed-word',
    templateUrl: './completedword.component.html',
    styleUrls: ['./completedword.component.css']
})

export class CompletedWordComponent implements OnInit {
    @Input('title') title: String = '';
    @Input('is-operator') isOperator = false;
    @Input('is-const-value') isConstValue = false;
    @Input('is-equals') isEquals = false;
    @Input('wordIndex') wordIndex = 0;
    @Output('deleted') deleteEvent = new EventEmitter();
    @Output('clicked') clickEvent = new EventEmitter();

    insertionIndex: number;

    constructor(private _el: ElementRef) {
    }

    onClick() {
        // now send the value to the AutoComplete widget
        this.clickEvent.emit(this.insertionIndex);
    }

    ngOnInit() { }

    deleteWord() {
        this.deleteEvent.emit(this.wordIndex);
    }

    /**
     * gets the width of this component's element rendered in the DOM
     */
    getWidth(): number {
        return this._el.nativeElement.offsetWidth;
    }
}
