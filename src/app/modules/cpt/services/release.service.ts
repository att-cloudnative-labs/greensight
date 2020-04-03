import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Utils } from '@app/modules/cpt/lib/utils';
import { ApiResult } from '../interfaces/api-result';
import { TreeNodeRelease, TreeNodeReleaseCreateDto } from '@app/modules/cpt/interfaces/tree-node-release';
import { map } from 'rxjs/operators';
import { NodeTypes } from '@cpt/capacity-planning-simulation-types/lib';

@Injectable()
export class ReleaseService {
    constructor(private http: HttpClient) { }

    baseUrl = Utils.createModelUrl('release');

    createRelease(release: TreeNodeReleaseCreateDto): Observable<TreeNodeRelease> {
        return this.http
            .post<ApiResult<TreeNodeRelease>>(`${this.baseUrl}`, release, this.httpOptions).pipe(
                map(result => result.data));
    }

    getReleases(nodeId: string, all: boolean): Observable<TreeNodeRelease[]> {
        const url = `${this.baseUrl}?nodeId=${nodeId}&all=${all}`;
        return this.http
            .get<ApiResult<TreeNodeRelease[]>>(url, this.httpOptions).pipe(
                map(result => result.data)
            );
    }

    updateRelease(releaseId: string, description?: string, tags?: string[]): Observable<TreeNodeRelease> {
        return this.http
            .put<ApiResult<TreeNodeRelease>>(`${this.baseUrl}/${releaseId}`, { description: description, tags: tags }, this.httpOptions).pipe(
                map(result => result.data)
            );
    }

    get httpOptions() {
        return {
            headers: new HttpHeaders({
                'Content-Type': 'application/json',
                'Authorization': Utils.getToken()
            })
        };
    }
}
