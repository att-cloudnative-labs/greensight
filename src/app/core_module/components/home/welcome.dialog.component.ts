import { Component, Inject, OnInit, AfterContentInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { ProjectService } from '../../service/project.service';
import { Project } from '../../interfaces/project';
import { Utils } from '../../../utils_module/utils';
import { ChangeDetectionService } from '../../service/change.detection.service';
import { NgForm } from '@angular/forms';


@Component({
    selector: 'app-welcome-dialog',
    templateUrl: './welcome.dialog.component.html',
    styleUrls: ['./welcome.dialog.component.css']
})
export class WelcomeDialogComponent implements OnInit {
    public projectList: Project[] = Array<Project>();
    public isLoading = true;
    // the title that the new project is to be called
    public newProjectTitle = '';
    // holds any error message received from the project creation response
    public errorMessage = '';

    constructor(
        // get the module destination url from the received data on modal opening
        @Inject(MAT_DIALOG_DATA) public moduleData,
        private projectService: ProjectService,
        private dialogRef: MatDialogRef<WelcomeDialogComponent>,
        private changeDetectionService: ChangeDetectionService) {
    }

    ngOnInit() {
        this.isLoading = true;
        // get the existing projects and filter private projects if the logged in user is not listed in usersWithAccess
        this.projectService.getProjectsWithoutLoading().subscribe(result => {
            this.projectList = result.filter(project => ((project.usersWithAccess.find(user => user.id === Utils.getUserId())) || !project.isPrivate)) as Project[];
            this.isLoading = false;
        });
    }

    /**
     * selects a specific project and lets other components know of this new selection
     * @param projectId the id of the project to be selected
     */
    selectProject(projectId: string) {
        this.changeDetectionService.selectProjectFromWelcomeModal(projectId, false, this.moduleData.moduleClicked);
        this.closeDialog();
    }

    /**
     * Creates a new public project with the logged in user set as its owner.
     * If project creation was successful, the project is selected the modal closes
     * @param newProjectForm the form used to create the project
     */
    onCreateProject(newProjectForm: NgForm) {
        // create the project
        this.projectService
            .createProject(this.newProjectTitle)
            .subscribe(newProject => {
                this.changeDetectionService.selectProjectFromWelcomeModal(newProject.id, true, this.moduleData.moduleClicked);
                this.closeDialog();
            }, (err) => {
                // if an error was received, set the error message to be displayed on the modal and reset the form
                const errorResponse = JSON.parse(err._body);
                this.errorMessage = errorResponse.errorMessage;
                newProjectForm.reset();
            });
    }

    /**
     * Closes the dialog so it is no longer visible
     */
    closeDialog() {
        this.dialogRef.close();
    }

}
