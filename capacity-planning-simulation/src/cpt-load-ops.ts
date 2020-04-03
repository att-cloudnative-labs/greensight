import { GraphParam, NumberParam, AspectNumberParam, Aspect, NormalDistNumberParam, StringParam, AspectParam, BooleanParam } from '@cpt/capacity-planning-simulation-types';
import { add } from './cpt-math-ops';
import { ForecastVariableRefParam, InportParam } from "@cpt/capacity-planning-simulation-types/lib";

export type NumberType = NumberParam | AspectNumberParam | NormalDistNumberParam

export function isNumber(param: GraphParam): param is NumberType {
    return param && (param.type === 'NUMBER' || param.type === 'ASPECT_NUMBER' || param.type === 'NORMAL_DIST_NUMBER');
}

export function isAspectNumber(param: GraphParam): param is AspectNumberParam {
    return param && param.type === 'ASPECT_NUMBER' && param.aspects !== undefined && param.aspects.length > 0;
}

export function isDistNumber(param: GraphParam): param is NormalDistNumberParam {
    return param && param.type === 'NORMAL_DIST_NUMBER';
}


export function asAspectNumber(param: NumberType): AspectNumberParam {
    if (isAspectNumber(param)) {
        return param;
    }
    return {
        type: 'ASPECT_NUMBER',
        value: param.value,
        unit: param.unit,
        aspects: [],
        stdDev: param.type === 'NORMAL_DIST_NUMBER' ? param.stdDev : undefined
    };
}

export function asDistNumber(param: NumberType): NormalDistNumberParam {
    if (isDistNumber(param)) {
        return param;
    }
    return {
        type: 'NORMAL_DIST_NUMBER',
        value: param.value,
        unit: param.unit,
        stdDev: param.type === 'ASPECT_NUMBER' ? param.stdDev : undefined
    };
}

export function hasUnit(param: GraphParam): param is NumberType {
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

export function aggregateLoad(loads: GraphParam[]): GraphParam {
    if (loads && loads.length > 0) {
        if (loads.length === 1) {
            return loads[0];
        }
        let numLoads = loads.filter(l => isNumber(l));
        if (numLoads.length > 0) {
            let sum = numLoads[0];
            for (let num of numLoads.slice(1)) {
                sum = add(sum, num);
            }
            return sum;
        }
        return loads[0];
    }
    return null;
}

export function dupl(load: GraphParam): GraphParam {
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

export function scaleAspect(scaleTo: number, aspect: Aspect): Aspect {
    let scaledAspect: Aspect = {
        type: 'BREAKDOWN',
        name: aspect.name,
        slices: {}
    };
    let sliceSum: number = getSliceSum(aspect);
    if (sliceSum) {
        let scale = Math.abs(scaleTo) / sliceSum;
        for (let sliceName in aspect.slices) {
            scaledAspect.slices[sliceName] = aspect.slices[sliceName] * scale;
        }
    }
    return scaledAspect;
}

// take a relative aspect and turn in into an absolute one
// FIXME: this almost identical to scaleAspect
export function applyAspect(aVal: number, aspect: Aspect): Aspect {
    if (!aspect.relative) {
        return aspect;
    }
    if (aspect.type === 'TAG') {
        let slices: { [sliceName: string]: number } = {};
        slices[aspect.name] = aVal;
        return {
            type: 'TAG',
            name: aspect.name,
            slices: slices
        }
    } else if (aspect.type === 'BREAKDOWN') {
        let appliedBreakdown: Aspect = {
            type: 'BREAKDOWN',
            name: aspect.name,
            slices: {}
        }
        let sliceSum: number = getSliceSum(aspect);
        let scale = Math.abs(aVal) / sliceSum;
        for (let sliceName in aspect.slices) {
            appliedBreakdown.slices[sliceName] = aspect.slices[sliceName] * scale;
        }
        return appliedBreakdown;
    }
}
export function applyAspects(aVal: number, aspects: Aspect[]): Aspect[] {
    let appliedAspects: Aspect[] = [];
    for (let aspect of aspects) {
        appliedAspects.push(applyAspect(aVal, aspect));
    }
    return appliedAspects;
}


function padAspect(val: number, aspect: Aspect): Aspect {
    let sliceSum = getSliceSum(aspect, true);
    if (val <= sliceSum) {
        return aspect;
    }
    let delta = val - sliceSum;
    if (aspect.type === 'TAG') {
        let slices: { [sliceName: string]: number } = {}
        slices[aspect.name] = sliceSum;
        slices['unknown'] = delta;
        return {
            type: 'TAG',
            name: aspect.name,
            slices: slices
        }
    } else if (aspect.type === 'BREAKDOWN') {
        let paddedBreakdown: Aspect = {
            type: 'BREAKDOWN',
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
}

function addSingleAspect(aAspect: Aspect, bAspect: Aspect): Aspect {
    if (aAspect.type !== bAspect.type) {
        throw new Error("can't add aspects with different types");
    }
    if (aAspect.name !== bAspect.name) {
        throw new Error("shouldnt't add aspects with different names");
    }
    let aSum = getSliceSum(aAspect);
    let bSum = getSliceSum(bAspect);
    let outAspect: Aspect = {
        type: aAspect.type,
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
    let appliedAAspects = applyAspects(aVal, aAspects);
    let appliedBAspects = applyAspects(bVal, bAspects);
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

export function filterAspects(aspects: Aspect[], aspectName: string, sliceName: string): Aspect[] {
    let resultAspects: Aspect[] = [];
    let filterAspect = aspects.filter(asp => asp.name === aspectName).pop();
    let auxAspects = aspects.filter(asp => asp.name !== aspectName);
    if (!filterAspect) {
        // fixme: or should we return all incoming aspects???
        return [];
    }
    if (filterAspect.slices[sliceName] === undefined) {
        return [];
    }

    let sliceVal = filterAspect.slices[sliceName];

    // omit for undefined slices
    // a breakdown with just undefined data doesnt make sense
    if (sliceName !== 'unknown') {
        let filteredAspect: Aspect = { type: filterAspect.type, name: filterAspect.name, slices: {} };
        filteredAspect.slices[sliceName] = sliceVal;
        resultAspects.push(filteredAspect);
    }
    for (let auxAspect of auxAspects) {
        resultAspects.push(scaleAspect(sliceVal, auxAspect));
    }
    return resultAspects;
}

export function filterAspectNum(aspectNum: AspectNumberParam, aspectName: string, sliceName: string): AspectNumberParam {
    let filterAspect = aspectNum.aspects.filter(a => a.name === aspectName).pop();
    if (filterAspect) {
        let filterSlice = filterAspect.slices[sliceName];
        if (filterSlice) {
            return {
                type: 'ASPECT_NUMBER',
                unit: aspectNum.unit,
                value: filterSlice,
                aspects: filterAspects(aspectNum.aspects, aspectName, sliceName),
                stdDev: aspectNum.stdDev
            };
        }
    }
    return null;
}

interface sliceRange {
    start: number;
    end: number;
    name: string;
}

function getRandomInt(min: number, max: number): number {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}


// select a  random slice name. driven by the relative sice
// of the slices
export function getRandomSliceName(aspect: Aspect): string {
    let sliceRanges: sliceRange[] = [];
    let index = 1;
    for (let sliceName in aspect.slices) {
        let sliceNum = Math.abs(aspect.slices[sliceName]);
        sliceRanges.push({ start: index, end: index + sliceNum - 1, name: sliceName });
        index += sliceNum;
    }
    if (sliceRanges.length) {
        let random = getRandomInt(1, index);
        for (let sr of sliceRanges) {
            if (random >= sr.start && random <= sr.end) {
                return sr.name;
            }
        }
    }
    return null;
}
