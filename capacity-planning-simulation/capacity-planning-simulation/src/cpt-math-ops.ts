import { GraphParam, NumberParam, Aspect } from '@cpt/capacity-planning-simulation-types';
import { isNumber, isAspectNumber, addAspects, hasAspect } from './cpt-load-ops';
import { Normal, LogNormal, Uniform, Poisson, Exponential, Erlang, Weibull } from 'essy-distribution';
import * as MersenneTwister from 'mersenne-twister';
import { RandomNumberParam } from '@cpt/capacity-planning-simulation-types/lib';



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


export function add(p1: GraphParam, p2: GraphParam): NumberParam {
    if (!p1 && !p2) {
        throw Error("null input");
    }

    if (!isNumber(p1) || !isNumber(p2)) {
        throw Error("can only add numbers");
    }
    if (!p1) {
        return p2;
    }
    if (!p2) {
        return p1;
    }

    let sum: NumberParam = {
        type: 'NUMBER',
        value: p1.value + p2.value,
        unit: p2.unit === p1.unit ? p1.unit : undefined
    };

    if (hasAspect(p1) || hasAspect(p2)) {
        return {
            type: 'NUMBER',
            value: sum.value,
            aspects: addAspects(p1.value, p1.aspects, p2.value, p2.aspects),
            unit: sum.unit
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
    if (isAspectNumber(p1)) {
        aspects.push(...p1.aspects);
    }
    if (aspects.length > 0) {
        let aspectProduct: NumberParam = {
            type: 'NUMBER',
            value: product.value,
            unit: product.unit,
            aspects: aspects
        }
        return aspectProduct;
    }
    return product;
}

export function min(params: NumberParam[]): GraphParam {
    if (!params || params.length === 0) {
        throw Error("null input");
    }
    //find the param with the lowest value
    let min = params.reduce((min, current) => {
        return min.value < current.value ? min : current;
    });
    return min;
}

export function max(params: NumberParam[]): GraphParam {
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

export function meanNormal(mean: number, stddev: number): number {
    let normValue = new Normal(mean, stddev);
    return normValue.mean();
}

export function sampleLognormal(scale: number, shape: number): number {
    let value = new LogNormal(scale, shape);
    return value.sample(1, twister);
}

export function meanLognormal(scale: number, shape: number): number {
    let value = new LogNormal(scale, shape);
    return value.mean();
}

export function sampleUniform(a: number, b: number): number {
    if (b < a) {
        b = a;
    }
    let value = new Uniform(a, b);
    return value.sample(1, twister);
}

export function meanUniform(a: number, b: number): number {
    if (b < a) {
        b = a;
    }
    let value = new Uniform(a, b);
    return value.mean();
}

export function sampleBernoulli(p: number): number {
    let value = new Uniform(0, 1);
    return value < p ? 1 : 0;
}

export function meanBernoulli(p: number): number {
    return p;
}

export function samplePoisson(lambda: number): number {
    let value = new Poisson(lambda);
    return value.sample(1, twister);
}

export function meanPoisson(lambda: number): number {
    let value = new Poisson(lambda);
    return value.mean();
}

export function sampleExponential(lambda: number): number {
    let value = new Exponential(lambda);
    return value.sample(1, twister);
}

export function meanExponential(lambda: number): number {
    let value = new Exponential(lambda);
    return value.mean();
}

export function sampleErlang(shape: number, rate: number): number {
    let value = new Erlang(shape, rate);
    return value.sample(1, twister);
}

export function meanErlang(shape: number, rate: number): number {
    let value = new Erlang(shape, rate);
    return value.mean();
}

export function sampleWeibull(scale: number, shape: number): number {
    let value = new Weibull(scale, shape);
    return value.sample(1, twister);
}

export function meanWeibull(scale: number, shape: number): number {
    let value = new Weibull(scale, shape);
    return value.mean();
}

export function meanValue(randNum: RandomNumberParam): number {
    switch (randNum.distr) {
        default:
            return 0;
        case 'NORMAL':
            return meanNormal(randNum.distrDescr['mean'], randNum.distrDescr['stddev']);
        case 'LOGNORMAL':
            return meanLognormal(randNum.distrDescr['scale'], randNum.distrDescr['shape']);
        case 'UNIFORM':
            return meanUniform(randNum.distrDescr['a'], randNum.distrDescr['b']);
        case 'BERNOULLI':
            return meanBernoulli(randNum.distrDescr['p']);
        case 'POISSON':
            return meanPoisson(randNum.distrDescr['rate']);
        case 'EXPONENTIAL':
            return meanExponential(randNum.distrDescr['rate']);
        case 'ERLANG':
            return meanErlang(randNum.distrDescr['shape'], randNum.distrDescr['rate']);
        case 'WEIBULL':
            return meanWeibull(randNum.distrDescr['scale'], randNum.distrDescr['shape']);
    }
}

export function sampleValue(randNum: RandomNumberParam): number {
    switch (randNum.distr) {
        default:
            return 0;
        case 'NORMAL':
            return sampleNormal(randNum.distrDescr['mean'], randNum.distrDescr['stddev']);
        case 'LOGNORMAL':
            return sampleLognormal(randNum.distrDescr['scale'], randNum.distrDescr['shape']);
        case 'UNIFORM':
            return sampleUniform(randNum.distrDescr['a'], randNum.distrDescr['b']);
        case 'BERNOULLI':
            return sampleBernoulli(randNum.distrDescr['p']);
        case 'POISSON':
            return samplePoisson(randNum.distrDescr['rate']);
        case 'EXPONENTIAL':
            return sampleExponential(randNum.distrDescr['rate']);
        case 'ERLANG':
            return sampleErlang(randNum.distrDescr['shape'], randNum.distrDescr['rate']);
        case 'WEIBULL':
            return meanWeibull(randNum.distrDescr['scale'], randNum.distrDescr['shape']);
    }
}
