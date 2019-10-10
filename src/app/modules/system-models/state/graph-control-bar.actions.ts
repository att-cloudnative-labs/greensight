
export class ProcessingElementSearchResultSelected {
    static readonly type = '[Graph Control Bar] Processing Element Search Result Selected';
    constructor(public readonly payload: {
        graphModelId: string,
        graphModelOrProcessInterface: any,
        position: any,
        label: string
    }) { }
}

export class GraphModelVersionCommentCommitted {
    static readonly type = '[Graph Control Bar] Manual Graph Model Version Comment Committed';
    constructor(public readonly payload: { id: string, comment: string }) { }
}

