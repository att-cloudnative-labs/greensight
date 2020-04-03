import { ForecastVariableModel } from "@app/modules/cpt/interfaces/forecast-variable";
import { Expression, VariableType } from "@cpt/capacity-planning-projection/lib";
import { TimeSegmentMethod } from "@cpt/capacity-planning-projection/lib/timesegment";



export function bdHasAssociatedVariables(breakdownId: string, allVariables: ForecastVariableModel[]): boolean {
    const associatedVariables: ForecastVariableModel[] = allVariables.filter(v => v.breakdownIds && v.breakdownIds.includes(breakdownId));
    return associatedVariables.length > 0;
}

export function isReferencedVariables(variableId: string, allVariables: ForecastVariableModel[]): boolean {
    for (const variable of allVariables) {
        if (variable.variableType !== VariableType.Breakdown && variable.timeSegments) {
            for (const timeSeg of variable.timeSegments) {
                if (timeSeg.expression) {
                    const ex = Expression.deserialize(timeSeg.expression);
                    let references = {};
                    if (ex instanceof Expression) {
                        references = ex.getNeededRefsExt();
                        const hasReference = !!Object.values(references).find(r => r === variableId);
                        if (hasReference) {
                            return true;
                        }
                    }
                }
            }
        }
    }
    return false;
}

export function removeBreakdownReferences(breakdownId: string, allVariables: ForecastVariableModel[]) {
    for (const v of allVariables) {
        if (v.breakdownIds && v.breakdownIds.includes(breakdownId)) {
            v.breakdownIds = v.breakdownIds.filter(bd => bd != breakdownId);
            if (v.breakdownIds.length === 0) {
                v.breakdownIds = null;
            }
        }
    }
}

export function sanitizeTimeSegments(variables: ForecastVariableModel[]) {
    for (const v of variables) {
        for (const ts of v.timeSegments) {
            const tsRaw = ts as any;
            delete tsRaw._mainIdentifierValues;
            delete tsRaw._scopedIdentifierValues;
            delete tsRaw._dateShield;
        }
    }
}


export function setVariableType(variable: ForecastVariableModel, variableType: VariableType) {
    switch (variableType) {
        case VariableType.Real:
        case VariableType.Integer:
            if (variable.timeSegments && variable.timeSegments.length > 0 && variable.timeSegments[0].method === TimeSegmentMethod.Breakdown) {
                variable.timeSegments.splice(0, variable.timeSegments.length);
            }
            variable.defaultBreakdown = null;
            break;
        case VariableType.Breakdown:
            variable.timeSegments.splice(0, variable.timeSegments.length);
            break;
    }
    variable.variableType = variableType;
}
