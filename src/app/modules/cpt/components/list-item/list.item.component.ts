import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
    selector: 'list-item',
    templateUrl: './list.item.component.html',
    styleUrls: ['./list.item.component.css']
})

export class ListItemComponent implements OnInit {
    @Input('title') title: String;
    @Input('id') id: String;
    @Output('delete') deleteEvent = new EventEmitter();
    @Output('item-selected') itemSelectedEvent = new EventEmitter();

    constructor() { }

    ngOnInit() { }

    onTitleSelected() {

    }

    onDelete() {
        // raise an event for handling delete
        this.deleteEvent.emit({
            id: this.id
        });
    }

    onItemSelected() {
        // raise an event for handling item selection
        this.itemSelectedEvent.emit({
            id: this.id
        });
    }
}
