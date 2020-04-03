import { VariableType } from '@cpt/capacity-planning-projection/lib';

export class AddVariable {
    static readonly type = '[Forecast Sheet] Add Variable';
    constructor(public readonly payload: { folderId: string, folderName: string, sheetId: string, sheetName: string, variableId: string, variableName: string, variableContent: any }) { }
}

export class UpdateVariable {
    static readonly type = '[Forecast Sheet] Update Variable';
    constructor(public readonly payload: { folderId: string, folderName: string, sheetId: string, sheetName: string, variableId: string, variableName: string, variableContent: any }) { }
}

export class DeleteVariable {
    static readonly type = '[Forecast Sheet] Delete Variable';
    constructor(public readonly payload: { sheetId: string, variableId: string, force?: boolean }) { }
}

export class FailedToDeleteVariable {
    static readonly type = '[Forecast Sheet] Failed to Delete Variable';
    constructor(public readonly payload: { sheetId: string, variableId: string, reason: string }) { }
}

export class EnteredVariableTitle {
    static readonly type = '[Forecast Sheet] New Variable Title';
    constructor(public readonly payload: { sheetId: string, variableId: string, variableTitle: string }) { }

}

export class VariableTitleError {
    static readonly type = '[Forecast Sheet] Variable Title Error';
    constructor(public readonly payload: { sheetId: string, variableId: string, message: string }) { }

}

export class SelectedVariableType {
    static readonly type = '[Forecast Sheet] Selected Variable Type';
    constructor(public readonly payload: { sheetId: string, variableId: string, variableType: VariableType, force?: boolean }) { }

}

export class ClickedVariableCell {
    static readonly type = '[Forecast Sheet] Clicked Variable Cell';
    constructor(public readonly payload: { sheetId: string, variableId: string, date: string }) { }
}
