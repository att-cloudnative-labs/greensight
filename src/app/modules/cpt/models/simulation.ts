/* TODO: Add other fields to do with simulation or remove this interface and use interface from cpt package instead*/
export interface Simulation {
    id: string;
    version: string;
    metadata?: any;
    ref?: string;
    monteCarloIterations?: number;
}
