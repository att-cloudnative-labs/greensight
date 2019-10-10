import { Http, RequestOptions, Headers } from '@angular/http';
import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Router } from '@angular/router';
import { Utils } from '../../utils_module/utils';
import { User } from '../interfaces/user';
import { Observable } from 'rxjs';
import { LoaderService } from './loader.service';

@Injectable()
export class UserService implements CanActivate {
    token: String = '';

    constructor(
        private router: Router,
        private http: Http,
        private loaderService: LoaderService) { }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        if (sessionStorage.getItem('user_auth_status') === '1') {
            return true;
        }
        this.router.navigate(['login']);
        return false;

    }

    getUserByName(username: String) {
        this.loaderService.show();
        const url = Utils.createUrl(Utils.routeUser) + '/username/' + username;
        const header = new Headers({ 'Content-Type': 'application/json' });
        return this.http
            .get(url, Utils.getRequestOptions())
            .map(result => {
                this.loaderService.hide();
                return result.json();
            });
    }

    authenticateUser(username: String, password: String) {
        this.loaderService.show();
        const url = Utils.createUrl(Utils.routeLogin);
        const body = { username: username, password: password };

        const header = new Headers({ 'Content-Type': 'application/json' });
        const requestOptions = new RequestOptions({ headers: header, withCredentials: true });

        return this.http
            .post(url, body, requestOptions)
            .map(result => {
                this.loaderService.hide();
                const res = result.json();
                if (res.data) {
                    this.token = res.data.token;
                    sessionStorage['authorization_token'] = 'Bearer ' + this.token;
                }
                return result.json();
            })
            .catch((error: any) => {
                this.loaderService.hide();
                return Observable.throw(error);
            });
    }

    getOwners(callback: (users: User[]) => void) {
        this.loaderService.show();
        const url = Utils.createUrl(Utils.routeUser);
        this.http
            .get(url, Utils.getRequestOptions())
            .map(result => result.json())
            .subscribe(result => {
                this.loaderService.hide();
                callback(result.data as User[]);
            });
    }

    getDetails(id: String) {
        this.loaderService.show();
        const url = Utils.createUrl(Utils.routeUser) + '/' + id;
        return this.http
            .get(url, Utils.getRequestOptions())
            .map(result => {
                this.loaderService.hide();
                return result.json();
            });
    }

    createUser(username: String, password: String, roleId: String) {
        this.loaderService.show();
        const url = Utils.createUrl(Utils.routeUser);
        const body = { username: username, password: password, role: roleId };

        return this.http
            .post(url, body, Utils.getRequestOptions())
            .map(result => {
                this.loaderService.hide();
                return result.json();
            });
    }

    updateUser(id: String, username: String, roleId: String, projectId: String, branchId: String, settings: Map<string, any>, password?: String) {
        this.loaderService.show();
        const url = Utils.createUrl(Utils.routeUser) + '/' + id;

        let body = {};
        if (password != null) {
            body = { id: id, username: username, password: password, role: roleId, projectId: projectId, branchId: branchId, settings: settings == null ? null : JSON.parse(this._mapOrObjectToString(settings)) };
        } else {
            body = { id: id, username: username, role: roleId, projectId: projectId, branchId: branchId, settings: settings == null ? null : JSON.parse(this._mapOrObjectToString(settings)) };
        }

        return this.http
            .put(url, body, Utils.getRequestOptions())
            .map(result => {
                this.loaderService.hide();
                return result.json();
            });
    }

    deleteUser(id) {
        this.loaderService.show();
        const url = Utils.createUrl(Utils.routeUser) + '/' + id;
        return this.http
            .delete(url, Utils.getRequestOptions())
            .map(result => {
                this.loaderService.hide();
                return result.json();
            });
    }

    getUsers() {
        // this.loaderService.show();
        const url = Utils.createUrl(Utils.routeUser);
        return this.http
            .get(url, Utils.getRequestOptions())
            .map(result => {
                this.loaderService.hide();
                return result.json();
            });
    }

    getLoggedInUser() {
        this.loaderService.show();
        const url = Utils.createUrl(Utils.routeUser) + '/username/' + Utils.getUserName();
        return this.http
            .get(url, Utils.getRequestOptions())
            .map(result => {
                this.loaderService.hide();
                return result.json();
            });
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
