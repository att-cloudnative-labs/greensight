import { Routes, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';

import { ProjectListComponent } from './components/projects/project.list.component';
import { BranchListComponent } from './components/branches/branches-list.component';
import { SettingsComponent } from './components/settings/settings.component';
import { UsersComponent } from './components/users/users.component';
import { UsergroupsComponent } from './components/usergroups/usergroups.component';
import { HomeComponent } from './components/home/home.component';
import { AppViewComponent } from './components/app-view/app-view.component';

import { UserService } from './service/user.service';
import { ForecastAppComponent } from './components/forecasts/forecast-app/forecast.app.component';

const routes: Routes = [
    {
        path: '', component: AppViewComponent, children: [
            { path: '', redirectTo: '/home', pathMatch: 'full' },
            { path: 'home', component: HomeComponent, canActivate: [UserService] },
            { path: 'project-list', component: ProjectListComponent, canActivate: [UserService] },
            { path: 'branches-list/:projectId', component: BranchListComponent, canActivate: [UserService] },
            { path: 'settings', component: SettingsComponent, canActivate: [UserService] },
            { path: 'users', component: UsersComponent, canActivate: [UserService] },
            { path: 'usergroups', component: UsergroupsComponent, canActivate: [UserService] },
            { path: 'forecast_graphical', component: ForecastAppComponent, canActivate: [UserService] },
            { path: '**', redirectTo: '/home', pathMatch: 'full' }
        ],
        canActivate: [UserService],
        runGuardsAndResolvers: 'always'
    },
];


@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class CoreRoutingModule { }
