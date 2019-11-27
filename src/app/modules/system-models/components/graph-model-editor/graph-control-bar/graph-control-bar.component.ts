import { Component, Input } from '@angular/core';
import { Store } from '@ngxs/store';
import * as graphControlBarActions from '@system-models/state/graph-control-bar.actions';
import { LayoutEngineService } from '../services/layout-engine.service';

@Component({
    selector: 'app-graph-control-bar',
    templateUrl: './graph-control-bar.component.html',
    styleUrls: ['./graph-control-bar.component.css']
})
export class GraphControlBarComponent {
    @Input() graphModel;
    showHelpBox: boolean;
    disableHelpBox: boolean;

    constructor(private store: Store, private layoutEngineService: LayoutEngineService) { }

    onGraphProcessingElementSearchResultSelected(selectedItem) {
        const offsetParent = this.layoutEngineService.selectRectangleParent;
        const position = this.layoutEngineService.translatePoint({
            x: offsetParent.offsetLeft + 100,
            y: offsetParent.offsetTop + 200
        });
        const label = selectedItem.implementation === 'GRAPH_MODEL' ? this.checkDuplicateModel(selectedItem) : null;
        this.store.dispatch(new graphControlBarActions.ProcessingElementSearchResultSelected({
            graphModelId: this.graphModel.id,
            graphModelOrProcessInterface: selectedItem,
            position: position,
            label: label
        }));
    }

    toggleDisplayHelpBox() {
        this.showHelpBox = !this.showHelpBox;
    }

    toggleActivatingHelpBox() {
        this.disableHelpBox = !this.disableHelpBox;
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
