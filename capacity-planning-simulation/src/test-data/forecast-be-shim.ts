import { Variable } from '@cpt/capacity-planning-projection';
import { testForecastVariables } from './forcast-variables';

export function fetchSheetVariables(id: string, version?: string): Promise<{ version: string, variables: Variable[] }> {
    return new Promise<{ version: string, variables: Variable[] }>((resolve, reject) => {
        if (testForecastVariables[id]) {
            resolve({ variables: testForecastVariables[id], version: 'latest' });
        } else {
            reject("no such sheet");
        }


    });
}

export function emptyFetchBranchVariables(branchId: string): Promise<Variable[]> {

    let p = new Promise<Variable[]>((resolve, reject) => {
        reject("no such branch");
    });
    return p;
}
