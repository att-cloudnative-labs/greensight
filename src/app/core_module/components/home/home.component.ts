import { Component, OnInit } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { Modal } from 'ngx-modialog/plugins/bootstrap';
import { Utils } from '../../../utils_module/utils';
import { TooltipsComponent } from '../tooltips/tooltips.component';
import { BranchService } from '../../service/branch.service';
import { MatDialogConfig, MatDialog } from '@angular/material';
import { WelcomeDialogComponent } from './welcome.dialog.component';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.css']
})

export class HomeComponent implements OnInit {
    selectedMenu = 'home/system-model';
    userName = Utils.getUserName();
    lastModelPageViewed = Utils.getLastModelPageViewed();
    tooltips = new TooltipsComponent();

    showTooltip(event) {
        return this.tooltips.showTooltip(event);
    }

    constructor(
        private branchService: BranchService,
        private modal: Modal,
        private dialog: MatDialog,
        private router: Router) {

        router.events
            .subscribe(event => {
                if (event instanceof NavigationStart) {
                    this.selectedMenu = event.url.substr(1);
                    // save the last system model related page viewed
                    if (event.url.substr(1).includes('home/system-model')) {
                        if (event.url.substr(1) !== 'home/system-model' && !event.url.substr(1).includes('create-model-branch')) {
                            Utils.setLastModelPageViewed(event.url);
                            this.lastModelPageViewed = Utils.getLastModelPageViewed();
                        }
                    }
                }
            });
    }

    ngOnInit() {
        this.selectedMenu = 'home';
        if (this.lastModelPageViewed === undefined) {
            Utils.setLastModelPageViewed('system-model');
            this.lastModelPageViewed = 'system-model';
        }
    }

    /**
     * Checks that a project is selected before navigating to the forecasts/system model page.
     * Checks that a version is selected before navigating to the forecasts page.
     * Checks that a system model is selected before navigating to the system models page.
     * @param destination the url to the page that the user wishes to navigate to
     */
    navigate(destination) {
        if ((Utils.getActiveProject() === null || Utils.getActiveProject() === 'null' || Utils.getActiveProject() === undefined) && destination !== '/system-models') {
            this.showWelcomeDialog(destination);
        } else if ((Utils.getActiveBranch() === null || Utils.getActiveBranch() === 'null') && destination === '/forecast_graphical') {
            this.branchService
                .getBranches(Utils.getActiveProject())
                .subscribe(branches => {
                    if (branches.length > 0) {
                        this.router.navigate([destination]);
                        this.modal.alert()
                            .title('Notice')
                            .body('You must select a forecast version to view the forecasts page')
                            .open();
                    } else {
                        this.router.navigate(['/branches-list', Utils.getActiveProject()]);
                        this.modal.alert()
                            .title('Notice')
                            .body('There is no version available for the project. Please create a forecast version first')
                            .open();
                    }
                });
        } else {
            this.router.navigate([destination]);
        }
    }

    /**
     * Displays the Welcome Dialog where the user selects/creates a project
     * @param destination the url of the module that is to be navigated to after project selection
     */
    showWelcomeDialog(destination: string) {
        const dialogConfig = new MatDialogConfig();
        dialogConfig.height = '430px';
        dialogConfig.width = '700px';
        // send the destination url to the modal dialog
        dialogConfig.data = { moduleClicked: destination };
        dialogConfig.disableClose = true;
        dialogConfig.autoFocus = false;
        this.dialog.open(WelcomeDialogComponent, dialogConfig);
    }
}
