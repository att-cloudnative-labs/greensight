import { Moment } from 'moment';

export interface ForecastVariableDescriptor {
    variableName: string;
    variableId: string;
    variableUnit: string;
    sheetName: string;
    sheetId: string;
    sheetRefId: string;
    folderName: string;
    folderId: string;
    searchKey: string;
    variableType: string;
    startDate: Moment;
    endDate: Moment;
}
