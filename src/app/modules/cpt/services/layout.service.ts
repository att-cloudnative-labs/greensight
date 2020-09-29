import { Utils } from '@app/modules/cpt/lib/utils';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiResult } from '@app/modules/cpt/interfaces/api-result';
import { Layout } from '@cpt/interfaces/layout';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable()
export class LayoutService {
    constructor(
        private http: HttpClient) { }

    // get user's selected layout
    getLayout(ownerId: string): Observable<Layout> {
        const url = Utils.createUrl(Utils.routeLayout) + '/' + ownerId;
        return this.http
            .get<ApiResult<Layout>>(url, Utils.httpOptions).pipe(map(result =>  result.data ));
    }

    // create a layout for user
    createLayout(ownerId: string, content: any): Observable<Layout> {
        const url = Utils.createUrl(Utils.routeLayout) + '/' + ownerId;
        const body = { ownerId: ownerId, content };
        return this.http
            .post<ApiResult<Layout>>(url, body, Utils.httpOptions).pipe(map(result => result.data));
    }

    // update layout
    updateLayout(ownerId: string, content: any) {
        const url = Utils.createUrl(Utils.routeLayout) + '/' + ownerId;
        const body = { ownerId: ownerId, content };
        return this.http
            .put<ApiResult<Layout>>(url, body, Utils.httpOptions);
    }
}
