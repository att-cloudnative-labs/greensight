import { Component, OnInit, Input, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { Store } from '@ngxs/store';

import * as gmOutportDetailsActions from '@system-models/state/gm-outport-details.actions';

@Component({
    selector: 'app-gm-outport-details',
    templateUrl: './gm-outport-details.component.html',
    styleUrls: ['../details.common.css', './gm-outport-details.component.css']
})
export class GmOutportDetailsComponent implements OnInit, AfterViewInit {
    @Input() selected;
    @ViewChild('outportElement') outportElement: ElementRef;


    get outport() {
        return this.selected.object;
    }

    constructor(private store: Store) { }

    ngOnInit() {
    }

    ngAfterViewInit() {
        if (this.selected.eventType && this.selected.eventType === 'dblclick') {
            setTimeout(() => { this.outportElement.nativeElement.select(); }, 0);
        }
    }

    // TODO: escape key to cancel
    saveName(event) {
        if (event.target.value !== this.outport.name) {
            this.store.dispatch(new gmOutportDetailsActions.NameChanged({
                graphModelId: this.selected.context,
                outportId: this.selected.id,
                name: event.target.value
            }));
        }
    }
}
