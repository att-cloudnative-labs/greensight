import { Component, OnDestroy, OnInit } from '@angular/core';
import { DockableInputNotification } from '@cpt/interfaces/dockable';
import { Select, Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { UsersState } from '@cpt/state/users.state';
import { User } from '@cpt/interfaces/user';
import { UserGroup } from '@cpt/interfaces/user-group';
import { UserGroupAdd } from '@cpt/state/users.actions';

@Component({
    selector: 'user-group-editor',
    templateUrl: './user-group-editor.component.html',
    styleUrls: ['./user-group-editor.component.css']
})
export class UserGroupEditorComponent implements OnInit, OnDestroy, DockableInputNotification {
    @Select(UsersState.usergroups) usergroups$: Observable<UserGroup[]>;

    newGroupName = '';

    get isIllegalGroupName(): boolean {
        // fixme: maybe check if name is already taken (:
        return this.newGroupName.trim().length < 1;
    }

    constructor(private store: Store) {
    }

    ngOnDestroy(): void {
    }

    ngOnInit(): void {
    }

    enableUserInput() {

    }

    disableUserInput() {

    }

    createGroup() {
        this.store.dispatch(new UserGroupAdd({ userGroupName: this.newGroupName }));
        this.newGroupName = '';
    }

}
