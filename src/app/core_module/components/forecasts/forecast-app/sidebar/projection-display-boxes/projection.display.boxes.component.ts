import { Component, Input, OnInit, EventEmitter, Output, OnChanges } from '@angular/core';
import { Branch } from '../../../../../interfaces/branch';
import { VariableProjections, Variable } from '@cpt/capacity-planning-projection/lib';
import { ForecastVariableProjection } from '../../../../../interfaces/forecastVariableProjections';
import { Utils } from '../../../../../../utils_module/utils';

@Component({
    selector: 'projection-display-boxes',
    templateUrl: './projection.display.boxes.component.html',
    styleUrls: ['./projection.display.boxes.component.css']
})
export class ProjectionDisplayBoxesComponent implements OnInit, OnChanges {
    @Input('uiProjections') uiProjections: ForecastVariableProjection[] = [];
    @Input('variableList') variableList = [];
    @Output('displayChanged') displayChange = new EventEmitter();

    uiSideBarProjections: ForecastVariableProjection[] = [];
    button: string;
    selectAllVariablesStatus: Boolean = true;
    searchTextCol1: String = '';
    hiddenVariables = [];

    constructor() {
    }

    ngOnInit() {
        this._getHiddenVariables();
        this.uiSideBarProjections = Object.assign([], this.uiProjections);
        this.sortList();
        this.hideShowFunction();
    }

    ngOnChanges() {
        this.uiSideBarProjections = Object.assign([], this.uiProjections);
        this.sortList();
        this.searchVariable();
        this.hideShowFunction();
        this.selectAllVariablesStatus = true;
    }

    /**
     * Get the list of hidden variable from session storage
     * @private
     */
    _getHiddenVariables() {
        const result = Utils.getHiddenForecastVariables();
        if (result !== undefined) {
            this.hiddenVariables = JSON.parse(result);
        } else {
            this.hiddenVariables = [];
        }
    }

    private clearList() {
        this.uiSideBarProjections = [];
    }

    private sortList() {
        this.uiSideBarProjections.sort((a, b) => (a.variable.content.title > b.variable.content.title) ? 1 : -1);
    }

    toggleSelection(event, projection) {
        // Update session storage with the variable's visibility
        if (event.currentTarget.checked) {
            Utils.removeHiddenForecastVariable(projection.variable.id);
        } else {
            Utils.setHiddenForecastVariable(projection.variable.id);
        }

        this._getHiddenVariables();

        if (projection.display === true) {
            projection.display = false;
            this.displayChange.emit();
        } else {
            projection.display = true;
            this.displayChange.emit();
        }

        this.hideShowFunction();
    }

    public selectAllVariables() {
        if (this.selectAllVariablesStatus === false) {
            this.selectAllVariablesStatus = true;
            this.button = 'Hide All';
            for (let index = 0; index < this.uiSideBarProjections.length; index++) {
                this.uiSideBarProjections[index].display = true;
                Utils.removeHiddenForecastVariable(this.uiSideBarProjections[index].variable.id);
            }
        } else {
            this.selectAllVariablesStatus = false;
            this.button = 'Show All';
            for (let index = 0; index < this.uiSideBarProjections.length; index++) {
                this.uiSideBarProjections[index].display = false;
                Utils.setHiddenForecastVariable(this.uiSideBarProjections[index].variable.id);
            }
        }

        this.displayChange.emit();
    }

    public searchVariable() {
        this.clearList();
        const text = this.searchTextCol1;
        for (let index = 0; index < this.uiProjections.length; index++) {
            const projection = this.uiProjections[index];
            if (text.length === 0) {
                this.uiSideBarProjections.push(this.uiProjections[index]);
            } else {
                if (projection.variable.content.title.toLowerCase().indexOf(text.toLowerCase()) > -1) {
                    this.uiSideBarProjections.push(this.uiProjections[index]);
                }
            }
        }
        this.sortList();
    }

    hideShowFunction() {
        this.selectAllVariablesStatus = true;
        this.uiSideBarProjections.forEach(projection => {
            if (projection.display === false) {
                this.selectAllVariablesStatus = false;
            }
        }
        );
        if (!this.selectAllVariablesStatus) {
            this.button = 'Show All';
        } else {
            this.button = 'Hide All';
        }
    }

}
