import { GraphParam, NumberParam, Aspect, StringParam, AspectParam, BooleanParam } from '@cpt/capacity-planning-simulation-types';
import { add } from './cpt-math-ops';
import { ForecastVariableRefParam, InportParam, RandomNumberParam } from "@cpt/capacity-planning-simulation-types/lib";



export function isNumber(param: GraphParam | RandomNumberParam): param is NumberParam {
    return param && param.type === 'NUMBER';
}

export function hasAspect(param: NumberParam | RandomNumberParam): boolean {
    return param.aspects && param.aspects.length > 0;
}

export function isAspectNumber(param: GraphParam | RandomNumberParam): param is NumberParam {
    return isNumber(param) && hasAspect(param);
}

export function isRandomNumber(param: GraphParam | RandomNumberParam): param is RandomNumberParam {
    return param && param.type === 'RANDOM';
}

export function hasUnit(param: GraphParam): param is NumberParam {
    return isNumber(param) && param.unit !== undefined;
}

export function isString(param: GraphParam): param is StringParam {
    return param && param.type == 'STRING';
}

export function isAspect(param: GraphParam): param is AspectParam {
    return param && param.type == 'ASPECT';
}

export function isBoolean(param: GraphParam): param is BooleanParam {
    return param && (param.type === 'BOOLEAN');
}
export function isVarRef(param: InportParam | ForecastVariableRefParam): param is ForecastVariableRefParam {
    return param && (param.type === 'FORECAST_VAR_REF');
}

// aggregate numbers and booleans to a single param
// mainly used to generate a single value for each inport.
// if the params are mixed num and bool return num.
export function aggregateParams(params: GraphParam[]): GraphParam {
    if (params && params.length > 0) {
        if (params.length === 1) {
            return params[0];
        }
        const numParams = params.filter(l => isNumber(l));
        const boolParams = params.filter(l => isBoolean(l));
        const aggregateableParams = params.filter(l => isNumber(l) || isBoolean(l));


        if (numParams.length > 0) {
            let sum: NumberParam = {
                type: 'NUMBER',
                value: 0,
                aspects: []
            }
            let selectedUnits = false;
            for (let num of aggregateableParams) {
                if (isNumber(num)) {
                    sum = add(sum, num);
                    if (!selectedUnits) {
                        // Pick the unit of the first number provided in 'loads'. Needed here because add()
                        // picks the unit from the first argument
                        sum.unit = num.unit;
                        selectedUnits = true;
                    }
                }
                else if (isBoolean(num)) {
                    sum = add(sum, { type: 'NUMBER', value: num.value ? 1 : 0 });
                }
            }
            return sum;
        } else if (boolParams.length > 0) {
            let allTrue = true;
            for (const boolParam of boolParams) {
                if (isBoolean(boolParam)) {
                    allTrue = allTrue && boolParam.value;
                }
            }
            return { type: 'BOOLEAN', value: allTrue };

        }
        else {
            return params[0];
        }
    }
    return null;
}

export function cloneParam(load: GraphParam): GraphParam {
    return JSON.parse(JSON.stringify(load)) as GraphParam;
}

function getSliceSum(aspect: Aspect, ignoreUnknown?: boolean): number {
    let sliceSum: number = 0;
    for (let sliceName in aspect.slices) {
        // fixme: quick hack because sometimes string's where coming this way
        if (aspect.slices[sliceName]) {
            let sliceVal: number = parseFloat(aspect.slices[sliceName].toString());
            if (!ignoreUnknown || sliceName !== 'unknown') {
                sliceSum += sliceVal;
            }
        }
    }
    return sliceSum;
}

export function scaleBreakdown(scaleTo: number, breakdown: Aspect): Aspect {
    let res: Aspect = {
        name: breakdown.name,
        relative: false,
        slices: {}
    };
    let sliceSum: number = 0;
    for (let s in breakdown.slices) {
        sliceSum += breakdown.slices[s];
    }
    if (sliceSum === 0) sliceSum = 1;
    const scale = scaleTo / sliceSum;
    for (let s in breakdown.slices) {
        res.slices[s] = breakdown.slices[s] * scale;
    }
    return res;
}

export function scaleBreakdowns(aVal: number, breakdowns: Aspect[]): Aspect[] {
    let res: Aspect[] = [];
    for (let a of breakdowns) {
        res.push(scaleBreakdown(aVal, a));
    }
    return res;
}



function padAspect(val: number, aspect: Aspect): Aspect {
    let sliceSum = getSliceSum(aspect, true);
    if (val <= sliceSum) {
        return aspect;
    }
    let delta = val - sliceSum;
    let paddedBreakdown: Aspect = {
        name: aspect.name,
        slices: {
            unknown: delta
        }
    }
    for (let sliceName in aspect.slices) {
        if (sliceName !== 'unknown') {
            paddedBreakdown.slices[sliceName] = aspect.slices[sliceName];
        }
    }
    return paddedBreakdown;

}

function addSingleAspect(aAspect: Aspect, bAspect: Aspect): Aspect {
    if (aAspect.name !== bAspect.name) {
        throw new Error("shouldn't add aspects with different names");
    }
    let outAspect: Aspect = {
        name: aAspect.name,
        relative: aAspect.relative,
        slices: {}
    }
    for (let sliceName in aAspect.slices) {
        outAspect.slices[sliceName] = aAspect.slices[sliceName];
    }
    for (let sliceName in bAspect.slices) {
        if (outAspect.slices[sliceName]) {
            outAspect.slices[sliceName] += bAspect.slices[sliceName];
        } else {
            outAspect.slices[sliceName] = bAspect.slices[sliceName];
        }
    }
    return outAspect;

}

export function addAspects(aVal: number, aAspects: Aspect[], bVal: number, bAspects: Aspect[]): Aspect[] {
    let resultAspects: Aspect[] = [];
    let sum = Math.abs(aVal) + Math.abs(bVal);
    let appliedAAspects = scaleBreakdowns(aVal, aAspects);
    let appliedBAspects = scaleBreakdowns(bVal, bAspects);
    let commonAspectNames: string[] = [];
    for (let aAAspect of appliedAAspects) {
        if (appliedBAspects.filter(b => b.name === aAAspect.name).length) {
            commonAspectNames.push(aAAspect.name);
        }
    }
    for (let aspectName of commonAspectNames) {
        let a = appliedAAspects.filter(asp => asp.name === aspectName).pop();
        appliedAAspects = appliedAAspects.filter(asp => asp.name !== aspectName);
        let b = appliedBAspects.filter(asp => asp.name === aspectName).pop();
        appliedBAspects = appliedBAspects.filter(asp => asp.name !== aspectName);
        resultAspects.push(addSingleAspect(a, b));
    }
    for (let aspect of appliedAAspects) {
        resultAspects.push(padAspect(sum, aspect));
    }
    for (let aspect of appliedBAspects) {
        resultAspects.push(padAspect(sum, aspect));
    }
    return resultAspects;
}




export function filterByBreakdownSlice(val: NumberParam, breakdownName: string, sliceName: string): NumberParam {
    let res: NumberParam = {
        type: "NUMBER",
        unit: val.unit,
        value: 0,
        aspects: []
    }
    let filterAspect = val.aspects.filter(a => a.name === breakdownName).pop();
    if (!filterAspect) return res;
    let filterSlice = filterAspect.slices[sliceName];
    if (!filterSlice) return null;

    res.value = filterAspect.relative ? val.value * filterSlice : filterSlice;
    for (let a of val.aspects) {
        let asp: Aspect = {
            name: a.name,
            relative: a.relative,
            slices: {}
        }
        if (a.name === breakdownName) {
            asp.slices[sliceName] = a.relative ? 1 : res.value;
            res.aspects.push(asp);
        }
        else if (a.relative) {
            for (let s in a.slices) {
                asp.slices[s] = a.slices[s];
            }
            res.aspects.push(asp);
        }
        else {
            res.aspects.push(scaleBreakdown(res.value, a));
        }
    }

    return res;
}

export function makeBreakdownRelative(breakdown: Aspect): Aspect {
    if (breakdown.relative) {
        return breakdown;
    }

    let res: Aspect = {
        name: breakdown.name,
        relative: true,
        slices: {}
    };
    let sliceSum: number = 0;
    for (let s in breakdown.slices) {
        sliceSum += breakdown.slices[s];
    }
    if (sliceSum == 0) sliceSum = 1;
    for (let s in breakdown.slices) {
        res.slices[s] = breakdown.slices[s] / sliceSum;
    }
    return res;
}
