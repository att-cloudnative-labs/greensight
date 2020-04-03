import { Component, ViewChild } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Modal } from 'ngx-modialog-7/plugins/bootstrap';
import { NavBarComponent } from '@app/modules/login/components/nav-bar/nav-bar.component';

@Component({
    selector: 'app-view',
    templateUrl: './app-view.component.html',
    styleUrls: ['./app-view.component.css']
})
export class AppViewComponent {

    @ViewChild(NavBarComponent, { static: true }) navBar: NavBarComponent;
    constructor(
        public modal: Modal,
        private router: Router) {
        router.events.subscribe((val) => {
            if (val instanceof NavigationEnd) {

                if (val.urlAfterRedirects === '/home' || val.urlAfterRedirects === '/' || val.urlAfterRedirects === '/login') {
                    this.navBar.hideNavIcons = true;
                } else {
                    this.navBar.hideNavIcons = false;
                }
            }
        });
    }
}
