import { Component, OnInit, Input, Output, EventEmitter, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { TrackingModes } from '@cpt/capacity-planning-simulation-types/lib';
import { TreeNodeReferenceTracking } from '@cpt/interfaces/tree-node-tracking';
import { Store } from '@ngxs/store';
import { TreeNodeTrackingState } from '@cpt/state/tree-node-tracking.state';
import { filter, map } from 'rxjs/operators';
import { untilDestroyed } from 'ngx-take-until-destroy';

@Component({
    selector: 'tracking-editor',
    templateUrl: './node-tracking-editor.component.html',
    styleUrls: ['./node-tracking-editor.component.css']
})

export class NodeTrackingEditorComponent implements OnInit, OnDestroy {
    @Input('tracking') tracking: TreeNodeReferenceTracking;
    @Input() disabled = false;
    @Output('trackingUpdated') trackingUpdateEvent = new EventEmitter<TreeNodeReferenceTracking>();

    availableReleaseNrs: number[] = [];

    constructor(private store: Store) { }

    ngOnInit() {
        this.store.select(TreeNodeTrackingState.byId).pipe(
            map(byId => byId(this.tracking.nodeId)),
            untilDestroyed(this),
        ).subscribe(trackingState => {
            if (!trackingState) {
                this.disabled = true;
            } else if (trackingState.releaseNr) {
                this.availableReleaseNrs = Array.from({ length: trackingState.releaseNr }, (v, k) => k + 1).reverse();
            }
        });

    }

    ngOnDestroy(): void {


    }

    selectedTrackingMode(tm: TrackingModes) {
        this.trackingUpdateEvent.emit({
            nodeId: this.tracking.nodeId,
            tracking: tm,
            releaseNr: tm === 'LATEST_RELEASE' && this.availableReleaseNrs.length ? this.availableReleaseNrs[0] : undefined
        });

    }

    isTracking(tm: TrackingModes) {
        const isActive = this.tracking.tracking === tm ? 'active' : '';
        return isActive;
    }

    noReleases(): boolean {
        return !this.availableReleaseNrs.length || this.disabled;
    }


    selectFixed(rn: number) {
        this.trackingUpdateEvent.emit({ nodeId: this.tracking.nodeId, tracking: 'FIXED', releaseNr: rn });
    }

    get selectedFixedRelease(): string {
        if (this.tracking.tracking === 'FIXED' && this.tracking.releaseNr) {
            return 'R' + this.tracking.releaseNr.toString();
        } else {
            return '';
        }
    }
    get selectedLatestRelease(): string {
        if (this.tracking.tracking === 'LATEST_RELEASE' && this.tracking.releaseNr) {
            return 'R' + this.tracking.releaseNr.toString();
        } else {
            return '';
        }
    }


}
