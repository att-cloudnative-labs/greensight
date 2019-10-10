import { GraphParam, NumberParam, AspectNumberParam, Aspect, NormalDistNumberParam } from '@cpt/capacity-planning-simulation-types';
import { isNumber, NumberType, isAspectNumber, asAspectNumber, addAspects, isDistNumber, asDistNumber } from './cpt-load-ops';
import { Normal } from 'essy-distribution';
import { SampleStat } from 'essy-stats';
import * as MersenneTwister from 'mersenne-twister';



export function addStdDev(stdDevA: number, stdDevB: number): number {
    if ((stdDevA === undefined || stdDevA === null) && (stdDevA === undefined || stdDevA === null)) {
        return undefined;
    }
    if (!stdDevA)
        return stdDevB;
    if (!stdDevB)
        return stdDevA;
    return Math.sqrt(stdDevA * stdDevA + stdDevB + stdDevB);
}


export function add(p1: GraphParam, p2: GraphParam): GraphParam {
    if (!p1 && !p2) {
        throw Error("null input");
    }
    if (!p1) {
        return p2;
    }
    if (!p2) {
        return p1;
    }
    if (!isNumber(p1) || !isNumber(p2)) {
        throw Error("can only add numbers");
    }
    let sum: NumberParam = {
        type: 'NUMBER',
        value: p1.value + p2.value,
        unit: p2.unit === p1.unit ? p1.unit : undefined
    };

    if (isAspectNumber(p1) || isAspectNumber(p2)) {
        let a1 = asAspectNumber(p1);
        let a2 = asAspectNumber(p2);
        return {
            type: 'ASPECT_NUMBER',
            value: sum.value,
            aspects: addAspects(a1.value, a1.aspects, a2.value, a2.aspects),
            unit: sum.unit,
            stdDev: addStdDev(a1.stdDev, a2.stdDev)
        }
    } else if (isDistNumber(p1) || isDistNumber(p2)) {
        let d1 = asDistNumber(p1);
        let d2 = asDistNumber(p2);
        return {
            type: 'NORMAL_DIST_NUMBER',
            value: sum.value,
            unit: sum.unit,
            stdDev: addStdDev(d1.stdDev, d2.stdDev)
        }
    }

    return sum;
}

export function multiply(p1: GraphParam, p2: GraphParam): GraphParam {
    if (!p1 || !p2) {
        throw Error("null input");
    }
    if (!isNumber(p1) || !isNumber(p2)) {
        throw Error("can only multiply numbers");
    }
    let unit: string = undefined;
    if (p1.unit === p2.unit || p2.unit === undefined) {
        unit = p1.unit;
    } else if (p1.unit === undefined) {
        unit = p2.unit;
    }

    let product: NumberParam = {
        type: 'NUMBER',
        value: p1.value * p2.value,
        unit: unit
    };
    let aspects: Aspect[] = [];
    if (p1.type === 'ASPECT_NUMBER' && p1.aspects && p1.aspects.length > 0) {
        aspects.push(...p1.aspects);
    }
    if (aspects.length > 0) {
        let aspectProduct: AspectNumberParam = {
            type: 'ASPECT_NUMBER',
            value: product.value,
            unit: product.unit,
            aspects: aspects
        }
        return aspectProduct;
    }
    return product;
}

export function min(params: NumberType[]): GraphParam {
    if (!params || params.length === 0) {
        throw Error("null input");
    }
    //find the param with the lowest value
    let min = params.reduce((min, current) => {
        return min.value < current.value ? min : current;
    });
    return min;
}

export function max(params: NumberType[]): GraphParam {
    if (!params || params.length === 0) {
        throw Error("null input");
    }
    //find the param with the highest value
    let max = params.reduce((max, current) => {
        return max.value > current.value ? max : current;
    });
    return max;
}

let twister = new MersenneTwister();

export function sampleNormal(mean: number, stddev: number): number {
    let normValue = new Normal(mean, stddev);
    return normValue.sample(1, twister);
}
