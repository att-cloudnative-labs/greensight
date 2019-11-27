import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/Observable';
import { tap, map, mergeMap } from 'rxjs/operators';
import { forkJoin } from 'rxjs';
import { Utils } from '../../utils_module/utils';
import { LoaderService } from './loader.service';
import { ForecastVariableModel } from '../interfaces/forecast-variable';
import { ForecastVariableDescriptor } from '../interfaces/forecast-variable-descriptor';
import { TreeService } from './tree.service';
import { TreeNode } from '../interfaces/tree-node';
import { v4 as uuid } from 'uuid';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ApiResult } from '@app/core_module/interfaces/api-result';

@Injectable()
export class ForecastVariableService {

    constructor(
        private loaderService: LoaderService,
        private treeService: TreeService,
        private http: HttpClient
    ) { }

    baseUrl = Utils.createModelUrl('variables');

    get httpOptions() {
        return {
            headers: new HttpHeaders({
                'Content-Type': 'application/json',
                'Authorization': Utils.getToken()
            })
        };
    }


    private nodeToVariable(node: TreeNode): ForecastVariableModel {
        if (node.type === 'FC_VARIABLE_BD' || node.type === 'FC_VARIABLE_NUM') {
            const variable: ForecastVariableModel = {
                id: node.id,
                version: String(node.version),
                content: node.content,
                metadata: {
                    branchId: node.parentId,
                    ownerId: node.ownerId,
                    ownerName: node.ownerName,
                    createdAt: '',
                    lastChangedAt: ''
                }
            };
            return variable;
        }
        return null;
    }

    private variableToNode(variable: ForecastVariableModel): TreeNode {
        const title = variable.content ? variable.content.title : null;
        const unit = variable.content ? variable.content.unit : null;
        const varType = variable.content ? variable.content.variableType : 'UNKNOWN';
        const node: TreeNode = {
            accessControl: 'INHERIT',
            parentId: variable.metadata ? variable.metadata.branchId : null,
            type: varType === 'BREAKDOWN' ? 'FC_VARIABLE_BD' : 'FC_VARIABLE_NUM',
            id: variable.id,
            name: title,
            // store the unit here so it's available on sparse queries
            description: unit,
            content: variable.content
        };

        return node;
    }

    public createVariable(variable: ForecastVariableModel): Observable<ForecastVariableModel> {
        return this.treeService.createTreeNode2(this.variableToNode(variable)).map(node => this.nodeToVariable(node));
    }

    public updateVariable(variable: ForecastVariableModel, version?: string): Observable<ForecastVariableModel> {
        return this.treeService.updateTreeNode2(this.variableToNode(variable), version).map(node => this.nodeToVariable(node));
    }

    public getVariables(branchId: string, showLoading: boolean = false): Observable<ForecastVariableModel[]> {
        if (showLoading) {
            this.loaderService.show();
        }
        return this.treeService.getTree3(branchId, false, true, false).map(nodes => {
            const variableNodes = nodes.filter(n => n.type === 'FC_VARIABLE_BD' || n.type === 'FC_VARIABLE_NUM');
            return variableNodes.map(vn => this.nodeToVariable(vn));
        });
    }

    public deleteVariable(variableId: string, version?: string): Observable<string[]> {
        return this.treeService.trashTreeNode(variableId, version);
    }


    // generate a new list of variables with updated uuids
    public duplicateVariables(vars: ForecastVariableModel[], oldBranchId: string, newBranchId: string): ForecastVariableModel[] {
        let newVariables: ForecastVariableModel[] = [];
        const idMap: { [oldId: string]: string } = {};
        idMap[oldBranchId] = newBranchId;
        newVariables = vars.map(oldVar => {
            const newVar: ForecastVariableModel = JSON.parse(JSON.stringify(oldVar));
            newVar.id = uuid();
            idMap[oldVar.id] = newVar.id;
            return newVar;
        });
        // update the content of the variables without knowledge of the
        // data structure (:
        let nvText = JSON.stringify(newVariables);
        for (const oldId in idMap) {
            const newId = idMap[oldId];
            nvText = Utils.replaceAll(nvText, oldId, newId);
        }
        return JSON.parse(nvText);
    }

    public createVariables(variables: ForecastVariableModel[]): Observable<ForecastVariableModel[]> {
        return forkJoin(...variables.map(v => this.createVariable(v)));
    }



    // fetch all projects/sheets/variables and compile the ForecastVariableDescriptor list
    getForecastVariableDescriptors(): Observable<ForecastVariableDescriptor[]> {
        return this.http
            .get<ApiResult<ForecastVariableDescriptor[]>>(`${this.baseUrl}`, this.httpOptions)
            .map(result => result.data);
    }

}
