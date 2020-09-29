import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Utils } from '@app/modules/cpt/lib/utils';
import { Modal } from 'ngx-modialog-7/plugins/bootstrap';
import { Select, Store } from '@ngxs/store';
import { SettingsButtonClicked } from '@cpt/state/settings.actions';
import { UsersState } from '@cpt/state/users.state';
import { combineLatest, Observable, Subject } from 'rxjs';
import { UserEditorButtonClicked, UserGroupEditorButtonClicked } from '@cpt/state/users.actions';
import { SettingsState } from '@cpt/state/settings.state';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { map } from 'rxjs/operators';
import { Router } from '@angular/router';

@Component({
    selector: 'app-nav-bar',
    templateUrl: './nav-bar.component.html',
    styleUrls: ['./nav-bar.component.css']
})
export class NavBarComponent implements OnInit, OnDestroy {
    userName = Utils.getUserName();

    @Select(UsersState.currentUserIsAdmin) currentUserIsAdmin$: Observable<boolean>;
    @Select(SettingsState.authMode) authMode$: Observable<'LOCAL' | 'LDAP'>;

    showUserEditorPanels$: Observable<boolean>;

    constructor(
        private modal: Modal, private store: Store, private router: Router
    ) { }

    @Input('hideNavLinks') hideNavIcons: Boolean = false;
    @Input('isLoginPage') isLoginPage: Boolean = false;

    ngOnInit() {
        this.showUserEditorPanels$ = combineLatest([this.currentUserIsAdmin$, this.authMode$]).pipe(
            untilDestroyed(this),
            map(
                c => c[0] && c[1] === 'LOCAL'
            ));

    }

    ngOnDestroy(): void {
    }

    logout(event) {
        event.preventDefault();
        const dialog =
            this.modal
                .confirm()
                .title('Confirmation')
                .body('Are you sure you want to logout?')
                .okBtn('Yes').okBtnClass('btn btn-primary')
                .cancelBtn('No')
                .open();
        dialog.result.then(promise => {
            this.router.navigate(['/login']);
            window.location.replace('/login');
        });
    }

    openSettings() {
        this.store.dispatch(new SettingsButtonClicked());
    }

    openUserEditor() {
        this.store.dispatch(new UserEditorButtonClicked());
    }

    openUserGroupEditor() {
        this.store.dispatch(new UserGroupEditorButtonClicked());
    }
}
