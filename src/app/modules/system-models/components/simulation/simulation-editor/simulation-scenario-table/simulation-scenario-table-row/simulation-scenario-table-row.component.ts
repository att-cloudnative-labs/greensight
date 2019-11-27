import { Component, Input, OnInit, OnChanges, ViewChild, ElementRef } from '@angular/core';
import { Store, Select } from '@ngxs/store';
import * as simulationActions from '@system-models/state/simulation.actions';
import { ForecastValuesState } from '@app/modules/system-models/state/forecast-values.state';
import { ForecastVariableDescriptor } from '@app/core_module/interfaces/forecast-variable-descriptor';
import { ForecastVariableUnit } from '@system-models/models/forecast-variable-unit';
import { Observable } from 'rxjs';
import { ALL_PARAM_TYPES } from '@cpt/capacity-planning-simulation-types';
import * as moment from 'moment';

@Component({
    selector: '[app-simulation-scenario-table-row]',
    templateUrl: './simulation-scenario-table-row.component.html',
    styleUrls: ['./simulation-scenario-table-row.component.css']
})
export class SimulationScenarioTableRowComponent implements OnInit, OnChanges {
    @Input() scenarioId: string;
    @Input() simulationId: string;
    @Input() inport;
    @Input() inportId;
    @Input() modelInport;
    @ViewChild('numberInput') numberInput: ElementRef;
    @ViewChild('stringInput') stringInput: ElementRef;
    @Select(ForecastValuesState.forecastVariables) forecastVariables$: Observable<ForecastVariableDescriptor[]>;
    @Select(ForecastValuesState.forecastUnits) forecastUnits$: Observable<ForecastVariableUnit[]>;
    forecastVariables;
    forecastUnits;

    inportTypes = [];
    numValue = 0;
    boolValue = false;
    varValue: any;
    newInport: any = {};
    forecastVar: ForecastVariableDescriptor;
    selectedUnit;
    breakdownForecastVariables;
    strValue = '';
    dateValue: any;

    constructor(private store: Store) { }

    ngOnInit() {

    }

    ngOnChanges() {
        this.newInport = Object.assign({}, this.inport);

        if (this.newInport.unit) {
            this.selectedUnit = this.newInport.unit;
        } else {
            this.selectedUnit = 'undefined';
        }

        this.forecastVariables$.subscribe(result => {
            this.forecastVariables = result;
            if (this.modelInport && this.modelInport.requiredTypes.length > 0) {
                if (this.modelInport.requiredTypes.findIndex(type => type === 'BREAKDOWN') === -1) {
                    this.forecastVariables = this.forecastVariables.filter(item => item.variableType !== 'BREAKDOWN');
                } else if (this.modelInport.requiredTypes.findIndex(type => type === 'NUMBER') === -1) {
                    this.forecastVariables = this.forecastVariables.filter(item => item.variableType !== 'INTEGER' && item.variableType !== 'REAL');
                }
            }
            this.breakdownForecastVariables = this.forecastVariables.filter(item => item.variableType !== 'INTEGER' && item.variableType !== 'REAL');
            if (this.newInport.type === 'FORECAST_VAR_REF' || this.newInport.type === 'BREAKDOWN') {
                this.forecastVar = this.forecastVariables.find(variable =>
                    variable.variableId === this.newInport.variableId);
            }
        });

        this.forecastUnits$.subscribe(result => {
            this.forecastUnits = result;
        });

        this.inportTypes = [];
        // not supporting tags at the moment
        this.inportTypes = this.getParamTypes().filter(t => t !== 'TAG');

        if (this.inportTypes.findIndex(type => type === 'BREAKDOWN') !== -1 || this.inportTypes.findIndex(type => type === 'NUMBER') !== -1) {
            this.inportTypes.push('FORECAST_VAR_REF');
        } else if (this.newInport.type === 'FORECAST_VAR_REF' && this.inportTypes.length > 0) {
            this.newInport.type = this.inportTypes[0];
        }

        // remove FORECAST_VAR_REF option from type dropdown if the only selected required type is BREAKDOWN since both would have same var selection ref
        if (this.inportTypes.findIndex(type => type === 'BREAKDOWN') !== -1 && this.inportTypes.length === 2) {
            this.inportTypes.splice(this.inportTypes.findIndex(x => x === 'FORECAST_VAR_REF'), 1);
            this.newInport.type = this.inportTypes[0];
        }

        switch (this.newInport.type) {
            case 'BOOLEAN': {
                this.boolValue = this.newInport.value ? this.newInport.value : false;
                break;
            }
            case 'NUMBER': {
                this.numValue = this.newInport.value;
                break;
            }
            case 'STRING': {
                this.strValue = this.newInport.value;
                break;
            }
            case 'DATE': {
                this.dateValue = this.newInport.value;
                break;
            }
        }
        if (this.newInport && this.newInport.displayType) {
            this.newInport.type = this.newInport.displayType;
        }
    }

    getParamTypes() {
        if (this.modelInport.requiredTypes.length === 0) {
            const allTypes = Object.assign([], ALL_PARAM_TYPES);
            return allTypes;
        } else {
            return Object.assign([], this.modelInport.requiredTypes);
        }
    }

    onStringKeyUp(event) {
        if (event.key === 'Enter') {
            this.stringInput.nativeElement.blur();
        }
    }
    onKeyUp(event) {
        if (event.key === 'Enter') {
            this.numberInput.nativeElement.blur();
        }
    }

    onForecastVarSelected(event) {
        this.valueChanged(event);
    }

    valueChanged(event) {
        let inportUnit;
        this.forecastVar = undefined;
        switch (this.newInport.type) {
            case 'STRING': {
                this.newInport.value = this.strValue;
                inportUnit = this.selectedUnit;
                this.forecastVar = undefined;
                break;
            }
            case 'DATE': {
                this.newInport.value = this.dateValue !== undefined ? this.dateValue : moment(new Date()).format('YYYY-MM');
                inportUnit = this.selectedUnit;
                this.forecastVar = undefined;
                break;
            }
            case 'BOOLEAN': {
                this.newInport.value = this.boolValue;
                inportUnit = undefined;
                break;
            }
            case 'NUMBER': {
                this.newInport.value = this.numValue;
                inportUnit = this.selectedUnit;
                break;
            }
            case 'FORECAST_VAR_REF':
            case 'BREAKDOWN': {
                inportUnit = this.selectedUnit;
                this.forecastVar = event;
            }
        }

        if (this.newInport.value === null) {
            this.newInport.value = 0;
        }

        let scenarioInport = {};

        if (this.newInport.type === 'FORECAST_VAR_REF') {
            if (this.forecastVar) {
                scenarioInport = $.extend({}, {
                    displayType: this.newInport.type,
                    type: this.newInport.type,
                    name: this.forecastVar.variableName,
                    variableId: this.forecastVar.variableId,
                    forecastId: this.forecastVar.projectBranchId,
                    unit: inportUnit
                });

                this.store.dispatch(new simulationActions.InportScenarioVariableUpdated(
                    {
                        simulationId: this.simulationId,
                        inportId: this.inportId,
                        scenarioId: this.scenarioId,
                        newScenarioInport: scenarioInport
                    })
                );
            }
        } else if (this.newInport.type === 'BREAKDOWN') {
            if (this.forecastVar) {
                scenarioInport = $.extend({}, {
                    displayType: this.newInport.type,
                    type: 'FORECAST_VAR_REF',
                    name: this.forecastVar.variableName,
                    variableId: this.forecastVar.variableId,
                    forecastId: this.forecastVar.projectBranchId,
                    unit: inportUnit
                });

                this.store.dispatch(new simulationActions.InportScenarioVariableUpdated(
                    {
                        simulationId: this.simulationId,
                        inportId: this.inportId,
                        scenarioId: this.scenarioId,
                        newScenarioInport: scenarioInport
                    })
                );
            }
        } else {
            scenarioInport = $.extend({}, {
                displayType: this.newInport.type,
                type: this.newInport.type,
                value: this.newInport.value,
                unit: inportUnit
            });

            this.store.dispatch(new simulationActions.InportScenarioUpdated(
                {
                    simulationId: this.simulationId,
                    inportId: this.inportId,
                    scenarioId: this.scenarioId,
                    newScenarioInport: scenarioInport
                })
            );
        }
    }

    unitChanged(event) {
        this.selectedUnit = event.target.value;
        this.valueChanged(event);
    }
}
