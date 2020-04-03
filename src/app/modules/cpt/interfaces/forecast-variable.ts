import { User } from '../../login/interfaces/user';
import { TimeSegment } from '@cpt/capacity-planning-projection/lib';
import { Actual, Breakdown } from '@cpt/capacity-planning-projection/lib/variable';
import { TimesegmentModel } from './timesegment';

import * as moment from 'moment';

export interface ForecastVariableTreeNode {
    id: string;
    version: string;
    metadata?: Metadata;
    content: ForecastVariableModel;
}

export interface Metadata {
    createdAt: string;
    lastChangedAt: string;
    ownerId: string;
    ownerName: string;
    branchId: string;
}

export interface ForecastVariableModel {
    title: string;
    color?: string;
    description: string;
    valueType: string;
    variableType: string;
    compositeType: string;
    unit: string;
    timeSegments?: Array<TimesegmentModel>;
    actuals?: Actual[];
    breakdownIds?: string[];
    defaultBreakdown?: Breakdown;
    objectId: string;
}


export class ForecastVariable {
    constructor(public variableModel: ForecastVariableModel) { }

    update(variableModel: ForecastVariableModel) {
        this.variableModel = variableModel;
    }

    get id(): string {
        return this.variableModel.objectId;
    }


    get content() {
        return this.variableModel;
    }

    get description(): string {
        return this.variableModel.description;
    }

    get title(): string {
        return this.variableModel.title;
    }

    get variableType(): string {
        return this.variableModel.variableType;
    }

    get segmentCount(): number {
        if (this.variableModel.defaultBreakdown == null) {
            return 0;
        }
        return Object.keys(this.variableModel.defaultBreakdown).length;
    }

    get timeSegments(): Array<TimesegmentModel> {
        // TODO: This should apply all the way up to the API level, we should always at least return an empty array.
        return this.variableModel.timeSegments || new Array<TimesegmentModel>();
    }

    // TODO: type this, make ForecastTimeSegment
    getNextTimeSegment(timeSegment) {
        const sorted = this.variableModel.timeSegments.sort((left, right) => {
            return moment(left.date, 'YYYY-MM').diff(moment(right.date, 'YYYY-MM'));
        });
        const index = sorted.findIndex(ts => ts.date === timeSegment.date);
        return sorted[index + 1];
    }
}
