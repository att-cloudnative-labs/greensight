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

export class OpenTabByNodeId {
    static readonly type = '[Layout] Open Editor Tab By Node Id';
    constructor(public readonly payload: { nodeId: string, releaseNr?: number }) { }
}

export class SaveLayout {
    static readonly type = '[Layout] Update Layout';
    constructor(public readonly payload: { ownerId: String, content: any }) { }
}

export class GetLayout {
    static readonly type = '[Layout] Get User Layout';
    constructor(public readonly payload: { ownerId: String}) { }
}
