import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { UserService } from '../../service/user.service';
import { Modal } from 'ngx-modialog/plugins/bootstrap';
import { Utils } from '../../../utils_module/utils';

@Component({
    selector: 'login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css']
})

export class LoginComponent implements OnInit {
    userName: String = '';
    password: String = '';

    constructor(
        private modal: Modal,
        private userService: UserService,
        private router: Router) { }

    ngOnInit() { }

    login() {
        if (this.userName.length === 0) {
            this.modal.alert()
                .title('Login Failed')
                .body('Please enter user name').
                open();
        } else if (this.password.length === 0) {
            this.modal.alert()
                .title('Login Failed')
                .body('Please enter password')
                .open();
        } else {
            this.userService
                .authenticateUser(this.userName, this.password)
                .subscribe(result => {
                    Utils.selectProject(result.data.projectId);
                    Utils.selectBranch(result.data.projectId, result.data.branchId);
                    Utils.selectSimulation(null);
                    this.userService
                        .getUserByName(this.userName)
                        .subscribe(result => {
                            sessionStorage['user_id'] = result.data.id;
                            sessionStorage['user_name'] = result.data.username;
                            sessionStorage['role_id'] = result.data.role;
                            sessionStorage['user_auth_status'] = '1';
                            sessionStorage['current_user_settings'] = JSON.stringify(result.data.settings);

                            this.router.navigate(['home']);
                        });
                },
                    error => {
                        const errorData = JSON.parse(error._body);
                        this.modal.alert()
                            .title('Login Failed')
                            .body(errorData.message)
                            .open();
                    });
        }
    }

    toggleCheckbox(event) {

    }
}
