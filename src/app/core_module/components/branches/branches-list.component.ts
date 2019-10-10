import { Component, OnInit, ViewChild } from '@angular/core';
import { Project } from '../../interfaces/project';
import { ProjectService } from '../../service/project.service';
import { TableViewHeader } from '../../../utils_module/interfaces/tableview-header';
import { TableViewRow } from '../../../utils_module/interfaces/tableview-row';
import { TableViewColumn } from '../../../utils_module/interfaces/tableview-column';
import { Modal } from 'ngx-modialog/plugins/bootstrap';
import { Router, ActivatedRoute } from '@angular/router';
import { BranchService } from '../../service/branch.service';
import { UserService } from '../../service/user.service';
import { Branch } from '../../interfaces/branch';
import { Utils } from '../../../utils_module/utils';
import { TableViewComponent } from '../../../utils_module/components/table-view/table.view.component';
import { ChangeDetectionService } from '../../service/change.detection.service';
import { LoaderService } from '../../service/loader.service';
import { ModalDialogService } from '../../service/modal-dialog.service';

@Component({
    selector: 'branch-list',
    templateUrl: './branches-list.component.html',
    styleUrls: ['./branches-list.component.css']
})

export class BranchListComponent implements OnInit {
    @ViewChild('branchTable') branchTable: TableViewComponent;
    columns: TableViewHeader[];
    rows: TableViewRow[] = new Array<TableViewRow>();
    projects: Project[] = new Array<Project>();
    branches: Branch[] = Array<Branch>();
    selectedBranch: Branch = null;
    location: String = 'version';
    isLoading: Boolean = false;
    userRole: String;
    private selectedProjectId = null;
    selectedprojectName = '';

    // indicates if the branch table shows the input row when first loaded
    showInputRow = false;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private branchService: BranchService,
        private modal: Modal,
        private modalDialog: ModalDialogService,
        private projectService: ProjectService,
        private userService: UserService,
        private changeDetectionService: ChangeDetectionService,
        private loaderService: LoaderService) {

        this.columns = new Array<TableViewHeader>();
        this.columns.push(new TableViewHeader('title', 'Version Title', 'col-md-3', '', ''));
        this.columns.push(new TableViewHeader('ownerName', 'Owner', 'col-md-3', '', ''));
        this.columns.push(new TableViewHeader('description', 'Description', 'col-md-5', '', ''));

        this.changeDetectionService
            .addProjectListener((projectId: string) => {
                this.selectedProjectId = projectId;

                this.projectService.getProject(this.selectedProjectId).subscribe(project => {
                    this.selectedprojectName = project.title;
                });

                this.reloadBranches();
            });
    }

    ngOnInit() {
        /*if the url indicates that the row with input fields should be immediately seen,
      indicate this to the table component*/
        this.route.queryParams.subscribe(params => {
            if (params['addForecastVersion'] === 'true') {
                this.showInputRow = true;
            } else {
                this.showInputRow = false;
            }
        });

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

        // use route paramater to get id of the project
        this.route.params.subscribe(params => {
            this.selectedProjectId = params['projectId'];
            this.projectService.getProject(this.selectedProjectId).subscribe(result => {
                this.selectedprojectName = result.title;
            });
            this.reloadProjects();
        });

    }

    reloadProjects() {
        this.projectService
            .getProjects()
            .subscribe(result => {
                this.projects = result;

                if (this.selectedProjectId == null) {
                    this.selectedProjectId = this.projects[0].id.toString();
                }
                this.reloadBranches();
            });
    }

    /**
     * Get the branches of a particular project and create rows in the table for each branch
     * @param projectId the id of the project for which we want to find the branches of
    */
    reloadBranches() {
        this.branchService.getBranches(this.selectedProjectId).subscribe(branches => {
            this.branches = branches;

            this.rows = new Array<TableViewRow>();
            this.branches.forEach(branch => {
                const row = new TableViewRow(branch.id);
                row.addColumn(new TableViewColumn('title', branch.title));
                row.addColumn(new TableViewColumn('ownerName', branch.ownerName));
                row.addColumn(new TableViewColumn('description', branch.description));
                this.rows.push(row);
            });
        });
    }

    /**
     * Updates the selected project/version in the dropdown menu and navigates to
     * the forecast of that particular praject/version
     * @param branchId the id of the branch clicked on from the list
     */
    onBranchSelected(branchId: string) {
        this.branchService.getBranch(branchId).subscribe(branch => {
            // tell the dropdown menu about newly selected project and version
            this.changeDetectionService
                .selectVersionFromList(
                    branch.projectId.toString(),
                    branchId.toString(),
                    true
                );
            Utils.selectBranch(Utils.getActiveProject(), branch.id);
            this.router.navigate(['/forecast_graphical']);
        });

    }

    onRowEdit(editedData: any) {
        // set the ownerId
        this.userService.getUserByName(editedData.ownerName).subscribe(userResult => {
            editedData.ownerId = userResult.data.id;
            // get the branch to be edited from db
            this.branchService.getBranch(editedData.id).subscribe(branch => {
                // update the relevant fields
                if (branch.title === 'Master') { branch.title = 'Master'; } else { branch.title = editedData.title; }
                branch.description = editedData.description;
                branch.ownerId = editedData.ownerId;
                branch.ownerName = editedData.ownerName;

                if (this.checkBranch(branch)) {

                    // update the branch in the db
                    this.loaderService.show();
                    this.branchService.updateBranch(branch).subscribe(updatedBranch => {
                        this.loaderService.hide();
                        console.log('Updated branch');
                        this.reloadBranches();
                        this.branchTable.exitEditMode();
                    }, (error) => {
                        this.loaderService.hide();
                        console.log('Error updating branch');

                        const response = JSON.parse(error._body);
                        this.modalDialog.showError(response.message);
                    });
                }
            });
        });
    }

    /**
     * Creates a new branch in Database and updates the UI with the newly added branch
     * @param newData the data retrived from the input row input fields
     */
    onAddRow(newData: any) {
        const newBranch: Branch = newData;
        // set fields which are not defined by the user
        newBranch.isMaster = false;
        newBranch.projectId = this.selectedProjectId;

        if (newData.ownerName == null || newData.ownerName === 'null' || newData.ownerName.length === 0) {
            this.modal.alert()
                .title('Warning')
                .body('Please select version owner')
                .open();
        } else {
            // create the new branch
            if (this.checkBranch(newBranch) === true) {

                this.loaderService.show();
                this.branchService.duplicateMasterBranch(this.selectedProjectId, newBranch.title).subscribe(createdBranch => {
                    this.loaderService.hide();
                    console.log('Created branch');
                    this.reloadBranches();
                    this.branchTable.onClearInputRow();
                    if (this.showInputRow === true) {
                        // navigate to manage versions url
                        this.router.navigate(['/branches-list', this.selectedProjectId]);
                    }
                }, (error) => {
                    this.loaderService.hide();
                    console.log('Error creating branch');

                    const response = JSON.parse(error._body);
                    this.modalDialog.showError(response.message);
                });
            }
        }
    }

    /**
     * Remove a branch from the database and update the the table of existing branches to reflect this
     * change.
     * @param id the id of the branch to delete
     */
    onRowDelete(id) {
        this.branchService.getBranch(id).subscribe(branch => {
            this.selectedBranch = branch;
            if (this.selectedBranch.isMaster) {
                this.modalDialog.showError('The Master version cannot be deleted', 'Error');
            } else {
                const dialog =
                    this.modal
                        .confirm()
                        .title('Confirmation')
                        .body('Are you sure you want to delete the \'' + this.selectedBranch.title + '\' branch?')
                        .okBtn('Yes').okBtnClass('btn btn-danger')
                        .cancelBtn('No')
                        .open();

                dialog.result.then(result => {
                    this.isLoading = true;
                    this.branchService
                        .deleteBranch(id)
                        .subscribe(resp => {
                            this.reloadProjects();
                            this.isLoading = false;
                        });
                });
            }
        });
    }

    /**
     * Ensure that the required data new/modified branch is valid
     * @param branch the branch containing the new/updated data
     */
    checkBranch(branch: Branch): boolean {
        if (branch.title === undefined || branch.title.length === 0) {
            this.modal.alert()
                .title('Error')
                .body('The mandatory field *Branch Name* is empty')
                .open();
            return false;
        } else if (branch.title.match(/[^0-9a-zA-Z_-]/)) {
            this.modal.alert()
                .title('Warning')
                .body('Names can only include Alphanumerical characters,underscores and hyphens')
                .open();
            return false;
        }
        return true;
    }
}
