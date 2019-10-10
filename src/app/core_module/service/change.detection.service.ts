import { Injectable } from '@angular/core';

@Injectable()
export class ChangeDetectionService {

    private projectListeners: Array<(projectId: string) => any> = new Array<(projectId: string) => any>();
    private projectsRefreshListeners: Array<() => any> = new Array<() => any>();
    private projectSelectedListeners: Array<(projectId: string) => any> = new Array<(projectId: string) => any>();
    private projectBranchListeners: Array<(projectId: string, branchId: string) => any> = new Array<(projectId: string, branchId: string) => any>();
    private projectModelBranchListeners: Array<(projectId: string, modelBranchId: string) => any> = new Array<(projectId: string, modelBranchId: string) => any>();
    // functions that are performed when a project/version is selected through the 'manage versions' page
    private versionPageListeners: Array<(projectId: string, branchId: string, isForecastBranch: Boolean) => any> = new Array<(projectId: string, branchId: string, isForecastBranch: Boolean) => any>();
    // functions that are performed when a project, forecast version or system model has not been selected
    private missingSelectionListeners: Array<(missingSelectionName: string) => any> = new Array<(missingSelectionName: string) => any>();
    // functions that are performed when a project is selected/created on the welcome modal
    private WelcomeModalListeners: Array<(projectId: string, isNewProject: boolean, destination: string) => any> = new Array<(projectId: string, isNewProject: boolean) => any>();
    // function that is performed when current selected project is deleted
    private deleteCurrentProjectListener: Array<(projectId: string) => any> = new Array<(projectId: string) => any>();
    // functions that are performed when a project is selected/created on the welcome modal
    private simulationSelectionListeners: Array<(simulationId: string) => any> = new Array<(simulationid: string) => any>();
    constructor() { }

    public addProjectListener(func) {
        this.projectListeners.push(func);
    }

    public addProjectsRefreshListener(func) {
        this.projectsRefreshListeners.push(func);
    }

    public addProjectSelectedListener(func) {
        this.projectSelectedListeners.push(func);
    }

    public addProjectBranchListener(func) {
        this.projectBranchListeners.push(func);
    }

    public removeProjectBranchListener(func) {
        const index = this.projectBranchListeners.findIndex(func);
        this.projectBranchListeners.splice(index, 1);
    }

    public removeAllProjectBranchListeners() {
        this.projectBranchListeners = [];
    }

    public addProjectModelBranchListener(func) {
        this.projectModelBranchListeners.push(func);
    }

    public addVersionPageListener(func) {
        this.versionPageListeners.push(func);
    }

    public addWelcomeModalListener(func) {
        this.WelcomeModalListeners.push(func);
    }

    public addDeleteCurrentProjectListener(func) {
        this.deleteCurrentProjectListener.push(func);
    }

    public addMissingSelectionListener(func) {
        this.missingSelectionListeners.push(func);
    }

    public addSimulationSelectionListener(func) {
        this.simulationSelectionListeners.push(func);
    }

    public removeVersionPageListener(func) {
        const index = this.versionPageListeners.findIndex(func);
        this.versionPageListeners.splice(index, 1);
    }

    public removeMissingSelectionListener(func) {
        const index = this.missingSelectionListeners.findIndex(func);
        this.missingSelectionListeners.splice(index, 1);
    }

    public removeWelcomeModalListeners() {
        this.WelcomeModalListeners.splice(0, this.WelcomeModalListeners.length);
    }

    public removeSimulationSelectionListeners() {
        this.simulationSelectionListeners.splice(0, this.simulationSelectionListeners.length);
    }

    /**
     * Set the active project that is used throughout the tool
     */
    public selectProject(projectId: string, branchId: string, modelBranchId: string) {
        // Set the relevant active branch depending on whether the the forecast or model branch is changed
        if (modelBranchId == null && branchId != null) {
            for (let index = 0; index < this.projectBranchListeners.length; index++) {
                this.projectBranchListeners[index](projectId, branchId);
            }
        } else if (branchId == null && modelBranchId != null) {
            for (let index = 0; index < this.projectModelBranchListeners.length; index++) {
                this.projectModelBranchListeners[index](projectId, modelBranchId);
            }
        } else if (branchId == null && modelBranchId == null) {
            for (let index = 0; index < this.projectListeners.length; index++) {
                this.projectListeners[index](projectId);
            }
        }
    }
    /**
     * Set the active project once it has been selected from the project list page
     */
    public projectSelected(projectId) {
        for (let index = 0; index < this.projectSelectedListeners.length; index++) {
            this.projectSelectedListeners[index](projectId);
        }
    }

    /**
     * Carries out the functions that are listening for projects/versions selected on
     * the 'manage versions' page
     * @param projectId the selected project ID
     * @param branchId the selected branchID
     */
    public selectVersionFromList(projectId: string, branchId: string, isForecastBranch: Boolean) {
        for (let index = 0; index < this.versionPageListeners.length; index++) {
            this.versionPageListeners[index](projectId, branchId, isForecastBranch);
        }
    }

    /**
     * Carries out the functions that are listening for missing project, forecast version or system model s
     * elections.
     * @param missingSelectionName the name of the of the missing object that needs to be selected before
     * carrying out a particular action i.e project, forecast version, system model
     */
    public displayMissingSelection(missingSelectionName: string) {
        for (let index = 0; index < this.missingSelectionListeners.length; index++) {
            this.missingSelectionListeners[index](missingSelectionName);
        }
    }

    /**
    * Carries out functions that are listening for the selection of a project through the welcome modal
    * @param projectId the id of the project that has been selected/created
    * @param isNewProject indicates if this project was just created through the modal
    * @param destination the url that is to be navigated to after project selection
    */
    public selectProjectFromWelcomeModal(projectId: string, isNewProject: boolean, destination: string) {
        this.WelcomeModalListeners[0](projectId, isNewProject, destination);
    }

    public deleteCurrentProject(projectId: string) {
        this.deleteCurrentProjectListener[0](projectId);
    }

    public refreshProjects() {
        this.projectsRefreshListeners[0]();
    }

    /**
     * Carries out funcitons that are listening for the selection of a simulation
     * @param simulationid the is of the simulation that has been selected
     */
    public selectSimulation(simulationid: string) {
        if (this.simulationSelectionListeners.length > 0) {
            this.simulationSelectionListeners[0](simulationid);
        }
    }
}
