import { Injectable } from '@angular/core';
import { Utils } from '@app/modules/cpt/lib/utils';
import { User } from '../interfaces/user';
import { HttpClient } from '@angular/common/http';
import { ApiResult } from '@app/modules/cpt/interfaces/api-result';
import { UserRole } from '@cpt/interfaces/role';
import { UserGroup } from '@cpt/interfaces/user-group';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';



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

    createUsergroup(userGroupName: String, usersWithAccess: Array<User>, roleId: UserRole): Observable<UserGroup> {
        const url = Utils.createUrl(Utils.routeUserGroup);
        const body = { userGroupName: userGroupName, usersWithAccess: usersWithAccess, roleId: roleId };

        return this.http
            .post<ApiResult<UserGroup>>(url, body, Utils.httpOptions).pipe(map(ugResult => ugResult.data));
    }

    updateUsergroup(id: String, userGroupName: String, usersWithAccess: Array<User>, roleId: String) {
        const url = Utils.createUrl(Utils.routeUserGroup) + '/' + id;
        const body = { id: id, userGroupName: userGroupName, usersWithAccess: usersWithAccess ? usersWithAccess : [], roleId: roleId };
        return this.http
            .put<ApiResult<any>>(url, body, Utils.httpOptions);
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
