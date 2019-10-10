import { Component, OnInit, Input, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Store } from '@ngxs/store';

import * as gmVariableReferenceDetailsActions from '@system-models/state/gm-variable-reference-details.actions';
import { Modal } from 'ngx-modialog/plugins/bootstrap';

@Component({
    selector: 'app-gm-variable-reference-details',
    templateUrl: './gm-variable-reference-details.component.html',
    styleUrls: ['../details.common.css', './gm-variable-reference-details.component.css']
})
export class GmVariableReferenceDetailsComponent implements OnInit, AfterViewInit {
    @Input() selected;
    @ViewChild('inputVarRef') inputElement: ElementRef;

    get variable() {
        return this.selected.object.variable;
    }

    constructor(private store: Store, private modal: Modal) { }

    ngOnInit() {
    }

    ngAfterViewInit() {
        if (this.selected.eventType && this.selected.eventType === 'dblclick') {
            setTimeout(() => { this.inputElement.nativeElement.select(); }, 0);
        }
    }

    // TODO: escape key to cancel
    saveLabel(event) {
        const otherNamedVarRef = this.variable.graphModel.variables.filter(x => x.id !== this.variable.id && x.objectType === 'NAMED_VARIABLE');
        if (this.variable.objectType === 'NAMED_VARIABLE' && otherNamedVarRef.find(x => x.label === event.target.value)) {
            const dialog = this.modal
                .alert()
                .title('Error')
                .isBlocking(true)
                .body('Failed to update Named Variable. A Named Variable with name "' + event.target.value + '" already exists!')
                .open();
            dialog.result.then(result => {
                this.inputElement.nativeElement.focus();
                this.inputElement.nativeElement.value = this.variable.label;
            });
        } else {
            if (event.target.value !== this.variable.label) {
                this.store.dispatch(new gmVariableReferenceDetailsActions.VariableLabelChanged({
                    graphModelId: this.selected.context,
                    variableId: this.variable.id,
                    label: event.target.value
                }));
            }
        }
    }
}
