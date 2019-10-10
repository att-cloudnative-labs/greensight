import { Router, ActivatedRoute } from '@angular/router';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Overlay } from 'ngx-modialog';
import { Modal } from 'ngx-modialog/plugins/bootstrap';
import { User } from '../../interfaces/user';
import { Role } from '../../interfaces/role';
import { UserService } from '../../service/user.service';
import { Utils } from '../../../utils_module/utils';
import { UserGroupService } from '../../service/usergroup.service';
import { UserGroup } from '../../interfaces/user-group';

@Component({
    selector: 'users',
    templateUrl: './users.component.html',
    styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {

    name: String = '';
    password: String = '';
    projectId: String = '';
    branchId: String = '';
    role: String = '';
    roles: Role[] = Array<Role>();
    settings: Map<string, any> = new Map<string, any>();
    private loggedInUserId: String = '';
    // list of existing users
    availableUsers: User[] = Array<User>();
    // list of existing usergroups
    availableUsergroups: UserGroup[] = Array<UserGroup>();


    selectedUser: User = null;
    createdUser: User = null;
    passwordChanged: Boolean = false;
    passwordMatch: Boolean = true;
    confirmPassword: String = '';
    passwordVisible: Boolean = false;
    roleId: String = '';

    @Input('selectedUserId') selectedUserId: String = null;
    @Output('cancel-UserModal-event') cancelEvent = new EventEmitter();
    @Output('save-UserModal-event') saveEvent = new EventEmitter();

    constructor(private route: ActivatedRoute,
        private router: Router,
        private modal: Modal,
        private userService: UserService,
        private usergroupService: UserGroupService) {
    }

    ngOnInit(): void {
        this.route
            .queryParams
            .subscribe(params => {
                // var id = params['id'];
                const id = this.selectedUserId;
                if (id === undefined) { return; }

                // get the currently logged in user
                this.userService.getLoggedInUser().subscribe(result => {
                    if (result.status === 'OK') {
                        const userData = result.data;
                        this.loggedInUserId = userData.id;
                    }
                });

                this.userService
                    .getDetails(id)
                    .subscribe(result => {
                        this.selectedUser = result.data as User;
                        this.name = this.selectedUser.username;
                        this.projectId = this.selectedUser.projectId;
                        this.branchId = this.selectedUser.branchId;
                        this.roleId = this.selectedUser.role;
                        this.settings = this.selectedUser.settings;
                    });
            });

        this.roles = Utils.roles;
        if (this.selectedUser == null) {
            this.roleId = 'READ_ONLY';
        }

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

    passwordChange() {
        if ((this.password === '') && (this.confirmPassword === '')) {
            this.passwordChanged = false;
        } else { this.passwordChanged = true; }
        // this.passwordChanged = (this.password != this.confirmPassword);
    }

    changePswVisibility() {
        this.passwordVisible = !this.passwordVisible;
    }

    // create user
    onSave() {
        if (this.name.length === 0) {
            this.modal.alert()
                .title('Warning')
                .body('Please enter a username')
                .open();
        } else {
            if (this.selectedUser != null) {
                // update existing

                if (this.passwordChanged && (this.password.length === 0)) {
                    this.modal.alert()
                        .title('Warning')
                        .body('Please enter a password')
                        .open();
                } else if (this.passwordChanged && (this.password !== this.confirmPassword)) {
                    this.modal.alert()
                        .title('Warning')
                        .body('Passwords must match')
                        .open();
                } else {
                    if (this.passwordChanged) {
                        if (this.usernameExists(this.selectedUser, this.name)) {
                            this.modal.alert()
                                .title('Warning')
                                .body('Failed to update user called \'' + this.selectedUser.username +
                                    '\'. Selected name: \'' + this.name + '\' is already associated with another user.')
                                .open();
                            this.cancel();
                        } else if (this.usergroupExists(this.name)) {
                            this.modal.alert()
                                .title('Warning')
                                .body('Failed to update user called \'' + this.selectedUser.username +
                                    '\'. Selected name: \'' + this.name + '\' is already associated with a usergroup.')
                                .open();
                            this.cancel();
                        } else {
                            this.userService
                                .updateUser(this.selectedUser.id, this.name, this.roleId, this.projectId, this.branchId, this.settings, this.password)
                                .subscribe(result => {
                                    console.log('result', result);
                                    if (result.status === 'UNPROCESSABLE_ENTITY') {
                                        this.modal.alert()
                                            .title('Warning')
                                            .body('Failed to update user called \'' + this.name +
                                                '\'.')
                                            .open();
                                    } else {
                                        this.clearInputs();
                                    }
                                });
                        }
                    } else {
                        if (this.usernameExists(this.selectedUser, this.name)) {
                            this.modal.alert()
                                .title('Warning')
                                .body('Failed to update user called \'' + this.selectedUser.username +
                                    '\'. Selected name: \'' + this.name + '\' is already associated with another user.')
                                .open();
                            this.cancel();
                        } else if (this.usergroupExists(this.name)) {
                            this.modal.alert()
                                .title('Warning')
                                .body('Failed to update user called \'' + this.selectedUser.username +
                                    '\'. Selected name: \'' + this.name + '\' is already associated with a usergroup.')
                                .open();
                            this.cancel();
                        } else {
                            this.userService
                                .updateUser(this.selectedUser.id, this.name, this.roleId, this.projectId, this.branchId, this.settings)
                                .subscribe(result => {
                                    console.log('result', result);
                                    if (result.status === 'UNPROCESSABLE_ENTITY') {
                                        this.modal.alert()
                                            .title('Warning')
                                            .body('Failed to update user called \'' + this.name +
                                                '\'. This name is already associated with another user.')
                                            .open();
                                    } else {
                                        this.clearInputs();
                                    }
                                });
                        }
                    }
                }

            } else {
                // create new

                if (this.password.length === 0) {
                    this.modal.alert()
                        .title('Warning')
                        .body('Please enter a password')
                        .open();
                } else if (this.password !== this.confirmPassword) {
                    this.modal.alert()
                        .title('Warning')
                        .body('Passwords must match')
                        .open();
                } else {
                    if (this.usernameExists(this.selectedUser, this.name)) {
                        this.modal.alert()
                            .title('Warning')
                            .body('Failed to create user called \'' + this.name +
                                '\'. This name is already associated with another user.')
                            .open();
                        this.cancel();
                    } else if (this.usergroupExists(this.name)) {
                        this.modal.alert()
                            .title('Warning')
                            .body('Failed to create user called \'' + this.name +
                                '\'. This name is already associated with a usergroup.')
                            .open();
                        this.cancel();
                    } else {
                        this.userService
                            .createUser(this.name, this.password, this.roleId)
                            .subscribe(result => {
                                console.log('result', result);

                                if (result.status === 'UNPROCESSABLE_ENTITY') {
                                    this.modal.alert()
                                        .title('Warning')
                                        .body('Failed to create user called \'' + this.name +
                                            '\'.')
                                        .open();
                                } else {
                                    this.userService.getUserByName(this.name)
                                        .subscribe(result => {
                                            console.log('result', result);
                                            this.createdUser = result.data as User;
                                            this.clearInputs();
                                        });
                                }
                            });
                    }
                }
            }
        }
    }

    /*
    * check if the username already exists in the db
    * @param user the user that should be updated
    * @param newName the new name that user selected
    * @return true if username exists, false otherwise
    */
    usernameExists(user, newName): boolean {
        let usernameExists = false;
        this.availableUsers.forEach(existingUser => {
            if (user != null) {
                if (newName === existingUser.username && user.id !== existingUser.id) { usernameExists = true; return usernameExists; }
            } else { if (newName === existingUser.username) { usernameExists = true; return usernameExists; } }

        });
        return usernameExists;
    }

    /*
    * check if the username has name conflict with an existing usergroup name
    * @param name the username that should be updated
    * @return true if usergroup exists, false otherwise
    */
    usergroupExists(name): boolean {
        let usergroupExists = false;
        this.availableUsergroups.forEach(usergroup => {
            if (name === usergroup.userGroupName) { usergroupExists = true; return usergroupExists; }
        });
        return usergroupExists;
    }

    // clear inputs
    clearInputs() {
        this.name = '';
        this.password = '';
        this.projectId = '';
        this.branchId = '';
        this.roleId = '';
        this.settings = null;
        if (this.selectedUser == null) {
            this.saveEvent.emit();
            this.router.navigate(['/settings']);
        } else {
            if (this.selectedUser.id === this.loggedInUserId) {
                this.selectedUser = null;
                sessionStorage.clear();
                window.location.reload();
            } else {
                this.saveEvent.emit();
                this.selectedUser = null;
                this.router.navigate(['/settings']);
            }
        }
    }

    cancel() {
        this.name = '';
        this.password = '';
        this.projectId = '';
        this.branchId = '';
        this.roleId = '';
        this.settings = null;
        this.selectedUser = null;
        this.selectedUserId = '';
        this.cancelEvent.emit();
        this.router.navigate(['/settings']);
    }
}
