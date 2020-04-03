export interface SRSDatatableProperties {
    tableEntries: TableEntryProperties[];
    selectedRows: SelectedRowProperties[];
    expansionStateVariables: { [simulationNodeId: string]: boolean };
    selectedScenario?: string;
}

export interface TableEntryProperties {
    objectId: string;
    aggregationMethod: string;
    dataType: string;
}

export interface SelectedRowProperties extends TableEntryProperties {
    month?: string;
}
