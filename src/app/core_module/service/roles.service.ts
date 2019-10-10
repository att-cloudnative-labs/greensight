import { Injectable } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import { Utils } from '../../utils_module/utils';
import { LoaderService } from './loader.service';


@Injectable()
export class RoleService {
    constructor(
        private http: Http,
        private loaderService: LoaderService) { }

    // get all roles
    getRoles() {
        return [
            {
                'id': 'ADMIN',
                'roleName': 'ROLE_Admin'
            },
            {
                'id': 'READ_ONLY',
                'roleName': 'ROLE_Read-only'
            },
            {
                'id': 'READ_AND_WRITE',
                'roleName': 'ROLE_Read-and-write'
            }
        ];
    }

}
