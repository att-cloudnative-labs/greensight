import { Component, OnInit, HostListener } from '@angular/core';
import { SettingsService } from '../../service/settings.service';
import { Router, ActivatedRoute } from '@angular/router';
import { BranchService } from '../../service/branch.service';
import { ProjectService } from '../../service/project.service';
import { ForecastVariableService } from '../../service/variable.service';
import { Project } from '../../interfaces/project';
import { Branch } from '../../interfaces/branch';
import { UserService } from '../../service/user.service';
import { Utils } from '../../../utils_module/utils';
import { Modal } from 'ngx-modialog/plugins/bootstrap';
import { Unit } from '../../interfaces/unit';
import { VariableUnitService } from '../../service/variable-unit.service';
import { UserGroupService } from '../../service/usergroup.service';
import { UserGroup } from '../../interfaces/user-group';
import { Role } from '../../interfaces/role';
import { User } from '../../interfaces/user';
import { VersionService } from '../../service/micro-service-versions.service';
import { Location } from '@angular/common';
const moment = require('moment-timezone');

@Component({
    selector: 'settings',
    templateUrl: 'settings.component.html',
    styleUrls: [
        'settings.component.css'
    ]
})

export class SettingsComponent implements OnInit {
    sigma = '';
    breakdownDec = '';
    otherDec = '';
    sigmaId = '';
    otherDecId = '';
    breakdownDecId = '';
    variableDecimal = '';
    commaCheck: boolean;
    commaCheckId = '';
    showUGModal = false;
    showUserModal = false;
    pointToLocalhost: boolean;
    userRole: String;
    private users = [];
    private roles = [];
    checked = true;
    username: String;
    userGroupName: String;
    units: Unit[] = new Array<Unit>();
    newUnits: string[] = new Array<string>();
    private usergroups = [];
    selectedUserGroupId: String = null;
    selectedUserId: String = null;

    userGroupRoleName: String = '';
    userRoleName: String = '';
    userGroupRolesList: Role[] = Array<Role>();
    removedUserList: User[] = Array<User>();
    removedUserRoleName: String = '';
    usergroupLis: UserGroup[] = Array<UserGroup>();
    projectsWithAssociatedUserGroups: Project[] = Array<Project>();

    timezones = moment.tz.names();
    utcList = [];
    timezone = '';




    public version: String = Utils.getUIVersion();
    public forecastBackendVersion: any = {};
    public modelBackendVersion: any = {};
    public simBackendVersion: any = {};
    public ProjectionVersion = require('@cpt/capacity-planning-projection/package.json').version;

    projectsWithUserGroups: Project[] = Array<Project>();

    constructor(
        private settingsService: SettingsService,
        private branchService: BranchService,
        private projectService: ProjectService,
        private route: ActivatedRoute,
        private variableUnitService: VariableUnitService,
        private variableService: ForecastVariableService,
        private userService: UserService,
        private router: Router,
        private modalDialog: Modal,
        private usergroupService: UserGroupService,
        private versionService: VersionService,
        private location: Location

    ) { }

    ngOnInit() {

        // get gmt value of all timezones in timezones list and pushh them in utcList
        for (let index = 0; index < this.timezones.length; index++) {
            this.utcList.push(this.timezones[index] + ': ' + moment.tz(this.timezones[index]).toString().split(' ')[5]);
        }
        this.getUnits();
        if (Utils.baseUrl === 'http://localhost:8443') {
            this.pointToLocalhost = true;
        } else {
            this.pointToLocalhost = false;
        }

        this.getBackendVersionInfo();

        this.roles = Utils.roles;
        // get the currently logged in user
        this.userService.getLoggedInUser().subscribe(result => {
            if (result.status === 'OK') {
                const userData = result.data;
                this.roles.forEach(role => {
                    if (userData.role === role.id) {
                        this.userRole = role.roleName;
                    }
                });

            }
        });

        this.getUsers();

        this.settingsService
            .getSettings()
            .subscribe(settings => {
                const settingData = settings.data;

                this.otherDec = settingData.VARIABLE_DECIMAL;
                this.variableDecimal = settingData.VARIABLE_DECIMAL;
                this.breakdownDec = settingData.BREAKDOWN_DECIMAL;
                this.commaCheck = settingData.COMMA_CHECK === 'true' ? true : false;
                this.sigma = settingData.SIGMA;
                // get timezone value if already set by user, otherwise set default to local timezone
                this.timezone = settingData.TIMEZONE == null ? this.timezone = moment.tz.guess() + ': ' + moment.tz(moment.tz.guess()).toString().split(' ')[5]
                    : settingData.TIMEZONE.split(':')[0] + ': ' + moment.tz(settingData.TIMEZONE.split(':')[0]).toString().split(' ')[5];
            });
    }

    onChangeSettings() {

        if (this.validatePercentiles()) {
            this.settingsService
                .updateSettings({
                    'VARIABLE_DECIMAL': this.variableDecimal,
                    'SIGMA': this.sigma.trim(),
                    'BREAKDOWN_DECIMAL': this.breakdownDec,
                    'COMMA_CHECK': this.commaCheck,
                    'TIMEZONE': this.timezone
                })
                .subscribe(result => {
                    console.log('Successfully updated settings.');
                });
        }
    }

    onValidatePercentile() {
        if (this.validatePercentiles() === false) {
            this.modalDialog.alert()
                .title('Save Failed - Invalid percentiles detected')
                .body('Ensure that percentages are between 0 and 100, are separated by commas and only contain numerical values.')
                .open();
        }
    }

    onChangeUserRole(user) {
        if (this.userRole === 'ROLE_Admin') {
            if (user.id !== Utils.getUserId()) {
                this.userService
                    .updateUser(user.id, user.username, user.role, user.projectId, user.branchId, user.modelBranchId, user.settings)
                    .subscribe(result => {
                        console.log('Successfully updated users', user.username);
                    });
            }
        }
    }

    onChangeUsergroupRole(usergroup) {
        if (this.userRole === 'ROLE_Admin') {
            this.adjustUserRole(usergroup);
            this.usergroupService
                .updateUsergroup(usergroup.id, usergroup.userGroupName, usergroup.usersWithAccess, usergroup.roleId)
                .subscribe(result => {
                    console.log('Successfully updated user groups');
                });
            for (let index = 0; index < usergroup.usersWithAccess.length; index++) {
                this.userGroupRolesList = [];
                this.usergroupLis = [];
                this.modifyUserRole(usergroup.usersWithAccess[index]);

            }
        }
    }

    /**
    * save variable unit when enter key is pressed
    * if creating new unit status is OK, success modal msg shows up
    * if variable unit not created with success, warning modal pops up
    * at the end a call to getUnits() to refresh variable units view.
    */
    @HostListener('window:keydown', ['$event'])
    onButtonPress($event: KeyboardEvent) {
        if ($event.keyCode === 13) {
            for (const unit of this.newUnits) {
                this.variableUnitService.createVariableUnit(unit, true).subscribe(result => {
                    if (result.status !== 'UNPROCESSABLE_ENTITY') {
                        this.getUnits();
                    } else {
                        this.modalDialog.alert()
                            .title('Warning')
                            .body('Could not create Variable Unit \'' + unit +
                                '\'.')
                            .open();
                    }
                });
            }
        }
    }

    getBackendVersionInfo() {
        // get the forecast backend version information
        this.versionService.getForecastBackendVersion().subscribe(result => {
            if (result.status === 'OK') {
                // this.forecastBackendVersion = {'version':result.data.version, 'modelVersion':result.data.modelVersion, 'groupId':result.data.groupId, 'artifactId':result.data.artifactId};
                this.forecastBackendVersion = result.data;
            }
        });

        // get the model backend version information
        this.versionService.getModelBackendVersion().subscribe(result => {
            if (result.status === 'OK') {
                // this.modelBackendVersion = {'version':result.data.version, 'modelVersion':result.data.modelVersion, 'groupId':result.data.groupId, 'artifactId':result.data.artifactId};
                this.modelBackendVersion = result.data;
            }
        });

        // get the simulation backend version information
        this.versionService.getSimBackendVersion().subscribe(result => {
            this.simBackendVersion = result;
        });
    }

    trackByIndex(index: number, value: string) {
        return index;
    }

    getUnits() {
        this.variableUnitService.getVariableUnits()
            .subscribe(result => {
                this.units = result.data as Unit[];
            });
    }
    onAddUnit() {
        this.newUnits.push('new-unit');
    }

    onUnitCancel(index) {
        this.newUnits.splice(index, 1);
    }

    onDeleteUnit(id: string) {
        const dialog = this.modalDialog
            .confirm()
            .title('Confirmation')
            .body('Are you sure you want to delete this unit?')
            .okBtn('Yes').okBtnClass('btn btn-danger')
            .cancelBtn('No')
            .open();
        dialog.result.then(result => {
            this.variableUnitService.deleteVariableUnit(id).subscribe(resp => {
                if (resp.status === 'OK') {
                    console.log('unit with id ' + id + 'deleted');
                    this.getUnits();
                }
            });
        });
    }

    getUsers() {
        // get all users
        this.users.splice(0, this.users.length);
        this.userService.getUsers().subscribe(result => {
            if (result.status === 'OK') {
                this.users = result.data;
            }
        });
        this.getUsergroups();
    }

    getUsergroups() {
        this.usergroups.splice(0, this.usergroups.length);
        this.usergroupService.getUserGroup().subscribe(result => {
            if (result.status === 'OK') {
                console.log('Successfully retrieved user groups');
                this.usergroups = result.data;
            }
        });

    }

    setUserGroupsRoles(usergroup, role) {
        for (let index = 0; index < this.usergroups.length; index++) {
            if (this.usergroups[index].userGroupName === usergroup.userGroupName) {
                this.usergroups[index].roleId = role.id;
                this.adjustUserRole(this.usergroups[index]);
            }
        }
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
                        if (usergroup.usersWithAccess[position].id !== Utils.getUserId()) {
                            this.userService
                                .updateUser(usergroup.usersWithAccess[position].id, usergroup.usersWithAccess[position].username, usergroup.roleId, usergroup.usersWithAccess[position].projectId, usergroup.usersWithAccess[position].branchId, usergroup.usersWithAccess[position].settings)
                                .subscribe(result => {
                                    if (result.status === 'UNPROCESSABLE_ENTITY') {
                                        this.modalDialog.alert()
                                            .title('Warning')
                                            .body('Failed to update user called \'' + usergroup.usersWithAccess[position].username +
                                                '\'. This name is already associated with another user')
                                            .open();
                                    } else {
                                        // this.clearInputs();
                                    }
                                });
                        }
                    }
                } else if (this.userGroupRoleName === 'ROLE_Read-and-write') {
                    if (this.userRoleName === 'ROLE_Read-only') {
                        usergroup.usersWithAccess[position].role = usergroup.roleId;
                        this.userService
                            .updateUser(usergroup.usersWithAccess[position].id, usergroup.usersWithAccess[position].username, usergroup.roleId, usergroup.usersWithAccess[position].projectId, usergroup.usersWithAccess[position].branchId, usergroup.usersWithAccess[position].settings)
                            .subscribe(result => {
                                if (result.status === 'UNPROCESSABLE_ENTITY') {
                                    this.modalDialog.alert()
                                        .title('Warning')
                                        .body('Failed to update user called \'' + usergroup.usersWithAccess[position].username +
                                            '\'. This name is already associated with another user')
                                        .open();
                                } else {
                                    // this.clearInputs();
                                }
                            });

                    }
                }

            }
        }
    }

    isCheckedUserGroup(usergroup, role) {
        for (let index = 0; index < this.usergroups.length; index++) {
            if (this.usergroups[index].userGroupName === usergroup.userGroupName) {
                if (usergroup.roleId === role.id) {
                    return true;
                } else {
                    return false;
                }
            }
        }
    }

    setRoles(user, role) {
        for (let index = 0; index < this.users.length; index++) {
            if (this.users[index].username === user.username) {
                this.users[index].role = role.id;
            }
        }
    }

    isChecked(user, role) {
        for (let index = 0; index < this.users.length; index++) {
            if (this.users[index].username === user.username) {
                if (user.role === role.id) {
                    return true;
                } else {
                    return false;
                }
            }
        }
    }

    createUserGroup() {
        this.selectedUserGroupId = null;
        this.showUGModal = true;
        // this.router.navigate(['/usergroups']);
    }

    createUser() {
        this.showUserModal = true;
        // this.router.navigate(['/users']);
    }

    editUser(userId?) {
        this.showUserModal = true;
        if (userId == null) {
            this.selectedUserId = Utils.getUserId();
        } else {
            this.selectedUserId = userId;
        }
    }

    deleteUsergroup(usergroup) {
        const dialog = this.modalDialog
            .confirm()
            .title('Confirmation')
            .body('Are you sure you want to delete this user group')
            .okBtn('Yes').okBtnClass('btn btn-danger')
            .cancelBtn('No')
            .open();
        dialog.result.then(promise => {
            for (let index = 0; index < usergroup.usersWithAccess.length; index++) {
                this.removedUserList.push(usergroup.usersWithAccess[index]);
            }
            this.usergroupService.deleteUsergroup(usergroup.id).subscribe(res => {
                if (res.status === 'OK') {

                    for (let index = 0; index < this.removedUserList.length; index++) {
                        this.modifyUserRole(this.removedUserList[index]);
                    }
                    //TODO: update project ACLs to remove user groups

                    this.getUsergroups();
                    this.router.navigate(['/settings']);

                }
            });
        });

    }
    modifyUserRole(user) {

        console.log(' userGroupRolesList : ' + this.userGroupRolesList.length);
        console.log('this.usergroupLis: ' + this.usergroupLis.length);
        this.roles.forEach(role => {
            if (user.roleId === role.id) {
                this.removedUserRoleName = role.roleName;
                console.log(user.username + ' current user role: ' + this.removedUserRoleName);
            }
        });
        this.usergroupService.getUserInUsergroups(user.id)
            .subscribe(result => {
                this.usergroupLis = result.data as Array<UserGroup>;
                console.log(' usergroupLis length should be empty for each user:' + this.usergroupLis.length);
                this.userGroupRolesList = [];
                for (let index = 0; index < this.usergroupLis.length; index++) {
                    this.roles.forEach(role => {
                        if (this.usergroupLis[index].roleId === role.id) {
                            this.userGroupRolesList.push(role);
                            console.log(user.username + ' current usergroup name: ' + this.usergroupLis[index].userGroupName + ' usergrouplist role : ' + this.usergroupLis[index].roleId);
                            console.log(user.username + ' is part of ' + this.usergroupLis[index].userGroupName + ' user group');
                        }

                    });
                }
                if (this.usergroupLis.length !== 0) {
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
                if (user.id !== Utils.getUserId()) {
                    this.userService
                        .updateUser(user.id, user.username, user.roleId, user.projectId, user.branchId, user.modelBranchId, user.settings)
                        .subscribe(result => {
                            console.log('result of update', result);
                        });
                }
            });

    }
    editUsergroup(id) {
        this.selectedUserGroupId = id;
        this.showUGModal = true;
        // this.router.navigate(['/usergroups'], {
        //     queryParams: {
        //         id: id
        //     }
        // });

    }
    editUsergroups(usergroup) {
        const dialog = this.modalDialog
            .confirm()
            .title('Confirmation')
            .body('Are you sure you want to delete this user')
            .okBtn('Yes').okBtnClass('btn btn-danger')
            .cancelBtn('No')
            .open();
        dialog.result.then(promise => {
            this.usergroupService.deleteUsergroup(usergroup.id).subscribe(result => {
                if (result.status === 'OK') {
                    if (usergroup.userGroupName === this.userGroupName) {
                        sessionStorage.clear();
                        window.location.reload();
                    } else {
                        this.getUsergroups();
                    }
                }
            });
        });
    }
    deleteUser(user) {
        const dialog = this.modalDialog
            .confirm()
            .title('Confirmation')
            .body('Are you sure you want to delete this user?')
            .okBtn('Yes').okBtnClass('btn btn-danger')
            .cancelBtn('No')
            .open();
        dialog.result.then(promise => {
            this.userService.deleteUser(user.id).subscribe(result => {
                if (result.status === 'OK') {
                    this.removeUserFromUsergroups(user.id);
                    if (user.username === this.username) {
                        sessionStorage.clear();
                        window.location.reload();
                    } else {
                        this.getUsers();
                    }
                }
            });
        });
    }
    removeUserFromUsergroups(userID) {
        this.usergroupService
            .getUserInUsergroups(userID)
            .subscribe(result => {
                this.usergroupLis = result.data as Array<UserGroup>;
                this.userGroupRolesList = [];
                for (let index = 0; index < this.usergroupLis.length; index++) {
                    this.usergroupLis[index].usersWithAccess.forEach(usergroupUser => {
                        if (userID === usergroupUser.id) {
                            const position = this.usergroupLis[index].usersWithAccess.findIndex(accessUser => accessUser.id === userID);
                            this.usergroupLis[index].usersWithAccess.splice(position, 1);
                        }
                        this.usergroupService
                            .updateUsergroup(this.usergroupLis[index].id, this.usergroupLis[index].userGroupName, this.usergroupLis[index].usersWithAccess, this.usergroupLis[index].roleId)
                            .subscribe(result => {
                                console.log('result of update', result);
                            });
                        this.removeUserFromUsergroupsInProjects(this.usergroupLis[index]);


                    });

                }

            });

    }
    removeUserFromUsergroupsInProjects(usergroup) {
        //TODO: implement
    }
    updateProject(project) {
        console.log('updating proeject: ' + project.title);
        this.projectService
            .updateProject(project)
            .subscribe(project => { });
    }
    onCancel() {
        this.router.navigate(['/home']);
    }


    /**
     * Check to make sure every percentile added is a valid percentage
     * @return true if all percentiles defined in the input string are valid.
     */
    validatePercentiles(): boolean {
        const percentiles: string[] = this.sigma.split(',');
        for (const perc of percentiles) {
            // if one of the percentiles is not a number or is not between 0 and 100
            if (isNaN(Number(perc)) || Number(perc) > 100 || (Number(perc) < 0)) {
                return false;
            }
        }
        return true;
    }

    cancelUGModal() {
        this.showUGModal = false;
        this.selectedUserGroupId = null;
    }

    saveUGModal() {
        this.showUGModal = false;
        this.selectedUserGroupId = null;
        setTimeout(() => { this.getUsergroups(); }, 500);
    }

    cancelUserModal() {
        this.showUserModal = false;
        this.selectedUserId = null;
    }

    saveUserModal() {
        this.getUsers();
        this.selectedUserId = null;
        this.showUserModal = false;
    }
}
