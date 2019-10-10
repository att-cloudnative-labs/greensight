
import { AppRoutingModule } from './app.routing';
import { AppComponent } from './app.component';
import { environment as env } from '@environments/environment';

import { NgxLineChartModule } from 'ngx-line-chart';
import { ChartsModule } from 'ng2-charts';
import { ColorPickerModule } from 'ngx-color-picker';
import { ModalModule } from 'ngx-modialog';
import { BootstrapModalModule } from 'ngx-modialog/plugins/bootstrap';
import { DpDatePickerModule } from 'ng2-date-picker';
import { NvD3Module } from 'ng2-nvd3';
import { HttpModule } from '@angular/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AngularFontAwesomeModule } from 'angular-font-awesome';
import { BreadcrumbsModule } from 'ng2-breadcrumbs';
import { ShContextMenuModule } from 'ng2-right-click-menu';
import { NgxsLoggerPluginModule } from '@ngxs/logger-plugin';
import { NgxsReduxDevtoolsPluginModule } from '@ngxs/devtools-plugin';
import { NgxsModule } from '@ngxs/store';
import { NgxsStoragePluginModule, StorageOption } from '@ngxs/storage-plugin';

import { BrowserModule } from '@angular/platform-browser';
import { NgModule, ErrorHandler } from '@angular/core';
import { CoreModule } from './core_module/core.module';

import { UtilsModule } from './utils_module/utils.module';
import { NgxPageScrollModule } from 'ngx-page-scroll/ngx-page-scroll';
import { LoaderComponent } from './utils_module/components/loader/loader.component';
import { AngularSplitModule } from 'angular-split';
import { GlobalErrorHandler } from './global-error-handler';

@NgModule({
    declarations: [
        LoaderComponent,
        AppComponent
    ],
    imports: [
        AngularSplitModule,
        AppRoutingModule,
        CoreModule,
        UtilsModule,
        ChartsModule,
        NgxLineChartModule,
        BrowserModule,
        HttpModule,
        FormsModule,
        BrowserAnimationsModule,
        AngularFontAwesomeModule,
        ModalModule.forRoot(),
        BootstrapModalModule,
        DpDatePickerModule,
        NvD3Module,
        ShContextMenuModule,
        BreadcrumbsModule,
        ColorPickerModule,
        ReactiveFormsModule,
        NgxPageScrollModule,
        NgxsModule.forRoot([], { developmentMode: !env.production }),
        NgxsStoragePluginModule.forRoot({
            key: 'layout',
            storage: StorageOption.SessionStorage
        }),
        NgxsLoggerPluginModule.forRoot({ logger: console, collapsed: false }),
        NgxsReduxDevtoolsPluginModule.forRoot({ disabled: env.production }),
    ],
    providers: [
        {
            provide: ErrorHandler,
            useClass: GlobalErrorHandler,
        }
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
