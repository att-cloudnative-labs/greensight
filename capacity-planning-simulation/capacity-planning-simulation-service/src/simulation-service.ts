import { SimulationConfiguration, SimulationResult } from '@cpt/capacity-planning-simulation-types';
import { ModelService, TreeNode } from './model-service';
import { CptSimulationHarness } from '@cpt/capacity-planning-simulation';

export function runSimulationSync(authToken: string, sc: SimulationConfiguration, srTreeNode: TreeNode, logPrefix?: string) {

    let modelService = new ModelService();

    const logger = logPrefix ? (x: any) => console.log(`${logPrefix}${x}`) : console.log;

    let sh = new CptSimulationHarness(
        (sheetId, version) => modelService.fetchSheet(authToken, sheetId, version).toPromise(),
        (graphModelId, version) => modelService.fetchModel(authToken, graphModelId, version).toPromise(),
        logger
    );

    try {
        const sr: SimulationResult = srTreeNode.content as SimulationResult;
        sh.runSimulationConfiguration(sc, sr).then(() => {
            modelService.updateSimulationResult(authToken, srTreeNode).subscribe((tn) => { console.log("updated simulation result for done") }, err => { console.log("failed to update simulation result"); });
        }, err => {
            modelService.updateSimulationResult(authToken, srTreeNode).subscribe((tn) => { console.log("updated simulation result failed") }, err => { console.log("failed to update simulation result"); });
        });
    } catch (e) {
        console.log("failed to run sim " + e);
    }
}

