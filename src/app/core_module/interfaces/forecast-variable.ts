import { User } from './user';
import { TimeSegment } from '@cpt/capacity-planning-projection/lib';
import { Actual, Breakdown } from '@cpt/capacity-planning-projection/lib/variable';
import { TimesegmentModel } from './timesegment';

import * as moment from 'moment';

export interface ForecastVariableModel {
    id: string;
    version: string;
    metadata?: Metadata;
    content: Content;
}

export interface Metadata {
    createdAt: string;
    lastChangedAt: string;
    ownerId: string;
    ownerName: string;
    branchId: string;
}

export interface Content {
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
}


export class ForecastVariable {
    constructor(public variableModel: ForecastVariableModel) { }

    update(variableModel: ForecastVariableModel) {
        this.variableModel = variableModel;
    }

    get id(): string {
        return this.variableModel.id;
    }

    get version(): string {
        return this.variableModel.version;
    }

    get metadata() {
        return this.variableModel.metadata;
    }

    get content() {
        return this.variableModel.content;
    }

    get description(): string {
        return this.variableModel.content.description;
    }

    get title(): string {
        return this.variableModel.content.title;
    }

    get variableType(): string {
        return this.variableModel.content.variableType;
    }

    get segmentCount(): number {
        if (this.variableModel.content.defaultBreakdown == null) {
            return 0;
        }
        return Object.keys(this.variableModel.content.defaultBreakdown).length;
    }

    get timeSegments(): Array<TimesegmentModel> {
        // TODO: This should apply all the way up to the API level, we should always at least return an empty array.
        return this.variableModel.content.timeSegments || new Array<TimesegmentModel>();
    }

    // TODO: type this, make ForecastTimeSegment
    getNextTimeSegment(timeSegment) {
        const sorted = this.content.timeSegments.sort((left, right) => {
            return moment(left.date, 'YYYY-MM').diff(moment(right.date, 'YYYY-MM'));
        });
        const index = sorted.findIndex(ts => ts.date === timeSegment.date);
        return sorted[index + 1];
    }
}
