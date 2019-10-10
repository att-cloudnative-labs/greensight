import { Variable } from '@cpt/capacity-planning-projection';
import { testForecastVariables } from './forcast-variables';

export function fetchBranchVariables(branchId: string): Promise<Variable[]> {

    let p = new Promise<Variable[]>((resolve, reject) => {
        if (testForecastVariables[branchId]) {
            resolve(testForecastVariables[branchId]);
        } else {
            reject("no such branch");
        }
    });
    return p;
}

export function emptyFetchBranchVariables(branchId: string): Promise<Variable[]> {

    let p = new Promise<Variable[]>((resolve, reject) => {
        reject("no such branch");
    });
    return p;
}
