import { Component, EventEmitter, Input, HostBinding, Output, ElementRef, ViewChild, OnInit } from '@angular/core';
import { Highlightable } from '@angular/cdk/a11y';
import { Observable, combineLatest } from 'rxjs';
import { Select } from '@ngxs/store';
import { UserGroup } from '@app/core_module/interfaces/user-group';
import { User } from '@app/core_module/interfaces/user';
import { UsersState } from '@system-models/state/users.state';
import { TreeNodeAccessControlListEntry } from '@app/core_module/interfaces/tree-node';

@Component({
    selector: '[fc-user-picker-search]',
    templateUrl: './fc-user-picker-search.component.html',
    styleUrls: ['./fc-user-picker-search.component.css']
})
export class ForecastUserPickerSearchComponent implements Highlightable, OnInit {

    @Input() user: TreeNodeAccessControlListEntry;
    @Output() userSelected: EventEmitter<TreeNodeAccessControlListEntry> = new EventEmitter();
    @ViewChild('userElement') userElement: ElementRef;

    private _isActive = false;

    ngOnInit() {
    }
    @HostBinding('class.active') get isActive() {
        return this._isActive;
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
