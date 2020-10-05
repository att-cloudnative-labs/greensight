import { Action, Selector, State, StateContext } from '@ngxs/store';
import * as settingActions from '@cpt/state/settings.actions';
import { VersionService } from '@cpt/services/software-versions.service';
import { catchError, tap } from 'rxjs/operators';
import { Utils } from '@cpt/lib/utils';
import { SettingsService } from '@cpt/services/settings.service';
import { stringifySigma, UserSettings } from '@cpt/interfaces/user-settings';
import { of } from 'rxjs';
import * as layoutActions from '@cpt/state/layout.actions';

export interface SettingsStateModel {
    uiVersion: string;
    backendVersion: string;
    backendAuthMode: 'LOCAL' | 'LDAP';
    simulationVersion: string;
    projectionVersion: string;
    variablePrecision: number;
    breakdownVariablePrecision: number;
    timezone: string;
    sigma: number[];
}

@State<SettingsStateModel>({
    name: 'settings',
    defaults: {
        uiVersion: Utils.getUIVersion(),
        backendVersion: 'n/a',
        backendAuthMode: 'LOCAL',
        simulationVersion: 'n/a',
        projectionVersion: require('@cpt/capacity-planning-projection/package.json').version,
        variablePrecision: 0,
        breakdownVariablePrecision: 0,
        timezone: 'UTC: GMT+0000',
        sigma: [99, 95]
    }
})
export class SettingsState {

    constructor(private versionService: VersionService, private settingsService: SettingsService) {
    }

    @Selector()
    static authMode(state: SettingsStateModel) {
        return state.backendAuthMode;
    }

    @Selector()
    static userSettings(state: SettingsStateModel): UserSettings {
        return {
            BREAKDOWN_DECIMAL: state.breakdownVariablePrecision,
            VARIABLE_DECIMAL: state.variablePrecision,
            TIMEZONE: state.timezone,
            SIGMA: state.sigma
        };
    }


    @Action(settingActions.SettingsFetchBackendInfo)
    fetchBackendInfo(ctx: StateContext<SettingsStateModel>) {
        return this.versionService.getBackendVersion().pipe(tap(beInfo => {
            ctx.patchState({ backendVersion: beInfo.version, backendAuthMode: beInfo.authMode });
        }));
    }

    @Action(settingActions.SettingsFetchSimulationInfo)
    fetchSimulationInfo(ctx: StateContext<SettingsStateModel>) {
        return this.versionService.getSimBackendVersion().pipe(tap(simInfo => {
            ctx.patchState({ simulationVersion: simInfo.version });
        }), catchError((e) => of('dont mind')));
    }

    @Action(settingActions.SettingsFetchUser)
    fetchUserSettings(ctx: StateContext<SettingsStateModel>) {
        const curUserSettings = SettingsState.userSettings(ctx.getState());
        return this.settingsService.getSettings().pipe(tap(s => {
            ctx.patchState({
                breakdownVariablePrecision: s.BREAKDOWN_DECIMAL !== undefined ? s.BREAKDOWN_DECIMAL : curUserSettings.BREAKDOWN_DECIMAL,
                variablePrecision: s.VARIABLE_DECIMAL !== undefined ? s.VARIABLE_DECIMAL : curUserSettings.VARIABLE_DECIMAL,
                timezone: s.TIMEZONE !== undefined ? s.TIMEZONE : curUserSettings.TIMEZONE
            });
            this.settingsService.updateSessionStorage(SettingsState.userSettings(ctx.getState()));
        }));
    }

    @Action(settingActions.SettingsBreakdownVariablePrecisionUpdate)
    setBreakdownVariablePrecision(ctx: StateContext<SettingsStateModel>, { payload: { precision } }: settingActions.SettingsBreakdownVariablePrecisionUpdate) {
        return this.settingsService.setUserSetting('BREAKDOWN_DECIMAL', precision).pipe(tap(() => {
            ctx.patchState({ breakdownVariablePrecision: precision });
            this.settingsService.updateSessionStorage(SettingsState.userSettings(ctx.getState()));
        }));
    }

    @Action(settingActions.SettingsVariablePrecisionUpdate)
    setVariablePrecision(ctx: StateContext<SettingsStateModel>, { payload: { precision } }: settingActions.SettingsVariablePrecisionUpdate) {
        return this.settingsService.setUserSetting('VARIABLE_DECIMAL', precision).pipe(tap(() => {
            ctx.patchState({ variablePrecision: precision });
            this.settingsService.updateSessionStorage(SettingsState.userSettings(ctx.getState()));
        }));
    }

    @Action(settingActions.SettingsTimezoneUpdate)
    setTimezone(ctx: StateContext<SettingsStateModel>, { payload: { timezone } }: settingActions.SettingsTimezoneUpdate) {
        return this.settingsService.setUserSetting('TIMEZONE', timezone).pipe(tap(() => {
            ctx.patchState({ timezone: timezone });
            this.settingsService.updateSessionStorage(SettingsState.userSettings(ctx.getState()));
        }));
    }

    @Action(settingActions.SettingsSigmaUpdate)
    setSigmas(ctx: StateContext<SettingsStateModel>, { payload: { sigma } }: settingActions.SettingsSigmaUpdate) {
        return this.settingsService.setUserSetting('SIGMA', stringifySigma(sigma)).pipe(tap(() => {
            ctx.patchState({ sigma: sigma });
            this.settingsService.updateSessionStorage(SettingsState.userSettings(ctx.getState()));
        }));
    }

    @Action(settingActions.SettingsFetch)
    @Action(settingActions.SettingsButtonClicked)
    pullLatestSettings(ctx: StateContext<SettingsStateModel>) {
        return ctx.dispatch([new settingActions.SettingsFetchBackendInfo(), new settingActions.SettingsFetchSimulationInfo(), new settingActions.SettingsFetchUser(), new layoutActions.GetLayout(sessionStorage['user_name'])]);
    }


}
