import { Injectable } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import { Utils } from '../../utils_module/utils';
import { LoaderService } from './loader.service';
import { User } from '../interfaces/user';



@Injectable()
export class UserGroupService {
    constructor(
        private http: Http,
        private loaderService: LoaderService) { }

    // get all userGroup
    getUserGroup() {
        // this.loaderService.show();
        const url = Utils.createUrl(Utils.routeUserGroup);
        return this.http
            .get(url, Utils.getRequestOptions())
            .map(result => {
                this.loaderService.hide();
                return result.json();
            });
    }

    createUsergroup(userGroupName: String, usersWithAccess: Array<User>, roleId: String) {
        this.loaderService.show();
        const url = Utils.createUrl(Utils.routeUserGroup);
        const body = { userGroupName: userGroupName, usersWithAccess: usersWithAccess, roleId: roleId };

        return this.http
            .post(url, body, Utils.getRequestOptions())
            .map(result => {
                this.loaderService.hide();
                return result.json();
            });
    }

    updateUsergroup(id: String, userGroupName: String, usersWithAccess: Array<User>, roleId: String) {
        this.loaderService.show();
        const url = Utils.createUrl(Utils.routeUserGroup) + '/' + id;
        const body = { id: id, userGroupName: userGroupName, usersWithAccess: usersWithAccess, roleId: roleId };
        return this.http
            .put(url, body, Utils.getRequestOptions())
            .map(result => {
                this.loaderService.hide();
                return result.json();
            });
    }
    getDetails(id: String) {
        this.loaderService.show();
        const url = Utils.createUrl(Utils.routeUserGroup) + '/' + id;
        return this.http
            .get(url, Utils.getRequestOptions())
            .map(result => {
                this.loaderService.hide();
                return result.json();
            });
    }
    getUserByName(userGroupName: String) {
        this.loaderService.show();
        const url = Utils.createUrl(Utils.routeUserGroup) + '/userGroupName/' + userGroupName;
        const header = new Headers({ 'Content-Type': 'application/json' });
        return this.http
            .get(url, Utils.getRequestOptions())
            .map(result => {
                this.loaderService.hide();
                return result.json();
            });
    }
    deleteUsergroup(id) {
        this.loaderService.show();
        const url = Utils.createUrl(Utils.routeUserGroup) + '/' + id;
        return this.http
            .delete(url, Utils.getRequestOptions())
            .map(result => {
                this.loaderService.hide();
                return result.json();
            });
    }
    getUserInUsergroups(userId) {
        this.loaderService.show();
        const url = Utils.createUrl(Utils.routeUserGroup) + '/user/' + userId;
        return this.http
            .get(url, Utils.getRequestOptions())
            .map(result => {
                this.loaderService.hide();
                return result.json();
            });
    }



}
