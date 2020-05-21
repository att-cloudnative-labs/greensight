import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LoginComponent } from './modules/login/components/login/login.component';
import { AuthService } from '@login/services/auth.service';

const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: '', canActivate: [AuthService], loadChildren: './modules/cpt/cpt.module#CptModule' }
];

@NgModule({
    imports: [RouterModule.forRoot(routes, { onSameUrlNavigation: 'ignore', enableTracing: false })],
    exports: [RouterModule]
})
export class AppRoutingModule {

}
