
import { AppRoutingModule } from './app.routing';
import { AppComponent } from './app.component';
import { environment as env } from '@environments/environment';

import { ModalModule } from 'ngx-modialog-7';
import { BootstrapModalModule } from 'ngx-modialog-7/plugins/bootstrap';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AngularFontAwesomeModule } from 'angular-font-awesome';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core'; import { AngularSplitModule } from 'angular-split';
import { GlobalErrorHandler } from './global-error-handler';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { LoginModule } from '@app/modules/login/login.module';
import { OverlayModule } from '@angular/cdk/overlay';
import { NgxsModule } from '@ngxs/store';
import { NgxsLoggerPluginModule } from '@ngxs/logger-plugin';
import { NgxsReduxDevtoolsPluginModule } from '@ngxs/devtools-plugin';
import { NgxsStoragePluginModule, StorageOption } from '@ngxs/storage-plugin';

@NgModule({
    declarations: [
        AppComponent
    ],
    imports: [
        AngularSplitModule.forRoot(),
        LoginModule,
        AppRoutingModule,
        BrowserModule,
        HttpClientModule,
        FormsModule,
        BrowserAnimationsModule,
        AngularFontAwesomeModule,
        ModalModule.forRoot(),
        BootstrapModalModule,
        ReactiveFormsModule,
        OverlayModule,
        NgxsModule.forRoot([], { developmentMode: !env.production }),
        NgxsLoggerPluginModule.forRoot({ logger: console, collapsed: false }),
        NgxsReduxDevtoolsPluginModule.forRoot({ disabled: env.production }),
        NgxsStoragePluginModule.forRoot({
            key: 'layout',
            storage: StorageOption.SessionStorage
        }),
    ],
    providers: [
        {
            provide: HTTP_INTERCEPTORS,
            useClass: GlobalErrorHandler,
            multi: true
        }
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
