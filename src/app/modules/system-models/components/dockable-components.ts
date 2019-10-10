/*
* The purpose of this file is to ensure that the dockable ui can render the appropriate
* component in the right stack. This file is used to:
*   A) map state strings to component classes
*   B) ensure these are loaded on NgModules entryComponents
*/
import { LibraryComponent } from '@system-models/components/library/library.component';
import { GraphModelEditorComponent } from '@system-models/components/graph-model-editor/graph-model-editor.component';
import { DetailsComponent } from '@system-models/components/details/details.component';
import { HistoryComponent } from '@system-models/components/history/history.component';
import { TrashComponent } from './trash/trash.component';
import { SimulationEditorComponent } from '@system-models/components/simulation/simulation-editor/simulation-editor.component';
import { SimulationResultComponent } from '@system-models/components/simulation/simulation-result/simulation-result.component';

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
    'TrashComponent': TrashComponent
};

export const dockableComponents = Object.values(dockableComponentsMap);
