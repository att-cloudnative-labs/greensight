import { Component, OnInit, OnDestroy } from '@angular/core';
import { ProjectService } from '../../service/project.service';
import { BranchService } from '../../service/branch.service';
import { Branch } from '../../interfaces/branch';
import { Utils } from '../../../utils_module/utils';
import { Modal } from 'ngx-modialog/plugins/bootstrap';
import { Project } from '../../interfaces/project';
import { Router, NavigationEnd } from '@angular/router';
import { ChangeDetectionService } from '../../service/change.detection.service';
import { UserService } from '../../service/user.service';
import { LoaderService } from '../../service/loader.service';

@Component({
    selector: 'app-core-project-combo',
    templateUrl: './project.combo.component.html',
    styleUrls: ['./project.combo.component.css']
})

export class ProjectComboComponent implements OnInit, OnDestroy {
    selectedMenu = 'home/system-model';
    public projects: Project[] = new Array<Project>();
    public branches: Branch[] = new Array<Branch>();
    // the username of the user currently logged in
    public loggedInUser: string;
    projectNamePlaceholder = 'Project List';
    activeProject: Project;
    activeBranch: Branch;
    activeProjectId = '';
    activeBranchId: string;
    activeProjectName = '';
    activeBranchName = '';
    // definition of the css class that displays the dropdown
    public dropdownStatus = 'normal';
    showForecastVersions: Boolean = true;
    showModelVersions: Boolean = true;

    constructor(
        private loaderService: LoaderService,
        private changeDetectionSerivce: ChangeDetectionService,
        private projectService: ProjectService,
        private branchService: BranchService,
        private userService: UserService,
        public modal: Modal,
        public router: Router) {

        // Set whether the forecast or model version are visible depending on which page the user is on
        router.events.subscribe((val) => {
            if (val instanceof NavigationEnd) {
                if (val.url === '/forecast_graphical') {
                    this.showModelVersions = false;
                    this.showForecastVersions = true;
                    this.projectNamePlaceholder = this.activeProjectName;
                } else if (val.url === '/system-model' || val.url === '/verify-model') {
                    this.showModelVersions = true;
                    this.showForecastVersions = false;
                    this.projectNamePlaceholder = this.activeProjectName;
                } else {
                    this.showModelVersions = true;
                    this.showForecastVersions = true;

                    this.projectNamePlaceholder = this.activeProjectName;
                }
            }
        });

        /*listen for projects/versions selected by the clicking on a version on
        the manage versions page*/
        this.changeDetectionSerivce
            .addVersionPageListener((projectId: string, branchId: string, isForecastBranch: Boolean) => {
                this.goToProjectBranch(projectId, branchId, isForecastBranch);
            });

        // listen for current selected project deleted from the manage projection page
        this.changeDetectionSerivce
            .addDeleteCurrentProjectListener((deletedProjectId: string) => {
                this.removeProjectFromDropdown(deletedProjectId);
            });

        // listen for saving project event from the manage projection page
        this.changeDetectionSerivce
            .addProjectsRefreshListener(() => {
                this.reloadProjectList();
            });

        this.changeDetectionSerivce.addMissingSelectionListener((missingSelectionName: string) => {
            this.openDropdown(missingSelectionName);
        });

        // listen for a project selection from the welcome modal. If a project was create on the modal, update the list of projects
        // navigate to the the appropriate module after the project has been selected.
        this.changeDetectionSerivce.addWelcomeModalListener((projectId: string, isNewProject: boolean, destination: string) => {
            if (isNewProject) {
                this.reloadProjectList();
            }
            this.goToProject(projectId);
            this.router.navigate([destination]);
        });

        this.changeDetectionSerivce.addProjectSelectedListener((projectId) => {
            this.goToProject(projectId, true);
        });
    }

    ngOnInit() {
        // Load project list
        this.reloadProjectList();
        this.userService
            .getDetails(Utils.getUserId())
            .subscribe(userInfo => {
                this.activeProjectId = userInfo.data.projectId;

                this.loggedInUser = userInfo.data.id;
                Utils.selectProject(this.activeProjectId);
                if (this.activeProjectId !== null && this.activeProjectId !== 'null') {
                    // get active project and branch name for the dropdown title
                    this.projectService
                        .getProject(this.activeProjectId)
                        .subscribe(project => {
                            this.activeProject = project;
                            this.activeProjectName = this.activeProject.title;
                            this.projectNamePlaceholder = this.activeProjectName;
                        });
                }
            });
    }

    /**
     * Removes any welcome modal listeners.
     */
    ngOnDestroy() {
        this.changeDetectionSerivce.removeWelcomeModalListeners();
    }

    /**
     * Updates the active project title that appears in the project combo box
     */
    updateProjectPlaceholder() {
        const activeProject = this.projects.find(project => project.id === Utils.getActiveProject());
        if (activeProject === undefined) {
            this.activeProjectName = 'Project List';
        } else {
            this.activeProjectName = activeProject.title;
        }

        if (this.projectNamePlaceholder !== this.activeProjectName) {
            this.projectNamePlaceholder = this.activeProjectName;
        }
    }

    getBranchDetails() {
        if (this.activeBranchId !== '' && this.activeBranchId !== null && this.activeBranchId !== 'null' && typeof (this.activeBranchId) !== 'undefined') {
            this.branchService
                .getBranch(this.activeBranchId)
                .subscribe(branch => {
                    this.activeBranch = branch;
                    this.activeBranchName = (this.activeBranch.title).toString();
                    this.setProjectBranch();
                });
        }
    }

    setProjectBranch() {
        if (!this.showModelVersions) {
            this.projectNamePlaceholder = this.activeProjectName + '_' + this.activeBranchName;
        } else {
            this.projectNamePlaceholder = this.activeProjectName;
        }
    }


    // reload branches when hovering on project
    reloadBranches(projectId) {
        const id = projectId;
        if (id != null) {
            this.branchService
                .getBranches(id)
                .subscribe(branches => {
                    this.branches = branches;
                });
        }
    }



    /**
     * Retrieves all the projects which the logged in user has access to
     */
    reloadProjectList() {
        this.projectService
            .getProjectsWithoutLoading()
            .subscribe(result => {

                this.projects = result;

                this.updateProjectPlaceholder();
            }
            );
    }

    /**
     * Triggered when a version is selected from the dropdown list.
     * Gets the forecast and model branches for the selected project
     */
    goToProjectBranch(projectId, branchId, isForecastBranch) {
        let tempForecastBranches = [];
        const tempModelBranches = [];

        // close the dropdown if it was set to open without hover
        /*if the dropdown was automatically opened due to a missing selection,
         set the relevant fields back to their defaults*/
        if (this.dropdownStatus === 'stayOpen') {
            this.dropdownStatus = 'normal';
            this.showForecastVersions = true;
            this.showModelVersions = true;
        }

        this.branchService
            .getBranches(projectId)
            .subscribe(branches => {
                tempForecastBranches = branches;
                this.setActiveProjectBranch(projectId, branchId, isForecastBranch, tempForecastBranches, tempModelBranches);
            });
    }

    /**
     * Set the active attributes of the branches, store the information in session storage
     * and update the user object within the database
     */
    setActiveProjectBranch(projectId, branchId, isForecastBranch, tempForecastBranches, tempModelBranches) {
        const arrayBranches = [];

        if (isForecastBranch) {
            tempForecastBranches.forEach(eachBranch => {
                arrayBranches.push(eachBranch);
            });
        } else {
            tempModelBranches.forEach(eachBranch => {
                arrayBranches.push(eachBranch);
            });
        }

        const branchIndex = arrayBranches.findIndex(x => x.id === branchId);
        this.projectService
            .getProject(projectId)
            .subscribe(project => {
                this.activeProject = project;
                this.activeProjectName = (this.activeProject.title).toString();

                // Put selected project into session storage
                Utils.selectProject(projectId);

                const activeBranch = arrayBranches[branchIndex];
                const activeBranchName = activeBranch.title;

                // Set active attributes of selected branch whether it is a forecast or model branch
                if (isForecastBranch) {
                    this.activeBranch = activeBranch;
                    this.activeBranchId = activeBranch.id;
                    this.activeBranchName = (activeBranchName).toString();
                }
                // Get active project and branch name for the dropdown title
                if (this.showForecastVersions && this.showModelVersions) {
                    this.projectNamePlaceholder = this.activeProjectName;
                } else {
                    this.projectNamePlaceholder = this.activeProjectName + '_' + activeBranchName;
                }


                // Put selected branch into session storage.
                // Set active attributes of other branch and store in session storage
                if (isForecastBranch) {
                    Utils.selectBranch(projectId, branchId);

                } else {
                    const forecastBranchIndex = tempForecastBranches.findIndex(x => x.id === this.activeBranchId);
                    // If the currently selected forecast branch is a child of the newly selected project
                    if (forecastBranchIndex === -1) {
                        const forecastMasterBranchIndex = tempForecastBranches.findIndex(x => x.isMaster === true);

                        if (forecastMasterBranchIndex === -1) {
                            Utils.selectBranch(projectId, null);
                            this.activeBranch = null;
                            this.activeBranchId = null;
                            this.activeBranchName = null;
                        } else {
                            Utils.selectBranch(projectId, tempForecastBranches[forecastMasterBranchIndex].id);
                            this.activeBranch = tempForecastBranches[forecastMasterBranchIndex];
                            this.activeBranchId = tempForecastBranches[forecastMasterBranchIndex].id;
                            this.activeBranchName = tempForecastBranches[forecastMasterBranchIndex].title;
                        }
                    } else {
                        Utils.selectBranch(projectId, tempForecastBranches[forecastBranchIndex].id);
                        this.activeBranch = tempForecastBranches[forecastBranchIndex];
                        this.activeBranchId = tempForecastBranches[forecastBranchIndex].id;
                        this.activeBranchName = tempForecastBranches[forecastBranchIndex].title;
                    }
                }


                // Update the user object in the database with the selected project, forecast branch and model branch
                this.userService.updateUser(Utils.getUserId(), Utils.getUserName(),
                    Utils.getUserRoleId(), Utils.getActiveProject(), Utils.getActiveBranch(), Utils.getCurrentUserSettings())
                    .subscribe(user => {
                        if (user.status === 'UNPROCESSABLE_ENTITY') {
                            this.modal.alert()
                                .title('Warning')
                                .body('Failed to set project & branch for user called \'' + Utils.getUserName() +
                                    '\'')
                                .open();
                        }
                    });

                // Update the change detector with the selected project, forecast branch and model branch
                if (isForecastBranch) {
                    this.changeDetectionSerivce
                        .selectProject(
                            this.activeProject.id.toString(),
                            activeBranch.id.toString(),
                            null
                        );
                    this.router.navigate(['/forecast_graphical']);
                } else {
                    this.changeDetectionSerivce
                        .selectProject(
                            this.activeProject.id.toString(),
                            null,
                            activeBranch.id.toString()
                        );
                    this.router.navigate(['/system-model']);
                }
            });
    }

    // highlight active project and branch
    isActiveProjectBranch(id) {
        if (id === Utils.getActiveProject()) {
            return false;
        } else {
            return true;
        }
    }

    openDropdown(selectionType: string) {
        this.dropdownStatus = 'stayOpen';
        if (selectionType === 'version') {
            this.showModelVersions = false;
            this.showForecastVersions = true;
        } else if (selectionType === 'model') {
            this.showForecastVersions = false;
            this.showModelVersions = true;
        }
    }

    goToProject(projectId, navFromProjectPage?) {
        Utils.selectProject(projectId);
        this.branchService.getMasterOfAProject(projectId)
            .subscribe(masterBranch => {
                if (masterBranch) {
                    this.activeBranchId = masterBranch.id;
                    Utils.selectBranch(projectId, masterBranch.id);
                } else {
                    this.activeBranchId = null;
                    Utils.selectBranch(projectId, null);
                }

                if (!navFromProjectPage) { this.navigate(projectId, masterBranch); }

                this.userService.updateUser(Utils.getUserId(), Utils.getUserName(),
                    Utils.getUserRoleId(), projectId, this.activeBranchId, Utils.getCurrentUserSettings())
                    .subscribe(user => {
                        if (user.status === 'UNPROCESSABLE_ENTITY') {
                            this.modal.alert()
                                .title('Warning')
                                .body('Failed to set project for user called \'' + Utils.getUserName() +
                                    '\'')
                                .open();
                        }
                    });
            });

        this.projectService
            .getProject(projectId)
            .subscribe(project => {
                this.activeProject = project;
                this.activeProjectName = this.activeProject.title;
                this.projectNamePlaceholder = this.activeProjectName;
            }
            );
    }

    navigate(projectId, masterBranch) {
        if ($('forecast-app').length > 0) {
            if (masterBranch) {
                this.goToProjectBranch(projectId, masterBranch.id, true);
            } else {
                this.branchService
                    .getBranches(projectId)
                    .subscribe(branches => {
                        if (branches.length > 0) {
                            this.router.navigate(['/forecast_graphical']);
                            this.modal.alert()
                                .title('Notice')
                                .body('You must select a forecast version to view the forecasts page')
                                .open();
                        } else {
                            this.router.navigate(['/branches-list', projectId]);
                            this.modal.alert()
                                .title('Notice')
                                .body('Please create a forecast version first')
                                .open();
                        }
                    });
            }
        }
    }

    removeProjectFromDropdown(deletedProjectId) {
        if (deletedProjectId === Utils.getActiveProject()) {
            this.projectNamePlaceholder = 'Project List';
            this.activeProjectName = '';
            Utils.removeActiveBranch();
            Utils.removeActiveProject();
        }
        this.reloadProjectList();
    }
}
