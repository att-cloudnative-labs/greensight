import { Router, ActivatedRoute } from '@angular/router';
import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { Overlay } from 'ngx-modialog';
import { Modal } from 'ngx-modialog/plugins/bootstrap';
import { User } from '../../interfaces/user';
import { Role } from '../../interfaces/role';
import { UserService } from '../../service/user.service';
import { Utils } from '../../../utils_module/utils';
import { UserGroup } from '../../interfaces/user-group';
import { UserGroupService } from '../../service/usergroup.service';
import { ProjectService } from '../../service/project.service';
import { Project } from '../../interfaces/project';

@Component({
    selector: 'usergroups',
    templateUrl: './usergroups.component.html',
    styleUrls: ['./usergroups.component.css']
})
export class UsergroupsComponent implements OnInit {

    roleId: String = '';
    roles: Role[] = Array<Role>();
    userGroupName: String = '';
    filteredUsers: User[] = new Array<User>();
    ownerId: String = '';
    isOwner: Boolean = false;
    users: User[] = Array<User>();
    searchName: String = '';
    usersWithAccess: User[] = Array<User>();
    projectsWithUserGroups: Project[] = Array<Project>();
    projectId = '';
    projectTitle = '';
    projectsDescription = '';
    projectOwnerId: String = '';
    projectIsPrivate: Boolean = false;
    projectUserWithAccess: User[] = Array<User>();
    projectUserGroups: UserGroup[] = Array<UserGroup>();
    selectedProject: Project = null;
    selectedUserGroup: UserGroup = null;
    createdUserGroup: UserGroup = null;
    userGroupRoleName: String = null;
    userRoleName: String = null;
    userGroupRolesList: Role[] = Array<Role>();
    removedUsers: User[] = Array<User>();
    usergroupName: String = '';
    // list of existing users
    availableUsers: User[] = Array<User>();
    // list of existing usergroups
    availableUsergroups: UserGroup[] = Array<UserGroup>();

    @Input('selectedUGId') selectedUserGroupId: String = null;
    @Output('cancel-UGModal-event') cancelEvent = new EventEmitter();
    @Output('save-UGModal-event') saveEvent = new EventEmitter();

    constructor(private route: ActivatedRoute,
        private router: Router,
        private modal: Modal,
        private userService: UserService,
        private usergroupService: UserGroupService,
        private projectService: ProjectService) {
    }

    ngOnInit(): void {
        this.roles = Utils.roles;
        if (this.selectedUserGroupId == null) {
            this.roleId = this.roles[0].id;
        } else {
            this.route
                .queryParams
                .subscribe(params => {
                    // var id = params['id'];
                    const id = this.selectedUserGroupId;
                    if (id === undefined) { return; }

                    this.usergroupService
                        .getDetails(id)
                        .subscribe(result => {
                            this.selectedUserGroup = result.data as UserGroup;
                            this.userGroupName = this.selectedUserGroup.userGroupName;
                            this.usersWithAccess = this.selectedUserGroup.usersWithAccess;
                            this.roleId = this.selectedUserGroup.roleId;
                            this.userService.getUsers().subscribe(res => {
                                if (res.status === 'OK') {
                                    const usrs = res.data;
                                    for (const user of usrs) {
                                        if (this.hasAccess(user)) {
                                            this.filteredUsers.push(user);
                                        }
                                    }
                                }
                            });
                        });
                });
        }

        this.userService
            .getOwners((users => {
                this.users = users;
                if (this.ownerId === '') {
                    this.ownerId = Utils.getUserId();
                }
                if (this.ownerId !== '' && this.ownerId === Utils.getUserId()) {
                    this.isOwner = true;
                } else if (this.ownerId === '') {
                    this.isOwner = true;
                }
            }));
        this.userService.getUsers().subscribe(result => {
            if (result.status === 'OK') {
                this.availableUsers = result.data;
            }
        });

        this.usergroupService.getUserGroup().subscribe(result => {
            if (result.status === 'OK') {
                this.availableUsergroups = result.data;
            }
        });

    }

    // create usergroup
    onSave() {
        // TODO - remove this once backend bug fixed
        const updatedUsersWithAccess = Object.assign([], this.usersWithAccess);
        for (const user of updatedUsersWithAccess) {
            user.grantedAuthorities = null;
            user.authorities = null;
        }

        if (this.userGroupName.length === 0) {
            this.modal.alert()
                .title('Warning')
                .body('Please enter a usergroupname')
                .open();
            // }
            // else if (this.usersWithAccess.length == 0) {
            //     this.modal.alert()
            //         .title('Warning')
            //         .body('Please select a user')
            //         .open();
        } else {
            if (this.selectedUserGroup != null) {
                this.adjustUserRole(this.selectedUserGroup);
                if (this.usernameExists(this.userGroupName)) {
                    this.modal.alert()
                        .title('Warning')
                        .body('Failed to update usergroup called \'' + this.selectedUserGroup.userGroupName +
                            '\'. Selected name: \'' + this.userGroupName + '\' is already associated with a user.')
                        .open();
                } else if (this.usergroupExists(this.selectedUserGroup, this.userGroupName)) {
                    this.modal.alert()
                        .title('Warning')
                        .body('Failed to update usergroup called \'' + this.selectedUserGroup.userGroupName +
                            '\'. Selected name: \'' + this.userGroupName + '\' is already associated with another usergroup.')
                        .open();
                } else {
                    // update existing
                    this.usergroupService
                        .updateUsergroup(this.selectedUserGroup.id, this.userGroupName, updatedUsersWithAccess, this.roleId)
                        .subscribe(result => {
                            console.log('result of update', result);
                            if (result.status === 'UNPROCESSABLE_ENTITY') {
                                this.modal.alert()
                                    .title('Warning')
                                    .body('Failed to update user group called \'' + this.userGroupName +
                                        '\'. This name is already associated with another user group')
                                    .open();
                            } else {
                                // TODO: update project?
                            }

                        });
                    this.usersWithAccess.forEach(removedUser => {
                        this.modifyUserRole(removedUser);
                        console.log('removed user is: ' + removedUser.username);

                    });
                }

            } else {
                if (this.usernameExists(this.userGroupName)) {
                    this.modal.alert()
                        .title('Warning')
                        .body('Failed to create usergroup called \'' + this.userGroupName +
                            '\'. This name is already associated with a user.')
                        .open();
                } else if (this.usergroupExists(this.userGroupName, this.userGroupName)) {
                    this.modal.alert()
                        .title('Warning')
                        .body('Failed to create usergroup called \'' + this.userGroupName +
                            '\'. This name is already associated with another usergroup.')
                        .open();
                } else {
                    // create new
                    this.usergroupName = this.userGroupName;
                    console.log('user group name is : ' + this.usergroupName);
                    this.usergroupService
                        .createUsergroup(this.userGroupName, updatedUsersWithAccess, this.roleId)
                        .subscribe(result => {
                            console.log('result', result);

                            if (result.status === 'UNPROCESSABLE_ENTITY') {
                                this.modal.alert()
                                    .title('Warning')
                                    .body('Failed to create user group called \'' + this.userGroupName +
                                        '\'. This name is already associated with another user group.')
                                    .open();
                            } else {
                                this.usergroupService.getUserByName(this.usergroupName)
                                    .subscribe(result => {
                                        console.log('result', result);
                                        this.createdUserGroup = result.data as UserGroup;
                                        this.adjustUserRole(this.createdUserGroup);
                                        this.createdUserGroup.usersWithAccess.forEach(user => {
                                            this.usergroupService.getUserInUsergroups(user.id)
                                                .subscribe(result => {
                                                    const usergroupLis = result.data as Array<UserGroup>;
                                                    for (let index = 0; index < usergroupLis.length; index++) {
                                                        usergroupLis[index].usersWithAccess.forEach(userInList => {
                                                            if (user.id === userInList.id) {
                                                                userInList.role = user.role;
                                                            }
                                                            this.usergroupService
                                                                .updateUsergroup(this.createdUserGroup.id, this.createdUserGroup.userGroupName, this.createdUserGroup.usersWithAccess, this.createdUserGroup.roleId)
                                                                .subscribe(result => {
                                                                    console.log('result of update', result);
                                                                    this.usergroupService.getUserGroup().subscribe(res => {
                                                                        if (res.status === 'OK') {
                                                                            console.log('userGroup List', res);
                                                                        }
                                                                    });
                                                                });
                                                        });

                                                    }
                                                });
                                        });
                                        this.clearInputs();
                                    });
                            }
                        });
                }

            }
        }
        this.clearInputs();
    }

    adjustUserRole(usergroup: UserGroup) {
        this.roles.forEach(role => {
            if (usergroup.roleId === role.id) {
                this.userGroupRoleName = role.roleName;
            }
        });
        for (let position = 0; position < usergroup.usersWithAccess.length; position++) {
            this.roles.forEach(role => {
                if (usergroup.usersWithAccess[position].role === role.id) {
                    this.userRoleName = role.roleName;
                }
            });
            if (this.userGroupRoleName !== 'ROLE_Read-only') {
                if (this.userGroupRoleName === 'ROLE_Admin') {
                    if (this.userRoleName !== this.userGroupRoleName) {
                        usergroup.usersWithAccess[position].role = usergroup.roleId;
                        this.userService
                            .updateUser(usergroup.usersWithAccess[position].id, usergroup.usersWithAccess[position].username, usergroup.usersWithAccess[position].role, usergroup.usersWithAccess[position].projectId, usergroup.usersWithAccess[position].branchId, usergroup.usersWithAccess[position].settings)
                            .subscribe(result => {
                                console.log('result', result);
                                if (result.status === 'UNPROCESSABLE_ENTITY') {
                                    this.modal.alert()
                                        .title('Warning')
                                        .body('Failed to update user called \'' + usergroup.usersWithAccess[position].username +
                                            '\'. This name is already associated with another user')
                                        .open();
                                }
                            });
                    }
                } else if (this.userGroupRoleName === 'ROLE_Read-and-write') {
                    if (this.userRoleName === 'ROLE_Read-only') {
                        usergroup.usersWithAccess[position].role = usergroup.roleId;
                        this.userService
                            .updateUser(usergroup.usersWithAccess[position].id, usergroup.usersWithAccess[position].username, usergroup.usersWithAccess[position].role, usergroup.usersWithAccess[position].projectId, usergroup.usersWithAccess[position].branchId, usergroup.usersWithAccess[position].settings)
                            .subscribe(result => {
                                console.log('result', result);
                                if (result.status === 'UNPROCESSABLE_ENTITY') {
                                    this.modal.alert()
                                        .title('Warning')
                                        .body('Failed to update user called \'' + usergroup.usersWithAccess[position].username +
                                            '\'. This name is already associated with another user')
                                        .open();
                                }
                            });

                    }
                }

            }
        }
    }

    /*
    * check if the usergroup name doesn't conflict with an existing username
    * @param usergroupName the usergroup name that should be updated
    * @return true if username exists, false otherwise
    */
    usernameExists(usergroupName): boolean {
        let usernameExists = false;
        this.availableUsers.forEach(user => {
            if (usergroupName === user.username) { usernameExists = true; return usernameExists; }
        });
        return usernameExists;
    }

    /*
    * check if the usergroup has already exists in db
    * @param usergroup the usergroup that should be updated
    * @param newName the new name that is picked by user
    * @return true if usergroup exists, false otherwise
    */
    usergroupExists(usergroup, newName): boolean {
        let usergroupExists = false;
        this.availableUsergroups.forEach(existingUsergroup => {
            if (newName === existingUsergroup.userGroupName && usergroup.id !== existingUsergroup.id) { usergroupExists = true; return usergroupExists; }
        });
        return usergroupExists;
    }

    // clear inputs
    clearInputs() {
        this.userGroupName = '';
        this.selectedUserGroupId = null;
        this.saveEvent.emit();
        this.router.navigate(['/settings']);
    }

    cancel() {
        this.userGroupName = '';
        this.selectedUserGroup = null;
        this.selectedUserGroupId = null;
        this.cancelEvent.emit();
        this.router.navigate(['/settings']);
    }

    filterResult(event, type) {
        this.filteredUsers.splice(0, this.filteredUsers.length);
        if (event.target.value !== '') {
            for (let index = 0; index < this.users.length; index++) {
                const usr = this.users[index];
                if (usr.username.toLowerCase().indexOf(this.searchName.toLowerCase()) >= 0) {
                    if (!this.hasAccess(usr)) {
                        this.filteredUsers.push(usr);
                    }
                }
            }
        }

        for (const user of this.users) {
            if (this.hasAccess(user)) {
                this.filteredUsers.push(user);
            }
        }
    }

    shouldSkipUser(usr): Boolean {
        if (usr.id === this.ownerId) {
            return true;
        }

        return false;
    }
    setAccess(event, user) {
        const access = event.target.checked;
        if (access === true) {
            if (this.userExists(user) !== true) {
                this.usersWithAccess.push(user);
            }
        } else {
            const position = this.usersWithAccess.findIndex(accessUser => accessUser.id === user.id);
            this.usersWithAccess.splice(position, 1);
            this.removedUsers.push(user);
        }
    }
    modifyUserRole(user) {
        this.userGroupRolesList = [];
        let removedUserRoleName;
        this.roles.forEach(role => {
            if (user.roleId === role.id) {
                removedUserRoleName = role.roleName;
                console.log('current user role: ' + removedUserRoleName);
            }
        });
        this.usergroupService.getUserInUsergroups(user.id)
            .subscribe(result => {
                const usergroupLis = result.data as Array<UserGroup>;
                if (usergroupLis.length === 0) { this.userGroupRolesList = []; }
                for (let index = 0; index < usergroupLis.length; index++) {
                    this.roles.forEach(role => {
                        if (usergroupLis[index].roleId === role.id) {
                            this.userGroupRolesList.push(role);
                            console.log('usergrouplist : ' + this.userGroupRolesList[index].roleName);
                        }

                    });
                }
                if (usergroupLis.length !== 0) {
                    const AdminIndices = this.userGroupRolesList.map((role, index) => role.roleName === 'ROLE_Admin' ? index : '').filter(String);
                    const WriteIndices = this.userGroupRolesList.map((role, index) => role.roleName === 'ROLE_Read-and-write' ? index : '').filter(String);
                    const ReadOnlyIndices = this.userGroupRolesList.map((role, index) => role.roleName === 'ROLE_Read-only' ? index : '').filter(String);
                    if (AdminIndices.length !== 0) {
                        this.userGroupRolesList.forEach(role => {
                            if (role.roleName === 'ROLE_Admin') {
                                user.roleId = role.id;
                            }
                        });

                    } else if (WriteIndices.length !== 0) {
                        this.userGroupRolesList.forEach(role => {
                            if (role.roleName === 'ROLE_Read-and-write') {
                                user.roleId = role.id;
                            }
                        });
                    } else if (ReadOnlyIndices.length !== 0) {
                        this.userGroupRolesList.forEach(role => {
                            if (role.roleName === 'ROLE_Read-only') {
                                user.roleId = role.id;
                            }
                        });
                    }
                }
                console.log('updated user role: ' + user.roleId);

                this.userService
                    .updateUser(user.id, user.username, user.roleId, user.projectId, user.branchId, user.modelBranchId, user.settings)
                    .subscribe(result => {
                        console.log('result of update', result);
                    });
            });

    }
    hasAccess(user) {
        for (let index = 0; index < this.usersWithAccess.length; index++) {
            if (this.usersWithAccess[index].id === user.id) {
                return true;
            }
        }
    }

    userExists(user): Boolean {
        let exists = false;
        for (let index = 0; index < this.usersWithAccess.length; index++) {
            if (user.id === this.usersWithAccess[index].id) {
                exists = true;
                return exists;
            }
        }
        return exists;
    }
}
