import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { DockableInputNotification } from '@cpt/interfaces/dockable';
import { Select, Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { UsersState } from '@cpt/state/users.state';
import { User } from '@cpt/interfaces/user';
import { UserRole } from '@cpt/interfaces/role';
import { Modal } from 'ngx-modialog-7/plugins/bootstrap';
import { UserDelete, UserUpdatePassword, UserUpdateRole } from '@cpt/state/users.actions';

@Component({
    selector: 'user-list-entry',
    templateUrl: './user-list-entry.component.html',
    styleUrls: ['./user-list-entry.component.css']
})
export class UserListEntryComponent implements OnInit, OnDestroy, DockableInputNotification {

    @Input() user: User;

    showEditMode = false;

    pw1 = '';
    pw2 = '';

    constructor(private modal: Modal, private store: Store) {
    }

    get passwordInputInvalid(): boolean {
        return this.pw1.trim().length < 4 || this.pw1 !== this.pw2;
    }

    ngOnDestroy(): void {
    }

    ngOnInit(): void {
    }

    enableUserInput() {

    }

    disableUserInput() {

    }

    toggleEditMode() {
        this.showEditMode = !this.showEditMode;
    }

    closeEditMode() {
        this.showEditMode = false;
        this.pw2 = '';
        this.pw1 = '';
    }

    roleClass(role: UserRole) {
        const isActive = this.user.role === role ? 'active' : '';
        return isActive;
    }

    setRole(role: UserRole) {
        this.store.dispatch(new UserUpdateRole({ userId: this.user.id, role: role }));
    }

    updatePassword() {
        this.store.dispatch(new UserUpdatePassword({ userId: this.user.id, newPassword: this.pw1 })).subscribe(() => { this.closeEditMode(); });

    }

    deleteUser() {
        const confirmDelete = this.modal
            .confirm()
            .title('Delete User')
            .body('Really Delete User ' + this.user.username + '?')
            .okBtn('Delete').okBtnClass('btn btn-danger')
            .cancelBtn('Cancel')
            .open();

        confirmDelete.result.then(() => {
            this.store.dispatch(new UserDelete({ userId: this.user.id }));
        });
    }

}
