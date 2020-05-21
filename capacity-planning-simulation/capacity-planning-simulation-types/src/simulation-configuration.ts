import {
    AspectParam,
    NumberParam,
    StringParam,
    BooleanParam,
    DateParam,
    ParamType, RandomNumberParam
} from './param';
import { ReleaseTrackingUidObject, UidObject, TrackingModes } from './object';


export interface ForecastVariableRefParam {
    type: 'FORECAST_VAR_REF';
    name: string;
    variableId: string;
    sheetRefId: string;
    unit?: string;
}

export type InportParam = AspectParam | NumberParam | StringParam | BooleanParam | DateParam | RandomNumberParam;

export interface SimulationScenario extends UidObject {
    // from UidObject
    objectId: string;
    objectType: 'SIMULATION_SCENARIO';

    name: string;
    disabled?: boolean;
    inports: { [inportId: string]: InportParam | ForecastVariableRefParam };
}

export type SimulationReportTypes = 'AGGREGATED';

export interface ForecastSheetReference extends ReleaseTrackingUidObject {
    // from UidObject
    objectId: string;
    objectType: 'FC_SHEET_REF';

    // from ReleaseTrackingUidObject
    releaseNr?: number;
    tracking?: TrackingModes;
    ref: string;

    label?: string;

}

export interface SimulationConfiguration extends ReleaseTrackingUidObject {
    // from UidObject
    objectId: string;
    objectType: 'SIMULATION_CONFIGURATION';

    // from ReleaseTrackingUidObject
    releaseNr?: number;
    tracking?: TrackingModes;
    ref: string;

    metadata?: any;

    modelVersion?: string;
    modelName?: string;
    monteCarloIterations?: number;
    inports?: { [inportId: string]: { types: ParamType[], name: string } };
    forecasts?: { [fcrefId: string]: ForecastSheetReference };

    // first simulation step date to be simulated
    stepStart: string;
    // last simulation step date to be simulated
    stepLast: string;

    // what report to generate on the simulation
    // only AGGREGATED supported for now.
    reportType: SimulationReportTypes;

    scenarios: { [scenarioId: string]: SimulationScenario };

}
