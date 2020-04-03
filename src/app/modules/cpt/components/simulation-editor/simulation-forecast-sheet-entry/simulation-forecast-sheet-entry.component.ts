import { Component, Input, OnInit, OnChanges, Output, EventEmitter } from '@angular/core';
import { TreeNode } from '@cpt/interfaces/tree-node';
import {
    ForecastSheetReference,
    ForecastVariableRefParam,
    InportParam
} from '@cpt/capacity-planning-simulation-types/lib';
import { Select, Store } from '@ngxs/store';
import { TreeNodeTrackingState } from '@cpt/state/tree-node-tracking.state';
import { Observable, Subject } from 'rxjs';
import { TreeNodeReferenceTracking, TreeNodeInfo } from '@cpt/interfaces/tree-node-tracking';
import { map } from 'rxjs/operators';
import { ForecastSheetTrackingUpdateClicked, RemoveForecastSheetClicked } from '@cpt/state/simulation.actions';


@Component({
    selector: 'simulation-forecast-sheet-entry',
    templateUrl: './simulation-forecast-sheet-entry.component.html',
    styleUrls: ['./simulation-forecast-sheet-entry.component.css']
})
export class SimulationForecastSheetEntryComponent implements OnInit {

    @Input('forecastSheetRef') forecastSheetRef: ForecastSheetReference;
    @Input('simulationId') simulationId: string;

    sheetName = '';
    treeNodeTracking: TreeNodeReferenceTracking;


    constructor(private store: Store) {

    }
    ngOnInit() {


        this.store.select(TreeNodeTrackingState.id(this.forecastSheetRef.ref)).subscribe(trackinginfo => {
            if (trackinginfo) {
                this.sheetName = trackinginfo.pathName ? trackinginfo.pathName + '/' + trackinginfo.name : trackinginfo.name;
                this.treeNodeTracking = {
                    nodeId: this.forecastSheetRef.ref,
                    releaseNr: this.forecastSheetRef.releaseNr,
                    tracking: this.forecastSheetRef.tracking
                };
            }
        });

    }

    updatedTracking(tnt: TreeNodeReferenceTracking) {
        this.store.dispatch(new ForecastSheetTrackingUpdateClicked({ simulationId: this.simulationId, tracking: tnt, forecastSheetReferenceId: this.forecastSheetRef.objectId }));
    }

    deleteForecastSheet() {
        this.store.dispatch(new RemoveForecastSheetClicked({ simulationId: this.simulationId, forecastSheetReferenceId: this.forecastSheetRef.objectId }));
    }

}
