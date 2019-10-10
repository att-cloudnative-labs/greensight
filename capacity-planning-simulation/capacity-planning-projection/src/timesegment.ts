import { Distribution, DistributionType, DistributionSource, DistributionSourceMethod } from './distribution';
import { Frame, FrameRenderContext } from './frame';
import { Variable, Breakdown } from './variable';
import { getMonths, monthDiff } from './date';
import { Expression } from './expression';
import { IdentifierValues, ScopedIdentifierValues } from './expression-utils';


export enum TimeSegmentMethod { Basic = "BASIC", Expression = "EXPRESSION", Breakdown = "BREAKDOWN" };

export class TimeSegment {
    constructor(public method: TimeSegmentMethod, public date: string) {

    }

    protected _mainIdentifierValues: IdentifierValues = {};
    protected _scopedIdentifierValues: ScopedIdentifierValues = { distribution: {} };
    protected _dateShield: string = "";

    public static deserialize(data: any): TimeSegment | Error {
        if (data.hasOwnProperty("method") && data.hasOwnProperty("date")) {
            let method = data.method as TimeSegmentMethod;
            switch (method) {
                case TimeSegmentMethod.Basic:
                    return TimeSegmentBasic.deserialize(data);
                case TimeSegmentMethod.Expression:
                    return TimeSegmentExpression.deserialize(data);
                case TimeSegmentMethod.Breakdown:
                    return TimeSegmentBreakdown.deserialize(data);
                default:
                    return new Error("no such method");
            }
        } else {
            return new Error("missing data");
        }
    }

    protected updateIdentifierValues(date: string, context: FrameRenderContext) {
        if (this._dateShield !== date) {
            // collect available identifier values
            let identifierValues: IdentifierValues = {};
            let distributionIdentifierValues: IdentifierValues = {};
            for (let refId in context.renderState) {
                let varRenderState = context.renderState[refId];
                if (varRenderState.f) {
                    if (varRenderState.f.projectedValue !== undefined) {
                        identifierValues[refId] = varRenderState.f.projectedValue;
                    }
                    // only supporting gaussian distribution atm
                    if (varRenderState.f.distribution && varRenderState.f.distribution.stdDev && varRenderState.f.distribution.distributionType === DistributionType.Gaussian) {
                        distributionIdentifierValues[refId] = varRenderState.f.distribution.stdDev;
                    }
                }
            }
            this._mainIdentifierValues = identifierValues;
            this._scopedIdentifierValues = { distribution: distributionIdentifierValues };
            this._dateShield = date;
        }
    }

    public calculate(date: string, variable: Variable, context: FrameRenderContext): Frame {
        let f = new Frame(date, variable.unit);
        return f;
    }
    public getNeededVarIds(): string[] {
        return [];
    }
}

class TimeSegmentDistribution extends TimeSegment {

    public distribution?: DistributionSource;


    public addDistribution(d: number | Expression | "auto"): TimeSegmentDistribution {
        if (d === "auto") {
            this.distribution = {
                distributionType: DistributionType.Gaussian,
                method: DistributionSourceMethod.Auto
            };
        } else if (d instanceof Expression) {
            this.distribution = {
                distributionType: DistributionType.Gaussian,
                method: DistributionSourceMethod.Expression,
                expression: d
            };
        } else if (typeof d === "number") {
            this.distribution = {
                distributionType: DistributionType.Gaussian,
                method: DistributionSourceMethod.Static,
                staticStdDev: d
            };
        }
        return this;
    }

    protected static deserializeDistribution(distributionSourceObject: any): DistributionSource | Error {
        let ds: DistributionSource = distributionSourceObject as DistributionSource;
        if (ds.expression) {
            let exp = Expression.deserialize(ds.expression);
            if (exp instanceof Error)
                return exp;
            else {
                ds.expression = exp;
            }
        }

        return ds;
    }

    protected calculateDistribution(date: string, variable: Variable, context: FrameRenderContext, frame: Frame) {
        this.updateIdentifierValues(date, context);
        if (this.distribution) {
            if (this.distribution.method === DistributionSourceMethod.Auto) {
                this.calculateAutoDistribution(date, variable, context, frame);
            }
            if (this.distribution.method === DistributionSourceMethod.Expression && this.distribution.expression) {
                let distributionResult = this.distribution.expression.calculate(this._mainIdentifierValues, this._scopedIdentifierValues);
                if (typeof distributionResult === 'number') {
                    frame.distribution = { distributionType: DistributionType.Gaussian, stdDev: distributionResult };
                } else {
                    frame.distributionCalculationError = distributionResult.message;
                }
            } else if (this.distribution.method === DistributionSourceMethod.Static && this.distribution.staticStdDev !== undefined) {
                frame.distribution = { distributionType: DistributionType.Gaussian, stdDev: this.distribution.staticStdDev };
            }
        }
    }

    protected calculateAutoDistribution(date: string, variable: Variable, context: FrameRenderContext, frame: Frame) {
        frame.distribution = undefined;
    }


}


export enum GrowthType { Constant = "CONSTANT", Exponential = "EXPONENTIAL", Linear = "LINEAR" };
export class TimeSegmentBasic extends TimeSegmentDistribution {
    public value: number = NaN;
    public growth: number = 0.0;
    public growthType: GrowthType = GrowthType.Exponential;
    constructor(date: string, value?: number, growth?: number, growthType?: GrowthType) {
        super(TimeSegmentMethod.Basic, date);
        if (value !== undefined) {
            this.value = value;
        }
        if (growth) {
            this.growth = growth;
        }
        if (growthType) {
            this.growthType = growthType
        }
    }

    public static deserialize(data: any): TimeSegmentBasic | Error {
        let tsb = new TimeSegmentBasic(data.date);
        if (data.value !== undefined)
            tsb.value = data.value;
        if (data.growth) {
            tsb.growth = data.growth;
        }
        if (data.distribution) {
            let dist = TimeSegmentDistribution.deserializeDistribution(data.distribution);
            if (dist instanceof Error) {
                return dist;
            }
            tsb.distribution = dist;
        }
        if (data.growthType) {
            tsb.growthType = data.growthType;
        }
        return tsb;
    }

    public calculate(date: string, variable: Variable, context: FrameRenderContext): Frame {
        let f = new Frame(date, variable.unit);
        f.projectedValue = this.value;
        let diff = monthDiff(this.date, date);
        if (diff > 0 && this.growth !== 0) {
            if (this.growthType === GrowthType.Exponential) {
                for (let i = 0; i < diff; i++) {
                    f.projectedValue += f.projectedValue * this.growth;
                }

            } else if (this.growthType === GrowthType.Linear) {
                for (let i = 0; i < diff; i++) {
                    f.projectedValue += this.value * this.growth;
                }
            }
        }
        this.calculateDistribution(date, variable, context, f);
        return f;
    }

    public getNeededVarIds(): string[] {
        if (this.distribution) {
            if (this.distribution.method === DistributionSourceMethod.Expression && this.distribution.expression) {
                return this.distribution.expression.getNeededRefs();
            }
        }
        return [];
    }

}

/**
 * TimeSegments defined with basic mathematical expressions.
 * Expressions can be used to define the projected value and the distribution.
 * Additionally the distribution can be set to "auto". Now the distributions
 * of all variables referenced in the projected value expression are used to
 * calculate the distribution.
 * If another variable is referenced in an expression, it's projected value is pulled in.
 * If it's distribution value is supposed to be used the d(<variable>) call has to be used.
 *
 */
export class TimeSegmentExpression extends TimeSegmentDistribution {
    public growth: number = 0.0;
    constructor(date: string, public expression: Expression, growth?: number) {
        super(TimeSegmentMethod.Expression, date);
        if (growth !== undefined) {
            this.growth = growth;
        }
    }

    public static deserialize(data: any): TimeSegmentExpression | Error {
        if (data.expression === undefined) {
            return new Error("no expression given");
        }
        let exp = Expression.deserialize(data.expression);
        if (exp instanceof Error) {
            return exp;
        }

        let tsx = new TimeSegmentExpression(data.date, exp, data.growth);

        if (data.distribution) {
            let dist = TimeSegmentDistribution.deserializeDistribution(data.distribution);
            if (dist instanceof Error) {
                return dist;
            }
            tsx.distribution = dist;
        }

        return tsx;
    }

    public calculate(date: string, variable: Variable, context: FrameRenderContext): Frame {

        let f = new Frame(date, variable.unit);

        // collect available identifier values
        let identifierValues: IdentifierValues = {};
        let distributionIdentifierValues: IdentifierValues = {};
        for (let refId in context.renderState) {
            let varRenderState = context.renderState[refId];
            if (varRenderState.f) {
                if (varRenderState.f.projectedValue !== undefined) {
                    identifierValues[refId] = varRenderState.f.projectedValue;
                }
                // only supporting gaussian distribution atm
                if (varRenderState.f.distribution && varRenderState.f.distribution.stdDev && varRenderState.f.distribution.distributionType === DistributionType.Gaussian) {
                    distributionIdentifierValues[refId] = varRenderState.f.distribution.stdDev;
                }
            }
        }

        // calculate the projected value
        let result = this.expression.calculate(identifierValues, { distribution: distributionIdentifierValues });
        if (typeof result === 'number') {
            f.projectedValue = result;
            // when the expression is static, growth will be applied exponentially
            if (this.expression.isStatic() && this.growth !== 0.0) {
                let diff = monthDiff(this.date, date);
                for (let i = 0; i < diff; i++) {
                    f.projectedValue += f.projectedValue * this.growth;
                }
            }
        } else {
            f.projectionCalculationError = result.message;
        }

        this.calculateDistribution(date, variable, context, f);
        return f;
    }

    // this is the combination of refs needed by the value expression
    // and the refs needed by the distribution
    public getNeededVarIds(): string[] {
        let ids: string[] = this.expression.getNeededRefs();
        if (this.distribution) {
            // we only need extra refs, when we're in expression mode
            if (this.distribution.method === DistributionSourceMethod.Expression && this.distribution.expression) {
                let distributionIds = this.distribution.expression.getNeededRefs().filter(ref => ids.indexOf(ref) < 0);
                ids.push(...distributionIds);
            }
        }
        return ids;
    }

    // for every identifier used in the epxression, get the distribution
    // and return the squareroot of the square of all std deviations of them. this is a very rough approximation.
    protected calculateAutoDistribution(date: string, variable: Variable, context: FrameRenderContext, frame: Frame) {
        this.updateIdentifierValues(date, context);
        let d: Distribution = { distributionType: DistributionType.Gaussian, stdDev: 0 };
        let stdDevSum: number = 0;

        for (let ref of this.expression.getNeededRefs()) {
            if (this._mainIdentifierValues[ref] && this._scopedIdentifierValues.distribution[ref] > 0) {
                stdDevSum += this._scopedIdentifierValues.distribution[ref] * this._scopedIdentifierValues.distribution[ref];
            }
        }
        if (stdDevSum > 0) {
            d.stdDev = Math.sqrt(stdDevSum);
            frame.distribution = d;
        }
    }

}

export class TimeSegmentBreakdown extends TimeSegment {
    public breakdown: Breakdown = {};
    constructor(date: string, breakdown?: Breakdown) {
        super(TimeSegmentMethod.Breakdown, date);
        if (breakdown) {
            this.breakdown = breakdown;
        }
    }

    public static deserialize(data: any): TimeSegmentBreakdown | Error {
        let tsb = new TimeSegmentBreakdown(data.date);
        if (data.breakdown) {
            tsb.breakdown = data.breakdown as Breakdown;
        }
        return tsb;
    }


    public calculate(date: string, variable: Variable, context: FrameRenderContext): Frame {
        let f = new Frame(date, variable.unit);
        for (let bdName in this.breakdown) {
            f.addSubframe(bdName, this.breakdown[bdName]);
        }
        return f;
    }
}
