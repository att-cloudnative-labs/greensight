import { Component, OnDestroy, OnInit } from '@angular/core';
import { DockableInputNotification } from '@cpt/interfaces/dockable';
import { Select } from '@ngxs/store';
import { Observable } from 'rxjs';
import { UsersState } from '@cpt/state/users.state';

@Component({
    selector: 'settings-editor',
    templateUrl: './settings-editor.component.html',
    styleUrls: ['./settings-editor.component.css']
})
export class SettingsEditorComponent implements OnInit, OnDestroy, DockableInputNotification {
    @Select(UsersState.currentUserIsAdmin) currentUserIsAdmin$: Observable<boolean>;

    ngOnDestroy(): void {
    }

    ngOnInit(): void {
    }

    enableUserInput() {

    }

    disableUserInput() {

    }

}
