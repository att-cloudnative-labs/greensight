import { Action, Selector, State, StateContext } from '@ngxs/store';
import { Unit } from '@cpt/interfaces/unit';
import * as variableUnitActions from './variable-unit.actions';
import { VariableUnitService } from '@cpt/services/variable-unit.service';
import { tap } from 'rxjs/operators';
import { append, patch, removeItem } from '@ngxs/store/operators';
import { SettingsButtonClicked } from '@cpt/state/settings.actions';

export interface VariableUnitStateModel {
    units: Unit[];
}

@State<VariableUnitStateModel>({
    name: 'units',
    defaults: {
        units: []
    }
})
export class VariableUnitState {
    constructor(private unitService: VariableUnitService) {
    }

    @Selector()
    static units(state: VariableUnitStateModel) {
        return state.units;
    }

    @Action(SettingsButtonClicked)
    @Action(variableUnitActions.UnitFetchAll)
    fetchAll(ctx: StateContext<VariableUnitStateModel>) {
        return this.unitService.getVariableUnits().pipe(tap(allUnits => {
            ctx.patchState({ units: allUnits });
        }));
    }

    @Action(variableUnitActions.UnitAdd)
    addUnit(ctx: StateContext<VariableUnitStateModel>, { payload: { title } }: variableUnitActions.UnitAdd) {
        return this.unitService.createVariableUnit(title, true).pipe(tap((newUnit) => {
            ctx.setState(patch({ units: append([newUnit]) }));
        }));
    }

    @Action(variableUnitActions.UnitDelete)
    deleteUnit(ctx: StateContext<VariableUnitStateModel>, { payload: { id } }: variableUnitActions.UnitDelete) {
        return this.unitService.deleteVariableUnit(id).pipe(tap(() => {
            ctx.setState(patch({ units: removeItem(u => u.id === id) }));
        }));
    }


}
