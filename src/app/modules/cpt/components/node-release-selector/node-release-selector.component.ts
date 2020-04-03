import { Component, OnInit, Input, Output, EventEmitter, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { TrackingModes } from '@cpt/capacity-planning-simulation-types/lib';
import { TreeNodeReferenceTracking } from '@cpt/interfaces/tree-node-tracking';
import { Select, Store } from '@ngxs/store';
import { TreeNodeTrackingState } from '@cpt/state/tree-node-tracking.state';
import { filter, map } from 'rxjs/operators';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { ReleaseSelected } from '@cpt/state/release.actions';

@Component({
    selector: 'release-selector',
    templateUrl: './node-release-selector.component.html',
    styleUrls: ['./node-release-selector.component.css']
})

export class NodeReleaseSelectorComponent implements OnInit, OnDestroy {
    @Input('nodeId') nodeId: string;
    @Input('releaseNr') releaseNr: number;

    constructor(private store: Store) { }

    availableReleaseNrs: number[] = [];

    ngOnInit() {
        console.log(this.releaseNr);
        const tntni = this.store.selectSnapshot(TreeNodeTrackingState);
        this.store.select(TreeNodeTrackingState.id(this.nodeId)).pipe(
            untilDestroyed(this),
            filter(trackingState => !!trackingState)
        ).subscribe(trackingState => {
            if (trackingState.releaseNr) {
                this.availableReleaseNrs = Array.from({ length: trackingState.releaseNr }, (v, k) => k + 1).reverse();
            }
        });

    }

    ngOnDestroy(): void {


    }

    getReleaseClass(): string {
        return this.releaseNr ? 'active' : '';
    }

    getVersionClass(): string {
        return !this.releaseNr ? 'active' : '';
    }

    noReleases(): boolean {
        return !this.availableReleaseNrs.length;
    }

    get selectedRelease(): string {
        return this.releaseNr ? `R${this.releaseNr}` : '';
    }
    get selectedVersion(): string {
        return "";
    }

    selectVersion(v: number) {
        this.store.dispatch(new ReleaseSelected({ nodeId: this.nodeId, releaseNr: undefined }));

    }

    selectRelease(r: number) {
        this.store.dispatch(new ReleaseSelected({ nodeId: this.nodeId, releaseNr: r }));

    }


}
