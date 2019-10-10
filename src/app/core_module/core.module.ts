import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { UtilsModule } from '../utils_module/utils.module';
import { CoreRoutingModule } from './core_module.routing';
import { AngularFontAwesomeModule } from 'angular-font-awesome';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DpDatePickerModule } from 'ng2-date-picker';
import { ShContextMenuModule } from 'ng2-right-click-menu';
import { NvD3Module } from 'ng2-nvd3';
import { RouterModule } from '@angular/router';
import { NgxPageScrollModule } from 'ngx-page-scroll/ngx-page-scroll';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatTabsModule, MatDialogModule, MatTooltipModule, MatProgressSpinnerModule } from '@angular/material';
import { LoginComponent } from './components/login/login.component';
import { ProjectComboComponent } from './components/project_combo/project.combo.component';
import { ProjectListComponent } from './components/projects/project.list.component';
import { BranchListComponent } from './components/branches/branches-list.component';
import { SettingsComponent } from './components/settings/settings.component';
import { UsersComponent } from './components/users/users.component';
import { UsergroupsComponent } from './components/usergroups/usergroups.component';
import { HomeComponent } from './components/home/home.component';
import { FooterComponent } from './components/footer/footer.component';
import { UserService } from './service/user.service';
import { UserGroupService } from './service/usergroup.service';
import { SettingsService } from './service/settings.service';
import { ProjectService } from './service/project.service';
import { BranchService } from './service/branch.service';
import { LoaderService } from './service/loader.service';
import { ForecastVariableService } from './service/variable.service';
import { AppVariableTypeService } from './service/variable.type.service';
import { VariableUnitService } from './service/variable-unit.service';
import { VersionService } from './service/micro-service-versions.service';
import { TreeService } from './service/tree.service';
import { Config } from './service/config';
import { AppViewComponent } from './components/app-view/app-view.component';
import { ModalDialogService } from './service/modal-dialog.service';
import { ChangeDetectionService } from './service/change.detection.service';
import { TooltipsComponent } from './components/tooltips/tooltips.component';

// TODO: Forecast component need to be returned to the forecast_module once routing between multiple module is achieved
import { ColorPickerModule } from '../../../node_modules/ngx-color-picker';
import { D3Service } from '../../../node_modules/d3-ng2-service';
import { WelcomeDialogComponent } from './components/home/welcome.dialog.component';
import { ForecastAppComponent } from './components/forecasts/forecast-app/forecast.app.component';
import { SpreadsheetEntryComponent } from './components/forecasts/forecast-app/spreadsheet-entry/spreadsheet.entry.component';
import { HeaderCellComponent } from './components/forecasts/forecast-app/spreadsheet-entry/header-cell/header.cell.component';
import { VariableCellComponent } from './components/forecasts/forecast-app/spreadsheet-entry/variable-cell/variable.cell.component';
import { FrameCellComponent } from './components/forecasts/forecast-app/spreadsheet-entry/frame-cell/frame.cell.component';
import { SubframeCellComponent } from './components/forecasts/forecast-app/spreadsheet-entry/subframe-cell/subframe.cell.component';
import { SubframeEditorComponent } from './components/forecasts/forecast-app/spreadsheet-entry/subframe-cell/subframe-editor/subframe.editor.component';
import { SubframeLabelCellComponent } from './components/forecasts/forecast-app/spreadsheet-entry/subframe-label-cell/subframe.label.cell.component';
import { VariableEditorComponent } from './components/forecasts/forecast-app/spreadsheet-entry/variable-editor/variable.editor.component';
import { RealTypeComponent } from './components/forecasts/forecast-app/spreadsheet-entry/variable-editor/types/real/real.type.component';
import { IntegerTypeComponent } from './components/forecasts/forecast-app/spreadsheet-entry/variable-editor/types/integer/integer.type.component';
import { BreakdownTypeComponent } from './components/forecasts/forecast-app/spreadsheet-entry/variable-editor/types/breakdown/breakdown.type.component';
import { SubvariableLineComponent } from './components/forecasts/forecast-app/spreadsheet-entry/variable-editor/types/breakdown/subvariable-line/subvariable.line.component';
import { FrameEditorComponent } from './components/forecasts/forecast-app/spreadsheet-entry/frame-editor/frame.editor.component';
import { ActualProjectedToggleComponent } from './components/forecasts/forecast-app/spreadsheet-entry/frame-editor/actual-projected-toggle/actual.projected.toggle.component';
import { ForecastGraphComponent } from './components/forecasts/forecast-app/forecast-graph/forecast.graph.component';
import { ForecastSidebarComponent } from './components/forecasts/forecast-app/sidebar/forecast.sidebar.component';
import { ProjectionDisplayBoxesComponent } from './components/forecasts/forecast-app/sidebar/projection-display-boxes/projection.display.boxes.component';
import { GraphMetricsComponent } from './components/forecasts/forecast-app/sidebar/graph-metrics-checkboxes/graph.metrics.component';
import { AngularSplitModule } from 'angular-split';
import { AssociateBreakdownVariableComponent } from './components/forecasts/forecast-app/spreadsheet-entry/variable-editor/types/associate-breakdown-variables/associate.breakdown.component';
import { TypeSelectComponent } from './components/forecasts/forecast-app/spreadsheet-entry/variable-editor/types/type-select/type-select.component';
import { NgxPopperModule } from 'ngx-popper';
import { InlineEditComponent } from './components/forecasts/forecast-app/spreadsheet-entry/variable-editor/inline-edit/inline-edit.component';
import { EditActualValueComponent } from './components/forecasts/forecast-app/spreadsheet-entry/frame-editor/edit-actual-value/edit.actual.value.component';
import { ConstantEditComponent } from './components/forecasts/forecast-app/spreadsheet-entry/frame-editor/timesegment-edit/editor-types/constant-edit/constant.edit.component';
import { ExpressionEditComponent } from './components/forecasts/forecast-app/spreadsheet-entry/frame-editor/timesegment-edit/editor-types/expression-edit/expression.edit.component';
import { TimesegmentEditComponent } from './components/forecasts/forecast-app/spreadsheet-entry/frame-editor/timesegment-edit/timesegment.edit.component';
import { ProgressBarComponent } from './components/forecasts/forecast-app/sidebar/progress-bar/progress.bar.component';
import { NgWormholeModule } from 'ng-wormhole';
import { CellResizeHandlerComponent } from './components/forecasts/forecast-app/spreadsheet-entry/cell-resize-handler/cell.resize.handler.component';
import { VariableCreatorComponent } from './components/forecasts/forecast-app/spreadsheet-entry/variable-creator/variable.creator.component';
import { TimeSegDistributionComponent } from './components/forecasts/forecast-app/spreadsheet-entry/frame-editor/timesegment-edit/editor-types/time-seg-distribution/time.seg.distribution.component';
import 'nvd3';
import { ExpressionCreatorService } from './service/expression-creator.service';
import { BlankCellComponent } from './components/forecasts/forecast-app/spreadsheet-entry/blank-cell/blank.cell.component';

@NgModule({
    declarations: [

        TimeSegDistributionComponent,
        ProgressBarComponent,
        InlineEditComponent,
        TypeSelectComponent,
        AssociateBreakdownVariableComponent,
        TooltipsComponent,
        AppViewComponent,
        ProjectComboComponent,
        LoginComponent,
        ProjectListComponent,
        BranchListComponent,
        SettingsComponent,
        UsersComponent,
        UsergroupsComponent,
        HomeComponent,
        FooterComponent,
        TooltipsComponent,
        WelcomeDialogComponent,
        ForecastAppComponent,
        SpreadsheetEntryComponent,
        HeaderCellComponent,
        VariableCellComponent,
        CellResizeHandlerComponent,
        FrameCellComponent,
        BlankCellComponent,
        SubframeCellComponent,
        SubframeLabelCellComponent,
        VariableEditorComponent,
        RealTypeComponent,
        IntegerTypeComponent,
        BreakdownTypeComponent,
        SubvariableLineComponent,
        FrameEditorComponent,
        SubframeEditorComponent,
        TimesegmentEditComponent,
        EditActualValueComponent,
        ConstantEditComponent,
        ExpressionEditComponent,
        ActualProjectedToggleComponent,
        ForecastGraphComponent,
        ForecastSidebarComponent,
        ProjectionDisplayBoxesComponent,
        GraphMetricsComponent,
        VariableCreatorComponent,
    ],
    imports: [
        NgxPopperModule,
        AngularSplitModule.forRoot(),
        CoreRoutingModule,
        CommonModule,
        UtilsModule,
        AngularFontAwesomeModule,
        FormsModule,
        HttpClientModule,
        ColorPickerModule,
        ReactiveFormsModule,
        DpDatePickerModule,
        ShContextMenuModule,
        NgWormholeModule,
        NvD3Module,
        RouterModule,
        NoopAnimationsModule,
        NgxPageScrollModule,
        MatTabsModule,
        MatDialogModule,
        MatTooltipModule,
        MatProgressSpinnerModule
    ],
    exports: [
        AppViewComponent,
        ProjectComboComponent,
        LoginComponent,
        ProjectListComponent,
        BranchListComponent,
        SettingsComponent,
        UsersComponent,
        UsergroupsComponent,
        HomeComponent,
        WelcomeDialogComponent,
        FooterComponent,
        TooltipsComponent,
        MatTabsModule,
        MatDialogModule,
        MatTooltipModule,
    ],
    providers: [
        ModalDialogService,
        BranchService,
        UserService,
        UserGroupService,
        ProjectService,
        SettingsService,
        LoaderService,
        ForecastVariableService,
        AppVariableTypeService,
        VariableUnitService,
        VersionService,
        Config,
        D3Service,
        ChangeDetectionService,
        ExpressionCreatorService,
        TreeService
    ],
    bootstrap: [],
    entryComponents: [
        WelcomeDialogComponent,
        IntegerTypeComponent,
        BreakdownTypeComponent,
        RealTypeComponent,
        ConstantEditComponent,
        ExpressionEditComponent,
        EditActualValueComponent
    ]
})
export class CoreModule { }
