import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LoginComponent } from './core_module/components/login/login.component';
import { UserService } from './core_module/service/user.service';

const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: 'system-models', canActivate: [UserService], loadChildren: './modules/system-models/system-models.module#SystemModelsModule' },
    { path: '#', canActivate: [UserService], loadChildren: './core_module/core.module#CoreModule' }
];

@NgModule({
    imports: [RouterModule.forRoot(routes, { onSameUrlNavigation: 'reload' })],
    exports: [RouterModule]
})
export class AppRoutingModule {

}
