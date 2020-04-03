import { Selection } from '@app/modules/cpt/state/selection.state';
import { ClipboardStateModel } from '@app/modules/cpt/state/clipboard.state';

export class NodesCopied {
    static readonly type = '[Clipboard] Node Copied';
    constructor() { }
}

export class GraphModelElementsCopied {
    static readonly type = '[Clipboard] Graph Model Elements Copied';
    constructor() { }
}

export class NodesCut {
    static readonly type = '[Clipboard] Node Cut';
    constructor() { }
}

export class NodesPasted {
    static readonly type = '[Clipboard] Node Pasted';
    constructor(public targetNodeId) { }
}

export class NodePasteCommitted {
    static readonly type = '[Clipboard] Node Paste Committed';
    constructor(public targetNodeId) { }
}

export class GraphModelElementsPasted {
    static readonly type = '[Clipboard] Graph Model Elements Pasted';
    constructor(public targetNodeId,
        public position) { }
}

export class PastePerformed {
    static readonly type = '[Clipboard] Paste Performed';
    constructor(public payload: {
        targetNodeId: string,
        clipboardData: ClipboardStateModel,
        position?: any
    }) { }
}

export class ClipboardDataSet {
    static readonly type = '[Clipboard] Clipboard data set';
    constructor(public payload: {
        selections: Selection[],
        action: string
    }) { }
}

export class ClipboardDataCleared {
    static readonly type = '[Clipboard] Clipboard Data Cleared';
    constructor() { }
}
