import { Component, OnInit, ViewChild, ViewEncapsulation, AfterViewInit } from '@angular/core';
import { Project } from '../../interfaces/project';
import { ProjectService } from '../../service/project.service';
import { UserService } from '../../service/user.service';
import { TableViewHeader } from '../../../utils_module/interfaces/tableview-header';
import { TableViewRow } from '../../../utils_module/interfaces/tableview-row';
import { TableViewColumn } from '../../../utils_module/interfaces/tableview-column';
import { Modal } from 'ngx-modialog/plugins/bootstrap';
import { Router, Route, ActivatedRoute } from '@angular/router';
import { UserGroup } from '../../interfaces/user-group';
import { User } from '../../interfaces/user';
import { TableViewComponent } from '../../../utils_module/components/table-view/table.view.component';
import { LoaderService } from '../../service/loader.service';
import { TreeService } from '../../service/tree.service';
import { ModalDialogService } from '../../service/modal-dialog.service';
import { Utils } from '../../../utils_module/utils';
import { ChangeDetectionService } from '../../service/change.detection.service';
import { TreeNodeAccessControlMode, mapControlModeNames } from '@app/core_module/interfaces/tree-node';


@Component({
    selector: 'project-list',
    templateUrl: './project.list.component.html',
    styleUrls: ['./project.list.component.css'],
    encapsulation: ViewEncapsulation.None
})

export class ProjectListComponent implements OnInit {
    @ViewChild(TableViewComponent) projectTable: TableViewComponent;
    columns: TableViewHeader[];
    rows: TableViewRow[] = new Array<TableViewRow>();
    projects: Project[] = new Array<Project>();
    user: User = null;
    userGroups: UserGroup[] = new Array<UserGroup>();
    selectedProject: Project = null;

    isLoading: Boolean = false;
    userRole: String;
    onModelTab = false;
    location = 'project';

    // indicates if the project table shows the input row when first loaded
    showInputRow = false;

    constructor(
        private changeDetectionService: ChangeDetectionService,
        private router: Router,
        public route: ActivatedRoute,
        private modal: Modal,
        private modalDialog: ModalDialogService,
        private userService: UserService,
        private projectService: ProjectService,
        private loaderService: LoaderService,
        private treeService: TreeService) {

        this.columns = new Array<TableViewHeader>();
        this.columns.push(new TableViewHeader('title', 'Project Name', 'col-md-3', '', ''));
        this.columns.push(new TableViewHeader('ownerName', 'Owner', 'col-md-3', '', ''));
        this.columns.push(new TableViewHeader('description', 'Description', 'col-md-2', '', ''));
        this.columns.push(new TableViewHeader('access', 'Access', 'col-md-4', '', ''));

    }

    ngOnInit() {
        /*if the url indicates that the row with input fields should be immediately seen,
        indicate this to the table component*/
        this.route.queryParams.subscribe(params => {
            if (params['addProject'] === 'true') {
                this.showInputRow = true;
            } else {
                this.showInputRow = false;
            }
        });

        this.onModelTab = this.router.isActive('/projects', false);
        const roles = Utils.roles;
        this.userService.getLoggedInUser().subscribe(result => {
            if (result.status === 'OK') {
                const userData = result.data;
                roles.forEach(role => {
                    if (userData.role === role.id) {
                        this.userRole = role.roleName;
                    }
                });

            }
        });
        this.reloadProjects();
    }

    onProjectSelected(projectId: string) {
        this.changeDetectionService.projectSelected(projectId);

        this.router.navigate(['/branches-list', projectId]);
    }

    onBeginEdit(projectId: string) {

    }

    onRowEdit(editedData: any) {
        console.log(editedData);
        // set the ownerId
        this.userService.getUserByName(editedData.ownerName).subscribe(result => {
            const owner = result.data;
            editedData.ownerId = result.data.id;


            // get the branch to be edited from db
            this.projectService.getProject(editedData.id).subscribe(project => {
                // update the relevant fields
                project.title = editedData.title;
                project.description = editedData.description;
                project.ownerId = editedData.ownerId;
                project.ownerName = editedData.ownerName;
                if (editedData.mode) {
                    project._accessMode = editedData.mode;
                }
                if (editedData.permissions) {
                    project._permissions = editedData.permissions;
                }

                if (this.checkProject(project)) {

                    // update the project
                    this.loaderService.show();
                    this.projectService.updateProject(project).subscribe(result => {
                        this.loaderService.hide();
                        console.log('Updated project');
                        this.changeDetectionService.refreshProjects();
                        this.projectTable.exitEditMode();
                        this.reloadProjects();
                    }, (error) => {
                        this.loaderService.hide();
                        console.log('Error updating project');

                        const response = JSON.parse(error._body);
                        this.modalDialog.showError(response.message);
                    });
                }
            });
        });
    }

    onRowSave(project) {
        if (project.title.length === 0) {
            this.modal.alert()
                .title('Error')
                .body('The mandatory field *Project Name* is empty')
                .open();
        } else if (project.title.match(/[^0-9a-zA-Z_-]/)) {
            this.modal.alert()
                .title('Warning')
                .body('Names can only include Alphanumerical characters, underscores and hyphens')
                .open();

        } else if (project.ownerName == null || project.ownerName === 'null' || project.ownerName.length === 0) {
            this.modal.alert()
                .title('Warning')
                .body('Please select project owner')
                .open();
        } else {
            let ownerId = '';
            this.userService.getUserByName(project.ownerName).subscribe(result => {
                if (result.status === 'OK') {
                    const owner = result.data;
                    ownerId = result.data.id;

                    if (this.selectedProject != null) {
                        // Update existing project
                        this.loaderService.show();
                        this.projectService.updateProject(this.selectedProject.id, project.title)
                            .subscribe(project => {
                                this.loaderService.hide();
                                console.log('Updated project');
                                this.projectTable.onClearInputRow();
                                this.reloadProjects();
                                this.changeDetectionService.refreshProjects();
                            }, (error) => {
                                this.loaderService.hide();
                                console.log('Error updating project');

                                const response = JSON.parse(error._body);
                                this.modalDialog.showError(response.message);
                            });
                    } else {
                        // Create new project
                        this.loaderService.show();
                        this.projectService.createProject(project.title, project.description)
                            .subscribe(newProject => {
                                this.loaderService.hide();
                                console.log('Created project');
                                this.projectTable.onClearInputRow();
                                this.reloadProjects();
                                this.changeDetectionService.refreshProjects();
                                // if 'add new project' url is active
                                if (this.showInputRow === true) {
                                    // navigate to manage projects url
                                    this.router.navigate(['/project-list']);
                                }
                            }, (error) => {
                                this.loaderService.hide();
                                console.log('Error creating project');

                                const response = JSON.parse(error._body);
                                this.modalDialog.showError(response.message);
                            });
                    }
                }
            });
        }
    }

    onRowDelete(id) {
        this.projectService.getProject(id).subscribe(project => {
            this.selectedProject = project;
            const dialog =
                this.modal
                    .confirm()
                    .title('Confirmation')
                    .body('Are you sure you want to delete the \"' + this.selectedProject.title + '\" project?')
                    .okBtn('Yes').okBtnClass('btn btn-danger')
                    .cancelBtn('No')
                    .open();

            dialog.result.then(promise => {
                this.isLoading = true;
                const projectVersion = project._treeNode ? project._treeNode.version : -1;
                this.projectService
                    .deleteProject(id, String(projectVersion))
                    .subscribe(resp => {
                        this.selectedProject = null;
                        if (Utils.getActiveProject() === id) {
                            this.userService.updateUser(Utils.getUserId(), Utils.getUserName(),
                                Utils.getUserRoleId(), null, null, Utils.getCurrentUserSettings())
                                .subscribe(user => {
                                    this.changeDetectionService.deleteCurrentProject(id);
                                    if (user.status === 'UNPROCESSABLE_ENTITY') {
                                        this.modal.alert()
                                            .title('Warning')
                                            .body('Failed to set project for user called \"' + Utils.getUserName() +
                                                '\"')
                                            .open();
                                    }
                                });
                        }
                        this.reloadProjects();
                        this.changeDetectionService.refreshProjects();
                        this.isLoading = false;
                    });
            });
        });
    }

    // reload projects
    reloadProjects() {
        this.isLoading = true;
        this.projectService
            .getProjects()
            .subscribe(result => {
                this.projects = result as Array<Project>;
                this.rows = new Array<TableViewRow>();
                this.projects.forEach(project => {
                    const row = new TableViewRow(project.id);
                    row.setAccessControlMode(project._treeNode.accessControl as TreeNodeAccessControlMode);
                    row.treeNode = project._treeNode;

                    row.addColumn(new TableViewColumn('title', project.title));
                    row.addColumn(new TableViewColumn('ownerName', project.ownerName));
                    row.addColumn(new TableViewColumn('description', project.description));
                    row.addColumn(new TableViewColumn('access', mapControlModeNames(project._treeNode.accessControl as TreeNodeAccessControlMode)));

                    this.rows.push(row);
                });
                this.isLoading = false;
            });
    }

    /**
     * Ensure that the required data new/modified branch is valid
     * @param project the project containing the new/updated data
     */
    checkProject(project: Project) {
        if (project.title.length === 0) {
            this.modal.alert()
                .title('Error')
                .body('The mandatory field *Project Name* is empty')
                .open();
            return false;
        } else if (project.title.match(/[^0-9a-zA-Z_-]/)) {
            this.modal.alert()
                .title('Warning')
                .body('Names can only include Alphanumerical characters, underscores and hyphens')
                .open();
            return false;

        } else if (project.ownerName === null || project.ownerName === 'null' || project.ownerName.length === 0) {
            this.modal.alert()
                .title('Warning')
                .body('Please select project owner')
                .open();
            return false;
        }

        return true;
    }
}
