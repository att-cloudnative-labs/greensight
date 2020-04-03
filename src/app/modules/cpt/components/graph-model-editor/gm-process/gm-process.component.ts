import { Component, Input, HostBinding, Output, EventEmitter } from '@angular/core';
import { Store } from '@ngxs/store';
import * as graphEditorActions from '@app/modules/cpt/state/graph-editor.actions';


@Component({
    selector: 'app-gm-process',
    templateUrl: './gm-process.component.html',
    styleUrls: ['./gm-process.component.css']
})
export class GmProcessComponent {
    @Input() process;
    @Input() disabled = false;
    @Output() processInportDblClicked = new EventEmitter();
    @HostBinding('class') get processType() { return this.process.type; }
    hovering = false;

    constructor(private store: Store) { }

    get isWarningNode() {
        return this.process.visualizationHint && this.process.visualizationHint === 'WARNING';
    }

    get isStopNode() {
        return this.process.visualizationHint && this.process.visualizationHint === 'ERROR';
    }

    emitProcessInportDblClicked() {
        this.processInportDblClicked.emit();
    }

    openModelRef() {
        this.store.dispatch(new graphEditorActions.OpenGraphModelRef({ graphModelId: this.process.ref, releaseNr: this.process.releaseNr }));
    }

    get showLink() {
        return this.hovering && this.process.type === 'GRAPH_MODEL';
    }

    get dimName() {
        return this.showLink && this.process.label;
    }

    get releaseTrackingSymbol() {
        if (this.process.tracking === 'CURRENT_VERSION') {
            return 'fa-bolt';
        } else if (this.process.tracking === 'FIXED') {
            return 'fa-link';
        } else {
            return '';
        }
    }

    onMouseEnter() {
        this.hovering = true;
    }

    onMouseLeave() {
        this.hovering = false;
    }

    isLinkedToRelease(): boolean {
        return true;
    }
}
