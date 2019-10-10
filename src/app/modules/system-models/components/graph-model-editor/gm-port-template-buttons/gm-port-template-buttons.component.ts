import { Component, OnInit, Input, OnChanges, HostBinding } from '@angular/core';
import { Store } from '@ngxs/store';

import { Process, ProcessPortTemplate } from '@system-models/models/graph-model.model';
import * as graphEditorActions from '@system-models/state/graph-editor.actions';

@Component({
    selector: 'app-gm-port-template-buttons',
    templateUrl: './gm-port-template-buttons.component.html',
    styleUrls: ['./gm-port-template-buttons.component.css']
})
export class GmPortTemplateButtonsComponent implements OnInit, OnChanges {
    @Input() process: Process;
    @Input() portTemplates: ProcessPortTemplate[] = [];
    @HostBinding('class') @Input() flavor = 'all';
    public filteredTemplates = [];

    constructor(private store: Store) { }

    ngOnInit() {
    }

    ngOnChanges() {
        this.filteredTemplates = this.portTemplates.filter(pt => pt.flavor === this.flavor);
    }

    buttonClicked(template) {
        this.store.dispatch(new graphEditorActions.AddPortTemplateButtonClicked({
            graphModelId: template.graphModel.id,
            processId: this.process.id,
            portTemplate: template.toObject()
        }));
    }

    // don't bubble mousedown or mouseup to prevent the containing process from becoming selected
    mouseTrap(event) {
        event.stopPropagation();
    }

}
