import { Component, Input, OnInit, OnDestroy, OnChanges, ViewChild, ElementRef } from '@angular/core';
import { Store, Select } from '@ngxs/store';
import * as simulationActions from '@cpt/state/simulation.actions';
import { ForecastValuesState } from '@cpt/state/forecast-values.state';
import { ForecastVariableDescriptor } from '@cpt/interfaces/forecast-variable-descriptor';
import { ForecastVariableUnit } from '@cpt/models/forecast-variable-unit';
import { Observable } from 'rxjs';
import { ALL_PARAM_TYPES } from '@cpt/capacity-planning-simulation-types';
import * as moment from 'moment';
import { ParamType } from '@cpt/capacity-planning-simulation-types/lib';

@Component({
    selector: '[app-simulation-scenario-table-row]',
    templateUrl: './simulation-scenario-table-row.component.html',
    styleUrls: ['./simulation-scenario-table-row.component.css']
})
export class SimulationScenarioTableRowComponent implements OnInit, OnDestroy, OnChanges {
    @Input() scenarioId: string;
    @Input() simulationId: string;
    @Input() inport;
    @Input() inportId;
    @Input() inportInfos: { types: ParamType[], name: string };
    @Input() reloadOnChange: boolean;
    @Input() variableDescriptors: Observable<ForecastVariableDescriptor[]>;

    @ViewChild('numberInput', { static: false }) numberInput: ElementRef;
    @ViewChild('stringInput', { static: false }) stringInput: ElementRef;
    @Select(ForecastValuesState.forecastUnits) forecastUnits$: Observable<ForecastVariableUnit[]>;
    forecastVariables = [];
    forecastUnits;

    inportTypes = [];
    numValue = 0;
    boolValue = false;
    newInport: any = {};
    forecastVar: ForecastVariableDescriptor;
    selectedUnit;
    breakdownForecastVariables;
    strValue = '';
    dateValue: any;
    delayTimer;

    constructor(private store: Store) { }

    ngOnInit() {

    }

    ngOnDestroy() {
        if (this.delayTimer) clearTimeout(this.delayTimer);
    }

    ngOnChanges() {
        if (!this.inportInfos) {
            this.inportInfos = { types: [], name: "" };
        }
        this.newInport = Object.assign({}, this.inport);
        if (this.newInport.type === 'FORECAST_VAR_REF') {
            if (this.newInport.displayType === 'FORECAST_VAR_REF') {
                this.newInport.type = 'VARIABLE';
                this.newInport.displayType = 'VARIABLE';
            } else if (this.newInport.displayType === 'BREAKDOWN') {
                this.newInport.type = 'VARIABLE';
                this.newInport.displayType = 'BREAKDOWN';
            }
        }

        if (this.newInport.unit) {
            this.selectedUnit = this.newInport.unit;
        } else {
            this.selectedUnit = 'undefined';
        }

        this.variableDescriptors.subscribe(result => {
            this.forecastVariables = result;
            if (this.inportInfos.types.length > 0) {
                if (this.inportInfos.types.findIndex(type => type === 'BREAKDOWN') === -1) {
                    this.forecastVariables = this.forecastVariables.filter(item => item.variableType !== 'BREAKDOWN');
                } else if (this.inportInfos.types.findIndex(type => type === 'NUMBER') === -1) {
                    this.forecastVariables = this.forecastVariables.filter(item => item.variableType !== 'INTEGER' && item.variableType !== 'REAL');
                }
            }
            this.breakdownForecastVariables = this.forecastVariables.filter(item => item.variableType !== 'INTEGER' && item.variableType !== 'REAL');
            if (this.newInport.displayType === 'VARIABLE') {
                this.forecastVar = this.forecastVariables.find(variable =>
                    variable.variableId === this.newInport.variableId);
            } else if (this.newInport.displayType === 'BREAKDOWN') {
                this.forecastVar = this.breakdownForecastVariables.find(variable =>
                    variable.variableId === this.newInport.variableId);
            }
        });

        this.forecastUnits$.subscribe(result => {
            this.forecastUnits = result;
        });

        this.inportTypes = [];
        // not supporting tags at the moment
        this.inportTypes = this.getParamTypes().filter(t => t !== 'TAG').map(t => t === 'FORECAST_VAR_REF' ? 'VARIABLE' : t);

        if (this.inportTypes.findIndex(type => type === 'NUMBER') !== -1) {
            this.inportTypes.push('VARIABLE');
        } else if ((this.newInport.type === 'VARIABLE' || this.newInport.type === 'NUMBER') && this.inportTypes.length > 0) {
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

    get variableSelectMessage(): string {
        if (!this.forecastVariables.length) {
            return 'select a forecast sheet first';
        }
        return 'select a forecast variable';
    }

    get breakdownSelectMessage(): string {
        if (!this.forecastVariables.length) {
            return 'select a forecast sheet first';
        }

        return 'select a breakdown variable';
    }

    getParamTypes() {
        if (!this.inportInfos || this.inportInfos.types.length === 0) {
            const allTypes = Object.assign([], ALL_PARAM_TYPES);
            return allTypes;
        } else {
            return Object.assign([], this.inportInfos.types);
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

    textInputChanged(event, timeout) {
        if (this.delayTimer) clearTimeout(this.delayTimer);
        if (timeout) {
            this.delayTimer = setTimeout(() => {
                this.valueChanged(event);
            }, timeout);
        }
        else {
            this.valueChanged(event);
        }
    }

    typeChanged(event) {
        if (this.delayTimer) clearTimeout(this.delayTimer);
        this.valueChanged(event);
    }

    valueChanged(event) {
        let inportUnit;
        this.forecastVar = undefined;
        switch (this.newInport.type) {
            case 'STRING': {
                if (this.newInport.value === this.strValue) {
                    return;
                }
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
                if (this.newInport.value === this.numValue) {
                    return;
                }
                this.newInport.value = this.numValue;
                inportUnit = this.selectedUnit;
                break;
            }
            case 'VARIABLE':
            case 'BREAKDOWN': {
                inportUnit = this.selectedUnit;
                this.forecastVar = event;
            }
        }

        if (this.newInport.value === null) {
            this.newInport.value = 0;
        }

        let scenarioInport = {};

        if (this.newInport.type === 'VARIABLE') {
            if (this.forecastVar) {
                scenarioInport = $.extend({}, {
                    displayType: 'FORECAST_VAR_REF',
                    type: 'FORECAST_VAR_REF',
                    name: this.forecastVar.variableName,
                    variableId: this.forecastVar.variableId,
                    sheetRefId: this.forecastVar.sheetRefId,
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
                    displayType: 'BREAKDOWN',
                    type: 'FORECAST_VAR_REF',
                    name: this.forecastVar.variableName,
                    variableId: this.forecastVar.variableId,
                    sheetRefId: this.forecastVar.sheetRefId,
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
        this.selectedUnit = (event.target.value && event.target.value !== "") ? event.target.value : null;
        this.valueChanged(event);
    }
}

function triggerValueChange(obj, event) {
    if (obj)
        obj.valueChanged(event);
}
