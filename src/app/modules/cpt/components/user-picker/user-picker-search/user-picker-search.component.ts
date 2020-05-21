import { Component, EventEmitter, Input, HostBinding, Output, ElementRef, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { Highlightable } from '@angular/cdk/a11y';
import { Observable, combineLatest } from 'rxjs';
import { Select } from '@ngxs/store';
import { UserGroup } from '@app/modules/cpt/interfaces/user-group';
import { User } from '@cpt/interfaces/user';
import { UsersState } from '@app/modules/cpt/state/users.state';

@Component({
    selector: '[app-user-picker-search]',
    templateUrl: './user-picker-search.component.html',
    styleUrls: ['./user-picker-search.component.css']
})
export class UserPickerSearchComponent implements Highlightable, OnInit, OnDestroy {

    @Select(UsersState.users) users$: Observable<User[]>;
    @Select(UsersState.usergroups) usergroups$: Observable<UserGroup[]>;
    @Input() user;
    @Output() userSelected = new EventEmitter();
    @ViewChild('userElement', { static: false }) userElement: ElementRef;

    users = [];
    usergroups = [];

    private _isActive = false;

    ngOnInit() {
        const CombinedObservables = combineLatest(this.users$, this.usergroups$);
        CombinedObservables.subscribe(
            ([users, usergroup]) => {
                this.users = users;
                this.usergroups = usergroup;
            });
    }

    ngOnDestroy(): void {
        //Called once, before the instance is destroyed.
        //Add 'implements OnDestroy' to the class.
    }

    @HostBinding('class.active') get isActive() {
        return this._isActive;
    }

    get isUsergroup() {
        return (this.user.userGroupName !== undefined || this.usergroups.find(u => u.userGroupName === this.user) !== undefined);
    }

    get isUser() {
        return (this.user.username !== undefined || this.users.find(u => u.username === this.user) !== undefined);
    }

    setActiveStyles() {
        this._isActive = true;
    }

    setInactiveStyles() {
        this._isActive = false;
    }

    selectUser() {
        this.userSelected.emit(this.user);
    }

}
