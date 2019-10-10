import { from, Subject, Observable, Observer, of, throwError } from 'rxjs';
import { SimulationConfiguration, SimulationResult } from '@cpt/capacity-planning-simulation-types';
import { ModelService, TreeNode } from './model-service';
import { CptSimulationHarness, getPeRepository } from '@cpt/capacity-planning-simulation';
import workers = require('worker_threads')

export class SimulationService {

    public runSimulation(authToken: string, sc: SimulationConfiguration, sr: SimulationResult) {
        let worker = new workers.Worker('./lib/simulation-worker.js', { workerData: { authToken: authToken, config: sc, result: sr } });
        worker.on('error', e => { console.log("sim err " + e) });
    }

    public runSimulationSync(authToken: string, sc: SimulationConfiguration, srTreeNode: TreeNode) {

        let modelService = new ModelService();

        let sh = new CptSimulationHarness(
            (branchId) => modelService.fetchBranchVariables(authToken, branchId).toPromise(),
            (graphModelId) => modelService.fetchModel(authToken, graphModelId).toPromise(),
            console.log
        );

        try {
            sh.runSimulationConfiguration(sc).then(srWithData => {
                let sr: SimulationResult = srTreeNode.content as SimulationResult;
                sr.nodes = {};
                for (let nodeId in srWithData.nodes) {
                    srWithData.nodes[nodeId].rawData = undefined;
                    srWithData.nodes[nodeId].rawResponses = undefined;
                }
                sr.nodes = srWithData.nodes;
                sr.scenarios = sc.scenarios;
                sr.state = 'DONE';
                modelService.updateSimulationResult(authToken, srTreeNode).subscribe((tn) => { console.log("updated simulation result") }, err => { console.log("failed to update simulation result"); });
            }, err => {
                console.log("failed to run simulation;" + err);
                let sr = srTreeNode.content as SimulationResult;
                sr.nodes = {};
                sr.scenarios = sc.scenarios;
                sr.error = err;
                sr.state = 'FAILED';
                modelService.updateSimulationResult(authToken, srTreeNode).subscribe((tn) => { console.log("updated simulation result") }, err => { console.log("failed to update simulation result"); });
            });
        } catch (e) {
            console.log("failed to run sim " + e);
        }
    }
}