import { Injectable } from '@angular/core';
import { Utils } from '@app/modules/cpt/lib/utils';
import { User } from '../../login/interfaces/user';
import { HttpClient } from '@angular/common/http';
import { ApiResult } from '@app/modules/cpt/interfaces/api-result';



@Injectable()
export class UserGroupService {
    constructor(
        private http: HttpClient) { }

    // get all userGroup
    getUserGroup() {
        const url = Utils.createUrl(Utils.routeUserGroup);
        return this.http
            .get<ApiResult<any>>(url, Utils.httpOptions);

    }

    createUsergroup(userGroupName: String, usersWithAccess: Array<User>, roleId: String) {
        const url = Utils.createUrl(Utils.routeUserGroup);
        const body = { userGroupName: userGroupName, usersWithAccess: usersWithAccess, roleId: roleId };

        return this.http
            .post<ApiResult<any>>(url, body, Utils.httpOptions);
    }

    updateUsergroup(id: String, userGroupName: String, usersWithAccess: Array<User>, roleId: String) {
        const url = Utils.createUrl(Utils.routeUserGroup) + '/' + id;
        const body = { id: id, userGroupName: userGroupName, usersWithAccess: usersWithAccess, roleId: roleId };
        return this.http
            .put<ApiResult<any>>(url, body, Utils.httpOptions)
    }
    getDetails(id: String) {
        const url = Utils.createUrl(Utils.routeUserGroup) + '/' + id;
        return this.http
            .get<ApiResult<any>>(url, Utils.httpOptions);
    }
    getUserByName(userGroupName: String) {
        const url = Utils.createUrl(Utils.routeUserGroup) + '/userGroupName/' + userGroupName;
        return this.http
            .get<ApiResult<any>>(url, Utils.httpOptions);
    }
    deleteUsergroup(id) {
        const url = Utils.createUrl(Utils.routeUserGroup) + '/' + id;
        return this.http
            .delete<ApiResult<any>>(url, Utils.httpOptions);
    }
    getUserInUsergroups(userId) {
        const url = Utils.createUrl(Utils.routeUserGroup) + '/user/' + userId;
        return this.http
            .get<ApiResult<any>>(url, Utils.httpOptions);
    }
}
