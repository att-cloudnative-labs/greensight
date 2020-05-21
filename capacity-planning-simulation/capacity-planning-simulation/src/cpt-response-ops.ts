import {
    Aspect,
    GraphParam,
    ResponseAspect,
    ResponseNumberParam,
    ResponseValue,
    ResponseValueEntry
} from '@cpt/capacity-planning-simulation-types';
import { ResponseParam } from "@cpt/capacity-planning-simulation-types/lib";
import {
    addResponseValues,
    CartesianAggregation, combineResponseValue,
    maxResponseValues
} from "./cpt-cartesian-ops";

// for now all this is limited to latency responses

export function isResponseNumber(param: GraphParam | ResponseParam): param is ResponseNumberParam {
    return param && (param.type === 'RESPONSE_NUMBER');
}

export function isLatencyResponse(param: GraphParam | ResponseParam): param is ResponseNumberParam {
    return isResponseNumber(param) && param.category === 'latency' && param.unit == 'ms';
}

export function hasResponse(params: ResponseParam[]): boolean {
    return !!params && !!params.length;
}

function buildResponseAspect(value: ResponseValue, aspect: Aspect): ResponseAspect {
    const slices: {
        [label: string]: ResponseValue;
    } = {};
    for (const aspectSliceName in aspect.slices) {
        slices[aspectSliceName] = value;
    }

    return {
        type: 'RESPONSE_BREAKDOWN',
        name: aspect.name,
        relative: aspect.relative,
        slices: slices
    };
}

export function makeLatencyResponse(val: number, aspects?: Aspect[]): ResponseNumberParam {
    const baseResponse: ResponseNumberParam = {
        type: 'RESPONSE_NUMBER',
        unit: 'ms',
        category: 'latency',
        value: [{ value: val, freq: 1000 }]
    };
    if (!aspects || aspects.length < 1) {
        return baseResponse;
    }
    const responseAspects = aspects.map(a => buildResponseAspect(baseResponse.value, a));
    return { ...baseResponse, aspects: responseAspects }

}
export function makeHopResponse(val: number, aspects?: Aspect[]): ResponseNumberParam {
    const baseResponse: ResponseNumberParam = {
        type: 'RESPONSE_NUMBER',
        unit: '',
        category: 'hop',
        value: [{ value: val, freq: 1000 }]
    };
    if (!aspects || aspects.length < 1) {
        return baseResponse;
    }
    const responseAspects = aspects.map(a => buildResponseAspect(baseResponse.value, a));
    return { ...baseResponse, aspects: responseAspects }

}



function cloneResponseValue(value: ResponseValue): ResponseValue {
    return JSON.parse(JSON.stringify(value)) as ResponseValue;
}

export function getResponseValueEntry(value: ResponseValue, entryValue: number): ResponseValueEntry {
    let entries = value.filter(e => e.value === entryValue);
    if (entries.length > 0) {
        return entries[0];
    }
    return null;
}

export function addEntryToResponseValue(value: ResponseValue, entry: ResponseValueEntry) {
    let existingEntry = getResponseValueEntry(value, entry.value);
    if (existingEntry) {
        existingEntry.freq += entry.freq;
    } else {
        value.push({ freq: entry.freq, value: entry.value });
    }
}

export function getResponseValueMean(value: ResponseValue) {
    const normFreq = 1000;
    let valueSum = 0;
    for (let e of value) {
        valueSum += Math.abs(e.freq * e.value);
    }
    return valueSum / normFreq;
}



// normalize frequency to a 1000 units
export function normalizeResponseValue(value: ResponseValue): ResponseValue {
    return scaleResponseValueFrequencies(value, 1000);
}

export function unifyResponseValue(value: ResponseValue): ResponseValue {
    const unifiedValue: ResponseValue = [];
    for (const inValue of value) {
        addEntryToResponseValue(unifiedValue, inValue);
    }
    return unifiedValue;
}

// scale frequency to a x units
export function scaleResponseValueFrequencies(value: ResponseValue, norm: number): ResponseValue {
    const normFreq = Math.round(norm);
    let normalizedValue: ResponseValue = [];
    if (value.length > 0) {
        let freqSum = 0;
        for (let e of value) {
            freqSum += Math.abs(e.freq);
        }
        if (freqSum) {
            let freqFactor = normFreq / freqSum;
            for (let e of value) {
                normalizedValue.push({ freq: Math.round(e.freq * freqFactor), value: Math.round(e.value) });
            }
        }
    }
    return normalizedValue;
}
export function mergeResponseValue(valueA: ResponseValue, valueB: ResponseValue): ResponseValue {
    let mergedValue: ResponseValue = cloneResponseValue(valueA);
    for (let sEntry of valueB) {
        if (sEntry.value) {
            addEntryToResponseValue(mergedValue, sEntry);
        }
    }
    return mergedValue;
}


function normalizeResponseAspect(aspect: ResponseAspect): ResponseAspect {
    let normalizedAspect: ResponseAspect = {
        type: aspect.type,
        name: aspect.name,
        relative: aspect.relative,
        slices: {}
    };
    for (let sliceName in aspect.slices) {
        normalizedAspect.slices[sliceName] = normalizeResponseValue(aspect.slices[sliceName]);
    }
    return normalizedAspect;
}

type GetUndefinedCategory = (categoryName: string) => ResponseValue;
type GetUndefinedSlice = (breakdownName: string, sliceName: string) => ResponseValue;

export function getZeroValue(unusedParam1: string, unusedParam2?: string): ResponseValue {
    return [{ value: 0, freq: 1000 }];
}

type ResponseGroupCategoryMap = { [categoryName: string]: { ref: ResponseParam, aspects: { [aspectName: string]: ResponseAspect } } };
type CategoryAspects = { [categoryName: string]: { aspects: { [aspectName: string]: { slices: { [sliceName: string]: any } } } } };
function aggregateResponseGroups(responseGroups: ResponseParam[][], op: CartesianAggregation, getCategoryUndefinedValue: GetUndefinedCategory, getSliceUndefinedValue: GetUndefinedSlice): ResponseParam[] {
    const categories: CategoryAspects = {};
    const responseGroupCategoriesList: ResponseGroupCategoryMap[] = [];
    const units: { [categoryName: string]: string } = {};
    for (const responseGroup of responseGroups) {
        const rgCategories: ResponseGroupCategoryMap = {};
        for (const response of responseGroup ? responseGroup : []) {
            // only response numbers are supported atm
            if (isResponseNumber(response)) {
                const category = response.category;
                if (!(response.category in categories)) {
                    categories[category] = { aspects: {} };
                }
                // fixme: just taking the unit of the 1st response per category for now
                if (!(response.category in units)) {
                    units[category] = response.unit;
                }
                rgCategories[category] = { ref: response, aspects: {} };
                for (const aspect of (response.aspects ? response.aspects : [])) {
                    if (!(aspect.name in categories[category].aspects)) {
                        categories[category].aspects[aspect.name] = { slices: {} };
                    }
                    rgCategories[category].aspects[aspect.name] = aspect;
                    for (const sliceName in aspect.slices) {
                        categories[category].aspects[aspect.name].slices[sliceName] = aspect.slices[sliceName];
                    }
                }
            }
        }
        responseGroupCategoriesList.push(rgCategories);
    }
    const aggregatedResponseGroup: ResponseParam[] = [];
    // create one response per category
    for (const categoryName of Object.keys(categories)) {
        const categoryResponse: ResponseNumberParam = {
            type: 'RESPONSE_NUMBER',
            unit: units[categoryName],
            aspects: [],
            category: categoryName,
            value: []
        };
        const tmpValues: ResponseValue[] = [];
        // pick up all the values from all response groups
        for (const rgCategory of responseGroupCategoriesList) {
            if (categoryName in rgCategory && isResponseNumber(rgCategory[categoryName].ref)) {
                tmpValues.push(rgCategory[categoryName].ref.value);
            } else {
                tmpValues.push(getCategoryUndefinedValue(categoryName));
            }
        }
        categoryResponse.value = op(tmpValues);

        // now aggregate the aspects
        for (const aspectName of Object.keys(categories[categoryName].aspects)) {
            const responseAspect: ResponseAspect = {
                type: 'RESPONSE_BREAKDOWN',
                name: aspectName,
                relative: false,
                slices: {}
            };
            const slices = categories[categoryName].aspects[aspectName].slices;
            for (const sliceName of Object.keys(slices)) {
                const sliceValues: ResponseValue[] = [];
                for (const rgCategories of responseGroupCategoriesList) {
                    if (categoryName in rgCategories) {
                        const rgCategory = rgCategories[categoryName];
                        if (aspectName in rgCategory.aspects) {
                            const inAspect = rgCategory.aspects[aspectName];
                            if (sliceName in inAspect.slices) {
                                sliceValues.push(inAspect.slices[sliceName]);
                            } else {
                                const undefinedSliceValue = getSliceUndefinedValue(aspectName, sliceName);
                                if (undefinedSliceValue) {
                                    sliceValues.push(undefinedSliceValue);
                                }
                            }
                        } else {
                            sliceValues.push(rgCategory.ref.value);
                        }
                    } else {
                        sliceValues.push(getCategoryUndefinedValue(categoryName));
                    }
                }
                responseAspect.slices[sliceName] = op(sliceValues);
            }
            categoryResponse.aspects.push(responseAspect);
        }
        aggregatedResponseGroup.push(categoryResponse);
    }
    return aggregatedResponseGroup;
}


export function maxResponseGroups(responseGroups: ResponseParam[][]): ResponseParam[] {
    return aggregateResponseGroups(responseGroups, maxResponseValues, getZeroValue, getZeroValue);
}

export function addResponseGroups(responseGroups: ResponseParam[][]): ResponseParam[] {
    return aggregateResponseGroups(responseGroups, addResponseValues, getZeroValue, getZeroValue);
}

export function combineResponseGroups(responseGroups: ResponseParam[][]): ResponseParam[] {
    return aggregateResponseGroups(responseGroups, combineResponseValue, getZeroValue, getZeroValue);
}


export function combineResponseGroupsWeighted(responseGroups: ResponseParam[][], weights: number[], getUndefinedSlice: GetUndefinedSlice): ResponseParam[] {
    let weightSum = 0;
    weights.forEach(w => weightSum += w);
    if (weightSum) {
        const weightedResponseGroups = [];

        for (let i = 0; i < responseGroups.length; i++) {
            const responseGroup = responseGroups[i];
            const weight = (weights[i] / weightSum) * responseGroups.length;
            const weightedResponses = responseGroup.map(r => scaleResponseParam(r, weight));
            weightedResponseGroups.push(weightedResponses);
        }
        return aggregateResponseGroups(weightedResponseGroups, combineResponseValue, getZeroValue, getUndefinedSlice);

    } else {
        return combineResponseGroups(responseGroups);
    }
}

function scaleResponseValue(v: ResponseValue, scale: number): ResponseValue {
    return v.map(e => { return { value: e.value * scale, freq: e.freq } });
}
function scaleResponseParam(p: ResponseParam, scale: number): ResponseParam {
    if (isResponseNumber(p)) {
        return {
            ...p,
            value: scaleResponseValue(p.value, scale)
        }
    } else {
        return p;
    }
}



export function mergeResponseAspect(aspectA: ResponseAspect, aspectB: ResponseAspect): ResponseAspect {
    let mergedAspect: ResponseAspect = {
        type: aspectA.type == aspectB.type ? aspectA.type : 'RESPONSE_BREAKDOWN',
        name: aspectA.name,
        relative: aspectA.relative,
        slices: {}
    };
    for (let sliceName in aspectA.slices) {
        mergedAspect.slices[sliceName] = cloneResponseValue(aspectA.slices[sliceName]);
    }
    for (let sliceName in aspectB.slices) {
        if (mergedAspect.slices[sliceName]) {
            mergedAspect.slices[sliceName] = mergeResponseValue(mergedAspect.slices[sliceName], aspectB.slices[sliceName]);
        } else {
            mergedAspect.slices[sliceName] = cloneResponseValue(aspectB.slices[sliceName]);
        }
    }
    return normalizeResponseAspect(mergedAspect);

}




// flatten a response aspect to an aspect of it's slices frequencies
export function flattenResponseAspectValue(a: ResponseAspect): Aspect {
    let flatAspect: Aspect = {
        name: a.name,
        slices: {}
    };
    for (let sliceName in a.slices) {
        let value = a.slices[sliceName];
        let mean = getResponseValueMean(value);

        flatAspect.slices[sliceName] = mean;
    }
    return flatAspect;
}




// try to squeeze all the splits into an array of numbers where
// the values are repeated as often as needed to represent their aggregated
// frequencies.
export function responseHistogramAggregation(responses: ResponseNumberParam[]): number[] {
    let aggregatedResponseValue: ResponseValue = [];
    for (let r of responses) {
        if (r.value) {
            for (let e of r.value) {
                addEntryToResponseValue(aggregatedResponseValue, e);
            }
        }
    }
    return responseValueHistogramAggregation(aggregatedResponseValue);
}

export function responseValueHistogramAggregation(responseValue: ResponseValue): number[] {
    let histogramInput: number[] = [];

    let min = 1000;
    for (let e of responseValue) {
        if (e.freq >= 1 && e.freq < min) {
            min = e.freq;
        }
    }

    // it's all in a single split now. emit a number for each value with frequency >= 1
    for (let e of responseValue) {
        let freq = e.freq;
        while (freq >= min) {
            histogramInput.push(e.value);
            freq -= min;
        }
    }
    return histogramInput;
}
