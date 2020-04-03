import { Component, Input, HostBinding, OnInit, OnDestroy, HostListener, Output, EventEmitter } from '@angular/core';
import { Store, Select } from '@ngxs/store';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { Observable } from 'rxjs';

import { CablePullService } from '@app/modules/cpt/components/graph-model-editor/services/cable-pull.service';
import { ProcessInport, ProcessOutport } from '@app/modules/cpt/models/graph-model.model';
import * as graphEditorActions from '@app/modules/cpt/state/graph-editor.actions';
import { SelectionState, Selection } from '@app/modules/cpt/state/selection.state';

@Component({
    selector: 'app-gm-process-port',
    templateUrl: './gm-process-port.component.html',
    styleUrls: ['./gm-process-port.component.css']
})
export class GmProcessPortComponent implements OnInit, OnDestroy {
    @Output() processInportDblClicked = new EventEmitter();
    @Input() port: ProcessInport | ProcessOutport;
    @Input() isProcess = true;
    @Input() disabled = false;
    @HostBinding('class') @Input() direction: string;
    @HostBinding('class.isSelected') isSelected = false;
    @HostBinding('class.isSecondarySelected') isSecondarySelected = false;
    @Select(SelectionState.withNodes) selection$: Observable<any[]>;
    mouseMovedAfterClick = false;
    default: boolean;

    constructor(
        private cablePullService: CablePullService,
        private store: Store
    ) { }

    ngOnInit() {
        this.selection$.pipe(untilDestroyed(this)).subscribe(selection => {
            this.isSelected = selection && !!selection.find(x => x.id === this.port.id);
            // If this process port is in a template group with the currently selected, show a fainter selection
            if (!this.isSelected && this.port.templateGroupId) {
                this.isSecondarySelected = !!selection.find(x => x.object.templateGroupId === this.port.templateGroupId);
            }
        });

    }

    ngOnDestroy() { }

    get displayDefault() {
        this.default = this.port.defaultParam && this.port.param === undefined && this.port.defaultSelected === undefined;
        return (this.port.defaultSelected && this.port.defaultParam) || this.default;
    }

    get name() {
        if (this.port.config && this.port.config.value) {
            return JSON.stringify(this.port.config.value);
        } else {
            return this.port.name;
        }
    }

    get paramValue() {
        if ((this.port.defaultSelected || this.default) || (this.port.defaultParam && this.port.param === undefined)) {
            switch (this.port.defaultParam && this.port.defaultParam.type) {
                case 'NUMBER':
                case 'BOOLEAN':
                case 'DATE':
                case 'STRING':
                    return JSON.stringify(this.port.defaultParam.value);
                case 'ASPECT':
                    return '{' + JSON.stringify(this.port.defaultParam.value) + '...}';

            }
        } else if (this.port.param && this.port.param.type) {
            switch (this.port.param.type) {
                case 'NUMBER':
                case 'BOOLEAN':
                case 'DATE':
                case 'STRING':
                    return JSON.stringify(this.port.param.value);
                case 'ASPECT':
                    return '{' + JSON.stringify(this.port.param.value.name) + '...}';
                default:
                    return undefined;
            }
        }
    }


    @HostListener('mousedown', ['$event'])
    onMouseDown(event) {
        if (event.button === 0) {
            event.stopPropagation();
            this.store.dispatch(new graphEditorActions.ProcessPortSelected({
                graphModelId: this.port.graphModel.id,
                nodeId: this.port.id,
                nodeType: this.port.nodeType,
                graphModelReleaseNr: this.port.graphModel.releaseNr
            }));
        }
    }

    @HostListener('mouseup', ['$event'])
    onMouseUp(event) {
        // if (event.button === 0 && !this.cablePullService.isActive) {
        //     event.stopPropagation();
        //     this.store.dispatch(new graphEditorActions.ProcessPortSelected({
        //         graphModelId: this.port.graphModel.id,
        //         nodeId: this.port.id,
        //         nodeType: this.port.nodeType
        //     }));
        // }
    }

    @HostListener('dblclick', ['$event'])
    onDblClick(event) {
        if (event.button === 0 && !this.cablePullService.isActive) {
            event.stopPropagation();
            this.processInportDblClicked.emit();
            this.store.dispatch(new graphEditorActions.ProcessPortDoubleClicked({
                graphModelId: this.port.graphModel.id,
                nodeId: this.port.id,
                nodeType: this.port.nodeType,
                eventType: event.type
            }));
        }
    }
}
