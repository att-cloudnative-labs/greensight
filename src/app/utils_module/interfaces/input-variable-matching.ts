import { BreakdownVariable } from './breakdownVariable';

export interface InputVariableMatching {
    inputVarId: string;
    inputVariableDisplayName: String;
    inputVariableName: string;
    unit: string;
    breakdowns: BreakdownVariable[];
    overriddenBreakdowns: string[];
    deviation: Float32Array;
    hasForecastMatch: boolean;
    forecastValue: Float32Array;
    forecastVarName: string;
    forecastVarId: String;
    overrideValue: String;

}
