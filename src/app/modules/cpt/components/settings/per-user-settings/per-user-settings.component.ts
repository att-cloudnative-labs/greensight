import { Component, OnDestroy, OnInit } from '@angular/core';
import * as momenttz from 'moment-timezone';
import { TrackingModes } from '@cpt/capacity-planning-simulation-types/lib';
import { Select, Store } from '@ngxs/store';
import {
    SettingsBreakdownVariablePrecisionUpdate, SettingsSigmaUpdate,
    SettingsTimezoneUpdate,
    SettingsVariablePrecisionUpdate
} from '@cpt/state/settings.actions';
import { SettingsState } from '@cpt/state/settings.state';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { Observable } from 'rxjs';
import { parseSigmaString, stringifySigma, UserSettings } from '@cpt/interfaces/user-settings';

@Component({
    selector: 'per-user-settings',
    templateUrl: './per-user-settings.component.html',
    styleUrls: ['./per-user-settings.component.css']
})
export class PerUserSettingsComponent implements OnInit, OnDestroy {
    @Select(SettingsState.userSettings) userSettings$: Observable<UserSettings>;

    timezones = momenttz.tz.names();
    utcList: { tzDescription: string, tzCode: string }[] = [];
    timezone = '';

    breakdownPrecision = 0;
    variablePrecision = 0;

    sigmaTxt = '';

    constructor(private store: Store) {
    }

    ngOnDestroy(): void {
    }

    ngOnInit(): void {
        for (let index = 0; index < this.timezones.length; index++) {
            const tzDesc = this.timezones[index] + ': ' + momenttz.tz(this.timezones[index]).toString().split(' ')[5];
            this.utcList.push({ tzDescription: tzDesc, tzCode: this.timezones[index] });
        }

        this.userSettings$.subscribe(settings => {
            this.breakdownPrecision = settings.BREAKDOWN_DECIMAL;
            this.variablePrecision = settings.VARIABLE_DECIMAL;
            // the old timezone string include the changing GMT offset after a colon
            // cut that off
            const separatorOffset = settings.TIMEZONE.indexOf(':');
            if (separatorOffset > 0) {
                this.timezone = settings.TIMEZONE.substr(0, separatorOffset);
            } else {
                this.timezone = settings.TIMEZONE;
            }
            this.sigmaTxt = stringifySigma(settings.SIGMA);

        });
    }
    setVarPrecision(precision: number) {
        this.store.dispatch(new SettingsVariablePrecisionUpdate({ precision: precision }));
    }

    varPrecisionClass(precision: number) {
        const isActive = this.variablePrecision === precision ? 'active' : '';
        return isActive;
    }

    setBdPrecision(precision: number) {
        this.store.dispatch(new SettingsBreakdownVariablePrecisionUpdate({ precision: precision }));
    }

    bdPrecisionClass(precision: number) {
        const isActive = this.breakdownPrecision === precision ? 'active' : '';
        return isActive;
    }

    tzUpdate(event) {
        if (this.timezone.trim().length > 0) {
            this.store.dispatch(new SettingsTimezoneUpdate({ timezone: this.timezone }));
        }

    }
    sigmaUpdate(event) {
        if (event instanceof FocusEvent) {
            const sigmaArray = parseSigmaString(this.sigmaTxt);
            this.store.dispatch(new SettingsSigmaUpdate({ sigma: sigmaArray }));
        }
    }

}
