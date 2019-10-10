import { Injectable } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import { Utils } from '../../utils_module/utils';
import { LoaderService } from './loader.service';
import { User } from '../interfaces/user';
import { UserGroup } from '../interfaces/user-group';
import { Project } from '../interfaces/project';
import { TreeService } from './tree.service';
import { TreeNode } from '../interfaces/tree-node';
import { BranchService } from './branch.service';
import { Branch } from '../interfaces/branch';


@Injectable()
export class ProjectService {

    constructor(
        private http: Http,
        private loaderService: LoaderService,
        private treeService: TreeService,
        private branchService: BranchService) { }



    private nodeToProject(treeNode: TreeNode): Project {
        return {
            id: treeNode.id,
            title: treeNode.name,
            description: treeNode.description,
            ownerName: treeNode.ownerName,
            ownerId: null,
            isPrivate: false,
            userGroups: [],
            usersWithAccess: [],
            _treeNode: treeNode
        };
    }

    private projectToNode(project: Project): TreeNode {
        return {
            id: project.id,
            accessControl: project._accessMode ? project._accessMode : 'PRIVATE',
            name: project.title,
            type: 'FC_PROJECT',
            description: project.description,
            parentId: 'fc_root',
            acl: project._permissions ? project._permissions : null
        };

    }


    // get all projects
    getProjects(showLoading: boolean = false): Observable<Project[]> {
        if (showLoading) {
            this.loaderService.show();
        }
        return this.treeService.getTree2('fc_root').map(nodes => {
            if (showLoading) {
                this.loaderService.hide();
            }
            const projectNodes = nodes.filter(node => node.type === 'FC_PROJECT');
            return projectNodes.map(node => this.nodeToProject(node));
        });
    }

    // get all projects without loading
    getProjectsWithoutLoading(): Observable<Project[]> {
        return this.getProjects();
    }

    public createProject(newProject: Project | string, description?: string): Observable<Project> {

        let newProjectNode: TreeNode;
        if (typeof newProject === 'string') {
            newProjectNode = this.projectToNode({ title: newProject, description: description });
        } else {
            newProjectNode = this.projectToNode(newProject);
        }

        return this.treeService.createTreeNode2(newProjectNode).pipe(
            map(node => this.nodeToProject(node)),
            // create the master branch on the fly
            tap(project => {
                this.branchService.createBranch(this.branchService.buildMasterBranch(project)).subscribe(b => { });
            })
        );
    }

    getProject(projectId: string): Observable<Project> {
        return this.treeService.getSingleTreeNode(projectId).map(node => {
            return this.nodeToProject(node);
        });

    }

    public updateProject(newProject: Project | string, title?: string, description?: string): Observable<Project> {
        let newProjectNode: TreeNode;
        if (typeof newProject === 'string') {
            newProjectNode = this.projectToNode({ id: newProject, title: title, description: description });
        } else {
            newProjectNode = this.projectToNode(newProject);
        }
        return this.treeService.updateTreeNode2(newProjectNode).map(node => this.nodeToProject(node));
    }


    deleteProject(projectId: string) {
        return this.treeService.trashTreeNode(projectId);
    }

    handleError(err) {
        return err;
    }
}
