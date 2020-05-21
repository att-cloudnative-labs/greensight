/*
* The purpose of this file is to ensure that the dockable ui can render the appropriate
* component in the right stack. This file is used to:
*   A) map state strings to component classes
*   B) ensure these are loaded on NgModules entryComponents
*/
import { LibraryComponent } from '@cpt/components/library/library.component';
import { GraphModelEditorComponent } from '@cpt/components/graph-model-editor/graph-model-editor.component';
import { DetailsComponent } from '@cpt/components/details/details.component';
import { HistoryComponent } from '@cpt/components/history/history.component';
import { TrashComponent } from './trash/trash.component';
import { SimulationEditorComponent } from '@cpt/components/simulation-editor/simulation-editor.component';
import { SimulationResultComponent } from '@cpt/components/simulation-result/simulation-result.component';
import { ForecastEditorComponent } from '@cpt/components/forecast-sheet-editor/forecast.editor.component';
import { VersionEditorComponent } from '@cpt/components/history/version-editor/version.editor.component';
import { ReleaseEditorComponent } from '@cpt/components/history/release-editor/release.editor.component';
import { SettingsEditorComponent } from '@cpt/components/settings/settings-editor-component';
import { UserEditorComponent } from '@cpt/components/user-editor/user-editor.component';
import { UserGroupEditorComponent } from '@cpt/components/user-group-editor/user-group-editor.component';


/*
* Any components added to this map must also be added to the entryComponents array in
* the system-ModelBranchService.module.ts
*/
export const dockableComponentsMap = {
    'LibraryComponent': LibraryComponent,
    'GraphModelEditorComponent': GraphModelEditorComponent,
    'SimulationEditorComponent': SimulationEditorComponent,
    'SimulationResultComponent': SimulationResultComponent,
    'DetailsComponent': DetailsComponent,
    'HistoryComponent': HistoryComponent,
    'TrashComponent': TrashComponent,
    'ForecastEditorComponent': ForecastEditorComponent,
    'VersionEditorComponent': VersionEditorComponent,
    'ReleaseEditorComponent': ReleaseEditorComponent,
    'SettingsEditorComponent': SettingsEditorComponent,
    'UserEditorComponent': UserEditorComponent,
    'UserGroupEditorComponent': UserGroupEditorComponent
};
