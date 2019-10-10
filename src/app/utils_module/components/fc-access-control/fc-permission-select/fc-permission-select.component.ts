import { Component, OnInit, Output, EventEmitter, Input, OnChanges } from '@angular/core';
import { TreeNode, TreeNodeUserPermissions, TreeNodeIdentityType, TreeNodeAccessControlMode } from '@app/core_module/interfaces/tree-node';

@Component({
    selector: 'fc-permission-select',
    templateUrl: './fc-permission-select.component.html',
    styleUrls: ['./fc-permission-select.component.css']
})
export class ForecastPermissionSelectComponent implements OnInit, OnChanges {

    @Output() onUpdatePermission: EventEmitter<TreeNodeUserPermissions> = new EventEmitter();
    @Input() permission: TreeNodeUserPermissions;
    @Input() showNoAccess: boolean;

    permissionsList: TreeNodeUserPermissions[];
    selectedPermission: TreeNodeUserPermissions = 'Read Only';

    constructor() { }

    ngOnInit() {
        this.permissionsList = ['Read Only', 'Read/Modify', 'Read/Create/Modify', 'Read/Create/Modify/Delete'];
        if (this.showNoAccess) {
            this.permissionsList = ['No Access', ...this.permissionsList];
        }
    }

    ngOnChanges() {
        if (this.permission) {
            this.selectedPermission = this.permission;
        } else {
            this.permission = 'Read Only';
        }
    }
    onChangePermission() {
        this.onUpdatePermission.emit(this.selectedPermission);
    }
}
