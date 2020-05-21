import { Injectable } from '@angular/core';
import { Utils } from '@app/modules/cpt/lib/utils';
import { UserService } from '@cpt/services/user.service';
import { HttpClient } from '@angular/common/http';
import { ApiResult } from '@app/modules/cpt/interfaces/api-result';
import { map } from 'rxjs/operators';
import { UserSettings } from '@cpt/interfaces/user-settings';
import { Observable } from 'rxjs';
import { User } from '@cpt/interfaces/user';

@Injectable()
export class SettingsService {

    get settingsUrl() {
        return Utils.createUrl(Utils.routeUser) + '/' + sessionStorage['user_id'] + '/settings';
    }

    constructor(
        private http: HttpClient, private userService: UserService) { }

    getSettings(): Observable<UserSettings> {
        return this.http
            .get<ApiResult<UserSettings>>(this.settingsUrl, Utils.httpOptions).pipe(
                map(result => {
                    sessionStorage['current_user_settings'] = JSON.stringify(result.data);
                    return result.data;
                }));
    }

    setUserSetting(field: string, val: any): Observable<any> {
        return this.http.post(this.settingsUrl, { key: field, value: val }, Utils.httpOptions);
    }

    updateSettings(settings: UserSettings): Observable<void> {

        // FIXME: this whole sessionstorage thing should not be used for settings
        let newSettings = null;

        if (sessionStorage['current_user_settings'] == null) {
            newSettings = new Map<string, any>();
        } else {
            newSettings = new Map<string, any>(Object.entries(Utils.getCurrentUserSettings()));
        }

        for (const settingName in settings) {
            if (settings.hasOwnProperty(settingName)) {
                newSettings.set(settingName, settings[settingName]);
            }
        }

        sessionStorage['current_user_settings'] = this._mapOrObjectToString(newSettings);

        return this.userService.updateUser(Utils.getUserId(), Utils.getUserName(),
            Utils.getUserRoleId(), newSettings).pipe(map(r => null));
    }

    updateSessionStorage(settings: UserSettings) {
        sessionStorage['current_user_settings'] = this._mapOrObjectToString(settings);
    }

    _mapOrObjectToString(map): string {
        if (map instanceof Map) {
            return JSON.stringify(
                Array.from(
                    map.entries()
                )
                    .reduce((o, [key, value]) => {
                        o[key] = value;

                        return o;
                    }, {})
            );
        } else if (map == null) {
            return 'null';
        } else {
            return JSON.stringify(map);
        }
    }

}
