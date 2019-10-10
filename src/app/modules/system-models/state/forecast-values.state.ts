import { State, Selector, StateContext, Store, Action } from '@ngxs/store';
import { ForecastVariableDescriptor } from '@app/core_module/interfaces/forecast-variable-descriptor';
import { ForecastVariableUnit } from '../models/forecast-variable-unit';
import { ForecastVariableService } from '@app/core_module/service/variable.service';
import { ForecastUnitService } from '../services/forecast-unit.service';
import { map } from 'rxjs/operators';
import * as forecastVariableActions from './forecast-values.actions';

export class ForecastValuesStateModel {
    forecastVariables: ForecastVariableDescriptor[];
    forecastUnits: ForecastVariableUnit[];
}

@State<ForecastValuesStateModel>({
    name: 'forecastValues',
    defaults: {
        forecastVariables: [],
        forecastUnits: []
    }
})
export class ForecastValuesState {

    constructor(private forecastVariableService: ForecastVariableService,
        private forecastUnitService: ForecastUnitService) {
    }

    @Selector()
    static forecastVariables(state: ForecastValuesStateModel) {
        return state.forecastVariables;
    }

    @Selector()
    static forecastVariableById(state: ForecastValuesStateModel) {
        return (id: string) => {
            return state.forecastVariables.find(node => node.variableId === id);
        };
    }

    @Selector()
    static forecastUnits(state: ForecastValuesStateModel) {
        return state.forecastUnits;
    }

    @Action(forecastVariableActions.LoadForecastVariables)
    loadForecastVariables({ patchState }: StateContext<ForecastValuesStateModel>) {
        return this.forecastVariableService
            .getForecastVariableDescriptors()
            .pipe(
                map((fcVariables) => {
                    patchState({
                        forecastVariables: fcVariables,
                    });
                })
            );
    }

    @Action(forecastVariableActions.LoadForecastUnits)
    loadForecastUnits({ patchState }: StateContext<ForecastValuesStateModel>) {
        return this.forecastUnitService
            .getForecastVariableUnits()
            .pipe(
                map((response: any) => {
                    patchState({
                        forecastUnits: response.data as ForecastVariableUnit[],
                    });
                })
            );
    }
}
