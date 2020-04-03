import { Breakdown } from '@cpt/capacity-planning-projection/lib/variable';
import { DistributionType, Expression } from '@cpt/capacity-planning-projection/lib';

export interface TimesegmentModel {
    method: string;
    date: string;
    value?: number;
    growth?: number;
    growthType?: string;
    expression?: Expression;
    breakdown?: Breakdown;
    distribution?: DistributionSource;
}

export interface DistributionSource {
    method: string;
    distributionType: string;
    expression?: Expression;
    staticStdDev?: number;
}

export interface Distribution {
    distributionType: string;
    stdDev: number;
}
