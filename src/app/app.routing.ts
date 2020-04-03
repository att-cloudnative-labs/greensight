import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LoginComponent } from './modules/login/components/login/login.component';
import { UserService } from './modules/login/services/user.service';

const routes: Routes = [
    {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
    },
    { path: 'login', component: LoginComponent },
    { path: 'capacity-planning', canActivate: [UserService], loadChildren: './modules/cpt/cpt.module#CptModule' }
];

@NgModule({
    imports: [RouterModule.forRoot(routes, { onSameUrlNavigation: 'reload' })],
    exports: [RouterModule]
})
export class AppRoutingModule {

}
