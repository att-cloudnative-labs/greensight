import { from, Subject, Observable, Observer, of, throwError } from 'rxjs';
import { map, reduce, switchMap } from 'rxjs/operators';

import { SimulationConfiguration, SimulationResult, GraphModel } from '@cpt/capacity-planning-simulation-types';
import { CptSimulationHarness, getPeRepository } from '@cpt/capacity-planning-simulation';
import { Variable } from '@cpt/capacity-planning-projection';
import { ModelService } from './model-service';
import worker = require('worker_threads')




console.log("running worker thread");

let modelService = new ModelService();
let authToken = worker.workerData.authToken;
let simulationConfiguration: SimulationConfiguration = worker.workerData.config;
let simulationResult: SimulationResult = worker.workerData.result;


let sh = new CptSimulationHarness(
    (sheetId, version) => modelService.fetchSheet(authToken, sheetId, version).toPromise(),
    (graphModelId, version) => modelService.fetchModel(authToken, graphModelId, version).toPromise()
);

try {
    sh.runSimulationConfiguration(simulationConfiguration).then(sr => console.log(JSON.stringify(sr)), err => { console.log("failed to run simulation;" + err) });
} catch (e) {
    console.log("failed to run sim " + e);
}



