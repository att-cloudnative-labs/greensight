import { Component, OnInit, Output, EventEmitter, Input, OnChanges } from '@angular/core';

@Component({
    selector: 'app-permission-select',
    templateUrl: './permission-select.component.html',
    styleUrls: ['./permission-select.component.css']
})
export class PermissionSelectComponent implements OnInit, OnChanges {

    @Output() onUpdatePermission: EventEmitter<any> = new EventEmitter();
    @Input() permission;

    permissionsList: string[];
    selectedPermission = 'Read Only';

    constructor() { }

    ngOnInit() {
        this.permissionsList = ['Read Only', 'Read/Modify', 'Read/Create/Modify', 'Read/Create/Modify/Delete'];
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
