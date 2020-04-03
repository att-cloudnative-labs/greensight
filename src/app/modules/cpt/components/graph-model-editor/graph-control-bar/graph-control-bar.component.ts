import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Actions, ofActionDispatched, Store } from '@ngxs/store';
import * as graphControlBarActions from '@app/modules/cpt/state/graph-control-bar.actions';
import * as releaseActions from '@cpt/state/release.actions';

import { LayoutEngineService } from '../services/layout-engine.service';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { ProcessOption } from '@cpt/interfaces/process-option';
import { AugmentNewProcessWithPid } from '@cpt/state/graph-model-interface.actions';

@Component({
    selector: 'app-graph-control-bar',
    templateUrl: './graph-control-bar.component.html',
    styleUrls: ['./graph-control-bar.component.css']
})
export class GraphControlBarComponent implements OnInit, OnDestroy {
    @Input() graphModel;
    @Input('releaseNr') releaseNr: number;
    showHelpBox: boolean;
    disableHelpBox: boolean;

    constructor(private store: Store, private actions: Actions, private layoutEngineService: LayoutEngineService) { }

    ngOnInit(): void {
        this.actions.pipe(ofActionDispatched(releaseActions.ReleaseDescriptionOpened), untilDestroyed(this)).subscribe((action) => {
            const payload = action.payload;
            if (payload && payload.hasOwnProperty('nodeId') && payload.nodeId === this.graphModel.id) {
                this.disableHelpBox = true;
            }
        });
        this.actions.pipe(ofActionDispatched(releaseActions.ReleaseDescriptionClosed), untilDestroyed(this)).subscribe((action) => {
            const payload = action.payload;
            if (payload && payload.hasOwnProperty('nodeId') && payload.nodeId === this.graphModel.id) {
                this.disableHelpBox = false;
            }
        });
    }

    ngOnDestroy(): void {
    }

    onGraphProcessingElementSearchResultSelected(selectedItem: ProcessOption) {
        const offsetParent = this.layoutEngineService.selectRectangleParent;
        const position = this.layoutEngineService.translatePoint({
            x: offsetParent.offsetLeft + 100,
            y: offsetParent.offsetTop + 200
        });
        const label = selectedItem.implementation === 'GRAPH_MODEL' ? this.checkDuplicateModel(selectedItem) : null;
        if (selectedItem.implementation === 'GRAPH_MODEL') {
            this.store.dispatch(new AugmentNewProcessWithPid({
                graphModelId: this.graphModel.id,
                tracking: selectedItem.graphModel,
                position: position,
                label: label
            }));
        } else {
            this.store.dispatch(new graphControlBarActions.ProcessingElementSearchResultSelected({
                graphModelId: this.graphModel.id,
                graphModelOrProcessInterface: selectedItem.processingElement,
                position: position,
                label: label
            }));
        }
    }

    toggleDisplayHelpBox() {
        this.showHelpBox = !this.showHelpBox;
    }

    private checkDuplicateModel(selectedItem) {
        let counter = -1;
        let processLabel: string;
        Object.keys(this.graphModel.processes).forEach(ref => {
            if (this.graphModel.processes[ref].ref === selectedItem.id) {
                counter++;
                processLabel = this.graphModel.processes[ref].label ? this.graphModel.processes[ref].label : processLabel;
            }
        });
        if (counter > -1) {
            let maxRetries = 100;
            let name = selectedItem.name;

            while (Object.keys(this.graphModel.processes).some(key => this.graphModel.processes[key].ref === selectedItem.id &&
                (this.graphModel.processes[key].label ? this.graphModel.processes[key].label : this.graphModel.processes[key].name) === name)) {
                if (maxRetries === 0) {
                    console.error('Exceeded unique name incrementation, cancelling operation');
                    return name;
                }
                const regexp = /_\d+$/;
                const increment = name.match(regexp);
                if (increment) {
                    const newIncrement = parseInt(increment[0].split('_')[1], 0) + 1;
                    name = name.replace(regexp, `_${newIncrement}`);
                } else {
                    name = name + '_1';
                }
                maxRetries--;
            }
            return name;
        }
    }
}
