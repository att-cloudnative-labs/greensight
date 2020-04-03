import { Component, OnInit, Input, Output, EventEmitter, OnChanges } from '@angular/core';

@Component({
    selector: 'app-access-control-row',
    templateUrl: './access-control-row.component.html',
    styleUrls: ['./access-control-row.component.css']
})
export class AccessControlRowComponent implements OnInit, OnChanges {

    @Output() onUpdateAccessRow: EventEmitter<any> = new EventEmitter();
    @Output() onUpdatePermission: EventEmitter<any> = new EventEmitter();
    @Output() onRemoveAccess: EventEmitter<any> = new EventEmitter();

    parentId: string;
    @Input() user: String;
    @Input() permission: string;
    // list of already added users/ groups names to ACL and remove them from new user-picker dropdown
    @Input() omit: string[];


    selectedUser: String;
    selectedPermission: string;

    userId: String;
    type: string;
    permissions: string[];


    constructor() { }

    ngOnInit() {
    }
    ngOnChanges() {
        if (this.user) {
            this.selectedUser = this.user;
        }
        if (this.permission) { this.selectedPermission = this.permission; }
    }
    updateUserAccess(event) {
        this.onUpdateAccessRow.emit(event);
    }

    updatePermission(event) {
        this.onUpdatePermission.emit(event);
    }

    removeAccess() {
        this.onRemoveAccess.emit();
    }
}
