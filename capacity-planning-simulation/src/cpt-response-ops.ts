import { ResponseSplit, ResponseSplitEntry, GraphParam, NumberParam, AspectNumberParam, Aspect, NormalDistNumberParam, StringParam, AspectParam, BooleanParam, ResponseNumberParam, ResponseAspect } from '@cpt/capacity-planning-simulation-types';
import { dupl, scaleAspect } from './cpt-load-ops';
// for now all this is limited to latency responses

export function isResponseNumber(param: GraphParam): param is ResponseNumberParam {
    return param && (param.type === 'RESPONSE_NUMBER');
}

export function isLatencyResponse(param: GraphParam): param is ResponseNumberParam {
    return isResponseNumber(param) && param.category === 'latency' && param.unit == 'ms';
}

export function makeLatencyResponse(val: number): ResponseNumberParam {
    return {
        type: 'RESPONSE_NUMBER',
        value: val,
        unit: 'ms',
        category: 'latency',
        split: [{ value: val, freq: 1000 }]
    }
}

export function aggregateResponse(responses: GraphParam[]): GraphParam {
    return aggregateResponseParallel(responses);
}

// select the highest value latency response
export function aggregateResponseParallel(responses: GraphParam[]): GraphParam {
    let latencies = responses.filter(r => isLatencyResponse(r)).map(r => r as ResponseNumberParam);
    if (latencies.length > 0) {
        let highestLatency = latencies.sort((a, b) => a.value - b.value).pop();
        return dupl(highestLatency);
    }
    return null;
}

// add all latency responses
export function aggregateResponseSerial(responses: GraphParam[]): GraphParam {
    let latencies = responses.filter(r => isLatencyResponse(r)).map(r => r as ResponseNumberParam);
    if (latencies.length > 0) {
        let latency = makeLatencyResponse(0);
        for (let l of latencies) {
            latency.value += Math.abs(l.value);
        }
        return latency;
    }
    return null;
}

function duplResponseSplit(split: ResponseSplit): ResponseSplit {
    return JSON.parse(JSON.stringify(split)) as ResponseSplit;
}

export function getResponseSplitEntry(split: ResponseSplit, value: number): ResponseSplitEntry {
    let entries = split.filter(e => e.value === value);
    if (entries.length > 0) {
        return entries[0];
    }
    return null;
}

export function addResponseSplitEntry(split: ResponseSplit, entry: ResponseSplitEntry) {
    let existingEntry = getResponseSplitEntry(split, entry.value);
    if (existingEntry) {
        existingEntry.freq += entry.freq;
    } else {
        split.push({ freq: entry.freq, value: entry.value });
    }
}

export function getResponseSplitMean(split: ResponseSplit) {
    const normFreq = 1000;
    let n = normalizeResponseSplit(split);
    let valueSum = 0;
    for (let e of split) {
        valueSum += Math.abs(e.freq * e.value);
    }
    return valueSum / normFreq;
}

// normalize frequency to a 1000 units
export function normalizeResponseSplit(split: ResponseSplit): ResponseSplit {
    return scaleResponseSplit(split, 1000);
}

// scale frequency to a x units
export function scaleResponseSplit(split: ResponseSplit, norm: number): ResponseSplit {
    const normFreq = Math.round(norm);
    let normalizedSplit: ResponseSplit = [];
    if (split.length > 0) {
        let freqSum = 0;
        for (let e of split) {
            freqSum += Math.abs(e.freq);
        }
        if (freqSum) {
            let freqFactor = normFreq / freqSum;
            for (let e of split) {
                normalizedSplit.push({ freq: Math.round(e.freq * freqFactor), value: Math.round(e.value) });
            }
        }
    }
    return normalizedSplit;
}
export function mergeResponseSplit(splitA: ResponseSplit, splitB: ResponseSplit): ResponseSplit {
    let mergedSplit: ResponseSplit = duplResponseSplit(splitA);
    for (let sEntry of splitB) {
        if (sEntry.value) {
            addResponseSplitEntry(mergedSplit, sEntry);
        }
    }
    return mergedSplit;
}

function normalizeResponseAspect(aspect: ResponseAspect): ResponseAspect {
    let normalizedAspect: ResponseAspect = {
        type: aspect.type,
        name: aspect.name,
        relative: aspect.relative,
        slices: {}
    }
    for (let sliceName in aspect.slices) {
        normalizedAspect.slices[sliceName] = normalizeResponseSplit(aspect.slices[sliceName]);
    }
    return normalizedAspect;
}

export function mergeResponseAspect(aspectA: ResponseAspect, aspectB: ResponseAspect): ResponseAspect {
    let mergedAspect: ResponseAspect = {
        type: aspectA.type == aspectB.type ? aspectA.type : 'RESPONSE_BREAKDOWN',
        name: aspectA.name,
        relative: aspectA.relative,
        slices: {}
    }
    for (let sliceName in aspectA.slices) {
        mergedAspect.slices[sliceName] = duplResponseSplit(aspectA.slices[sliceName]);
    }
    for (let sliceName in aspectB.slices) {
        if (mergedAspect.slices[sliceName]) {
            mergedAspect.slices[sliceName] = mergeResponseSplit(mergedAspect.slices[sliceName], aspectB.slices[sliceName]);
        } else {
            mergedAspect.slices[sliceName] = duplResponseSplit(aspectB.slices[sliceName]);
        }
    }
    return normalizeResponseAspect(mergedAspect);

}

export function scaleResponseAspect(a: ResponseAspect, val: number): ResponseAspect {
    let newAspect: ResponseAspect = {
        type: a.type,
        name: a.name,
        slices: {},
        relative: a.relative
    }
    for (let sliceName in a.slices) {
        newAspect.slices[sliceName] = scaleResponseSplit(a.slices[sliceName], val);
    }
    return newAspect;
}


export function addValueToResponseAspect(a: ResponseAspect, val: number): ResponseAspect {
    let newAspect: ResponseAspect = {
        type: a.type,
        name: a.name,
        slices: {},
        relative: a.relative
    }
    for (let sliceName in a.slices) {
        newAspect.slices[sliceName] = addValueToResponseSplit(a.slices[sliceName], val);
    }
    return newAspect;
}

// flatten a response aspect to an aspect of it's slices frequencies
export function flattenResponseAspect(a: ResponseAspect): Aspect {
    let flatAspect: Aspect = {
        type: a.type === 'RESPONSE_BREAKDOWN' ? 'BREAKDOWN' : 'TAG',
        name: a.name,
        slices: {}
    }
    for (let sliceName in a.slices) {
        let split = a.slices[sliceName];
        let freqSum = 0;
        for (let entry of split) {
            freqSum += entry.freq;
        }
        flatAspect.slices[sliceName] = freqSum;
    }
    return flatAspect;
}

// flatten a response aspect to an aspect of it's slices frequencies
export function flattenResponseAspectValue(a: ResponseAspect): Aspect {
    let flatAspect: Aspect = {
        type: a.type === 'RESPONSE_BREAKDOWN' ? 'BREAKDOWN' : 'TAG',
        name: a.name,
        slices: {}
    }
    for (let sliceName in a.slices) {
        let split = a.slices[sliceName];
        let mean = getResponseSplitMean(split);

        flatAspect.slices[sliceName] = mean;
    }
    return flatAspect;
}



function addValueToResponseSplit(split: ResponseSplit, val: number): ResponseSplit {
    let sumSplit: ResponseSplit = [];
    for (let e of split) {
        sumSplit.push({ value: e.value + val, freq: e.freq });
    }
    return sumSplit;
}

export function addLatencyResponse(r1: ResponseNumberParam, lat: number): ResponseNumberParam {
    if (isLatencyResponse(r1)) {
        let sum = makeLatencyResponse(r1.value + lat);
        if (r1.split) {
            sum.split = addValueToResponseSplit(r1.split, lat);
        }
        if (r1.aspects) {
            sum.aspects = [];
            for (let a of r1.aspects) {
                sum.aspects.push(addValueToResponseAspect(a, lat));
            }
        }
        return sum;
    }
    return null;
}

export function aggregateResponseByAspect(aspect: Aspect, responses: { [sliceName: string]: ResponseNumberParam }): ResponseNumberParam {
    let latency = makeLatencyResponse(0);
    latency.split = [];
    latency.aspects = [];

    // use map to make sure aspects of the same name from different responses get merged
    let latencyAspects: { [aspectName: string]: ResponseAspect } = {};

    // create a new aspect that holds the information of our aggregation efforts
    let newlyAggregatedAspect: ResponseAspect = {
        type: aspect.type === 'BREAKDOWN' ? 'RESPONSE_BREAKDOWN' : 'RESPONSE_TAG',
        name: aspect.name,
        slices: {}
    }
    // scale to the same base as the split
    let scaledAspect = scaleAspect(1000, aspect);
    for (let slicename in scaledAspect.slices) {
        let sliceFreq = scaledAspect.slices[slicename];
        let resp = responses[slicename];
        if (resp) {
            if (resp.split === undefined || resp.split.length === 0) {
                // no split, add the mean value
                let meanResponseSplit = { freq: sliceFreq, value: resp.value };
                newlyAggregatedAspect.slices[slicename] = duplResponseSplit([meanResponseSplit]);
                addResponseSplitEntry(latency.split, meanResponseSplit);
            } else {
                // we got a split, so we can ignore the value of the response as it's just the mean
                let scaledResponseSplit = scaleResponseSplit(resp.split, sliceFreq);
                newlyAggregatedAspect.slices[slicename] = duplResponseSplit(scaledResponseSplit);
                latency.split = mergeResponseSplit(latency.split, scaledResponseSplit);
            }
            if (resp.aspects && resp.aspects.length > 0) {
                for (let respAspect of resp.aspects) {
                    let scaledAspect = scaleResponseAspect(respAspect, sliceFreq);
                    if (latencyAspects[respAspect.name]) {
                        latencyAspects[respAspect.name] = mergeResponseAspect(latencyAspects[respAspect.name], scaledAspect);
                    } else {
                        latencyAspects[respAspect.name] = scaledAspect;
                    }
                }
            }
        } else {
            // no response
            let zeroResponseSplit = { freq: sliceFreq, value: 0 };
            newlyAggregatedAspect.slices[slicename] = duplResponseSplit([zeroResponseSplit]);
            addResponseSplitEntry(latency.split, zeroResponseSplit);
        }
    }
    // record our activity in the response aspects
    if (latencyAspects[aspect.name]) {
        latencyAspects[aspect.name] = mergeResponseAspect(latencyAspects[aspect.name], newlyAggregatedAspect);
    } else {
        latencyAspects[aspect.name] = newlyAggregatedAspect;
    }

    // store apects in output
    for (let aspectName in latencyAspects) {
        latency.aspects.push(latencyAspects[aspectName]);
    }
    latency.split = normalizeResponseSplit(latency.split);
    latency.value = getResponseSplitMean(latency.split);
    return latency;
}

// try to squeeze all the splits into an array of numbers where
// the values are repeated as often as needed to respresent their aggregated
// frequencies.
export function responseHistogramAggregation(responses: ResponseNumberParam[]): number[] {
    let histogramInput: number[] = [];
    let aggregatedResponseSplit: ResponseSplit = [];
    for (let r of responses) {
        if (r.split) {
            for (let e of r.split) {
                addResponseSplitEntry(aggregatedResponseSplit, e);
            }
        }
    }
    return responseSplitHistogramAggregation(aggregatedResponseSplit);
}

export function responseSplitHistogramAggregation(responseSplit: ResponseSplit): number[] {
    let histogramInput: number[] = [];

    let min = 1000;
    for (let e of responseSplit) {
        if (e.freq >= 1 && e.freq < min) {
            min = e.freq;
        }
    }

    // it's all in a single split now. emit a number for each value with frequency >= 1
    for (let e of responseSplit) {
        let freq = e.freq;
        while (freq >= min) {
            histogramInput.push(e.value);
            freq -= min;
        }
    }
    return histogramInput;
}
