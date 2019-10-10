import { Process, GraphModel, SimulationConfiguration, SimulationResult } from '@cpt/capacity-planning-simulation-types';
import { Variable } from '@cpt/capacity-planning-projection';
import { testGraphModels } from './graph-models';

export function fetchModel(id: string, version?: string): Promise<GraphModel> {

    let p = new Promise<GraphModel>((resolve, reject) => {
        if (testGraphModels[id]) {
            resolve(testGraphModels[id]);
        } else {
            reject("no such model");
        }
    });
    return p;
}

export function emptyFetchModel(id: string, version?: string): Promise<GraphModel> {

    let p = new Promise<GraphModel>((resolve, reject) => {
        reject("no such model");
    });
    return p;
}
