import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { bootstrap3Mode, Modal } from 'ngx-modialog/plugins/bootstrap';
import { NavBarComponent } from '@app/shared/components/nav-bar/nav-bar.component';
import { ProjectComboComponent } from '../project_combo/project.combo.component';
bootstrap3Mode();

@Component({
    selector: 'app-view',
    templateUrl: './app-view.component.html',
    styleUrls: ['./app-view.component.css']
})
export class AppViewComponent {
    selectedMenu = 'home/system-model';

    @ViewChild(NavBarComponent) navBar: NavBarComponent;
    @ViewChild(ProjectComboComponent) dropdown: ProjectComboComponent;
    constructor(
        public modal: Modal,
        private router: Router) {
        router.events.subscribe((val) => {
            if (val instanceof NavigationEnd) {
                if (val.urlAfterRedirects === '/forecast_graphical') {
                    this.navBar.showProjectCombo = true;
                } else {
                    this.navBar.showProjectCombo = false;
                }

                if (val.urlAfterRedirects === '/home' || val.urlAfterRedirects === '/' || val.urlAfterRedirects === '/login') {
                    this.navBar.hideNavIcons = true;
                } else {
                    this.navBar.hideNavIcons = false;
                    // if the dropdown opened due to issing selection, close the dropdown
                    if (this.dropdown.dropdownStatus === 'stayOpen') {
                        this.dropdown.dropdownStatus = 'normal';
                    }
                }
            }
        });
    }
}
