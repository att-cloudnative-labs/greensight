import { Component, Input, HostBinding, HostListener, OnInit, OnDestroy, ElementRef } from '@angular/core';
import { Store } from '@ngxs/store';

import { Port } from '@app/modules/cpt/models/graph-model.model';
import { CablePullService } from '@app/modules/cpt/components/graph-model-editor/services/cable-pull.service';
import * as graphEditorActions from '@app/modules/cpt/state/graph-editor.actions';

@Component({
    selector: 'app-gm-pin',
    templateUrl: './gm-pin.component.html',
    styleUrls: ['./gm-pin.component.css']
})
export class GmPinComponent implements OnInit, OnDestroy {
    @Input() port: Port;
    @Input() disabled = false;

    constructor(
        private cablePullService: CablePullService,
        private store: Store,
        private host: ElementRef
    ) { }

    ngOnInit() {
        this.cablePullService.registerPin(this);
        this.cablePullService.registerAnchor({
            nativeElement: this.host.nativeElement,
            portType: this.port.portType,
            id: this.port.id
        });
    }

    ngOnDestroy() {
        this.cablePullService.unregisterPin(this);
        this.cablePullService.unregisterAnchor({
            nativeElement: this.host.nativeElement,
            portType: this.port.portType,
            id: this.port.id
        });
    }

    matchesDropTarget(nativeElement) {
        const portParent = nativeElement.closest('app-gm-port, app-gm-process-port');
        if (portParent) {
            return portParent.contains(this.host.nativeElement);
        } else {
            return this.host.nativeElement.contains(nativeElement);
        }
    }

    @HostBinding('class.isConnected')
    get isConnected() {
        return this.port.isConnected;
    }

    @HostBinding('class.hasParam')
    get hasParam() {
        return this.port.hasParam;
    }

    @HostListener('mousedown', ['$event'])
    onMouseDown(event) {
        if (this.disabled) {
            return;
        }
        // if left mouse button shift click
        if (event.button === 0 && event.shiftKey) {
            event.preventDefault();
            this.store.dispatch(new graphEditorActions.PortPinShiftClicked({
                graphModelId: this.port.graphModel.id,
                portId: this.port.id
            }));
        }

        if (event.button === 0) {
            event.preventDefault();
            this.cablePullService.startPull(this.port, event);
        }
    }

    @HostListener('mouseup', ['$event'])
    onMouseUp(event) {
        if (event.button === 0) {
            event.preventDefault();
        }
    }
}
