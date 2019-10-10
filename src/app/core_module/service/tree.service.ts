import 'rxjs/add/observable/throw';

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Utils } from '@app/utils_module/utils';
import { TreeNode, TreeNodeContentPatch } from '../interfaces/tree-node';
import { ApiResult } from '../interfaces/api-result';

@Injectable()
export class TreeService {
    constructor(private http: HttpClient) { }

    baseUrl = Utils.createModelUrl('tree');

    getTree(rootNode: string = 'root'): Observable<TreeNode[]> {
        return this.http
            .get<[]>(`${this.baseUrl}/${rootNode}?sparse=false&trashed=false&depth=2`, this.httpOptions)
            .pipe(catchError((error: any) => Observable.throw(error.json())));
    }

    getTree2(rootNode: string = 'root', sparse: boolean = false, depth: number = 2): Observable<TreeNode[]> {
        return this.http
            .get<ApiResult<TreeNode[]>>(`${this.baseUrl}/${rootNode}?sparse=${sparse}&depth=${depth}`, this.httpOptions)
            .map(result => result.data);
    }

    getAllTreesWithoutContent(): Observable<TreeNode[]> {
        return this.http
            .get<[]>(`${this.baseUrl}/root?sparse=true&trashed=false`, this.httpOptions)
            .pipe(catchError((error: any) => Observable.throw(error.json())));
    }

    getTreeNode(payload): Observable<TreeNode[]> {
        return this.http
            .get<[]>(`${this.baseUrl}/${payload}?sparse=false`, this.httpOptions)
            .pipe(catchError((error: any) => Observable.throw(error.json())));
    }

    getSingleTreeNode(nodeId: string): Observable<TreeNode> {
        return this.http
            .get<ApiResult<TreeNode[]>>(`${this.baseUrl}/${nodeId}?sparse=false&depth=0`, this.httpOptions)
            .map(result => result.data.filter(node => node.id === nodeId)[0])
            .pipe(catchError((error: any) => Observable.throw(error.json())));
    }

    getTrash(): Observable<TreeNode[]> {
        return this.http
            .get<[]>(`${this.baseUrl}/root?sparse=false&trashed=true`, this.httpOptions)
            .pipe(catchError((error: any) => Observable.throw(error.json())));
    }

    getNodeHistory(payload: TreeNode): Observable<TreeNode[]> {
        return this.http
            .get<[]>(`${this.baseUrl}/${payload.id}/history?sparse=true`, this.httpOptions)
            .pipe(catchError((error: any) => Observable.throw(error)));
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
        let url = `${this.baseUrl}/${nodeId}/patchContent?v=${version}`;
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
            .map(nodeResult => nodeResult.data)
    }

    recoverTreeNode(nodeId: string) {
        return this.http
            .post<any>(`${this.baseUrl}/${nodeId}/recover`, {}, this.httpOptions)
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
