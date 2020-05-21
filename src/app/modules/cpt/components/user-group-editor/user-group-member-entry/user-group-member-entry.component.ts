import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { DockableInputNotification } from '@cpt/interfaces/dockable';
import { Select, Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { UsersState } from '@cpt/state/users.state';
import { User } from '@cpt/interfaces/user';
import { UserRole } from '@cpt/interfaces/role';
import { UserGroup } from '@cpt/interfaces/user-group';
import { UserGroupRemoveUser } from '@cpt/state/users.actions';

@Component({
    selector: 'user-group-member-entry',
    templateUrl: './user-group-member-entry.component.html',
    styleUrls: ['./user-group-member-entry.component.css']
})
export class UserGroupMemberEntryComponent implements OnInit, OnDestroy, DockableInputNotification {

    @Input() user: User;
    @Input() groupId: string;

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
    removeMember() {
        this.store.dispatch(new UserGroupRemoveUser({ userGroupId: this.groupId, userId: this.user.id }));
    }


}
