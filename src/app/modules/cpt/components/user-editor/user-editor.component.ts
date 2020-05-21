import { Component, OnDestroy, OnInit } from '@angular/core';
import { DockableInputNotification } from '@cpt/interfaces/dockable';
import { Select, Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { UsersState } from '@cpt/state/users.state';
import { User } from '@cpt/interfaces/user';
import { UserAdd } from '@cpt/state/users.actions';

@Component({
    selector: 'user-editor',
    templateUrl: './user-editor.component.html',
    styleUrls: ['./user-editor.component.css']
})
export class UserEditorComponent implements OnInit, OnDestroy, DockableInputNotification {
    @Select(UsersState.users) users$: Observable<User[]>;

    showAddUser = false;

    pw1 = '';
    pw2 = '';
    newUserName = '';

    constructor(private store: Store) {

    }

    addUser() {
        this.store.dispatch(new UserAdd({ userName: this.newUserName, newPassword: this.pw1 }));
        this.closeAddUser();
    }

    toggleAddUserVisible() {
        this.showAddUser = !this.showAddUser;
    }

    closeAddUser() {
        this.showAddUser = false;
        this._clean();
    }

    _clean() {
        this.pw1 = '';
        this.pw2 = '';
        this.newUserName = '';
    }

    get passwordInputInvalid(): boolean {
        return this.newUserName.trim().length < 1 || this.pw1.trim().length < 4 || this.pw1 !== this.pw2;
    }

    ngOnDestroy(): void {
    }

    ngOnInit(): void {
    }

    enableUserInput() {

    }

    disableUserInput() {

    }

}
