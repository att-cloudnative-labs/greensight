import { Component, OnInit, OnDestroy } from '@angular/core';
import { Modal } from 'ngx-modialog-7/plugins/bootstrap';
import { LoaderService } from '../../services/loader.service';
import { AuthService } from '@login/services/auth.service';
import { LayoutService } from '@cpt/services/layout.service';
import { Observable } from 'rxjs';
import { Select } from '@ngxs/store';
import { LayoutState } from '@app/modules/cpt/state/layout.state';
import { untilDestroyed } from 'ngx-take-until-destroy';

@Component({
    selector: 'login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css']
})

export class LoginComponent implements OnInit, OnDestroy {

    @Select(LayoutState.defaultLayout) defaultLayout$: Observable<any>;

    userName = '';
    password = '';
    defaultContent;

    constructor(
        private modal: Modal,
        private authService: AuthService,
        private loader: LoaderService,
        private layoutService: LayoutService) {}

    ngOnDestroy() {}

    ngOnInit() {
        this.defaultLayout$.pipe(untilDestroyed(this)).subscribe(selection => {
            this.defaultContent = selection;
        });
    }

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
            // retreive user's layout
            this.layoutService
            .getLayout(this.userName)
            .subscribe( result => {
            const content = result !== null ? result['content'] : undefined;
            sessionStorage['layout'] =  content !== undefined ? JSON.stringify(content) : JSON.stringify(this.defaultContent);
        },
        error => {
            console.log('Failed to get user layout ', error);
        }
        );
            this.authService
                .authenticateUser(this.userName, this.password)
                .subscribe(loginSuccessful => {
                 },
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
