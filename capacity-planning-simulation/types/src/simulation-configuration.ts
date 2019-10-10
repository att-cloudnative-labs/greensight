import { AspectParam, NumberParam, StringParam, BooleanParam, DateParam, NormalDistNumberParam, AspectNumberParam } from './param';
import { UidObject } from './object';


export interface ForecastVariableRefParam {
    type: 'FORECAST_VAR_REF';
    name: string;
    variableId: string;
    // forecast branch id for now
    forecastId: string;
    unit?: string;
}

export type InportParam = AspectParam | NumberParam | StringParam | BooleanParam | DateParam | NormalDistNumberParam | AspectNumberParam;

export interface SimulationScenario extends UidObject {
    // from UidObject
    objectId: string;
    objectType: 'SIMULATION_SCENARIO';

    name: string;
    disabled?: boolean;
    inports: { [inportId: string]: InportParam | ForecastVariableRefParam };
}

export type SimulationReportTypes = 'AGGREGATED';


export interface SimulationConfiguration extends UidObject {
    // from UidObject
    objectId: string;
    objectType: 'SIMULATION_CONFIGURATION';

    metadata?: any;

    modelRef: string;
    modelVersion?: string;
    monteCarloIterations?: number;

    // first simultation step date to be simulated
    stepStart: string;
    // last simulation step date to be simulated
    stepLast: string;

    // what report to generate on the simulation
    // only AGGREGATED supported for now.
    reportType: SimulationReportTypes;

    scenarios: { [scenarioId: string]: SimulationScenario };
}