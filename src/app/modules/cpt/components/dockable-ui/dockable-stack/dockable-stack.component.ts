import { Component, OnInit, Input, SimpleChanges, OnChanges } from '@angular/core';
import { Stack, Panel, LayoutState } from '@app/modules/cpt/state/layout.state';
import { Store } from '@ngxs/store';
import * as dockableStackActions from '@app/modules/cpt/state/dockable-stack.actions';
import * as libraryActions from '@app/modules/cpt/state/library.actions';

@Component({
    selector: 'app-dockable-stack',
    templateUrl: './dockable-stack.component.html',
    styleUrls: ['./dockable-stack.component.css']
})
export class DockableStackComponent implements OnInit, OnChanges {
    @Input() parentId: string;
    @Input() stack: Stack;
    private _previousSelection;

    get panels(): Panel[] {
        return this.stack.panels;
    }

    get selectedPanel(): Panel {
        return this.stack.panels.find(panel => panel.id === this.stack.selected);
    }

    constructor(private store: Store) { }

    handleDropNode(dragItem) {
        if (dragItem.data[0].type !== undefined) {
        const selection = dragItem.data;
        this.store.dispatch(new libraryActions.GraphModelDoubleClicked(selection[0]));
        }

    }
    get srEnabled() {
        return LayoutState.simResultOpen;
    }

    ngOnInit() {
    }

    ngOnChanges(changes: SimpleChanges) {
        if ((this._previousSelection !== this.stack.selected)) {
            if (this.stack.selected) {
                this._previousSelection = this.stack.selected;
                // Get nodeId
                const selectedPanel = this.stack.panels.find(panel => panel.id === this.stack.selected);
                if (selectedPanel && selectedPanel.args) {
                    setTimeout(() => {
                        this.store.dispatch(new dockableStackActions.TabSelectionChanged({ stackId: this.stack.id, nodeId: selectedPanel.args.nodeId }));
                    }, 0);
                }
            } else {
                setTimeout(() => {
                    this.store.dispatch(new dockableStackActions.TabSelectionChanged({ stackId: this.stack.id, nodeId: undefined }));
                }, 0);
            }
        }
    }

    onTabClick(panel: Panel) {
        this.store.dispatch(new dockableStackActions.TabClicked({ stackId: this.stack.id, panelId: panel.id }));
    }

    onTabCloseClick(panel: Panel) {
        this.store.dispatch(new dockableStackActions.TabCloseClicked({ stackId: this.stack.id, panelId: panel.id }));
    }

    icon(component) {
        if (component === 'SimulationEditorComponent') {
            return 'far fa-clock';
        } else if (component === 'GraphModelEditorComponent') {
            return 'fa fa-cube';
        } else if (component === 'SimulationResultComponent') {
            return 'fa fa-chart-bar';
        } else if (component === 'ForecastEditorComponent') {
            return 'fa fa-chart-line';
        } else if (component === 'SettingsEditorComponent') {
            return 'fa fa-cog';
        } else if (component === 'UserEditorComponent') {
            return 'fa fa-user';
        } else if (component === 'UserGroupEditorComponent') {
            return 'fa fa-users';
        } else {
            return '';
        }
    }


}
