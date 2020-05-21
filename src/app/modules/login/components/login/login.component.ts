import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { UserService } from '@cpt/services/user.service';
import { Modal } from 'ngx-modialog-7/plugins/bootstrap';
import { LoaderService } from '../../services/loader.service';
import { AuthService } from '@login/services/auth.service';
import { log } from 'util';

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
        private authService: AuthService,
        private router: Router,
        private loader: LoaderService) { }

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
            // the loader will be hidden on error or when the application loaded
            this.loader.show();
            this.authService
                .authenticateUser(this.userName, this.password)
                .subscribe(loginSuccessful => { },
                    error => {
                        this.loader.hide();
                        this.modal.alert()
                            .title('Login Failed')
                            .body(error.error.errorMessage)
                            .open();
                    });
        }
    }

    toggleCheckbox(event) {

    }
}
