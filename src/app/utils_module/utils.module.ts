import { UtilsRoutingModule } from './utils_module.routing';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MainContentsComponent } from './components/main_contents/main.contents.component';
import { AutocompleteInputComponent } from './components/auto-complete-input/autocomplete.input.component';
import { CompletedWordComponent } from './components/auto-complete-input/completedword.component';
import { DrawingToolsHeaderComponent } from './components/drawing-tools-header/darwing.tools.header.component';
import { DrawingToolsSidebarComponent } from './components/drawing-tools-sidebar/drawing.tools.sidebar.component';
import { ListItemComponent } from './components/list-item/list.item.component';
import { TableViewComponent } from './components/table-view/table.view.component';
import { AngularFontAwesomeModule } from 'angular-font-awesome';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AppHeaderComponent } from './components/app-header/app.header.component';
import { ComboComponent } from './components/branch_combo/branch.combo.component';
import { FormatValuePipe } from './pipes/formatValuePipe';
import { FormatValueWithUnitPipe } from './pipes/formatValueWithUnitPipe';
import { TetherDirective } from './tether.directive';
import { DraggableDirective } from './draggable.directive';
import { DropTargetDirective } from './drop-target.directive';
import { DragItemDirective } from './drag-item.directive';
import { DragPreviewDirective } from './drag-preview.directive';
import { DropListDirective } from './drop-list.directive';
import { ElementResizeDetectorDirective } from './element-resize-detector.directive';
import { HasPermissionDirective } from '@app/utils_module/has-permission.directive';
import { HighlightSubstringPipe } from './pipes/highlightSubstringPipe';
import { EditInPlaceComponent } from '@app/shared/components/edit-in-place/edit-in-place.component';
import { NavBarComponent } from '@app/shared/components/nav-bar/nav-bar.component';
import { NgWormholeModule } from 'ng-wormhole';
import { ForecastPermissionSelectComponent } from './components/fc-access-control/fc-permission-select/fc-permission-select.component';
import { ForecastAccessControlComponent } from './components/fc-access-control/fc-access-control.component';
import { ForecastAccessControlRowComponent } from './components/fc-access-control/fc-access-control-row/fc-access-control-row.component';
import { ForecastUserPickerComponent } from './components/fc-user-picker/fc-user-picker.component';
import { ForecastUserPickerSearchComponent } from './components/fc-user-picker/fc-user-picker-search/fc-user-picker-search.component';


@NgModule({
    declarations: [
        NavBarComponent,
        EditInPlaceComponent,
        AppHeaderComponent,
        MainContentsComponent,
        AutocompleteInputComponent,
        CompletedWordComponent,
        DrawingToolsHeaderComponent,
        DrawingToolsSidebarComponent,
        ListItemComponent,
        TableViewComponent,
        ComboComponent,
        FormatValuePipe,
        FormatValueWithUnitPipe,
        HighlightSubstringPipe,
        TetherDirective,
        DraggableDirective,
        DropTargetDirective,
        DropListDirective,
        DragItemDirective,
        DragPreviewDirective,
        ElementResizeDetectorDirective,
        HasPermissionDirective,
        ForecastPermissionSelectComponent,
        ForecastAccessControlComponent,
        ForecastAccessControlRowComponent,
        ForecastUserPickerComponent,
        ForecastUserPickerSearchComponent
    ],
    imports: [
        UtilsRoutingModule,
        CommonModule,
        AngularFontAwesomeModule,
        FormsModule,
        ReactiveFormsModule,
        NgWormholeModule
    ],
    exports: [
        AppHeaderComponent,
        MainContentsComponent,
        AutocompleteInputComponent,
        CompletedWordComponent,
        DrawingToolsHeaderComponent,
        DrawingToolsSidebarComponent,
        NavBarComponent,
        EditInPlaceComponent,
        ComboComponent,
        ListItemComponent,
        TableViewComponent,
        TetherDirective,
        DraggableDirective,
        DropTargetDirective,
        DropListDirective,
        DragItemDirective,
        DragPreviewDirective,
        ElementResizeDetectorDirective,
        HasPermissionDirective,
        FormatValuePipe,
        FormatValueWithUnitPipe,
        HighlightSubstringPipe,
        ForecastPermissionSelectComponent,
        ForecastAccessControlComponent,
        ForecastAccessControlRowComponent,
        ForecastUserPickerComponent,
        ForecastUserPickerSearchComponent

    ],
    providers: [],
    bootstrap: []
})
export class UtilsModule { }
