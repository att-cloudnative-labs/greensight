import { Component, OnInit, Input, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { Store } from '@ngxs/store';

import { ProcessOutport } from '@system-models/models/graph-model.model';
import * as gmProcessOutportDetailsActions from '@system-models/state/gm-process-outport-details.actions';

@Component({
    selector: 'app-gm-process-outport-details',
    templateUrl: './gm-process-outport-details.component.html',
    styleUrls: ['../details.common.css', './gm-process-outport-details.component.css']
})
export class GmProcessOutportDetailsComponent implements OnInit, AfterViewInit {
    @Input() selected;
    @ViewChild('processOutportElement') processOutportElement: ElementRef;

    get processOutport(): ProcessOutport {
        return this.selected.object;
    }

    constructor(private store: Store) { }

    ngOnInit() { }

    ngAfterViewInit() {
        if (this.selected.eventType && this.selected.eventType === 'dblclick' && this.processOutportElement) {
            setTimeout(() => { this.processOutportElement.nativeElement.select(); }, 0);
        }
    }

    get configValue() {
        switch (this.processOutport.configType) {
            case 'NUMBER':
                return this.processOutport.config ? this.processOutport.config.value : 0;
            case 'BOOLEAN':
                return this.processOutport.config ? this.processOutport.config.value : false;
            case 'STRING':
                return this.processOutport.config ? this.processOutport.config.value : '';
        }
    }

    private eventToValue(event) {
        switch (this.processOutport.configType) {
            case 'NUMBER':
                return Number(event.target.value);
            case 'BOOLEAN':
                return event.target.checked;
            case 'STRING':
                return event.target.value;
        }
    }

    saveConfig(event) {
        this.store.dispatch(new gmProcessOutportDetailsActions.ConfigChanged({
            graphModelId: this.processOutport.graphModel.id,
            processOutportId: this.processOutport.id,
            config: {
                type: this.processOutport.configType,
                value: this.eventToValue(event)
            }
        }));
    }
}
