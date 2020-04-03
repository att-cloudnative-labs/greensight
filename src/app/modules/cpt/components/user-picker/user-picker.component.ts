import { Component, OnInit, Output, EventEmitter, Input, OnChanges, AfterViewInit, ViewChildren, QueryList } from '@angular/core';
import { Utils } from '@app/modules/cpt/lib/utils';
import { Select } from '@ngxs/store';
import { UserGroup } from '@app/modules/cpt/interfaces/user-group';
import { User } from '@app/modules/login/interfaces/user';
import { UsersState } from '@app/modules/cpt/state/users.state';
import { Observable, combineLatest } from 'rxjs';
import { ActiveDescendantKeyManager } from '@angular/cdk/a11y';
import { UserPickerSearchComponent } from './user-picker-search/user-picker-search.component';
import { ENTER, UP_ARROW, DOWN_ARROW } from '@angular/cdk/keycodes';
import * as Sifter from 'sifter';


@Component({
    selector: 'app-user-picker',
    templateUrl: './user-picker.component.html',
    styleUrls: ['./user-picker.component.css']
})
export class UserPickerComponent implements OnInit, OnChanges, AfterViewInit {
    @Select(UsersState.users) users$: Observable<User[]>;
    @Select(UsersState.usergroups) usergroups$: Observable<UserGroup[]>;

    @Output() onUpdateUserAccess: EventEmitter<any> = new EventEmitter();
    @Output() resultSelected = new EventEmitter();
    @Input() user: string;
    // list of already added users/ groups names so to remove them from users/ groups and not display them again
    @Input() omit: String[];
    @ViewChildren(UserPickerSearchComponent) items: QueryList<UserPickerSearchComponent>;


    users = [];
    usergroups = [];
    selectedUser = '';
    loaded = false;
    addedUsers = [];
    searchResult = '';
    showSearchResults = false;
    usersList = [];
    usersAndUsergroups = [];
    keyManager: ActiveDescendantKeyManager<UserPickerSearchComponent>;


    constructor() { }

    ngAfterViewInit() {
        this.keyManager = new ActiveDescendantKeyManager(this.items).withWrap();
    }

    ngOnInit() {
        this.loaded = false;
        const CombinedObservables = combineLatest(this.users$, this.usergroups$);
        CombinedObservables.subscribe(
            ([users, usergroup]) => {
                this.users = users.filter((user) => (user.id !== Utils.getUserId()) && (!this.omit.includes(user.username)));
                this.usergroups = usergroup.filter((usergroup) => !this.omit.includes(usergroup.userGroupName));
                this.usersAndUsergroups = [...this.users, ...this.usergroups];
            });
        this.loaded = true;
    }

    ngOnChanges() {
        this.selectedUser = this.user;
        this.addedUsers.splice(this.addedUsers.indexOf(undefined), 1);
        this.addedUsers.push(this.user);
    }

    updateAccess(event) {
        this.selectedUser = event.userGroupName ? event.userGroupName : event.username;
        this.onUpdateUserAccess.emit(this.selectedUser);
    }

    navigateList(event) {
        if (event.keyCode === ENTER && this.keyManager.activeItem) {
            this.selectedUser = this.keyManager.activeItem.user.username ? this.keyManager.activeItem.user.username : this.keyManager.activeItem.user.userGroupName;
            this.onUpdateUserAccess.emit(this.selectedUser);
            this.closeList();
        } else if (event.keyCode === UP_ARROW || event.keyCode === DOWN_ARROW) {
            this.keyManager.onKeydown(event);
            this.keyManager.activeItem.userElement.nativeElement.scrollIntoView({ block: 'nearest' });
        }
    }

    closeList() {
        this.showSearchResults = false;
        this.usersList = [];
    }

    searchUsers(event) {
        if (event.keyCode !== ENTER && event.keyCode !== DOWN_ARROW && event.keyCode !== UP_ARROW) {
            this.showSearchResults = true;
            const sifter = new Sifter(this.usersAndUsergroups);
            const sifterResults = sifter.search(this.searchResult, {
                fields: ['username', 'userGroupName'],
                sortUsers: [{ field: 'username', direction: 'asc' }],
                sortUsergroups: [{ field: 'userGroupName', direction: 'asc' }],
            });
            this.usersList = sifterResults.items.map(item => {
                return this.usersAndUsergroups[item.id];
            });
            setTimeout(() => this.keyManager.setFirstItemActive(), 0);
        }
    }
}
