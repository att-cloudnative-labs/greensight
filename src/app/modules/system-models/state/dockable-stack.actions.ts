export class TabClicked {
    static readonly type = '[Dockable Stack] Tab Clicked';
    constructor(public payload: { stackId: string, panelId: string }) { }
}

export class TabCloseClicked {
    static readonly type = '[Dockable Stack] Tab Close Clicked';
    constructor(public payload: { stackId: string, panelId: string }) { }
}

export class TabSelectionChanged {
    static readonly type = '[Dockable Stack] Tab Selection Changed';
    constructor(public payload: { stackId: string, nodeId: string }) { }
}
