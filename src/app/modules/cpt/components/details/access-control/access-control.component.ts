import { Component, OnInit, Input, OnChanges } from '@angular/core';
import { Store, Select } from '@ngxs/store';
import { TreeNode } from '@app/modules/cpt/interfaces/tree-node';
import * as treeActions from '@app/modules/cpt/state/tree.actions';
import { Modal } from 'ngx-modialog-7/plugins/bootstrap';
import { AccessControlRowComponent } from './access-control-row/access-control-row.component';
import { UserGroup } from '@app/modules/cpt/interfaces/user-group';
import { User } from '@app/modules/login/interfaces/user';
import { UsersState } from '@app/modules/cpt/state/users.state';
import { Observable, combineLatest } from 'rxjs';
import { Utils } from '@app/modules/cpt/lib/utils';



@Component({
    selector: 'app-access-control',
    templateUrl: './access-control.component.html',
    styleUrls: ['./access-control.component.css']
})
export class AccessControlComponent implements OnInit, OnChanges {
    @Select(UsersState.users) users$: Observable<User[]>;
    @Select(UsersState.usergroups) usergroups$: Observable<UserGroup[]>;
    @Input() folder: TreeNode;

    users = [];
    usergroups = [];
    accessControls = {};
    permissionsMapToBE = {};
    displayAccess = false;
    permissionsList = [];

    access: string;
    accessControlRows: AccessControlRowComponent[] = [];
    accessType: string;
    ACLList = [] = [];
    anyonePermission: string;
    anyonePermissions = ['READ'];
    // defined to pass the currently added user/ groups name instead of obj to not populate them again in user-picker
    omit: String[] = [];

    constructor(private store: Store,
        private modal: Modal) { }

    ngOnInit() {
        this.accessControls = {
            'PRIVATE': 'Private',
            'PUBLIC_READ_ONLY': 'Public (read only)',
            'PUBLIC_READ_WRITE': 'Public (read/write)'
        };
        // TODO: add all key/ values to support 'own' included permissions
        this.permissionsMapToBE = {
            'Read Only': ['READ'],
            'Read/Modify': ['READ', 'MODIFY'],
            'Read/Create/Modify': ['READ', 'CREATE', 'MODIFY'],
            'Read/Create/Modify/Delete': ['READ', 'CREATE', 'MODIFY', 'DELETE']
        };
        this.permissionsList = ['Read Only', 'Read/Modify', 'Read/Create/Modify', 'Read/Create/Modify/Delete'/*, 'Read/Create/Modify own', 'Read/Create/Modify own/Delete own'*/];
    }
    ngOnChanges() {
        this.displayAccess = this.folder.ownerName === Utils.getUserName();
        this.anyonePermission = '';
        this.anyonePermissions = ['READ'];
        this.access = '';
        this.accessType = this.folder.accessControl;
        this.accessControlRows = [];

        const CombinedObservables = combineLatest(this.users$, this.usergroups$);
        CombinedObservables.subscribe(
            ([users, usergroup]) => {
                this.users = users;
                this.usergroups = usergroup;
            });

        if (this.folder.acl) {
            for (let index = 0; index < this.folder.acl.length; index++) {
                this.ACLList = this.folder.acl;
                if (this.ACLList[index].type === 'ALL') {
                    this.anyonePermission = this.findCurrentPermissions(this.ACLList[index].permissions);
                    this.anyonePermissions = this.ACLList[index].permissions;
                } else if (this.ACLList[index].type === 'USER') {
                    const accessRow = new AccessControlRowComponent();
                    accessRow.permission = this.findCurrentPermissions(this.ACLList[index].permissions);
                    this.users.forEach(user => {
                        if (user.id === this.ACLList[index].id) {
                            accessRow.user = user.username;
                            this.accessControlRows.push(accessRow);
                        }
                    });
                } else if (this.ACLList[index].type === 'GROUP') {
                    const accessRow = new AccessControlRowComponent();
                    accessRow.permission = this.findCurrentPermissions(this.ACLList[index].permissions);
                    this.usergroups.forEach(usergroup => {
                        if (usergroup.id === this.ACLList[index].id) {
                            accessRow.user = usergroup.userGroupName;
                            this.accessControlRows.push(accessRow);
                        }
                    });
                }
            }
        }
    }
    // TODO: optimize mapping when permissions enum is finalized
    findCurrentPermissions(BE_Permission) {
        if (BE_Permission.toString() === 'READ,CREATE,MODIFY,DELETE') {
            return 'Read/Create/Modify/Delete';
        } else if (BE_Permission.toString() === 'READ,CREATE,MODIFY') {
            return 'Read/Create/Modify';
        } else if (BE_Permission.toString() === 'READ,MODIFY') {
            return 'Read/Modify';
        } else if (BE_Permission.toString() === 'READ') {
            return 'Read Only';
        } else { return 'No Access'; }
    }

    setAccess(access) {
        this.access = access;
    }

    saveAccessChange(folder: TreeNode) {
        if (this.accessType === 'ADVANCED') {
            const updatedFolder = Object.assign({}, folder);
            updatedFolder.acl = [];
            updatedFolder.acl.push({
                'id': '',
                'type': 'ALL',
                'permissions': this.anyonePermissions
            });
            for (let index = 0; index < this.accessControlRows.length; index++) {
                if (this.accessControlRows[index].permissions && this.accessControlRows[index].userId && this.accessControlRows[index].type) {
                    updatedFolder.acl.push({
                        'id': this.accessControlRows[index].userId,
                        'type': this.accessControlRows[index].type,
                        'permissions': this.accessControlRows[index].permissions
                    });
                } else if (this.accessControlRows[index].permission && this.accessControlRows[index].user) {
                    this.users.forEach(usr => {
                        if (usr.username === this.accessControlRows[index].user) {
                            this.accessControlRows[index].userId = usr.id;
                            this.accessControlRows[index].type = 'USER';
                        }
                    });
                    if (this.accessControlRows[index].userId === undefined) {
                        this.usergroups.forEach(usrgroup => {
                            if (usrgroup.userGroupName === this.accessControlRows[index].user) {
                                this.accessControlRows[index].userId = usrgroup.id;
                                this.accessControlRows[index].type = 'GROUP';
                            }
                        });
                    }
                    this.accessControlRows[index].permissions = [];
                    this.mapPermission(this.accessControlRows[index], this.accessControlRows[index].permission);
                    updatedFolder.acl.push({
                        'id': this.accessControlRows[index].userId,
                        'type': this.accessControlRows[index].type,
                        'permissions': this.accessControlRows[index].permissions
                    });
                }
            }
            updatedFolder.accessControl = 'ADVANCED';
            this.store.dispatch(new treeActions.UpdateTreeNode(updatedFolder));

        } else {
            if (folder.accessControl !== 'PRIVATE' && this.access === 'PRIVATE') {
                const updatedFolder = Object.assign({}, folder);
                updatedFolder.accessControl = 'PRIVATE';
                this.anyonePermissions = [];
                updatedFolder.acl = [];
                this.store.dispatch(new treeActions.UpdateTreeNode(updatedFolder));
            } else if (folder.accessControl === 'PRIVATE' && this.access !== undefined && this.access !== 'PRIVATE') {
                if (this.access === 'PUBLIC_READ_ONLY') {
                    const dialog =
                        this.modal
                            .confirm()
                            .title('Warning')
                            .body(`Once a folder is public, anyone can reference or copy its content.
            Even if you decide to change the access back to 'Private' later on,
            anyone who copies or references specific model versions while the folder is public
            will continue to have access to them. Are you sure you want to make this folder public?`)
                            .okBtn('Make public').okBtnClass('btn btn-primary')
                            .cancelBtn('Cancel')
                            .open();
                    dialog.result.then(result => {
                        const updatedFolder = Object.assign({}, folder);
                        updatedFolder.accessControl = 'PUBLIC_READ_ONLY';
                        this.anyonePermissions = [];
                        updatedFolder.acl = [];
                        this.store.dispatch(new treeActions.UpdateTreeNode(updatedFolder));
                    });
                } else if (this.access === 'PUBLIC_READ_WRITE') {
                    const dialog =
                        this.modal
                            .confirm()
                            .title('Warning')
                            .body(`Once a folder is public, anyone can reference or copy its content.
              Even if you decide to change the access back to 'Private' later on,
              anyone who copies or references specific model versions while the folder is public
              will continue to have access to them. Are you sure you want to make this folder public?`)
                            .okBtn('Make public').okBtnClass('btn btn-primary')
                            .cancelBtn('Cancel')
                            .open();
                    dialog.result.then(result => {
                        const updatedFolder = Object.assign({}, folder);
                        updatedFolder.accessControl = 'PUBLIC_READ_WRITE';
                        this.anyonePermissions = [];
                        updatedFolder.acl = [];
                        this.store.dispatch(new treeActions.UpdateTreeNode(updatedFolder));
                    });
                }
            } else if (folder.accessControl !== 'PRIVATE' && this.access !== undefined) {
                if (this.access === 'PUBLIC_READ_ONLY') {
                    const updatedFolder = Object.assign({}, folder);
                    updatedFolder.accessControl = 'PUBLIC_READ_ONLY';
                    this.anyonePermissions = [];
                    updatedFolder.acl = [];
                    this.store.dispatch(new treeActions.UpdateTreeNode(updatedFolder));
                } else if (this.access === 'PUBLIC_READ_WRITE') {
                    const updatedFolder = Object.assign({}, folder);
                    updatedFolder.accessControl = 'PUBLIC_READ_WRITE';
                    this.anyonePermissions = [];
                    updatedFolder.acl = [];
                    this.store.dispatch(new treeActions.UpdateTreeNode(updatedFolder));
                }
            }
        }
    }

    addAccessControlRow() {
        const accessControlRow = new AccessControlRowComponent();
        accessControlRow.permissions = [];
        accessControlRow.permissions.push('READ');
        this.accessControlRows.push(accessControlRow);
        this.omit = this.accessControlRows.map(acr => acr.user);
    }

    updateAnyonePermission(updateAnyonePermission) {
        this.anyonePermissions = [];
        Object.keys(this.permissionsMapToBE).forEach(k => {
            if (updateAnyonePermission === k) {
                this.permissionsMapToBE[k].forEach(str => {
                    this.anyonePermissions.push(str);
                });
                this.anyonePermission = k;
            }
        });
    }

    updateAccessControl(accessContorlRow, selectedUser) {
        this.users.forEach(usr => {
            if (usr.username === selectedUser) {
                accessContorlRow.userId = usr.id;
                accessContorlRow.type = 'USER';
                accessContorlRow.user = selectedUser;
            }
        });
        if (accessContorlRow.userId === undefined) {
            this.usergroups.forEach(usrgroup => {
                if (usrgroup.userGroupName === selectedUser) {
                    accessContorlRow.userId = usrgroup.id;
                    accessContorlRow.type = 'GROUP';
                    accessContorlRow.user = selectedUser;
                }
            });
        }
    }

    updateUserPermission(accessContorlRow, selectedPermission) {
        accessContorlRow.permissions = [];
        this.mapPermission(accessContorlRow, selectedPermission);
    }

    /*  mapping the selected permission to the BE enum pemissions
     * @param accessContorlRow: current accessContorlRow object
     * @param selectedPermission: newly selected permission
    */
    mapPermission(accessContorlRow, selectedPermission) {
        Object.keys(this.permissionsMapToBE).forEach(k => {
            if (selectedPermission === k) {
                this.permissionsMapToBE[k].forEach(str => {
                    accessContorlRow.permissions.push(str);
                });
                accessContorlRow.permission = k;
            }
        });
    }

    removeAccessRow(accessRow) {
        this.accessControlRows.splice(this.accessControlRows.findIndex(acr => acr.user === accessRow.user), 1);
    }
}
