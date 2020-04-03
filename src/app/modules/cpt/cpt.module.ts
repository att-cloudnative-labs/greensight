import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxsModule } from '@ngxs/store';
import { AngularSplitModule } from 'angular-split';
import { AngularFontAwesomeModule } from 'angular-font-awesome';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DpDatePickerModule } from 'ng2-date-picker';

// Shared
import { DockableViewportComponent } from '@app/modules/cpt/components/dockable-ui/dockable-viewport/dockable-viewport.component';
import { DockableSplitComponent } from '@app/modules/cpt/components/dockable-ui/dockable-split/dockable-split.component';
import { DockableStackComponent } from '@app/modules/cpt/components/dockable-ui/dockable-stack/dockable-stack.component';
import { DockablePanelComponent } from '@app/modules/cpt/components/dockable-ui/dockable-panel/dockable-panel.component';
import { FilterDropdownComponent } from '@app/modules/cpt/components/filter-dropdown/filter-dropdown.component';
import { FilterDropdownListComponent } from '@app/modules/cpt/components/filter-dropdown/filter-dropdown-list/filter-dropdown-list.component';
import { TypeaheadComboboxComponent } from '@app/modules/cpt/components/typeahead-combobox/typeahead-combobox.component';
import { TypeaheadSearchComponent } from '@app/modules/cpt/components/typeahead-combobox/typeahead-search/typeahead-search.component';
import { TypeaheadSearchResultComponent } from '@app/modules/cpt/components/typeahead-combobox/typeahead-search/typeahead-search-result/typeahead-search-result.component';

// Local
import { states } from './state';
import { CptRoutingModule } from './cpt-routing.module';
import { SystemModelsPageComponent } from './components/system-models-page/system-models-page.component';
import { LibraryComponent } from './components/library/library.component';
import { SearchFilterComponent } from './components/search-filter/search-filter.component';
import { LibraryFolderComponent } from './components/library/library-folder/library-folder.component';
import { SimulationService } from './services/simulation.service';
import { LibraryGraphModelComponent } from './components/library/library-graph-model/library-graph-model.component';
import { DetailsComponent } from './components/details/details.component';
import { HistoryComponent } from './components/history/history.component';
import { HistoryItemComponent } from './components/history/history-item/history-item.component';
import { GraphModelEditorComponent } from './components/graph-model-editor/graph-model-editor.component';
import { GmProcessComponent } from './components/graph-model-editor/gm-process/gm-process.component';
import { GmProcessPortComponent } from './components/graph-model-editor/gm-process-port/gm-process-port.component';
import { GmPortComponent } from './components/graph-model-editor/gm-port/gm-port.component';
import { GmPinComponent } from './components/graph-model-editor/gm-pin/gm-pin.component';
import { GmConnectionComponent } from './components/graph-model-editor/gm-connection/gm-connection.component';
import { LibrarySimulationComponent } from './components/library/library-simulation/library-simulation.component';
import { LibrarySimulationResultComponent } from './components/library/library-simulation-result/library-simulation-result.component';
import { LibraryFolderPopupMenuComponent } from './components/library/library-folder/library-folder-popup-menu/library-folder-popup-menu.component';
import { LibraryGraphModelPopupMenuComponent } from './components/library/library-graph-model/library-graph-model-popup-menu/library-graph-model-popup-menu.component';
import { LibrarySimulationPopupMenuComponent } from './components/library/library-simulation/library-simulation-popup-menu/library-simulation-popup-menu.component';
import { LibrarySimulationResultPopupMenuComponent } from './components/library/library-simulation-result/library-simulation-result-popup-menu/library-simulation-result-popup-menu.component';
import { LibraryForecastSheetComponent } from './components/library/library-forecast-sheet/library-forecast-sheet.component';
import { LibraryForecastSheetPopupMenuComponent } from './components/library/library-forecast-sheet/library-forecast-sheet-popup-menu/library-forecast-sheet-popup-menu.component';


import { NgWormholeModule } from 'ng-wormhole';
import { LibrarySearchComponent } from './components/library/library-search/library-search.component';
import { LibrarySearchResultsComponent } from './components/library/library-search/library-search-result/library-search-result.component';
import { PermissionSelectComponent } from './components/details/access-control/permission-select/permission-select.component';
import { AccessControlComponent } from './components/details/access-control/access-control.component';
import { AccessControlRowComponent } from './components/details/access-control/access-control-row/access-control-row.component';
import { TrashComponent } from './components/trash/trash.component';
import { TrashSearchFilterComponent } from './components/trash/trash-search-filter/trash-search-filter.component';
import { TrashListComponent } from './components/trash/trash-list/trash-list.component';
import { AnyonePermissionSelectComponent } from './components/details/access-control/anyone-permission-select/anyone-permission-select.component';
import { GraphControlBarComponent } from './components/graph-model-editor/graph-control-bar/graph-control-bar.component';
import { GraphProcessingElementSearchComponent } from './components/graph-model-editor/graph-processing-element-search/graph-processing-element-search.component';
import { GraphSearchResultComponent } from './components/graph-model-editor/graph-processing-element-search/graph-search-result/graph-search-result.component';
import { GraphNodeDirective } from './components/graph-model-editor/graph-node.directive';
import { SimulationEditorComponent } from './components/simulation-editor/simulation-editor.component';
import { SimulationScenarioTableComponent } from './components/simulation-editor/simulation-scenario-table/simulation-scenario-table.component';
import { SimulationScenarioTableRowComponent } from './components/simulation-editor/simulation-scenario-table/simulation-scenario-table-row/simulation-scenario-table-row.component';
import { GmInportDetailsComponent } from './components/details/gm-inport-details/gm-inport-details.component';
import { TreeNodeDetailsComponent } from './components/details/tree-node-details/tree-node-details.component';
import { CreateReleaseButtonComponent } from './components/create-release-button/create-release-button.component';
import { SimulationTimelineComponent } from './components/simulation-editor/simulation-timeline/simulation-timeline.component';
import { GmOutportDetailsComponent } from './components/details/gm-outport-details/gm-outport-details.component';
import { ForecastUnitService } from './services/forecast-unit.service';
import { GmProcessInportDetailsComponent } from './components/details/gm-process-inport-details/gm-process-inport-details.component';
import { GmPortTemplateButtonsComponent } from './components/graph-model-editor/gm-port-template-buttons/gm-port-template-buttons.component';
import { SimulationResultComponent } from './components/simulation-result/simulation-result.component';
import { GmProcessOutportDetailsComponent } from './components/details/gm-process-outport-details/gm-process-outport-details.component';
import { BreakdownEditorComponent } from './components/breakdown-editor/breakdown-editor.component';
import { BreakdownEditorRowComponent } from './components/breakdown-editor/breakdown-editor-row/breakdown-editor-row.component';
import { GmProcessDetailsComponent } from './components/details/gm-process-details/gm-process-details.component';
import { SrTreeComponent } from './components/simulation-result/sr-tree/sr-tree.component';
import { SrTreeNodeComponent } from './components/simulation-result/sr-tree-node/sr-tree-node.component';
import { ResultDataTableComponent } from './components/simulation-result/result-data-table/result-data-table.component';
import { ResultDataTableRowComponent } from './components/simulation-result/result-data-table/result-data-table-row/result-data-table-row.component';
import { ResultValueCellComponent } from './components/simulation-result/result-data-table/result-data-table-row/result-value-cell/result-value-cell.component';
import { VariableNameCellComponent } from './components/simulation-result/result-data-table/variable-name-cell/variable-name-cell.component';

// Simulation Result Screen Graphs
import { NgxEchartsModule } from 'ngx-echarts';
import { SimulationResultStackedChartComponent } from './components/simulation-result/sr-visualization/simulation-result-stacked-chart/simulation-result-stacked-chart.component';
import { SrVisualizationComponent } from './components/simulation-result/sr-visualization/sr-visualization.component';
import { SimulationResultHistogramComponent } from './components/simulation-result/sr-visualization/simulation-result-histogram/simulation-result-histogram.component';
import { SimulationResultBreakdownChartComponent } from './components/simulation-result/sr-visualization/simulation-result-breakdown-chart/simulation-result-breakdown-chart.component';
import { SimulationResultTimeSeriesChartComponent } from './components/simulation-result/sr-visualization/simulation-result-time-series-chart/simulation-result-time-series-chart.component';
import { SrErrorWarningListComponent } from './components/simulation-result/sr-error-warning-list/sr-error-warning-list.component';
import { SrErrorWarningItemComponent } from './components/simulation-result/sr-error-warning-list/sr-error-warning-item/sr-error-warning-item.component';
import { SrVariablePickerComponent } from './components/simulation-result/sr-variable-picker/sr-variable-picker.component';
import { GmVariablePickerComponent } from './components/graph-model-editor/gm-variable-picker/gm-variable-picker.component';
import { GmBroadcastVariableComponent } from './components/graph-model-editor/gm-broadcast-variable/gm-broadcast-variable.component';
import { GmNamedVariableComponent } from './components/graph-model-editor/gm-named-variable/gm-named-variable.component';
import { GmVariableReferenceDetailsComponent } from './components/details/gm-variable-reference-details/gm-variable-reference-details.component';
import { SrValueDisplayComponent } from './components/simulation-result/sr-visualization/sr-value-display/sr-value-display.component';
import { UserPickerComponent } from './components/user-picker/user-picker.component';
import { UserPickerSearchComponent } from './components/user-picker/user-picker-search/user-picker-search.component';

// forecast app components
import { ForecastEditorComponent } from './components/forecast-sheet-editor/forecast.editor.component';
import { ForecastGraphComponent } from './components/forecast-sheet-editor/forecast-graph/forecast.graph.component';
import { GraphMetricsComponent } from './components/forecast-sheet-editor/forecast-graph/graph-metrics-checkboxes/graph.metrics.component';
import { VariableFilterComponent } from './components/forecast-sheet-editor/forecast-sheet-control-bar/variable-filter/variable-filter.component';
import { SpreadsheetEntryComponent } from './components/forecast-sheet-editor/spreadsheet-entry/spreadsheet.entry.component';
import { VariableEditorComponent } from './components/forecast-sheet-editor/spreadsheet-entry/variable-editor/variable.editor.component';
import { VariableCreatorComponent } from './components/forecast-sheet-editor/spreadsheet-entry/variable-creator/variable.creator.component';
import { VariableCellComponent } from './components/forecast-sheet-editor/spreadsheet-entry/variable-cell/variable.cell.component';
import { SubframeLabelCellComponent } from './components/forecast-sheet-editor/spreadsheet-entry/subframe-label-cell/subframe.label.cell.component';
import { SubframeCellComponent } from './components/forecast-sheet-editor/spreadsheet-entry/subframe-cell/subframe.cell.component';
import { HeaderCellComponent } from './components/forecast-sheet-editor/spreadsheet-entry/header-cell/header.cell.component';
import { FrameEditorComponent } from './components/forecast-sheet-editor/spreadsheet-entry/frame-editor/frame.editor.component';
import { FrameCellComponent } from './components/forecast-sheet-editor/spreadsheet-entry/frame-cell/frame.cell.component';
import { CellResizeHandlerComponent } from './components/forecast-sheet-editor/spreadsheet-entry/cell-resize-handler/cell.resize.handler.component';
import { BlankCellComponent } from './components/forecast-sheet-editor/spreadsheet-entry/blank-cell/blank.cell.component';
import { ActualProjectedToggleComponent } from './components/forecast-sheet-editor/spreadsheet-entry/frame-editor/actual-projected-toggle/actual.projected.toggle.component';
import { EditActualValueComponent } from './components/forecast-sheet-editor/spreadsheet-entry/frame-editor/edit-actual-value/edit.actual.value.component';
import { TimesegmentEditComponent } from './components/forecast-sheet-editor/spreadsheet-entry/frame-editor/timesegment-edit/timesegment.edit.component';
import { TimeSegDistributionComponent } from './components/forecast-sheet-editor/spreadsheet-entry/frame-editor/timesegment-edit/editor-types/time-seg-distribution/time.seg.distribution.component';
import { ExpressionEditComponent } from './components/forecast-sheet-editor/spreadsheet-entry/frame-editor/timesegment-edit/editor-types/expression-edit/expression.edit.component';
import { ConstantEditComponent } from './components/forecast-sheet-editor/spreadsheet-entry/frame-editor/timesegment-edit/editor-types/constant-edit/constant.edit.component';
import { RealTypeComponent } from './components/forecast-sheet-editor/spreadsheet-entry/variable-editor/types/real/real.type.component';
import { IntegerTypeComponent } from './components/forecast-sheet-editor/spreadsheet-entry/variable-editor/types/integer/integer.type.component';
import { BreakdownTypeComponent } from './components/forecast-sheet-editor/spreadsheet-entry/variable-editor/types/breakdown/breakdown.type.component';
import { AssociateBreakdownVariableComponent } from './components/forecast-sheet-editor/spreadsheet-entry/variable-editor/types/associate-breakdown-variables/associate.breakdown.component';
import { SubvariableLineComponent } from './components/forecast-sheet-editor/spreadsheet-entry/variable-editor/types/breakdown/subvariable-line/subvariable.line.component';
import { InlineEditComponent } from './components/forecast-sheet-editor/spreadsheet-entry/variable-editor/inline-edit/inline-edit.component';
import { TypeSelectComponent } from './components/forecast-sheet-editor/spreadsheet-entry/variable-editor/types/type-select/type-select.component';
import { SubframeEditorComponent } from './components/forecast-sheet-editor/spreadsheet-entry/subframe-cell/subframe-editor/subframe.editor.component';
import { MatTooltipModule } from '@angular/material';
import { ForecastSheetControlBarComponent } from './components/forecast-sheet-editor/forecast-sheet-control-bar/forecast-sheet-control-bar.component';
import { VersionEditorComponent } from '@app/modules/cpt/components/history/version-editor/version.editor.component';
import { ReleaseEditorComponent } from '@app/modules/cpt/components/history/release-editor/release.editor.component';
import { SettingsComponent } from '@app/modules/cpt/components/settings/settings.component';
import { NavBarComponent } from '@app/modules/login/components/nav-bar/nav-bar.component';
import { LoginModule } from '@app/modules/login/login.module';
import { BootstrapModalModule } from 'ngx-modialog-7/plugins/bootstrap';
import { TetherDirective } from '@app/modules/cpt/directives/tether.directive';
import { DraggableDirective } from '@app/modules/cpt/directives/draggable.directive';
import { DragPreviewDirective } from '@app/modules/cpt/directives/drag-preview.directive';
import { DragItemDirective } from '@app/modules/cpt/directives/drag-item.directive';
import { ElementResizeDetectorDirective } from '@app/modules/cpt/directives/element-resize-detector.directive';
import { DropTargetDirective } from '@app/modules/cpt/directives/drop-target.directive';
import { HasPermissionDirective } from '@app/modules/cpt/directives/has-permission.directive';
import { DropListDirective } from '@app/modules/cpt/directives/drop-list.directive';
import { EditInPlaceComponent } from '@app/modules/cpt/components/edit-in-place/edit-in-place.component';
import { HighlightSubstringPipe } from '@app/modules/cpt/pipes/highlightSubstringPipe';
import { FormatValuePipe } from '@app/modules/cpt/pipes/formatValuePipe';
import { FormatValueWithUnitPipe } from '@app/modules/cpt/pipes/formatValueWithUnitPipe';
import { AutocompleteInputComponent } from '@app/modules/cpt/components/auto-complete-input/autocomplete.input.component';
import { CompletedWordComponent } from '@app/modules/cpt/components/auto-complete-input/completedword.component';
import { UsergroupsComponent } from '@app/modules/cpt/components/usergroups/usergroups.component';
import { UsersComponent } from '@app/modules/cpt/components/users/users.component';
import { ChangeDetectionService } from '@app/modules/cpt/services/change.detection.service';
import { ReleaseService } from '@app/modules/cpt/services/release.service';
import { VersionService } from '@app/modules/cpt/services/micro-service-versions.service';
import { ExpressionCreatorService } from '@app/modules/cpt/services/expression-creator.service';
import { TreeService } from '@app/modules/cpt/services/tree.service';
import { UserGroupService } from '@app/modules/cpt/services/usergroup.service';
import { VariableUnitService } from '@app/modules/cpt/services/variable-unit.service';
import { ModalDialogService } from '@app/modules/cpt/services/modal-dialog.service';
import { SettingsService } from '@app/modules/cpt/services/settings.service';
import { DrawingToolsHeaderComponent } from '@app/modules/cpt/components/drawing-tools-header/darwing.tools.header.component';
import { DrawingToolsSidebarComponent } from '@app/modules/cpt/components/drawing-tools-sidebar/drawing.tools.sidebar.component';
import { TooltipsComponent } from '@app/modules/cpt/components/tooltips/tooltips.component';
import { ListItemComponent } from '@app/modules/cpt/components/list-item/list.item.component';
import { NgbButtonsModule, NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { NodeTrackingEditorComponent } from '@cpt/components/node-tracking-editor/node-tracking-editor.component';
import { SimulationForecastSheetEntryComponent } from '@cpt/components/simulation-editor/simulation-forecast-sheet-entry/simulation-forecast-sheet-entry.component';
import { NodeReleaseSelectorComponent } from '@cpt/components/node-release-selector/node-release-selector.component';
import { ForecastSearchBoxComponent } from '@cpt/components/simulation-editor/forecast-search-box/forecast-search-box.component';
import { ForecastSearchListEntryComponent } from '@cpt/components/simulation-editor/forecast-search-box/entry/forecast-search-list-entry.component';

@NgModule({
    imports: [
        CommonModule,
        CptRoutingModule,
        NgxsModule.forFeature(states),
        NgWormholeModule,
        AngularSplitModule.forRoot(),
        AngularFontAwesomeModule,
        FormsModule,
        ReactiveFormsModule,
        DpDatePickerModule,
        NgxEchartsModule,
        MatTooltipModule,
        LoginModule,

        BootstrapModalModule,
        NgbButtonsModule,
        NgbDropdownModule
    ],
    exports: [
        MatTooltipModule
    ],
    declarations: [
        SystemModelsPageComponent,
        FilterDropdownComponent,
        FilterDropdownListComponent,
        DockableViewportComponent,
        DockableSplitComponent,
        DockableStackComponent,
        GraphControlBarComponent,
        LibraryFolderComponent,
        LibraryFolderPopupMenuComponent,
        LibraryGraphModelPopupMenuComponent,
        LibraryComponent,
        LibraryGraphModelComponent,
        LibrarySearchComponent,
        LibrarySearchResultsComponent,
        LibrarySimulationComponent,
        LibrarySimulationPopupMenuComponent,
        LibrarySimulationResultComponent,
        LibrarySimulationResultPopupMenuComponent,
        SearchFilterComponent,
        DockablePanelComponent,
        TrashComponent,
        TrashSearchFilterComponent,
        TrashListComponent,
        TypeaheadComboboxComponent,
        TypeaheadSearchComponent,
        TypeaheadSearchResultComponent,
        GraphModelEditorComponent,
        SimulationEditorComponent,
        SimulationScenarioTableComponent,
        SimulationScenarioTableRowComponent,
        SimulationResultComponent,
        ResultDataTableComponent,
        ResultDataTableRowComponent,
        ResultValueCellComponent,
        VariableNameCellComponent,
        GraphProcessingElementSearchComponent,
        GraphSearchResultComponent,
        GmProcessComponent,
        GmProcessPortComponent,
        GmPortComponent,
        GmPinComponent,
        GmConnectionComponent,
        DetailsComponent,
        PermissionSelectComponent,
        AccessControlComponent,
        AccessControlRowComponent,
        HistoryComponent,
        HistoryItemComponent,
        AnyonePermissionSelectComponent,
        GraphNodeDirective,
        SimulationTimelineComponent,
        GmInportDetailsComponent,
        TreeNodeDetailsComponent,
        GmOutportDetailsComponent,
        GmProcessInportDetailsComponent,
        GmPortTemplateButtonsComponent,
        GmProcessOutportDetailsComponent,
        SrVisualizationComponent,
        BreakdownEditorComponent,
        BreakdownEditorRowComponent,
        GmProcessDetailsComponent,
        SimulationResultHistogramComponent,
        SimulationResultTimeSeriesChartComponent,
        SimulationResultStackedChartComponent,
        SimulationResultBreakdownChartComponent,
        SrValueDisplayComponent,
        SrVariablePickerComponent,
        SrErrorWarningListComponent,
        SrErrorWarningItemComponent,
        SrTreeComponent,
        SrTreeNodeComponent,
        GmVariablePickerComponent,
        GmBroadcastVariableComponent,
        GmNamedVariableComponent,
        GmVariableReferenceDetailsComponent,
        UserPickerComponent,
        UserPickerSearchComponent,
        LibraryForecastSheetComponent,
        LibraryForecastSheetPopupMenuComponent,
        // FC components
        ForecastEditorComponent,
        ForecastGraphComponent,
        GraphMetricsComponent,
        VariableFilterComponent,
        SpreadsheetEntryComponent,
        VariableEditorComponent,
        VariableCreatorComponent,
        VariableCellComponent,
        SubframeLabelCellComponent,
        SubframeCellComponent,
        HeaderCellComponent,
        FrameEditorComponent,
        FrameCellComponent,
        CellResizeHandlerComponent,
        BlankCellComponent,
        ActualProjectedToggleComponent,
        EditActualValueComponent,
        TimesegmentEditComponent,
        TimeSegDistributionComponent,
        ExpressionEditComponent,
        ConstantEditComponent,
        RealTypeComponent,
        IntegerTypeComponent,
        BreakdownTypeComponent,
        AssociateBreakdownVariableComponent,
        SubvariableLineComponent,
        InlineEditComponent,
        TypeSelectComponent,
        SubframeEditorComponent,
        ForecastSheetControlBarComponent,
        VersionEditorComponent,
        ReleaseEditorComponent,
        SettingsComponent,
        TetherDirective,
        DraggableDirective,
        HasPermissionDirective,
        ElementResizeDetectorDirective,
        DragPreviewDirective,
        DragItemDirective,
        DropTargetDirective,
        DropListDirective,
        EditInPlaceComponent,
        HighlightSubstringPipe,
        FormatValuePipe,
        FormatValueWithUnitPipe,
        AutocompleteInputComponent,
        CompletedWordComponent,
        SettingsComponent,
        UsergroupsComponent,
        UsersComponent,
        DrawingToolsHeaderComponent,
        DrawingToolsSidebarComponent,
        TooltipsComponent,
        ListItemComponent,
        CreateReleaseButtonComponent,
        NodeTrackingEditorComponent,
        SimulationForecastSheetEntryComponent,
        NodeReleaseSelectorComponent,
        ForecastSearchBoxComponent,
        ForecastSearchListEntryComponent
    ],
    providers: [
        ForecastUnitService,
        SimulationService,
        LibraryComponent,
        ChangeDetectionService,
        ExpressionCreatorService,
        VersionService,
        ReleaseService,
        TreeService,
        UserGroupService,
        VariableUnitService,
        ModalDialogService,
        SettingsService
    ],
    entryComponents: [
        LibraryComponent,
        GraphModelEditorComponent,
        SimulationEditorComponent,
        SimulationResultComponent,
        DetailsComponent,
        HistoryComponent,
        TrashComponent,
        TreeNodeDetailsComponent,
        GmInportDetailsComponent,
        GmProcessInportDetailsComponent,
        GmOutportDetailsComponent,
        GmProcessOutportDetailsComponent,
        GmProcessDetailsComponent,
        GmVariableReferenceDetailsComponent,
        // FC component
        ForecastEditorComponent,
        ForecastGraphComponent,
        GraphMetricsComponent,
        VariableFilterComponent,
        SpreadsheetEntryComponent,
        VariableEditorComponent,
        VariableCreatorComponent,
        VariableCellComponent,
        SubframeLabelCellComponent,
        SubframeCellComponent,
        HeaderCellComponent,
        FrameEditorComponent,
        FrameCellComponent,
        CellResizeHandlerComponent,
        BlankCellComponent,
        ActualProjectedToggleComponent,
        EditActualValueComponent,
        TimesegmentEditComponent,
        TimeSegDistributionComponent,
        ExpressionEditComponent,
        ConstantEditComponent,
        RealTypeComponent,
        IntegerTypeComponent,
        BreakdownTypeComponent,
        AssociateBreakdownVariableComponent,
        SubvariableLineComponent,
        InlineEditComponent,
        TypeSelectComponent,
        SubframeEditorComponent,
        VersionEditorComponent,
        ReleaseEditorComponent,
        SettingsComponent,
        NavBarComponent
    ]
})
export class CptModule { }
