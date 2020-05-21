import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Router } from '@angular/router';
import { Utils } from '@cpt/lib/utils';
import { User } from '@cpt/interfaces/user';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ApiResult } from '@cpt/interfaces/api-result';
import { map, tap } from 'rxjs/operators';
import { Role, UserRole } from '@cpt/interfaces/role';

@Injectable()
export class UserService {
    token: String = '';

    constructor(
        private router: Router,
        private http: HttpClient) { }

    get httpOptions() {
        return {
            headers: new HttpHeaders({
                'Content-Type': 'application/json',
                'Authorization': Utils.getToken()
            })
        };
    }

    getUserByName(username: String) {
        const url = Utils.createUrl(Utils.routeUser) + '/username/' + username;
        return this.http
            .get<ApiResult<any>>(url, this.httpOptions);
    }

    getOwners(callback: (users: User[]) => void) {
        const url = Utils.createUrl(Utils.routeUser);
        this.http
            .get<ApiResult<User[]>>(url, this.httpOptions)
            .subscribe(result => {
                callback(result.data as User[]);
            });
    }

    getDetails(id: String) {
        const url = Utils.createUrl(Utils.routeUser) + '/' + id;
        return this.http
            .get<ApiResult<any>>(url, this.httpOptions);
    }

    createUser(username: String, password: String, role: UserRole) {
        const url = Utils.createUrl(Utils.routeUser);
        const body = { username: username, password: password, role: role };

        return this.http
            .post<ApiResult<User>>(url, body, this.httpOptions).pipe(map(result => result.data));
    }

    updateUser(id: String, username: String, roleId: String, settings: Map<string, any>, password?: String) {
        const url = Utils.createUrl(Utils.routeUser) + '/' + id;

        let body = {};
        if (password != null) {
            body = { id: id, username: username, password: password, role: roleId, settings: settings == null ? null : JSON.parse(this._mapOrObjectToString(settings)) };
        } else {
            body = { id: id, username: username, role: roleId, settings: settings == null ? null : JSON.parse(this._mapOrObjectToString(settings)) };
        }

        return this.http
            .put<ApiResult<any>>(url, body, this.httpOptions);
    }

    deleteUser(id) {
        const url = Utils.createUrl(Utils.routeUser) + '/' + id;
        return this.http
            .delete<ApiResult<any>>(url, this.httpOptions);
    }

    getUsers() {
        const url = Utils.createUrl(Utils.routeUser);
        return this.http
            .get<ApiResult<any>>(url, this.httpOptions);
    }

    getLoggedInUser() {
        const url = Utils.createUrl(Utils.routeUser) + '/' + Utils.getUserId();
        return this.http
            .get<ApiResult<any>>(url, this.httpOptions);
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
            return '';
        } else {
            return JSON.stringify(map);
        }
    }

}
