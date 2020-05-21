
export class UnitFetchAll {
    static readonly type = '[Variable Unit]  Fetch';
}

export class UnitAdd {
    static readonly type = '[Variable Unit]  Add New Unit';
    constructor(public readonly payload: { title: string }) { }

}

export class UnitDelete {
    static readonly type = '[Variable Unit]  Delete Unit';
    constructor(public readonly payload: { id: string }) { }

}
