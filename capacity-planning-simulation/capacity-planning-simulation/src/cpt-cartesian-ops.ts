import { ResponseValue, ResponseValueEntry } from "@cpt/capacity-planning-simulation-types/lib";

const CART_MAX_ENTRIES = 1000;

type CartesianProductGroup = { combinedFreq: number, entries: ResponseValueEntry[] };
type CartesianEntryOperation = ((a: CartesianProductGroup) => ResponseValueEntry[]);
export type CartesianAggregation = ((values: ResponseValue[]) => ResponseValue);


export function cartesianProduct(values: ResponseValue[]): CartesianProductGroup[] {
    let rs: CartesianProductGroup[] = [];
    let minFreq = 1;
    const max = values.length - 1;
    // generate all combinations of response value entries
    function helper(acc: ResponseValueEntry[], i: number) {
        for (let j = 0, l = values[i].length; j < l; j++) {
            const a = acc.slice(0); // clone arr
            a.push(values[i][j]);
            if (i === max) {
                // limit to the highest frequencies
                let combinedFreq = 1;
                for (const entry of a) {
                    combinedFreq *= entry.freq;
                }
                if (combinedFreq >= minFreq) {
                    rs.push({ combinedFreq: combinedFreq, entries: a });
                    if (rs.length > CART_MAX_ENTRIES) {
                        rs.sort((a, b) => b.combinedFreq - a.combinedFreq);
                        rs = rs.slice(0, CART_MAX_ENTRIES);
                        minFreq = rs[rs.length - 1].combinedFreq;
                    }
                }

            }
            else
                helper(a, i + 1);
        }
    }
    helper([], 0);
    return rs;
}

function addProductComponent(productComponent: CartesianProductGroup): ResponseValueEntry[] {
    const freqCorrect = Math.pow(1000, productComponent.entries.length - 1);
    const result: ResponseValueEntry = { freq: Math.round(productComponent.combinedFreq / freqCorrect), value: 0 };
    for (const entry of productComponent.entries) {
        result.value += entry.value;
    }
    return [result];
}
function maxProductComponent(productComponent: CartesianProductGroup): ResponseValueEntry[] {
    const freqCorrect = Math.pow(1000, productComponent.entries.length - 1);
    const result: ResponseValueEntry = { freq: Math.round(productComponent.combinedFreq / freqCorrect), value: 0 };
    for (const entry of productComponent.entries) {
        if (result.value === undefined || entry.value > result.value) {
            result.value = entry.value;
        }
    }
    return [result];
}


function aggregateResponseValues(values: ResponseValue[], op: CartesianEntryOperation): ResponseValue {
    const cartesianProductEntryValues = cartesianProduct(values);
    let freqSum = 0;
    const entryMap: { [value: number]: ResponseValueEntry } = {};
    for (const entrySet of cartesianProductEntryValues) {
        const aggregatedEntryValues = op(entrySet);
        for (const aggregatedEntryValue of aggregatedEntryValues) {
            freqSum += aggregatedEntryValue.freq;
            if (aggregatedEntryValue.value in entryMap) {
                entryMap[aggregatedEntryValue.value].freq += aggregatedEntryValue.freq;
            } else {
                entryMap[aggregatedEntryValue.value] = aggregatedEntryValue;
            }
        }
    }
    const rawResult = Object.keys(entryMap).map(key => entryMap[key]).map(entry => { return { value: entry.value, freq: Math.round((entry.freq / freqSum) * 1000) } });
    const nonNullFreq = rawResult.filter(e => e.freq > 0);
    const sortedByFreq = nonNullFreq.sort((a, b) => b.freq - a.freq);
    return sortedByFreq.slice(0, CART_MAX_ENTRIES);
}



export function addResponseValues(values: ResponseValue[]): ResponseValue {
    return aggregateResponseValues(values, addProductComponent);
}

export function maxResponseValues(values: ResponseValue[]): ResponseValue {
    return aggregateResponseValues(values, maxProductComponent);
}

export function combineResponseValue(values: ResponseValue[]): ResponseValue {
    return aggregateResponseValues(values, c => c.entries);
}


