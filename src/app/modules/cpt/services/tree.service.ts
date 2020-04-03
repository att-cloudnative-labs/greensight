import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Utils } from '@app/modules/cpt/lib/utils';
import { TreeNode, TreeNodeContentPatch, TreeNodeType } from '../interfaces/tree-node';
import { ApiResult } from '../interfaces/api-result';
import { TreeNodeVersion } from '@app/modules/cpt/interfaces/tree-node-version';
import { NodeTypes, ProcessInterfaceDescription, TrackingModes } from '@cpt/capacity-planning-simulation-types/lib';
import { TreeNodeInfo } from '@cpt/interfaces/tree-node-tracking';

@Injectable()
export class TreeService {
    constructor(private http: HttpClient) { }

    baseUrl = Utils.createModelUrl('tree');

    lastProcessUpdate: Date;
    lastTrackingUpdate: Date;


    getTree3(nodeId: string, sparse: boolean = true, withChildren: boolean = true, sparseChildren: boolean = true): Observable<TreeNode[]> {
        return this.http
            .get<ApiResult<TreeNode[]>>(`${this.baseUrl}/${nodeId}?sparse=${sparse}&withChildren=${withChildren}&sparseChildren=${sparseChildren}`, this.httpOptions).pipe(
                map(result => result.data));
    }

    getSingleTreeNode(nodeId: string, releaseNr?: number): Observable<TreeNode> {
        const combinedId = releaseNr ? `${nodeId}@r${releaseNr}` : nodeId;
        return this.http
            .get<ApiResult<TreeNode[]>>(`${this.baseUrl}/${combinedId}?sparse=false`, this.httpOptions).pipe(
                map(result => result.data.filter(node => node.id === nodeId)[0]));
    }

    getTrash(): Observable<TreeNode[]> {
        return this.http
            .get<ApiResult<TreeNode[]>>(`${this.baseUrl}/root/trashed`, this.httpOptions).pipe(
                map(result => result.data));
    }

    getNodeHistory(payload: TreeNode): Observable<TreeNode[]> {
        return this.http
            .get<[]>(`${this.baseUrl}/${payload.id}/history?sparse=true`, this.httpOptions)
            .pipe(catchError((error: any) => Observable.throw(error)));
    }

    getNodeVersionInfo(nodeId: string): Observable<TreeNodeVersion[]> {
        return this.http
            .get<ApiResult<TreeNodeVersion[]>>(`${this.baseUrl}/${nodeId}/history?filter=hasDescription&alwaysInclude=first`, this.httpOptions).pipe(
                map(result => result.data));
    }

    getLastProcessUpdate(): Date {
        return this.lastProcessUpdate;
    }


    getTrackingInfo(nodeType?: NodeTypes, pidIds?: string[], since?: number): Observable<TreeNodeInfo[]> {
        let queryString = '';
        const queryParams = [];
        if (nodeType) {
            queryParams.push('nodeType=' + nodeType);
        }
        if (since) {
            queryParams.push('since=' + since);
        }
        if (pidIds) {
            for (const pidId of pidIds) {
                queryParams.push(`id=${pidId}`);
            }
        }
        queryString = queryParams.length === 0 ? '' : '?' + queryParams[0] + queryParams.slice(1).map(q => `&${q}`);
        return this.http
            .get<ApiResult<TreeNodeInfo[]>>(Utils.createModelUrl('tracking/') + queryString, { ...this.httpOptions, observe: 'response' }).pipe(
                tap(resp => {
                    this.lastTrackingUpdate = new Date(resp.headers.get('Date'));
                }),
                map(result => result.body.data)
            );
    }

    getLastTrackingUpdate(): Date {
        return this.lastTrackingUpdate;
    }


    getTrashedNode(payload: TreeNode): Observable<TreeNode[]> {
        return this.http
            .get<[]>(`${this.baseUrl}/${payload.id}?depth=0&sparse=false&trashed=true`, this.httpOptions)
            .pipe(catchError((error: any) => Observable.throw(error)));
    }

    createTreeNode(payload: TreeNode): Observable<TreeNode> {
        return this.http
            .post<ApiResult<TreeNode>>(`${this.baseUrl}`, payload, this.httpOptions).pipe(
                map(nodeResult => nodeResult.data));
    }

    updateTreeNode2(payload: TreeNode, version?: string, sparse?: boolean): Observable<TreeNode> {
        const doSparse = sparse ? true : false;
        let url = `${this.baseUrl}/${payload.id}?sparse=${doSparse}`;
        if (version) {
            url = url + '&v=' + version;
        }
        return this.http
            .put<ApiResult<TreeNode>>(url, payload, this.httpOptions).pipe(
                map(nodeResult => nodeResult.data))
    }

    patchTreeNode(nodeId: string, patchSet: TreeNodeContentPatch, version: string, description?: string): Observable<TreeNode> {
        let url = `${this.baseUrl}/${nodeId}/patchContent?v=${version}`;
        if (description) {
            url = url + `&description=${encodeURIComponent(description)}`
        }
        return this.http
            .put<ApiResult<TreeNode>>(url, patchSet, this.httpOptions).pipe(
                map(nodeResult => nodeResult.data));
    }

    trashTreeNode(nodeId: string, version?: string): Observable<string[]> {
        let url = `${this.baseUrl}/${nodeId}`;
        if (version) {
            url = url + '?v=' + version;
        }
        return this.http
            .delete<ApiResult<string[]>>(url, this.httpOptions).pipe(
                map(nodeResult => nodeResult.data));
    }

    moveNode(nodeId: string, version: string, newParentId: string): Observable<any> {
        const url = `${this.baseUrl}/${nodeId}/move?v=${version}&parentId=${newParentId}`;
        return this.http
            .post<ApiResult<any>>(url, {}, this.httpOptions);
    }

    copyNode(nodeId: string, version: string, newParentId: string): Observable<TreeNode> {
        const url = `${this.baseUrl}/${nodeId}/copyNode?v=${version}&parentId=${newParentId}`;
        return this.http
            .post<ApiResult<TreeNode>>(url, {}, this.httpOptions).pipe(map(result => result.data));
    }

    copyFolder(folderId: string): Observable<TreeNode> {
        const url = `${this.baseUrl}/${folderId}/copyFolder`;
        return this.http
            .post<ApiResult<TreeNode>>(url, {}, this.httpOptions).pipe(map(result => result.data));
    }

    recoverTreeNode(nodeId: string, version: string) {
        return this.http
            .post<any>(`${this.baseUrl}/${nodeId}/recover?v=${version}`, {}, this.httpOptions)
            .pipe(catchError((error: any) => Observable.throw(error)));
    }

    updateTreeNodeVersionDescription(nodeId, versionNumber, payload) {
        return this.http
            .put<TreeNode>(`${this.baseUrl}/${nodeId}/history?version=${versionNumber}`, payload, this.httpOptions)
            .pipe(catchError((error: any) => Observable.throw(error)));
    }

    search(params: { searchTerm?: string, siblingReference?: string, nodeTypes?: TreeNodeType[], size?: number, page?: number }): Observable<TreeNodeInfo[]> {
        let queryString = '';
        const queryParams = [];
        if (params.nodeTypes) {
            for (const nt of params.nodeTypes) {
                queryParams.push(`nodeType=${nt}`);
            }
        }
        if (params.searchTerm) {
            queryParams.push('q=' + params.searchTerm);
        } else if (params.siblingReference) {
            queryParams.push('siblingReference=' + params.siblingReference);
        }

        if (params.size) {
            queryParams.push('size=' + params.size);
        }

        if (params.page !== undefined) {
            queryParams.push('page=' + params.page);
        }

        queryString = queryParams.length === 0 ? '' : '?' + queryParams[0] + queryParams.slice(1).map(q => `&${q}`).join('');
        return this.http
            .get<ApiResult<TreeNodeInfo[]>>(`${this.baseUrl}/${queryString}`, this.httpOptions).pipe(
                map(nodeResult => nodeResult.data)
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
