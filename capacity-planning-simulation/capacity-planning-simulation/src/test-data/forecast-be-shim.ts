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
