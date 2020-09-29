import { NgModule } from '@angular/core';
import { ModalModule } from 'ngx-modialog-7';
import { LoginComponent } from '@login/components/login/login.component';
import { NavBarComponent } from '@login/components/nav-bar/nav-bar.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AppViewComponent } from '@login/components/app-view/app-view.component';
import { AuthService } from '@login/services/auth.service';
import { LayoutService } from '@app/modules/cpt/services/layout.service';

@NgModule({
    declarations: [
        LoginComponent,
        NavBarComponent,
        AppViewComponent
    ],
    imports: [
        ModalModule,
        CommonModule,
        FormsModule,
        RouterModule.forChild([])
    ],
    exports: [
        NavBarComponent,
        LoginComponent
    ],
    providers: [
        AuthService,
        LayoutService
    ]
})
export class LoginModule { }
