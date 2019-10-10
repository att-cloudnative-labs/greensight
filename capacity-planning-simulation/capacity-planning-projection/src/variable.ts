import { TimeSegment, TimeSegmentMethod } from './timesegment';
import { Frame, FrameRenderContext } from './frame';

export enum VariableType { Integer = "INTEGER", Real = "REAL", Breakdown = "BREAKDOWN" };

export class Actual {
    constructor(public date: String, public value: number) { }
}

export type Breakdown = { [name: string]: number };

export class Variable {
    public timeSegments?: TimeSegment[];
    public actuals?: Actual[];
    public breakdownIds?: string[];
    public defaultBreakdown?: Breakdown;

    constructor(public name: string, public id: string, public variableType: VariableType, public unit?: string) {

    }

    public static deserialize(data: any): Variable | Error {
        if (data.name === undefined || data.id === undefined || data.variableType === undefined) {
            return new Error("basic field missing");
        }
        let v = new Variable(data.name, data.id, data.variableType, data.unit);
        if (data.timeSegments && data.timeSegments instanceof Array) {
            for (let tsdata of data.timeSegments as any[]) {
                let ts = TimeSegment.deserialize(tsdata);
                if (ts instanceof Error) {
                    return ts;
                } else {
                    v.addTimeSegment(ts);
                }
            }
        }
        if (data.breakdownIds && data.breakdownIds instanceof Array) {
            for (let bddata of data.breakdownIds as any[]) {
                v.addBreakdownVariable(bddata);
            }
        }

        if (data.actuals && data.actuals instanceof Array) {
            for (let actd of data.actuals as Actual[]) {
                v.addActual(actd);
            }
        }
        if (data.defaultBreakdown) {
            v.defaultBreakdown = data.defaultBreakdown as Breakdown;
        }

        return v;
    }

    public getTimeSegment(date: String): TimeSegment | undefined {
        // we most likely would want to optimize this
        let lastTs: TimeSegment | undefined;
        if (this.timeSegments) {
            for (let ts of this.timeSegments) {
                if (ts.date === date)
                    return ts;
                if (ts.date > date) {
                    return lastTs;
                }
                lastTs = ts;
            }
        }
        return lastTs;
    }

    public addTimeSegment(timeSegment: TimeSegment) {
        if (this.variableType === VariableType.Breakdown && timeSegment.method !== TimeSegmentMethod.Breakdown) {
            return;
        }
        if (this.variableType !== VariableType.Breakdown && timeSegment.method === TimeSegmentMethod.Breakdown) {
            return;
        }

        if (this.timeSegments) {
            this.timeSegments = this.timeSegments.filter(ts => ts.date !== timeSegment.date);
        }
        else {
            this.timeSegments = [];
        }
        this.timeSegments.push(timeSegment);
        this.timeSegments.sort((a, b) => a.date.localeCompare(b.date));
    }

    public addActual(actual: Actual) {

        // We don't support actuals on breakdown variables
        if (this.variableType === VariableType.Breakdown) {
            return;
        }
        if (this.actuals) {
            this.actuals = this.actuals.filter(a => a.date !== actual.date);
        }
        else {
            this.actuals = [];
        }
        this.actuals.push(actual);
    }

    public addBreakdownVariable(bdVar: string | Variable) {
        let breakdownVarId: string = "";
        if (typeof bdVar !== "string") {
            if (bdVar.variableType !== VariableType.Breakdown) {
                return;
            }
            breakdownVarId = bdVar.id;
        } else {
            breakdownVarId = bdVar;
        }

        // We don't support breakdowns on breakdown variables
        if (this.variableType === VariableType.Breakdown) {
            return;
        }
        if (this.breakdownIds) {
            this.breakdownIds = this.breakdownIds.filter(bd => bd !== breakdownVarId);
        }
        else {
            this.breakdownIds = [];
        }
        this.breakdownIds.push(breakdownVarId);
    }
}
