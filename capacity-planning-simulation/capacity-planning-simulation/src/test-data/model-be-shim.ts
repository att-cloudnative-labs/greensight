import { Process, GraphModel, SimulationConfiguration, SimulationResult } from '@cpt/capacity-planning-simulation-types';
;
import { testGraphModels } from './graph-models';


export function fetchModel(id: string, version?: string): Promise<{ version: string, gm: GraphModel }> {

    return new Promise<{ version: string, gm: GraphModel }>((resolve, reject) => {
        if (testGraphModels[id]) {
            resolve({ version: "latest", gm: testGraphModels[id] });
        } else {
            reject("no such model");
        }
    });
}
