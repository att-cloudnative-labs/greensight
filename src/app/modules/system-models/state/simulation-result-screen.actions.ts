import { TableEntryProperties, SRSDatatableProperties } from '../models/srs-datatable-properties';
import { TreeNode } from '@app/core_module/interfaces/tree-node';


export class RefreshButtonClicked {
    static readonly type = '[Simulation Result Screen] Refresh Button Clicked';
    constructor(public readonly payload: TreeNode) { }
}

export class DatatableEntryAdded {
    static readonly type = '[Simulation Result Screen] Datatable Entry Added';
    constructor(public readonly payload: { simulationId: string, nodeId: string, aggregationMethod: string, dataType: string }) { }
}

export class DatatableEntryRemoved {
    static readonly type = '[Simulation Result Screen] Datatable Entry Removed';
    constructor(public readonly payload: { simulationId: string, selectedRows: any[] }) { }

}

export class DatatableCellSelected {
    static readonly type = '[Simulation Result Screen] Datatable Cell Selected';
    constructor(public readonly payload: { simulationId: string, nodeId: string, month: string, aggregationMethod: string, dataType: string }) { }
}

export class DatatableSingleRowSelected {
    static readonly type = '[Simulation Result Screen] Datatable Single Row Selected';
    constructor(public readonly payload: { simulationId: string, nodeId: string, aggregationMethod: string, dataType: string }) { }
}

export class DatatableMultiRowSelected {
    static readonly type = '[Simulation Result Screen] Datatable Multiple Row Selected';
    constructor(public readonly payload: { simulationId: string, nodeId: string, aggregationMethod: string, dataType: string }) { }
}

export class SimulationResultDeleted {
    static readonly type = '[Simulation Result Screen] Simulation Result Deleted';
    constructor(public readonly payload: string) { }
}

export class DatatableRowAggregationMethodChanged {
    static readonly type = '[Simulation Result Screen] Datatable Row Aggregation Method Changed';
    constructor(public readonly payload: { simulationId: string, nodeId: string, aggregationMethod: string, dataType: string }) { }
}

export class SimulationScenarioChanged {
    static readonly type = '[Simulation Result Screen] Simulation Scenario Changed';
    constructor(public readonly payload: { simulationId: string, selectedScenarioId: string, updatedAggregationMethods: { [nodeid: string]: string } }) { }
}

export class UpdateNodeExpansionState {
    static readonly type = '[Simulation Result Screen] Simulation Scenario Node Expansion State Changed';
    constructor(public readonly payload: { simResultId: string, expansionState: { [simulationNodeId: string]: boolean } }) { }
}

export class UpdateSimulationResultMetaState {
    static readonly type = '[Simulation Result Screen] Updating from Simulation Result Metadata';
    constructor(public readonly simResultId: string, public readonly props: SRSDatatableProperties) { }
}

export class NewSimulationResultState {
    static readonly type = '[Simulation Result Screen] State got update';
    constructor(public readonly simResultId: string, public readonly props: SRSDatatableProperties) { }
}
