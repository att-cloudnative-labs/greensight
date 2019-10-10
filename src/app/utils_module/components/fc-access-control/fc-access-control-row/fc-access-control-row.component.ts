import { Component, OnInit, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '@app/core_module/interfaces/user';
import { UserGroup } from '@app/core_module/interfaces/user-group';
import { TreeNodePermission, TreeNodeUserPermissions, TreeNodeAccessControlListEntry, mapUserPermissions, mapNodePermissions } from '@app/core_module/interfaces/tree-node';



@Component({
    selector: 'fc-access-control-row',
    templateUrl: './fc-access-control-row.component.html',
    styleUrls: ['./fc-access-control-row.component.css']
})
export class ForecastAccessControlRowComponent implements OnInit, OnChanges {

    @Output() onUpdateAccessControl: EventEmitter<TreeNodeAccessControlListEntry> = new EventEmitter();
    @Output() onRemoveAccess: EventEmitter<string> = new EventEmitter();

    @Input() aclEntry: TreeNodeAccessControlListEntry;
    // list of already added users/ groups names to ACL and remove them from new user-picker dropdown
    @Input() omit: string[];
    @Input() users$: Observable<User[]>;
    @Input() usergroups$: Observable<UserGroup[]>;

    userPermission: TreeNodeUserPermissions;


    constructor() { }

    ngOnInit() {
    }
    ngOnChanges() {
        if (this.aclEntry.permissions) {
            this.userPermission = mapNodePermissions(this.aclEntry.permissions);
        }
    }


    updateEntity(entity: TreeNodeAccessControlListEntry) {
        this.aclEntry.id = entity.id;
        this.aclEntry.name = entity.name;
        this.aclEntry.type = entity.type;
        this.onUpdateAccessControl.emit(this.aclEntry);
    }

    updatePermission(newPermission: TreeNodeUserPermissions) {
        this.aclEntry.permissions = mapUserPermissions(newPermission);
        this.onUpdateAccessControl.emit(this.aclEntry);
    }



    removeAccess() {
        this.onRemoveAccess.emit(this.aclEntry.id);
    }
}
