import { Component, OnInit, Input, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { Store } from '@ngxs/store';

import * as gmProcessDetailsActions from '@system-models/state/gm-process-details.actions';

@Component({
    selector: 'app-gm-process-details',
    templateUrl: './gm-process-details.component.html',
    styleUrls: ['../details.common.css', './gm-process-details.component.css']
})
export class GmProcessDetailsComponent implements OnInit, AfterViewInit {
    @Input() selected;
    @ViewChild('inputElement') inputElement: ElementRef;


    get process() {
        return this.selected.object;
    }

    get icon() {
        if (this.process.type === 'PROCESSING_ELEMENT') {
            return 'fa fa-microchip';
        } else {
            return 'fa fa-cube';
        }
    }

    constructor(private store: Store) { }

    ngOnInit() {
    }

    ngAfterViewInit() {
        if (this.selected.eventType && this.selected.eventType === 'dblclick') {
            setTimeout(() => { this.inputElement.nativeElement.select(); }, 0);
        }
    }

    // TODO: escape key to cancel
    saveLabel(event) {
        if (event.target.value !== this.process.label) {
            this.store.dispatch(new gmProcessDetailsActions.LabelChanged({
                graphModelId: this.selected.context,
                processId: this.selected.id,
                label: event.target.value
            }));
        }
    }
}
