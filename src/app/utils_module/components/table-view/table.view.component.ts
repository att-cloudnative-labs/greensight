import { Component, OnInit, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit, AfterViewChecked, OnChanges } from '@angular/core';
import { UserService } from '../../../core_module/service/user.service';
import { UserGroupService } from '../../../core_module/service/usergroup.service';
import { TableViewHeader } from '../../interfaces/tableview-header';
import { TableViewRow } from '../../interfaces/tableview-row';
import { Utils } from '../../utils';
import { User } from '../../../core_module/interfaces/user';
import { UserGroup } from '../../../core_module/interfaces/user-group';
import { Modal } from 'ngx-modialog/plugins/bootstrap';
import { Router } from '@angular/router';
import { TreeNode, TreeNodePermission, TreeNodeIdentityType, TreeNodeAccessControlMode, TreeNodeAccessControlListEntry } from '@app/core_module/interfaces/tree-node';


@Component({
    selector: 'table-view',
    templateUrl: './table.view.component.html',
    styleUrls: ['./table.view.component.css']
})

export class TableViewComponent implements OnInit, AfterViewChecked, AfterViewInit, OnChanges {
    @ViewChild('projectName') projectNameElement: ElementRef;
    @Input('cols') cols: TableViewHeader[] = Array<TableViewHeader>();
    @Input('delete-required') deleteRequired = true;
    @Input('edit-required') editRequired = true;
    // determine if the input row needs to be seen when first initialized
    @Input('show-inputRow') showInputRow = false;
    @Input('viewBranch-required') viewBranchRequired = false;
    @Input('viewModel-required') viewModelRequired = false;
    @Output('row-selected') rowSelected = new EventEmitter();
    // indicates when a table row is in edit mode
    @Output('row-begin-edit') rowBeginEdit = new EventEmitter();
    // indicates when a row has been edited and save is clicked
    @Output('row-edited') rowEdited: EventEmitter<TableViewRow> = new EventEmitter();
    // indicates when a row is to be deleted
    @Output('row-deleted') rowDeleted = new EventEmitter();
    @Output('row-added') rowAdded = new EventEmitter();
    @Output('row-viewBranches') rowViewBranches = new EventEmitter();
    @Output('row-viewModel') rowViewModel = new EventEmitter();
    @Input('extra-buttons') extraButtons = [];
    @Input('rows') set rows(rows: TableViewRow[]) {
        this.originalRows = rows;
        this.filteredRows = rows;
    }
    @Input('location') location = '';
    @Input('selectedProjectId') selectedProjectId = '';

    // indicates when we and to show the row which lets users insert data
    addRowMode = false;
    // indicates when we and to show editibale version of a particular row
    editRowID = null;
    editedRow: any = {};
    newRow: any = {};

    // for filtering
    originalRows: TableViewRow[];
    filteredRows: TableViewRow[];
    filterCols = [];
    userRole: String;
    usersWithAccess = [];
    userList: User[];

    // users:User[];
    // users = [];
    userGroups: UserGroup[];
    filterUser: String = '';
    filterUserGroup: String = '';
    filteredUsers: User[];
    filteredUserGroups: UserGroup[];
    // the list of users which currently have access to the data content in the row
    checkedUsers: User[] = [];
    // the user groups which currently have access to the data content in the row
    checkedUserGroups: UserGroup[] = [];

    ownerId: String = Utils.getUserId();
    ownerName = Utils.getUserName();
    loggedInUser: User = null;

    privateStatus: Boolean = false;

    isSingleClick = false;

    constructor(
        private modal: Modal,
        private userService: UserService,
        private userGroupService: UserGroupService,
        private router: Router) { }

    /**
     * enable/disable the visibility of input row whenever the external input changes
     */
    ngOnChanges() {
        this.addRowMode = this.showInputRow;
    }

    ngAfterViewChecked() {
        // if in add mode, scroll to the bottom
        if (this.addRowMode) {
            $('#overflow-container').scrollTop($('#overflow-container')[0].scrollHeight);
        }
    }

    ngAfterViewInit() {
        if (this.addRowMode) {
            this.projectNameElement.nativeElement.focus();
        }
    }

    ngOnInit() {
        this.generateGenericObject();
        const roles = Utils.roles;

        this.userService.getLoggedInUser().subscribe(result => {
            if (result.status === 'OK') {
                const userData = result.data;
                roles.forEach(role => {
                    if (userData.role === role.id) {
                        this.userRole = role.roleName;
                    }
                });

            }
        });

        this.userService.getUsers().subscribe(result => {
            if (result.status === 'OK') {
                this.userList = result.data;
            }
        });

        this.userGroupService.getUserGroup().subscribe(result => {
            if (result.status === 'OK') {
                this.userGroups = result.data;
            }
        });

        for (let index = 0; index < this.cols.length; index++) {
            this.filterCols[index] = '';
        }
    }

    /**
     * Populates the field of the generic object using the columns sent to the table
     * from the parent component
     */
    generateGenericObject() {
        for (const col of this.cols) {
            const tempTitle = (col.title).toString();
            this.newRow[tempTitle] = '';
        }
    }

    onRowSelected(event, id) {
        event.preventDefault();
        this.rowSelected.emit(id);
    }

    onClick(row) {
        if (this.editRowID !== row.id) {
            this.isSingleClick = true;
            setTimeout(() => {
                if (this.isSingleClick) {
                    if (!row.isPrivate || this.getUserAccess(row.usersWithAccess)) {
                        this.rowSelected.emit(row.id);
                    } else {
                        this.modal.alert()
                            .title('Unauthorized!')
                            .body('You do not have permission to view this ' + this.location + '.')
                            .open();
                    }
                }
            }, 300);
        }
    }

    onDoubleClick(row) {
        if (!row.isPrivate || this.getUserAccess(row.usersWithAccess)) {
            if (this.editRowID !== row.id) {
                this.isSingleClick = false;
                this.onEditRow(row);
            }
        } else {
            this.isSingleClick = false;
            this.modal.alert()
                .title('Unauthorized!')
                .body('You do not have permission to edit this ' + this.location + '.')
                .open();
        }
    }

    /**
     * Signals that a row within the table is to be deleted
     * @param id the id of the object displayed in the row to be deleted
     */
    onDeleteRow(id: string) {
        this.rowDeleted.emit(id);
    }

    /**
     * Puts a specified row into edit mode and signal that the row is now in an editable state
     * @param row the display row that will changed into a row containing input fields
     */
    onEditRow(row) {
        this.onClearInputRow();
        this.rowBeginEdit.emit(row.id);
        this.editedRow = row;
        this.editRowID = row.id;
        // set up the edited row object
        this.editedRow.id = row.id;
        // get the current values of each column
        for (const col of row.columns) {
            this.editedRow[col.columnName] = col.value;
        }
    }

    onViewBranchRow(id) {
        this.rowViewBranches.emit(id);
    }

    onViewModelRow(id) {
        this.rowViewModel.emit(id);
    }

    /**
     * Sets the table into 'Add Row Mode'
     */
    onAddRow() {
        // turn any rows that are in edit mode back to their display modes
        if (this.editRowID != null) {
            this.exitEditMode();
        }
        this.addRowMode = true;
        setTimeout(() => { this.projectNameElement.nativeElement.focus(); }, 500);
    }

    isNotAdmin() {
        if (Utils.getUserRoleId() !== 'ADMIN') {
            return true;
        } else {
            return false;
        }
    }

    /**
     * Indicates that the data currently in the input row is to be added to the table as a new row
     */
    onSaveNewRow() {
        this.newRow.ownerName = this.ownerName;
        this.rowAdded.emit(this.newRow);
    }

    /**
     * Removes all the data currently in the input fields of the input row and turns of 'Add Row Mode'
     */
    onClearInputRow() {
        this.addRowMode = false;
        delete this.newRow['usersWithAccess'];
        delete this.newRow['userGroups'];
        this.generateGenericObject();
        this.onClearRestrictionFields();
    }

    /**
     * Indicates that a row is to be updated with the new data
     */
    onSaveRowChanges() {
        this.rowEdited.emit(this.editedRow);
    }

    exitEditMode() {
        this.editRowID = null;
        delete this.editedRow['usersWithAccess'];
        delete this.editedRow['userGroups'];
        this.onClearRestrictionFields();
    }

    onClearRestrictionFields() {
        this.privateStatus = false;
        this.filteredUsers = [];
        this.filteredUserGroups = [];
        this.filterUser = '';
        this.filterUserGroup = '';
        this.checkedUsers = [];
        this.checkedUserGroups = [];
    }

    getUserAccess(users) {
        let hasAccess = false;
        users.forEach(user => {
            if (Utils.getUserId() === user.id) {
                hasAccess = true;
            }
        });
        return hasAccess;
    }

    setPrivateStatus() {
        // if in edit mode
        if (this.editRowID !== null) {
            this.privateStatus = !this.privateStatus;
        } else {
            // add mode
            this.privateStatus = !this.privateStatus;
            this.newRow['isPrivate'] = this.privateStatus;
        }

    }

    renderModal() {
        this.filteredUsers = [];
        this.filteredUsers = this.checkedUsers;
        this.filteredUserGroups = this.checkedUserGroups;
    }

    isChecked(value, location) {
        if (location === 'user') {
            for (const user of this.checkedUsers) {
                if (user === value) {
                    return true;
                }
            }
            return false;
        } else if (location === 'userGroup') {
            for (const group of this.checkedUserGroups) {
                if (group === value) {
                    return true;
                }
            }
            return false;
        }
    }

    setAccess(event, location, value) {
        let target = '';
        let row = {};
        if (this.addRowMode) {
            row = this.newRow;
        } else {
            row = this.editedRow;
        }

        if (location === 'user') { target = 'usersWithAccess'; } else if (location === 'userGroup') { target = 'userGroups'; }

        if (event.target.checked) {
            if (row[target] == null) {
                row[target] = [];
            }
            row[target].push(value);

            if (location === 'user') {
                this.checkedUsers.push(value);
            } else if (location === 'userGroup') {
                this.checkedUserGroups.push(value);
            }
        } else {
            let index = row[target].findIndex(x => x === value);
            row[target].splice(index, 1);


            if (location === 'user') {
                index = this.checkedUsers.findIndex(x => x === value);
                this.checkedUsers.splice(index, 1);
            } else if (location === 'userGroup') {
                index = this.checkedUserGroups.findIndex(x => x === value);
                this.checkedUserGroups.splice(index, 1);
            }
        }
    }

    filterResult(event, col) {
        let push = false;

        if (col instanceof TableViewHeader) {
            for (let index = 0; index < this.cols.length; index++) {
                if (index === this.cols.indexOf(col)) {
                    this.filterCols[index] = event.target.value;
                }
            }
            this.filteredRows = new Array<TableViewRow>();
            this.originalRows.forEach(row => {
                for (let index = 0; index < row.columns.length; index++) {
                    if (row.columns[index].value !== undefined && row.columns[index].value.toLowerCase().indexOf(this.filterCols[index].toLowerCase()) >= 0) {
                        push = true;
                    } else {
                        push = false;
                        break;
                    }
                }
                if (push === true) {
                    this.filteredRows.push(row);
                }

            });
        } else {
            if (col === 'users') {
                this.filteredUsers = [];
                if (event.target.value !== '') {
                    this.userList.forEach(user => {
                        if (user.username !== undefined && user.username.toLowerCase().indexOf(event.target.value.toLowerCase()) >= 0) {
                            this.filteredUsers.push(user);
                        }
                    });

                    for (const checkedUser of this.checkedUsers) {
                        const index = this.filteredUsers.findIndex(x => x === checkedUser);
                        if (index === -1) {
                            this.filteredUsers.push(checkedUser);
                        }
                    }
                } else {
                    for (const checkedUser of this.checkedUsers) {
                        const index = this.filteredUsers.findIndex(x => x === checkedUser);
                        if (index === -1) {
                            this.filteredUsers.push(checkedUser);
                        }
                    }
                }
            } else if (col === 'userGroups') {
                this.filteredUserGroups = [];
                if (event.target.value !== '') {
                    this.userGroups.forEach(group => {
                        if (group.userGroupName !== undefined && group.userGroupName.toLowerCase().indexOf(event.target.value.toLowerCase()) >= 0) {
                            this.filteredUserGroups.push(group);
                        }
                    });

                    for (const checkedUserGroup of this.checkedUserGroups) {
                        const index = this.filteredUserGroups.findIndex(x => x === checkedUserGroup);
                        if (index === -1) {
                            this.filteredUserGroups.push(checkedUserGroup);
                        }
                    }
                } else {
                    for (const checkedUserGroup of this.checkedUserGroups) {
                        const index = this.filteredUserGroups.findIndex(x => x === checkedUserGroup);
                        if (index === -1) {
                            this.filteredUserGroups.push(checkedUserGroup);
                        }
                    }
                }
            }
        }
    }

    updateRowAccessControl(row: TableViewRow, racl: { mode: TreeNodeAccessControlMode, permissions: TreeNodeAccessControlListEntry[] }) {
        console.log('updated tree acl:', racl);
        row.setAccessControlMode(racl.mode);
        row.setAccessControlPermissions(racl.permissions);
        this.editedRow.mode = racl.mode;
        this.editedRow.permissions = racl.permissions;

    }

    continueModal() {
        if (this.filteredUsers == null && this.filteredUserGroups == null) { this.setPrivateStatus(); }
        this.filterUser = '';
        this.filterUserGroup = '';
    }

    cancelModal() {
        this.filteredUsers = [];
        this.filteredUserGroups = [];
        this.filterUser = '';
        this.filterUserGroup = '';
        delete this.newRow['usersWithAccess'];
        delete this.newRow['userGroups'];
        if (this.addRowMode) {
            this.setPrivateStatus();
        }
    }

    onChangeOwnerProject(row) {
        this.editedRow.id = row.id;
        for (const col of row.columns) {
            this.editedRow[col.columnName] = col.value;
        }
        this.rowEdited.emit(this.editedRow);
    }
}
