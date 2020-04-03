import { State, Selector, StateContext, Store, Action } from '@ngxs/store';
import { ForecastVariableDescriptor } from '@app/modules/cpt/interfaces/forecast-variable-descriptor';
import { ForecastVariableUnit } from '../models/forecast-variable-unit';
import { ForecastUnitService } from '../services/forecast-unit.service';
import { map } from 'rxjs/operators';
import * as forecastVariableActions from './forecast-values.actions';
import * as fcActions from './forecast-sheet.action';
import * as treeActions from './tree.actions';
import * as libraryActions from './library.actions';
import * as trashActions from './trash.actions';
import * as clipboardActions from './clipboard.actions';

export class ForecastValuesStateModel {
    forecastUnits: ForecastVariableUnit[];
}

@State<ForecastValuesStateModel>({
    name: 'forecastValues',
    defaults: {
        forecastUnits: []
    }
})
export class ForecastValuesState {

    constructor(private forecastUnitService: ForecastUnitService) {
    }



    @Selector()
    static forecastUnits(state: ForecastValuesStateModel) {
        return state.forecastUnits;
    }


    @Action(forecastVariableActions.LoadForecastUnits)
    @Action(trashActions.RemoveTrashedNode)
    @Action(clipboardActions.NodePasteCommitted)
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
