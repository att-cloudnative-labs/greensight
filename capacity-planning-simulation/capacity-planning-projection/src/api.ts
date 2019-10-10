import { Frame, FrameRenderContext, AssociatedBreakdown } from './frame';
import { Variable, VariableType } from './variable';
import { TimeSegment } from './timesegment';
import { getMonths } from './date';

function renderFrame(variable: Variable, date: string, timeSegment: TimeSegment | undefined, renderContext: FrameRenderContext): Frame {
    let f = new Frame(date, variable.unit);
    if (timeSegment !== undefined) {
        f = timeSegment.calculate(date, variable, renderContext);
    } else {
        // breakdown variable use the default breakdown, when there is no
        // timesegment
        if (variable.variableType == VariableType.Breakdown && variable.defaultBreakdown){
            for (let bdName in variable.defaultBreakdown) {
                f.addSubframe(bdName, variable.defaultBreakdown[bdName]);
            }
        }
    }
    if (variable.actuals) {
        let a = variable.actuals.filter(a => a.date == date).pop();
        if (a) {
            f.actualValue = a.value;
        }
    }
    if (variable.breakdownIds) {
        for (let bd of variable.breakdownIds) {
            // they should be in the renderContext
            let breakdownFrame = renderContext.renderState[bd].f;
            let breakdownVariable = renderContext.renderState[bd].v;
            if (breakdownFrame && breakdownFrame.subFrames) {
                let associatedBreakdown: AssociatedBreakdown = {
                    id: breakdownVariable.id,
                    name: breakdownVariable.name,
                    slices: {}
                };
                for (let bd of breakdownFrame.subFrames) {
                    let name = breakdownVariable.name + "." + bd.name;
                    let value = 0;
                    associatedBreakdown.slices[bd.name] = bd.value;
                    if (f.actualValue !== undefined) {
                        value = bd.value * f.actualValue;
                    } else if (f.projectedValue !== undefined) {
                        value = bd.value * f.projectedValue;
                    }
                    f.addSubframe(name, value);
                }
                if (f.associatedBreakdowns === undefined){
                    f.associatedBreakdowns = [];
                }
                f.associatedBreakdowns.push(associatedBreakdown);
            }
        }
    }
    return f;
}

export type onRenderFrameCb = (frame: Frame, variable: Variable, date: string, timeSegment?: TimeSegment) => Frame;
export type onResultCb = (e?: Error, vp?: VariableProjections) => any;
export type VariableProjections = { [varId: string]: Frame[] }

/**
 * Main API entrypoint
 * Project variable values in the timespan between start- and endDate.
 * Variables have timesegments that define their values. renderProjections returns a Frame with the
 * variables values per timeinstance in the given timespan (at the moment strictly month based).
 *
 * @param variables the variable to project
 * @param startDate start projection from this date (inclusive, format: "2021-02" for February 2021)
 * @param endDate end projection at this date (inclusive, format: "2021-02" for February 2021)
 * @param options onRenderFrame: get called when a frame for a variable has been rendered, onResultCb: get called when
 the whole projection has been rendered (or an error occured)
 * @returns Error when the date range given is empty or invalid
 * @returns VariableProjections otherwise. There will be a frame for each timeinstance of each variable. If the
 *          variable is not defined there the frame will be empty.
 *          If certain frames could not be computed the appropiate error-fields
 *          inside the frame are set.
 */
export function renderProjections(variables: Variable[], startDate: string, endDate: string, options?: { onRenderFrame?: onRenderFrameCb, onResult?: onResultCb }): VariableProjections | Error {

    function errOut(msg?: string): Error {
        let e = new Error(msg);
        if (options && options.onResult) {
            options.onResult(e);
        }
        return e;
    }

    let vp: VariableProjections = {};

    let dateRange = getMonths(startDate, endDate);
    if (dateRange.length == 0) {
        return errOut("no valid date range given. expecting 2018-01, 2018-09");
    }

    variables.forEach(v => vp[v.id] = []);
    let previousRenderCtx: FrameRenderContext | undefined = undefined;


    for (let date of getMonths(startDate, endDate)) {
        let renderCtx = new FrameRenderContext(variables);

        renderCtx.renderInOrder(date, previousRenderCtx, (rs) => {
            let f = new Frame(date);
            if (rs.dependencyError) {
                // error while calculating the dependecies
                f.frameDependencyError = rs.dependencyError.message;
            } else {
                f = renderFrame(rs.v, date, rs.ts, renderCtx);
            }
            if (options && options.onRenderFrame) {
                f = options.onRenderFrame(f, rs.v, date, rs.ts);
            }
            rs.f = f;
            vp[rs.v.id].push(f);
        });

        previousRenderCtx = renderCtx;
    }
    if (options && options.onResult) {
        options.onResult(undefined, vp);
    }
    return vp;
}

/**
 * Returns results from renderProjections as CSV file contents.
 * @param variables the variable to project
 * @param startDate start projection from this date (inclusive, format: "2021-02" for February 2021)
 * @param endDate end projection at this date (inclusive, format: "2021-02" for February 2021)
 * @param precision nr of float digits in the output for real variables. default: 2
 * @returns Error when the date range given is empty or invalid
 * @returns String representing comma delimited CSV file representing the results of RenderProjections. Breakdown variables are omitted.
 */
export function renderProjectionsCsv(variables: Variable[], startDate: string, endDate: string, precision?: number): string | Error {

    // simplistic function to turn number into
    // string with configurable digits precision if
    // it's a floating point value. plain integers otherwise.
    function logNumber(n: number, p?: number): string {
        let precision = 2;
        if (p !== undefined && p >= 0) {
            precision = Math.round(p);
        }
        if (n % 1) {
            return n.toFixed(precision).toString();
        } else
            return n.toString();
    }
    let variableProjections = renderProjections(variables, startDate, endDate);
    if (variableProjections instanceof Error) {
        return variableProjections;
    }

    let csvString = "";
    csvString += "Variable,Type,Breakdown,\"Actual\/Projection\"";

    for (let date of getMonths(startDate, endDate)) {
        csvString += "," + date;
    }

    for (let v of variables) {
        let vHasActuals = false;
        // let vSubFrames = { };
        type Dict = { [key: string]: number };
        let vSubFrames: Dict = {};


        if (v.variableType !== VariableType.Breakdown && variableProjections[v.id] !== undefined) {
            // force variable precision for integer to 0.
            let variablePrecision = v.variableType === VariableType.Integer ? 0 : precision;
            csvString += "\n\"";
            csvString += v.name;
            csvString += "\",";
            csvString += v.variableType.toLowerCase();
            csvString += ",,projection";
            for (let f of variableProjections[v.id]) {
                //Evaluate frame to determine if actuals exist at any given point in time
                if (f.actualValue !== undefined) {
                    vHasActuals = true;
                }
                //Evaluate frame to determine the set of all sub-frames that exist from startDate to endDate
                if (f.subFrames !== undefined) {
                    // for (let k = 0; k < f.subFrames.length; k++) {
                    //     vSubFrames[f.subFrames[k].name] = undefined;
                    // }
                    for (let s of f.subFrames) {
                        vSubFrames[s.name] = 1;
                    }
                }

                //Print the variable's projection
                if (f.frameDependencyError || f.projectionCalculationError || f.distributionCalculationError) {
                    csvString += ",Err";
                }
                else if (f.projectedValue !== undefined) {
                    csvString += ", " + logNumber(f.projectedValue, variablePrecision);
                }
                else {
                    csvString += ",";
                }
            }
            //Print actuals
            if (vHasActuals) {
                csvString += "\n\"";
                csvString += v.name;
                csvString += "\",";
                csvString += v.variableType.toLowerCase();
                csvString += ",,actual";
                for (let f of variableProjections[v.id]) {
                    //Print the variable's actuals
                    if (f.actualValue !== undefined) {
                        csvString += ", " + logNumber(f.actualValue, variablePrecision);
                    }
                    else {
                        csvString += ",";
                    }
                }
            }
            //Print breakdowns
            for (let sf in vSubFrames) {
                let hasActuals = false;
                //Print projections first
                csvString += "\n\"";
                csvString += v.name;
                csvString += "\",";
                csvString += v.variableType.toLowerCase();
                csvString += ",";
                csvString += sf;
                csvString += ",projection";
                for (let f of variableProjections[v.id]) {
                    if (f.actualValue !== undefined) {
                        csvString += ",";
                        hasActuals = true;
                    }
                    else {
                        let value = undefined;
                        if (f.projectedValue !== undefined && f.subFrames !== undefined) {
                            for (let s of f.subFrames) {
                                if (s.name === sf) {
                                    value = s.value;
                                    break;
                                }
                            }
                        }
                        if (value !== undefined) {
                            csvString += ", " + logNumber(value, variablePrecision);
                        }
                        else {
                            csvString += ",";
                        }
                    }
                }
                //Then do actuals
                if (hasActuals) {
                    csvString += "\n\"";
                    csvString += v.name;
                    csvString += "\",";
                    csvString += v.variableType.toLowerCase();
                    csvString += ",";
                    csvString += sf;
                    csvString += ",actual";
                    for (let f of variableProjections[v.id]) {
                        if (f.actualValue === undefined) {
                            csvString += ",";
                        }
                        else {
                            let value = undefined;
                            if (f.subFrames !== undefined) {
                                for (let s of f.subFrames) {
                                    if (s.name === sf) {
                                        value = s.value;
                                        break;
                                    }
                                }
                            }
                            if (value !== undefined) {
                                csvString += ", " + logNumber(value, variablePrecision);
                            }
                            else {
                                csvString += ",";
                            }
                        }
                    }
                }
            }
        }
        if (v.variableType === VariableType.Breakdown && variableProjections[v.id] !== undefined) {
            // force variable precision for integer to 0.
            let variablePrecision = precision;
            for (let f of variableProjections[v.id]) {
                //Evaluate frame to determine the set of all sub-frames that exist from startDate to endDate
                if (f.subFrames !== undefined) {
                    // for (let k = 0; k < f.subFrames.length; k++) {
                    //     vSubFrames[f.subFrames[k].name] = undefined;
                    // }
                    for (let s of f.subFrames) {
                        vSubFrames[s.name] = 1;
                    }
                }
            }
            //Print breakdowns
            for (let sf in vSubFrames) {
                csvString += "\n\"";
                csvString += v.name;
                csvString += "\",";
                csvString += v.variableType.toLowerCase();
                csvString += ",";
                csvString += sf;
                csvString += ",";
                for (let f of variableProjections[v.id]) {
                    let value = undefined;
                    if (f.subFrames !== undefined) {
                        for (let s of f.subFrames) {
                            if (s.name === sf) {
                                value = s.value;
                                break;
                            }
                        }
                    }
                    if (value !== undefined && value != null) {
                        csvString += ", " + logNumber(value*100, variablePrecision) + "%";
                    }
                    else {
                        csvString += ",";
                    }
                }
            }
        }
    }
    return csvString;
}
