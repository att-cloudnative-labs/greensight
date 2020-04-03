/*
* The purpose of this file is to ensure that the details panel can render the appropriate
* component based on the selection. This file is used to:
*   A) map state strings to component classes
*   B) ensure these are loaded on NgModules entryComponents
*/
import { TreeNodeDetailsComponent } from '@app/modules/cpt/components/details/tree-node-details/tree-node-details.component';
import { GmInportDetailsComponent } from '@app/modules/cpt/components/details/gm-inport-details/gm-inport-details.component';
import { GmOutportDetailsComponent } from '@app/modules/cpt/components/details/gm-outport-details/gm-outport-details.component';
import { GmProcessInportDetailsComponent } from '@app/modules/cpt/components/details/gm-process-inport-details/gm-process-inport-details.component';
import { GmProcessOutportDetailsComponent } from '@app/modules/cpt/components/details/gm-process-outport-details/gm-process-outport-details.component';
import { GmProcessDetailsComponent } from '@app/modules/cpt/components/details/gm-process-details/gm-process-details.component';
import { GmVariableReferenceDetailsComponent } from '@app/modules/cpt/components/details/gm-variable-reference-details/gm-variable-reference-details.component';

/*
* Any components added to this map must also be added to the entryComponents array in
* the system-ModelBranchService.module.ts
*/
export const detailsPanelComponentsMap = {
    'TreeNodeDetailsComponent': TreeNodeDetailsComponent,
    'GmInportDetailsComponent': GmInportDetailsComponent,
    'GmProcessInportDetailsComponent': GmProcessInportDetailsComponent,
    'GmOutportDetailsComponent': GmOutportDetailsComponent,
    'GmProcessOutportDetailsComponent': GmProcessOutportDetailsComponent,
    'GmProcessDetailsComponent': GmProcessDetailsComponent,
    'GmVariableReferenceDetailsComponent': GmVariableReferenceDetailsComponent
};

export const detailsPanelComponents = Object.values(detailsPanelComponentsMap);
