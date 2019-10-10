export class Drop {
    static readonly type = '[Graph Editor] Drop';
    constructor(public readonly payload: {
        graphModelId: string,
        draggedList: any;
    }) { }
}

export class CablePullComplete {
    static readonly type = '[Graph Editor] Cable Pull Complete';
    constructor(public readonly payload: {
        graphModelId: string,
        newConnection: any;
    }) { }
}

export class PortPinShiftClicked {
    static readonly type = '[Graph Editor] Port Pin Shift Clicked';
    constructor(public readonly payload: {
        graphModelId: string,
        portId: string;
    }) { }
}

export class DeleteKeyPressed {
    static readonly type = '[Graph Editor] Delete Key Pressed';
    constructor(public readonly payload: {
        graphModelId: string,
        selection: any[]
    }) { }
}

export class NodeSelected {
    static readonly type = '[Graph Editor] Node Selected';
    constructor(public readonly payload: {
        nodeType: string,
        graphModelId: string,
        nodeId: string,
        modifierKeys: string[]
    }) { }
}

export class NodeDoubleClicked {
    static readonly type = '[Graph Editor] Node Double Clicked';
    constructor(public readonly payload: {
        nodeType: string,
        graphModelId: string,
        nodeId: string,
        modifierKeys: string[],
        eventType: string,

    }) { }
}

export class ProcessPortSelected {
    static readonly type = '[Graph Editor] Process Port Selected';
    constructor(public readonly payload: {
        nodeType: string,
        graphModelId: string,
        nodeId: string,
    }) { }
}

export class ProcessPortDoubleClicked {
    static readonly type = '[Graph Editor] Process Port Double Clicked';
    constructor(public readonly payload: {
        nodeType: string,
        graphModelId: string,
        nodeId: string,
        eventType?: string
    }) { }
}

export class DragSelectionChanged {
    static readonly type = '[Graph Editor] Drag Selection Changed';
    constructor(public readonly payload: {
        graphModelId: string,
        selection: any[]
    }) { }
}

export class AddPortTemplateButtonClicked {
    static readonly type = '[Graph Editor] Add Port Template Button Clicked';
    constructor(public readonly payload: {
        graphModelId: string,
        processId: string,
        portTemplate: any // TODO: Type this
    }) { }
}

export class ItemDropped {
    static readonly type = '[Graph Editor] Item Dropped';
    constructor(public readonly payload: {
        graphModelId: string,
        dropData: any,
        position: {
            x: number,
            y: number
        }
    }) { }
}

export class UndoPerformed {
    static readonly type = '[Graph Editor] Undo Performed';
    constructor(public readonly payload: {
        graphModelId: string,
        graphModelNode: any
    }) { }
}

export class RedoPerformed {
    static readonly type = '[Graph Editor] Redo Performed';
    constructor(public readonly payload: {
        graphModelId: string,
        graphModelNode: any
    }) { }
}
export class RemoveRefModel {
    static readonly type = '[Graph Editor] Remove Ref Model';
    constructor(public readonly payload: {
        graphModelId: string,
        selection: any[]
    }) { }
}

export class AddRefModelToSelection {
    static readonly type = '[Graph Editor] Add Ref Model to Selection';
    constructor(public readonly payload: {
        nodeType: string,
        graphModelId: string,
        nodeId: string,
        modifierKeys: string[]
    }) { }
}

export class OpenGraphModelRef {
    static readonly type = '[Graph Editor] Open graph Model Ref';
    constructor(public readonly graphNode: any) { }
}
