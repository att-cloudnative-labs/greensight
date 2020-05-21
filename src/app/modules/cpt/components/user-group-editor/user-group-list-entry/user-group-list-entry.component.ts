import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { DockableInputNotification } from '@cpt/interfaces/dockable';
import { User } from '@cpt/interfaces/user';
import { UserRole } from '@cpt/interfaces/role';
import { UserGroup } from '@cpt/interfaces/user-group';
import { Select, Store } from '@ngxs/store';
import { UserDelete, UserGroupAddUser, UserGroupDelete, UserGroupUpdateRole } from '@cpt/state/users.actions';
import { Modal } from 'ngx-modialog-7/plugins/bootstrap';
import { UsersState } from '@cpt/state/users.state';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { untilDestroyed } from 'ngx-take-until-destroy';

@Component({
    selector: 'user-group-list-entry',
    templateUrl: './user-group-list-entry.component.html',
    styleUrls: ['./user-group-list-entry.component.css']
})
export class UserGroupListEntryComponent implements OnInit, OnDestroy, DockableInputNotification {

    @Input() userGroup: UserGroup;
    @Select(UsersState.users) allUsers$: Observable<User[]>;

    showEditMode = false;

    possibleNewMembers: User[] = [];
    members: User[] = [];

    newMemberId: string;

    constructor(private store: Store, private modal: Modal) {
    }

    ngOnDestroy(): void {
    }

    ngOnInit(): void {
        this.members = this.userGroup.usersWithAccess ? this.userGroup.usersWithAccess : [];
        this.allUsers$.pipe(
            map(allUsers => allUsers.filter(u => !this.members.find(m => m.id === u.id))),
            untilDestroyed(this)
        ).subscribe(nonMemberUsers => { this.possibleNewMembers = nonMemberUsers; });
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
        // clear fields
    }

    roleClass(role: UserRole) {
        const isActive = this.userGroup.roleId === role ? 'active' : '';
        return isActive;
    }

    setRole(role: UserRole) {
        this.store.dispatch(new UserGroupUpdateRole({ userGroupId: this.userGroup.id, role: role }));
    }

    deleteGroup() {
        const confirmDelete = this.modal
            .confirm()
            .title('Delete Group')
            .body('Really Delete Group ' + this.userGroup.userGroupName + '?')
            .okBtn('Delete').okBtnClass('btn btn-danger')
            .cancelBtn('Cancel')
            .open();

        confirmDelete.result.then(() => {
            this.store.dispatch(new UserGroupDelete({ userGroupId: this.userGroup.id }));
        });
    }

    addNewMember() {
        this.store.dispatch(new UserGroupAddUser({ userGroupId: this.userGroup.id, userId: this.newMemberId }));
    }

}
