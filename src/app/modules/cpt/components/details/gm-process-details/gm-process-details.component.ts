import { Component, OnInit, Input, AfterViewInit, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { Store } from '@ngxs/store';

import * as gmProcessDetailsActions from '@app/modules/cpt/state/gm-process-details.actions';
import { ProcessInterfaceDescription, TrackingModes } from '@cpt/capacity-planning-simulation-types/lib';
import { Observable, Subject } from 'rxjs';
import { TreeNodeRelease } from '@cpt/interfaces/tree-node-release';
import { ReleaseService } from '@cpt/services/release.service';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { TrackingUpdated } from '@app/modules/cpt/state/gm-process-details.actions';
import { Process } from '@cpt/models/graph-model.model';
import { TreeNodeReferenceTracking } from '@cpt/interfaces/tree-node-tracking';

@Component({
    selector: 'app-gm-process-details',
    templateUrl: './gm-process-details.component.html',
    styleUrls: ['../../common.css', './gm-process-details.component.css']
})
export class GmProcessDetailsComponent implements OnInit, AfterViewInit, OnDestroy {
    @Input() selected;
    @ViewChild('inputElement', { static: false }) inputElement: ElementRef;

    get process(): Process {
        return this.selected.object;
    }

    get trackingInfo(): TreeNodeReferenceTracking {
        return {
            nodeId: this.process.ref,
            tracking: this.process.tracking,
            releaseNr: this.process.releaseNr
        };
    }

    get icon() {
        if (this.process.type === 'PROCESSING_ELEMENT') {
            return 'fa fa-microchip';
        } else {
            return 'fa fa-cube';
        }
    }

    get readonly() {
        return !!this.selected.releaseNr;
    }

    constructor(private store: Store, private releaseService: ReleaseService) { }

    ngOnInit() {

    }
    ngOnDestroy(): void {

    }

    updatedTracking(tt: TreeNodeReferenceTracking) {
        this.store.dispatch(new TrackingUpdated({ graphModelId: this.selected.context, processId: this.process.objectId, trackingMode: tt.tracking, releaseNr: tt.releaseNr }));
        console.log(tt);
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
