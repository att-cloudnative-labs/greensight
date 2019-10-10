import { Component, Input, OnInit } from '@angular/core';
import { Utils } from '@app/utils_module/utils';
import { Router } from '@angular/router';
import { Modal } from 'ngx-modialog/plugins/bootstrap';
import { environment } from '../../../../environments/environment';

@Component({
    selector: 'app-nav-bar',
    templateUrl: './nav-bar.component.html',
    styleUrls: ['./nav-bar.component.css']
})
export class NavBarComponent implements OnInit {
    userName = Utils.getUserName();

    constructor(
        private modal: Modal,
        private router: Router
    ) { }

    @Input('hideNavLinks') hideNavIcons: Boolean = false;
    @Input('showProjectCombo') showProjectCombo: Boolean = false;
    @Input('isLoginPage') isLoginPage: Boolean = false;

    showSystemModel: Boolean = environment.showSystemModel;
    ngOnInit() {
    }

    logout(event) {
        event.preventDefault();
        const dialog =
            this.modal
                .confirm()
                .title('Confirmation')
                .body('Are you sure you want logout?')
                .okBtn('Yes').okBtnClass('btn btn-primary')
                .cancelBtn('No')
                .open();
        dialog.result.then(promise => {
            sessionStorage.clear();
            window.location.reload();
        });
    }

    navigate(destination) {
        if (Utils.getActiveProject() === null || Utils.getActiveProject() === 'null' || Utils.getActiveProject() === undefined) {
            this.router.navigate(['/home']);
        } else {
            this.router.navigate([destination]);
        }
    }
}
