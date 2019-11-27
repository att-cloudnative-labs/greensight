import { Component, OnInit, Output, EventEmitter, Input, OnChanges } from '@angular/core';

@Component({
    selector: 'app-anyone-permission-select',
    templateUrl: './anyone-permission-select.component.html',
    styleUrls: ['./anyone-permission-select.component.css']
})
export class AnyonePermissionSelectComponent implements OnInit, OnChanges {

    @Output() onUpdateAnyonePermission: EventEmitter<any> = new EventEmitter();

    @Input() anyonePermission;

    permissionsList: string[];
    selectedAnyonePermission = 'No Access';

    constructor() { }

    ngOnInit() {
        this.permissionsList = ['No Access', 'Read Only', 'Read/Modify', 'Read/Create/Modify', 'Read/Create/Modify/Delete'];
    }

    ngOnChanges() {
        if (this.anyonePermission) {
            this.selectedAnyonePermission = this.anyonePermission;
        } else { this.selectedAnyonePermission = 'Read Only'; }
    }
    onChangeAnyonePermission() {
        this.onUpdateAnyonePermission.emit(this.selectedAnyonePermission);
    }

}
