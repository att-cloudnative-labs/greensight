import { Expression } from './expression';
export enum DistributionSourceMethod { Expression = "EXPRESSION", Static = "STATIC", Auto = "AUTO" };

export enum DistributionType { Gaussian = "GAUSSIAN" };


export interface DistributionSource {
    method: DistributionSourceMethod;
    distributionType: DistributionType;
    expression?: Expression;
    staticStdDev?: number;
}

export interface Distribution {
    distributionType: DistributionType;
    stdDev: number;
}
