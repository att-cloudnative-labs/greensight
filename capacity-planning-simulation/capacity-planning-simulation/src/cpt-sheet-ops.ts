import {
    CptSimulationHarness,
    SheetProjectionLibrary,
    SheetVariableLibrary,
    VersionedDependency
} from "./cpt-simulation-harness";
import { renderProjections, Variable, VariableProjections, VariableType } from '@cpt/capacity-planning-projection';
import {
    Aspect,
    AspectParam, InportParam, NumberParam, RandomNumberParam,
    SimulationConfiguration, SimulationScenario
} from "@cpt/capacity-planning-simulation-types/lib";
import { isVarRef, makeBreakdownRelative } from "./cpt-load-ops";

export class CptSheetOps {
    public static projectSheets(svl: SheetVariableLibrary, stepStart: string, stepLast: string): SheetProjectionLibrary {
        let sheetProjection: SheetProjectionLibrary = {};
        for (const sheetId in svl) {
            for (const sheetVersion in svl[sheetId]) {
                const variables = svl[sheetId][sheetVersion];
                let projection = renderProjections(variables, stepStart, stepLast);
                if (projection instanceof Error) {
                    // todo handle err
                } else {
                    if (!sheetProjection[sheetId]) {
                        sheetProjection[sheetId] = {};
                    }
                    sheetProjection[sheetId][sheetVersion] = projection;
                }
            }
        }
        return sheetProjection;
    }

    public static getVariableValue(variable: Variable, proj: VariableProjections, date: string): InportParam | Error {
        if (!variable) {
            return Error("Variable does not exist");
        }
        if (!proj) {
            return Error("No projection");
        }
        let variableId = variable.id;
        let varFrames = proj[variableId];
        if (varFrames) {
            for (let frame of varFrames) {
                if (frame.date === date) {
                    if (frame.distributionCalculationError === undefined && frame.frameDependencyError === undefined && frame.projectionCalculationError === undefined) {
                        if (frame.actualValue === undefined && frame.projectedValue === undefined) {
                            return {
                                type: 'NUMBER',
                                unit: frame.unit,
                                value: 0,
                                aspects: []
                            };
                        } else if (variable.variableType === VariableType.Breakdown) {
                            let aspectParam: AspectParam = {
                                type: 'ASPECT',
                                value: {
                                    name: variable.name,
                                    relative: false,
                                    slices: {}
                                }
                            };
                            for (let subFrame of frame.subFrames) {
                                aspectParam.value.slices[subFrame.name] = subFrame.value;
                            }
                            aspectParam.value = makeBreakdownRelative(aspectParam.value);
                            return aspectParam;
                        } else {
                            let rv: InportParam;
                            if (frame.distribution !== undefined && frame.distribution.stdDev != 0) {
                                rv = {
                                    type: 'RANDOM',
                                    unit: frame.unit,
                                    distr: 'NORMAL', // The forecast module only supports normal distributions
                                    distrDescr: {},
                                    aspects: []
                                } as RandomNumberParam;
                                rv.distrDescr['mean'] = frame.actualValue !== undefined ? frame.actualValue : frame.projectedValue;
                                rv.distrDescr['stddev'] = frame.distribution.stdDev;
                            }
                            else {
                                rv = {
                                    type: 'NUMBER',
                                    unit: frame.unit,
                                    value: frame.actualValue !== undefined ? frame.actualValue : frame.projectedValue,
                                    aspects: []
                                } as NumberParam;
                            }
                            if (frame.associatedBreakdowns !== undefined) {
                                for (let associatedBreakdown of frame.associatedBreakdowns) {
                                    let aspect: Aspect = {
                                        relative: true,
                                        name: associatedBreakdown.name,
                                        slices: {}
                                    }
                                    for (let sliceName in associatedBreakdown.slices) {
                                        let slice = associatedBreakdown.slices[sliceName];
                                        aspect.slices[sliceName] = slice;
                                    }
                                    if (rv.aspects === undefined) {
                                        rv.aspects = [];
                                    }
                                    rv.aspects.push(aspect);
                                }
                            }
                            return rv;
                        }
                    }
                    break;
                }
            }
        }
        return Error("could not find variable value for " + variableId + ":" + date);
    }

    public static getVariableFromProjections(svl: SheetVariableLibrary, sheetId: string, sheetVersion: string, variableId: string): Variable {
        let variables = svl[sheetId][sheetVersion];
        for (let v of variables) {
            if (v.id === variableId) {
                return v;
            }
        }
        return null;
    }

    public static getNeededSheetDeps(config: SimulationConfiguration, scenario: SimulationScenario): VersionedDependency[] {
        let forecastSheetDeps: VersionedDependency[] = [];
        for (let inportId in scenario.inports) {
            let inportParam = scenario.inports[inportId];
            if (isVarRef(inportParam)) {
                const p = inportParam;
                const sheetRef = config.forecasts[p.sheetRefId];
                const sheetVersion = CptSimulationHarness.getReferenceTrackingVersion(sheetRef);
                if (!forecastSheetDeps.find(dep => dep.id === sheetRef.ref && dep.version === sheetVersion)) {
                    forecastSheetDeps.push({ id: sheetRef.ref, version: sheetVersion, name: sheetRef.label });
                }
            }
        }
        return forecastSheetDeps;
    }
}
