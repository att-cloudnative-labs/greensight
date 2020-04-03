import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Router } from '@angular/router';
import { Utils } from '@app/modules/cpt/lib/utils';
import { User } from '@app/modules/login/interfaces/user';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ApiResult } from '@app/modules/cpt/interfaces/api-result';
import { tap } from 'rxjs/operators';

@Injectable()
export class UserService implements CanActivate {
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

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        if (sessionStorage.getItem('user_auth_status') === '1') {
            return true;
        }
        this.router.navigate(['login']);
        return false;

    }

    getUserByName(username: String) {
        const url = Utils.createUrl(Utils.routeUser) + '/username/' + username;
        return this.http
            .get<ApiResult<any>>(url, this.httpOptions)
    }

    authenticateUser(username: String, password: String) {
        const url = Utils.createUrl(Utils.routeLogin);
        const body = { username: username, password: password };

        return this.http
            .post<ApiResult<any>>(url, body, { headers: new HttpHeaders({ 'Content-Type': 'application/json' }), withCredentials: true })
            .pipe(
                tap(r => {
                    if (r.data) {
                        this.token = r.data.token;
                        sessionStorage['authorization_token'] = 'Bearer ' + r.data.token;
                    }
                }));
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

    createUser(username: String, password: String, roleId: String) {
        const url = Utils.createUrl(Utils.routeUser);
        const body = { username: username, password: password, role: roleId };

        return this.http
            .post<ApiResult<any>>(url, body, this.httpOptions)
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
            .put<ApiResult<any>>(url, body, this.httpOptions)
    }

    deleteUser(id) {
        const url = Utils.createUrl(Utils.routeUser) + '/' + id;
        return this.http
            .delete<ApiResult<any>>(url, this.httpOptions)
    }

    getUsers() {
        // this.loaderService.show();
        const url = Utils.createUrl(Utils.routeUser);
        return this.http
            .get<ApiResult<any>>(url, this.httpOptions)
    }

    getLoggedInUser() {
        const url = Utils.createUrl(Utils.routeUser) + '/username/' + Utils.getUserName();
        return this.http
            .get<ApiResult<any>>(url, this.httpOptions)
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
