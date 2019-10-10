import { Http, RequestOptions, Headers } from '@angular/http';
import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Router } from '@angular/router';
import { Utils } from '../../utils_module/utils';
import { User } from '../interfaces/user';
import { Observable } from 'rxjs';
import { LoaderService } from './loader.service';
import { UserService } from './user.service';

@Injectable()
export class SettingsService {

    constructor(
        private http: Http,
        private loaderService: LoaderService,
        private userService: UserService) { }

    getSettings() {
        this.loaderService.show();
        const url = Utils.createUrl(Utils.routeUser) + '/' + sessionStorage['user_id'] + '/settings';
        return this.http
            .get(url, Utils.getRequestOptions())
            .map(result => {
                this.loaderService.hide();
                sessionStorage['current_user_settings'] = JSON.stringify(result.json().data);
                return result.json();
            });
    }

    updateSettings(settings) {
        this.loaderService.show();
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
            Utils.getUserRoleId(), Utils.getActiveProject(), Utils.getActiveBranch(), newSettings);
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
