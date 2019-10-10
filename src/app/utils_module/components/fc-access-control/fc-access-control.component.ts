import { Component, OnInit, Input, Output, OnChanges, EventEmitter } from '@angular/core';
import { TreeNode, TreeNodePermission, TreeNodeIdentityType, TreeNodeAccessControlMode, TreeNodeAccessControlListEntry, TreeNodeUserPermissions, mapNodePermissions, mapUserPermissions, accessControlModeNames, mapControlModeNames } from '@app/core_module/interfaces/tree-node';
import * as treeActions from '@system-models/state/tree.actions';
import { Modal } from 'ngx-modialog/plugins/bootstrap';
import { ForecastAccessControlRowComponent } from './fc-access-control-row/fc-access-control-row.component';
import { UserGroup } from '@app/core_module/interfaces/user-group';
import { User } from '@app/core_module/interfaces/user';
import { Observable, combineLatest } from 'rxjs';
import { Utils } from '@app/utils_module/utils';
import { UserService } from '@app/core_module/service/user.service';
import { UserGroupService } from '@app/core_module/service/usergroup.service';


@Component({
    selector: 'fc-access-control',
    templateUrl: './fc-access-control.component.html',
    styleUrls: ['./fc-access-control.component.css']
})
export class ForecastAccessControlComponent implements OnInit, OnChanges {

    users$: Observable<User[]>;
    usergroups$: Observable<UserGroup[]>;

    @Input() node: TreeNode;
    @Output() onUpdatedAccessControl: EventEmitter<{ mode: TreeNodeAccessControlMode, permissions: TreeNodeAccessControlListEntry[] }> = new EventEmitter();


    users = [];
    usergroups = [];

    controlModeNames = mapControlModeNames;

    availableAccessControlModes: TreeNodeAccessControlMode[] = ['PRIVATE', 'PUBLIC_READ_ONLY', 'PUBLIC_READ_WRITE', 'ADVANCED'];
    accessControlMode: TreeNodeAccessControlMode;
    displayAccess = false;

    anyonePermissions: TreeNodeUserPermissions = 'Read Only';

    entityAclEntries: TreeNodeAccessControlListEntry[] = [];
    private allAclEntry: TreeNodeAccessControlListEntry;


    // defined to pass the currently added user/ groups name instead of obj to not populate them again in user-picker
    omit: string[] = [];

    constructor(
        private modal: Modal,
        private userService: UserService,
        private userGroupService: UserGroupService) { }

    ngOnInit() {
        this.users$ = this.userService.getUsers().map(response => response.data);
        this.usergroups$ = this.userGroupService.getUserGroup().map(response => response.data);
        const nodeAclEntries = this.node.acl ? this.node.acl as TreeNodeAccessControlListEntry[] : [];
        this.entityAclEntries = nodeAclEntries.filter(e => e.type !== 'ALL');
        const allAclEntry = nodeAclEntries.filter(e => e.type === 'ALL');
        if (allAclEntry.length) {
            this.allAclEntry = allAclEntry[0];
        } else {
            this.allAclEntry = { id: null, type: 'ALL', permissions: ['READ'] };
        }
        this.anyonePermissions = mapNodePermissions(this.allAclEntry.permissions);
        this.omit = this.entityAclEntries.map(e => e.id);
        this.accessControlMode = this.node.accessControl as TreeNodeAccessControlMode;
        // this is totally bonkers
        // but the underlying project-list/table-view is as well
        this.updateAndEmit();
    }
    ngOnChanges() {
        this.displayAccess = this.node.ownerId === Utils.getUserId();
    }
    private updateAndEmit() {
        this.omit = this.entityAclEntries.map(e => e.id);
        this.onUpdatedAccessControl.emit({ mode: this.accessControlMode, permissions: [...this.entityAclEntries.filter(e => e.id), this.allAclEntry] });
    }


    addAccessControlRow() {
        this.entityAclEntries.push({ id: null, type: null, permissions: ['READ'] });
    }

    updateAnyonePermissions(anyonePermissions: TreeNodeUserPermissions) {
        this.allAclEntry.permissions = mapUserPermissions(anyonePermissions);
        this.updateAndEmit();
    }

    setAccessControlMode(mode: TreeNodeAccessControlMode) {
        this.accessControlMode = mode;
        this.updateAndEmit();

    }

    updateAccessControlEntry(entry: TreeNodeAccessControlListEntry) {
        this.updateAndEmit();

    }

    removeAccessRow(entryId: string) {
        this.entityAclEntries = this.entityAclEntries.filter(e => e.id !== entryId);
        this.updateAndEmit();
    }
}
