import { Component, OnInit, Output, EventEmitter, Input, OnChanges, AfterViewInit, ViewChildren, QueryList, ChangeDetectorRef } from '@angular/core';
import { Utils } from '@app/utils_module/utils';
import { UserGroup } from '@app/core_module/interfaces/user-group';
import { User } from '@app/core_module/interfaces/user';
import { UsersState } from '@system-models/state/users.state';
import { Observable, combineLatest, BehaviorSubject } from 'rxjs';
import { ActiveDescendantKeyManager } from '@angular/cdk/a11y';
import { ForecastUserPickerSearchComponent } from './fc-user-picker-search/fc-user-picker-search.component';
import { ENTER, UP_ARROW, DOWN_ARROW } from '@angular/cdk/keycodes';
import * as Sifter from 'sifter';
import { TreeNodeIdentityType, TreeNode, TreeNodeAccessControlListEntry } from '@app/core_module/interfaces/tree-node';


@Component({
    selector: 'fc-user-picker',
    templateUrl: './fc-user-picker.component.html',
    styleUrls: ['./fc-user-picker.component.css']
})
export class ForecastUserPickerComponent implements OnInit, OnChanges, AfterViewInit {
    @Input() users$: Observable<User[]>;
    @Input() usergroups$: Observable<UserGroup[]>;

    @Output() onUpdateUser: EventEmitter<TreeNodeAccessControlListEntry> = new EventEmitter();
    @Input() user: TreeNodeAccessControlListEntry;
    // list of already added users/ groups names so to remove them from users/ groups and not display them again
    @Input() omit: String[];
    @ViewChildren(ForecastUserPickerSearchComponent) items: QueryList<ForecastUserPickerSearchComponent>;


    users = [];
    usergroups = [];
    searchResult = '';
    usersList = [];
    usersAndUsergroups = [];
    keyManager: ActiveDescendantKeyManager<ForecastUserPickerSearchComponent>;
    showSearchResults: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    showSearchResults$: Observable<boolean> = this.showSearchResults.asObservable();

    constructor(private changeDetector: ChangeDetectorRef) { }

    ngAfterViewInit() {
        this.keyManager = new ActiveDescendantKeyManager(this.items).withWrap();
    }

    ngOnInit() {
        combineLatest(this.users$, this.usergroups$).subscribe(
            ([users, usergroup]) => {
                this.users = users.filter((user) => (user.id !== Utils.getUserId()) && (!this.omit.includes(user.id)));
                const userEntries: TreeNodeAccessControlListEntry[] = this.users.map(u => { const e: TreeNodeAccessControlListEntry = { id: u.id, name: u.username, type: 'USER', permissions: [] }; return e; });
                this.usergroups = usergroup.filter((usergroup) => !this.omit.includes(usergroup.id));
                const userGroupEntries: TreeNodeAccessControlListEntry[] = this.usergroups.map(u => { const e: TreeNodeAccessControlListEntry = { id: u.id, name: u.userGroupName, type: 'GROUP', permissions: [] }; return e; });

                this.usersAndUsergroups = [...userEntries, ...userGroupEntries];
            });
    }

    ngOnChanges() {
    }

    updateUser(entry: TreeNodeAccessControlListEntry) {
        this.user = entry;
        this.onUpdateUser.emit(entry);
        this.closeList();
    }

    navigateList(event) {
        if (event.keyCode === ENTER && this.keyManager.activeItem) {
            this.user = this.keyManager.activeItem.user;
            this.onUpdateUser.emit(this.user);
            this.closeList();
        } else if (event.keyCode === UP_ARROW || event.keyCode === DOWN_ARROW) {
            this.keyManager.onKeydown(event);
            this.keyManager.activeItem.userElement.nativeElement.scrollIntoView({ block: 'nearest' });
        }
    }

    closeList() {
        this.showSearchResults.next(false);
        this.usersList = [];
    }

    searchUsers(event) {
        if (event.keyCode !== ENTER && event.keyCode !== DOWN_ARROW && event.keyCode !== UP_ARROW) {
            this.showSearchResults.next(true);
            const sifter = new Sifter(this.usersAndUsergroups);
            const sifterResults = sifter.search(this.searchResult, {
                fields: ['name'],
                sortUsers: [{ field: 'namer', direction: 'asc' }]
            });
            this.usersList = sifterResults.items.map(item => {
                return this.usersAndUsergroups[item.id];
            });
            setTimeout(() => this.keyManager.setFirstItemActive(), 0);
        }
    }
}
