import 'rxjs/add/observable/throw';

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Utils } from '@app/utils_module/utils';
import { TreeNode, TreeNodeContentPatch } from '../interfaces/tree-node';
import { ApiResult } from '../interfaces/api-result';
import { TreeNodeVersion } from '@app/core_module/interfaces/tree-node-version';
import { ProcessInterfaceDescription } from '@cpt/capacity-planning-simulation-types/lib';

@Injectable()
export class TreeService {
    constructor(private http: HttpClient) { }

    baseUrl = Utils.createModelUrl('tree');

    lastProcessUpdate: Date;

    getTree2(rootNode: string = 'root', sparse: boolean = false, depth: number = 2): Observable<TreeNode[]> {
        return this.http
            .get<ApiResult<TreeNode[]>>(`${this.baseUrl}/${rootNode}?sparse=${sparse}&depth=${depth}`, this.httpOptions)
            .map(result => result.data);
    }


    getTree3(nodeId: string, sparse: boolean = true, withChildren: boolean = true, sparseChildren: boolean = true): Observable<TreeNode[]> {
        return this.http
            .get<ApiResult<TreeNode[]>>(`${this.baseUrl}/${nodeId}?sparse=${sparse}&withChildren=${withChildren}&sparseChildren=${sparseChildren}`, this.httpOptions)
            .map(result => result.data);
    }

    getSingleTreeNode(nodeId: string): Observable<TreeNode> {
        return this.http
            .get<ApiResult<TreeNode[]>>(`${this.baseUrl}/${nodeId}?sparse=false`, this.httpOptions)
            .map(result => result.data.filter(node => node.id === nodeId)[0]);
    }

    getTrash(): Observable<TreeNode[]> {
        return this.http
            .get<ApiResult<TreeNode[]>>(`${this.baseUrl}/root/trashed`, this.httpOptions)
            .map(result => result.data);
    }

    getNodeHistory(payload: TreeNode): Observable<TreeNode[]> {
        return this.http
            .get<[]>(`${this.baseUrl}/${payload.id}/history?sparse=true`, this.httpOptions)
            .pipe(catchError((error: any) => Observable.throw(error)));
    }

    getNodeVersionInfo(nodeId: string): Observable<TreeNodeVersion[]> {
        return this.http
            .get<ApiResult<TreeNodeVersion[]>>(`${this.baseUrl}/${nodeId}/history?filter=hasComment&alwaysInclude=first`, this.httpOptions)
            .map(result => result.data);
    }

    getLastProcessUpdate(): Date {
        return this.lastProcessUpdate;
    }

    getProcessInfo(since?: number): Observable<ProcessInterfaceDescription[]> {
        let queryString = '';
        if (since) {
            queryString = '?since=' + since;
        }
        return this.http
            .get<ApiResult<ProcessInterfaceDescription[]>>(Utils.createModelUrl('processes/') + queryString, { ...this.httpOptions, observe: 'response' }).pipe(
                tap(resp => {
                    this.lastProcessUpdate = new Date(resp.headers.get('Date'));
                }),
                map(result => result.body.data)
            );
    }

    getTrashedNode(payload: TreeNode): Observable<TreeNode[]> {
        return this.http
            .get<[]>(`${this.baseUrl}/${payload.id}?depth=0&sparse=false&trashed=true`, this.httpOptions)
            .pipe(catchError((error: any) => Observable.throw(error)));
    }

    createTreeNode(payload: TreeNode): Observable<TreeNode> {
        return this.http
            .post<TreeNode>(`${this.baseUrl}`, payload, this.httpOptions)
            .pipe(catchError((error: any) => Observable.throw(error.json())));
    }

    createTreeNode2(payload: TreeNode): Observable<TreeNode> {
        return this.http
            .post<ApiResult<TreeNode>>(`${this.baseUrl}`, payload, this.httpOptions)
            .map(nodeResult => nodeResult.data);
    }

    updateTreeNode(payload: TreeNode): Observable<TreeNode> {
        return this.http
            .put<TreeNode>(`${this.baseUrl}/${payload.id}`, payload, this.httpOptions);
    }

    updateTreeNode2(payload: TreeNode, version?: string, sparse?: boolean): Observable<TreeNode> {
        const doSparse = sparse ? true : false;
        let url = `${this.baseUrl}/${payload.id}?sparse=${doSparse}`;
        if (version) {
            url = url + '&v=' + version;
        }
        return this.http
            .put<ApiResult<TreeNode>>(url, payload, this.httpOptions)
            .map(nodeResult => nodeResult.data);
    }

    patchTreeNode(nodeId: string, patchSet: TreeNodeContentPatch, version: string): Observable<TreeNode> {
        const url = `${this.baseUrl}/${nodeId}/patchContent?v=${version}`;
        return this.http
            .put<ApiResult<TreeNode>>(url, patchSet, this.httpOptions)
            .map(nodeResult => nodeResult.data);
    }

    trashTreeNode(nodeId: string, version?: string): Observable<string[]> {
        let url = `${this.baseUrl}/${nodeId}`;
        if (version) {
            url = url + '?v=' + version;
        }
        return this.http
            .delete<ApiResult<string[]>>(url, this.httpOptions)
            .map(nodeResult => nodeResult.data);
    }

    moveNode(nodeId: string, version: string, newParentId: string): Observable<ApiResult<void>> {
        const url = `${this.baseUrl}/${nodeId}/move?v=${version}&parentId=${newParentId}`;
        return this.http
            .post<ApiResult<void>>(url, {}, this.httpOptions);
    }

    recoverTreeNode(nodeId: string, version: string) {
        return this.http
            .post<any>(`${this.baseUrl}/${nodeId}/recover?v=${version}`, {}, this.httpOptions)
            .pipe(catchError((error: any) => Observable.throw(error)));
    }

    updateTreeNodeVersionComment(nodeId, versionNumber, payload) {
        return this.http
            .put<TreeNode>(`${this.baseUrl}/${nodeId}/history?version=${versionNumber}`, payload, this.httpOptions)
            .pipe(catchError((error: any) => Observable.throw(error)));
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
