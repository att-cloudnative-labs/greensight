export class SplitDragEnd {
    static readonly type = '[Layout] Split Drag End';
    constructor(public payload: { splitId: string, sizes: number[] }) { }
}

export class EditorTabTitleChanged {
    static readonly type = '[Layout] Editor Tab Title Changed';
    constructor(public readonly payload: { nodeId: string, newName: string }) { }
}

export class InvalidateEditorTabNames {
    static readonly type = '[Layout] InvalidateEditorTabNames';
    constructor() { }
}
