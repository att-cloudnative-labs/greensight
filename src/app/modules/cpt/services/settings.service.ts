import { Injectable } from '@angular/core';
import { Utils } from '@app/modules/cpt/lib/utils';
import { UserService } from '../../login/services/user.service';
import { HttpClient } from "@angular/common/http";
import { ApiResult } from "@app/modules/cpt/interfaces/api-result";
import { map } from 'rxjs/operators';

@Injectable()
export class SettingsService {

    constructor(
        private http: HttpClient,
        private userService: UserService) { }

    getSettings() {
        const url = Utils.createUrl(Utils.routeUser) + '/' + sessionStorage['user_id'] + '/settings';
        return this.http
            .get<ApiResult<any>>(url, Utils.httpOptions).pipe(
                map(result => {
                    sessionStorage['current_user_settings'] = JSON.stringify(result.data);
                    return result;
                }));
    }

    updateSettings(settings) {
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
            Utils.getUserRoleId(), newSettings);
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
