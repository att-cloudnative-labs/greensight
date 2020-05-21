import { Component, OnDestroy, OnInit } from '@angular/core';
import { Select } from '@ngxs/store';
import { SettingsState, SettingsStateModel } from '@cpt/state/settings.state';
import { Observable } from 'rxjs';


@Component({
    selector: 'version-info',
    templateUrl: './version-info.component.html',
    styleUrls: ['./version-info.component.css']
})
export class VersionInfoComponent {
    @Select(SettingsState) versionInfo$: Observable<SettingsStateModel>;

}
