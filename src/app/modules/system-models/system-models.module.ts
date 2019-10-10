import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxsModule } from '@ngxs/store';
import { AngularSplitModule } from 'angular-split';
import { AngularFontAwesomeModule } from 'angular-font-awesome';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { DpDatePickerModule } from 'ng2-date-picker';

// Shared
import { DockableViewportComponent } from '@app/shared/components/dockable-ui/dockable-viewport/dockable-viewport.component';
import { DockableSplitComponent } from '@app/shared/components/dockable-ui/dockable-split/dockable-split.component';
import { DockableStackComponent } from '@app/shared/components/dockable-ui/dockable-stack/dockable-stack.component';
import { DockablePanelComponent } from '@app/shared/components/dockable-ui/dockable-panel/dockable-panel.component';
import { FilterDropdownComponent } from '@app/shared/components/filter-dropdown/filter-dropdown.component';
import { FilterDropdownListComponent } from '@app/shared/components/filter-dropdown/filter-dropdown-list/filter-dropdown-list.component';
import { TypeaheadComboboxComponent } from '@app/shared/components/typeahead-combobox/typeahead-combobox.component';
import { TypeaheadSearchComponent } from '@app/shared/components/typeahead-combobox/typeahead-search/typeahead-search.component';
import { TypeaheadSearchResultComponent } from '@app/shared/components/typeahead-combobox/typeahead-search/typeahead-search-result/typeahead-search-result.component';

// Local
import { states } from './state/index';
import { dockableComponents } from './components/dockable-components';
import { detailsPanelComponents } from './components/details/details-panel-components';
import { SystemModelsRoutingModule } from './system-models-routing.module';
import { SystemModelsPageComponent } from './components/system-models-page/system-models-page.component';
import { LibraryComponent } from './components/library/library.component';
import { SearchFilterComponent } from './components/search-filter/search-filter.component';
import { LibraryFolderComponent } from './components/library/library-folder/library-folder.component';
import { SimulationService } from './services/simulation.service';
import { LibraryGraphModelComponent } from './components/library/library-graph-model/library-graph-model.component';
import { DetailsComponent } from './components/details/details.component';
import { LibraryGraphModelTemplateComponent } from './components/library/library-graph-model-template/library-graph-model-template.component';
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
import { LibraryGraphModelTemplatePopupMenuComponent } from './components/library/library-graph-model-template/library-graph-model-template-popup-menu/library-graph-model-template-popup-menu.component';
import { LibrarySimulationPopupMenuComponent } from './components/library/library-simulation/library-simulation-popup-menu/library-simulation-popup-menu.component';
import { LibrarySimulationResultPopupMenuComponent } from './components/library/library-simulation-result/library-simulation-result-popup-menu/library-simulation-result-popup-menu.component';

import { NgWormholeModule } from 'ng-wormhole';
import { UtilsModule } from '@app/utils_module/utils.module';
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
import { GraphProcessingElementSearchComponent } from './components/system-model-app/graph-model-editor/graph-processing-element-search/graph-processing-element-search.component';
import { GraphSearchResultComponent } from './components/system-model-app/graph-model-editor/graph-processing-element-search/graph-search-result/graph-search-result.component';
import { GraphNodeDirective } from './components/graph-model-editor/graph-node.directive';
import { SimulationEditorComponent } from './components/simulation/simulation-editor/simulation-editor.component';
import { SimulationScenarioTableComponent } from './components/simulation/simulation-editor/simulation-scenario-table/simulation-scenario-table.component';
import { SimulationScenarioTableRowComponent } from './components/simulation/simulation-editor/simulation-scenario-table/simulation-scenario-table-row/simulation-scenario-table-row.component';
import { GmInportDetailsComponent } from './components/details/gm-inport-details/gm-inport-details.component';
import { TreeNodeDetailsComponent } from './components/details/tree-node-details/tree-node-details.component';
import { GmManualSaveComponent } from './components/graph-model-editor/graph-control-bar/gm-manual-save/gm-manual-save.component';
import { SimulationTimelineComponent } from './components/simulation/simulation-editor/simulation-timeline/simulation-timeline.component';
import { GmOutportDetailsComponent } from './components/details/gm-outport-details/gm-outport-details.component';
import { ForecastUnitService } from './services/forecast-unit.service';
import { GmProcessInportDetailsComponent } from './components/details/gm-process-inport-details/gm-process-inport-details.component';
import { GmPortTemplateButtonsComponent } from './components/graph-model-editor/gm-port-template-buttons/gm-port-template-buttons.component';
import { SimulationResultComponent } from './components/simulation/simulation-result/simulation-result.component';
import { GmProcessOutportDetailsComponent } from './components/details/gm-process-outport-details/gm-process-outport-details.component';
import { BreakdownEditorComponent } from './breakdown-editor/breakdown-editor.component';
import { BreakdownEditorRowComponent } from './breakdown-editor-row/breakdown-editor-row.component';
import { GmProcessDetailsComponent } from './components/details/gm-process-details/gm-process-details.component';
import { SrTreeComponent } from './components/simulation/simulation-result/sr-tree/sr-tree.component';
import { SrTreeNodeComponent } from './components/simulation/simulation-result/sr-tree-node/sr-tree-node.component';
import { ResultDataTableComponent } from './components/simulation/simulation-result/result-data-table/result-data-table.component';
import { ResultDataTableRowComponent } from './components/simulation/simulation-result/result-data-table/result-data-table-row/result-data-table-row.component';
import { ResultValueCellComponent } from './components/simulation/simulation-result/result-data-table/result-data-table-row/result-value-cell/result-value-cell.component';
import { VariableNameCellComponent } from './components/simulation/simulation-result/result-data-table/variable-name-cell/variable-name-cell.component';

// Simulation Result Screen Graphs
import { NgxEchartsModule } from 'ngx-echarts';
import { SimulationResultStackedChartComponent } from './components/simulation/simulation-result/sr-visualization/simulation-result-stacked-chart/simulation-result-stacked-chart.component';
import { SrVisualizationComponent } from './components/simulation/simulation-result/sr-visualization/sr-visualization.component';
import { SimulationResultHistogramComponent } from './components/simulation/simulation-result/sr-visualization/simulation-result-histogram/simulation-result-histogram.component';
import { SimulationResultBreakdownChartComponent } from './components/simulation/simulation-result/sr-visualization/simulation-result-breakdown-chart/simulation-result-breakdown-chart.component';
import { SimulationResultTimeSeriesChartComponent } from './components/simulation/simulation-result/sr-visualization/simulation-result-time-series-chart/simulation-result-time-series-chart.component';
import { SrErrorWarningListComponent } from './components/simulation/simulation-result/sr-error-warning-list/sr-error-warning-list.component';
import { SrErrorWarningItemComponent } from './components/simulation/simulation-result/sr-error-warning-list/sr-error-warning-item/sr-error-warning-item.component';
import { SrVariablePickerComponent } from './components/simulation/simulation-result/sr-variable-picker/sr-variable-picker.component';
import { GmVariablePickerComponent } from './components/graph-model-editor/gm-variable-picker/gm-variable-picker.component';
import { GmBroadcastVariableComponent } from './components/graph-model-editor/gm-broadcast-variable/gm-broadcast-variable.component';
import { GmNamedVariableComponent } from './components/graph-model-editor/gm-named-variable/gm-named-variable.component';
import { GmVariableReferenceDetailsComponent } from './components/details/gm-variable-reference-details/gm-variable-reference-details.component';
import { SrValueDisplayComponent } from './components/simulation/simulation-result/sr-visualization/sr-value-display/sr-value-display.component';
import { UserPickerComponent } from './components/user-picker/user-picker.component';
import { UserPickerSearchComponent } from './components/user-picker/user-picker-search/user-picker-search.component';

@NgModule({
    imports: [
        CommonModule,
        SystemModelsRoutingModule,
        NgxsModule.forFeature(states),
        NgWormholeModule,
        AngularSplitModule.forRoot(),
        AngularFontAwesomeModule,
        FormsModule,
        ReactiveFormsModule,
        AngularSvgIconModule,
        UtilsModule,
        DpDatePickerModule,
        NgxEchartsModule
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
        LibraryGraphModelTemplatePopupMenuComponent,
        LibraryComponent,
        LibraryGraphModelComponent,
        LibraryGraphModelTemplateComponent,
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
        GmManualSaveComponent,
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
        UserPickerSearchComponent
    ],
    providers: [
        AngularSvgIconModule,
        ForecastUnitService,
        SimulationService,
        LibraryComponent
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
        GmVariableReferenceDetailsComponent
    ]
})
export class SystemModelsModule { }
