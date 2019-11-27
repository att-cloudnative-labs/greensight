import { Utils } from '../../utils_module/utils';
import { Injectable } from '@angular/core';
import { Http, Response, RequestOptions, Headers } from '@angular/http';
import { LoaderService } from './loader.service';
import { Branch } from '../interfaces/branch';
import { Observable } from 'rxjs/Observable';
import { tap, map, mergeMap, flatMap } from 'rxjs/operators';
import { forkJoin } from 'rxjs';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import { TreeService } from './tree.service';
import { TreeNode } from '../interfaces/tree-node';
import { Project } from '../interfaces/project';
import { ForecastVariableService } from './variable.service';


@Injectable()
export class BranchService {
    constructor(
        private http: Http,
        private loaderService: LoaderService,
        private treeService: TreeService,
        private variableService: ForecastVariableService) { }


    private nodeToBranch(node: TreeNode): Branch {
        if (node.type === 'FC_SHEET') {
            return {
                id: node.id,
                title: node.name,
                description: node.description,
                ownerName: node.ownerName,
                ownerId: node.ownerId,
                projectId: node.parentId,
                isMaster: node.content ? node.content.isMaster : false,
                startTime: node.content ? node.content.startTime : null,
                endTime: node.content ? node.content.endTime : null,
                _treeNode: node
            };
        }
        return null;
    }

    private branchToNode(branch: Branch): TreeNode {
        const t: TreeNode = {
            id: branch.id,
            type: 'FC_SHEET',
            accessControl: 'INHERIT',
            name: branch.title,
            description: branch.description,
            parentId: branch.projectId,
            content: {
                projectId: branch.projectId,
                isMaster: branch.isMaster,
                startTime: branch.startTime,
                endTime: branch.endTime
            },
            version: branch._treeNode ? branch._treeNode.version : -1
        };
        return t;
    }

    public buildMasterBranch(project: Project): Branch {
        return {
            id: null,
            projectId: project.id,
            title: 'Master',
            ownerName: null,
            ownerId: null,
            startTime: null,
            endTime: null,
            isMaster: true,
            description: null
        };
    }

    // get all branches from project
    getBranches(projectId: string, showLoading: boolean = false): Observable<Branch[]> {
        if (showLoading) {
            this.loaderService.show();
        }
        return this.treeService.getTree3(projectId, false, true, false).map(nodes => {
            const branchNodes = nodes.filter(node => node.type === 'FC_SHEET');
            const branches = branchNodes.map(node => this.nodeToBranch(node)).filter(branch => branch !== null);
            if (showLoading) {
                this.loaderService.hide();
            }
            return branches;
        });
    }

    getBranch(branchId: string): Observable<Branch> {
        return this.treeService.getSingleTreeNode(branchId).map(node => this.nodeToBranch(node));
    }

    getMasterOfAProject(projectId: string): Observable<Branch> {
        return this.getBranches(projectId).map(branches => {
            const masterBranch = branches.filter(b => b.isMaster);
            return masterBranch[0];
        });
    }

    deleteBranch(branchId: string) {
        return this.treeService.trashTreeNode(branchId);
    }

    createBranch(branch: Branch): Observable<Branch> {
        return this.treeService.createTreeNode2(this.branchToNode(branch)).map(node => this.nodeToBranch(node));
    }

    updateBranch(updatedBranch: Branch): Observable<Branch> {
        const node = this.branchToNode(updatedBranch);
        return this.treeService.updateTreeNode2(node, String(node.version)).map(node => this.nodeToBranch(node));
    }

    handleError(err) {
        return err;
    }

    // create a new branch by copying everything including child varibles from another branch
    // this includes generating new uuids for all variables and updating their internal references.
    copyBranch(sourceBranch: Branch, targetName: string, targetParentId?: string): Observable<Branch> {
        const targetBranch: Branch = Object.assign({}, sourceBranch);
        targetBranch.title = targetName;
        targetBranch.id = null;
        targetBranch.isMaster = false;
        return this.createBranch(targetBranch).pipe(tap(newBranch => {
            const newVars = this.variableService.getVariables(sourceBranch.id).pipe(
                map(vars => this.variableService.duplicateVariables(vars, sourceBranch.id, newBranch.id))).subscribe(newVars => {
                    this.variableService.createVariables(newVars).subscribe(createdVars => { });
                });
        }));
    }

    duplicateMasterBranch(projectId: string, newBranchName: string): Observable<Branch> {
        return this.getMasterOfAProject(projectId).pipe(flatMap(masterBranch => this.copyBranch(masterBranch, newBranchName)));
    }
}
