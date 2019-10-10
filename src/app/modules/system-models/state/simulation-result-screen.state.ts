import { State, Action, StateContext, Selector } from '@ngxs/store';
import * as simulationResultScreenActions from './simulation-result-screen.actions';
import { SRSDatatableProperties, TableEntryProperties } from '../models/srs-datatable-properties';
import produce from 'immer';
import { TreeService } from '@app/core_module/service/tree.service';
import { TreeNode, TreeNodeType } from '@app/core_module/interfaces/tree-node';
import { Observable, of } from 'rxjs';
import { catchError, map, tap, flatMap } from 'rxjs/operators';


export class SRSStateModel {
    public simulationResults: {
        [simulationResultNodeId: string]: SRSDatatableProperties
    };
}


@State<SRSStateModel>({
    name: 'simulationResults',
    defaults: {
        simulationResults: {},
    }
})
export class SRSState {
    constructor(
        private treeService: TreeService) { }

    @Selector()
    static resultById(state: SRSStateModel) {
        return (id: string) => {
            return state.simulationResults[id];
        };
    }

    @Action(simulationResultScreenActions.SimulationResultDeleted)
    removeSimulationResult(
        { getState, setState }: StateContext<SRSStateModel>,
        { payload }: simulationResultScreenActions.SimulationResultDeleted
    ) {
        const newState = produce(getState(), draft => {
            delete draft.simulationResults[payload];
        });
        setState(newState);
    }

    @Action(simulationResultScreenActions.DatatableCellSelected)
    setSelectedDatatableCell(
        { getState, patchState }: StateContext<SRSStateModel>,
        { payload }: simulationResultScreenActions.DatatableCellSelected
    ) {
        const oldState = getState();
        const currentProps = oldState.simulationResults[payload.simulationId];
        const updatedProps = {
            ...currentProps, selectedRows: [{
                objectId: payload.nodeId,
                month: payload.month,
                aggregationMethod: payload.aggregationMethod,
                dataType: payload.dataType
            }]
        };
        let updatedResults: { [simulationNodeId: string]: SRSDatatableProperties } = { ...oldState.simulationResults };
        updatedResults[payload.simulationId] = updatedProps;
        patchState({ simulationResults: updatedResults });
    }

    @Action(simulationResultScreenActions.DatatableSingleRowSelected)
    setSingleSelectedDatatableRow(
        { getState, patchState }: StateContext<SRSStateModel>,
        { payload }: simulationResultScreenActions.DatatableSingleRowSelected
    ) {
        const oldState = getState();
        const currentProps = oldState.simulationResults[payload.simulationId];
        const updatedProps = {
            ...currentProps, selectedRows: [{
                objectId: payload.nodeId,
                aggregationMethod: payload.aggregationMethod,
                dataType: payload.dataType
            }]
        };
        let updatedResults: { [simulationNodeId: string]: SRSDatatableProperties } = { ...oldState.simulationResults };
        updatedResults[payload.simulationId] = updatedProps;
        patchState({ simulationResults: updatedResults });
    }

    @Action(simulationResultScreenActions.DatatableMultiRowSelected)
    setMultiSelectedDatatableRow(
        { getState, patchState }: StateContext<SRSStateModel>,
        { payload }: simulationResultScreenActions.DatatableMultiRowSelected
    ) {
        const oldState = getState();
        const currentProps = oldState.simulationResults[payload.simulationId];
        // if the row is already selected, we don't need to do anything
        if (currentProps.selectedRows.findIndex(r => !(r.objectId === payload.nodeId && r.dataType === payload.dataType)) < 0) {
            return;
        }
        const updatedProps = {
            ...currentProps, selectedRows: [...currentProps.selectedRows, {
                objectId: payload.nodeId,
                aggregationMethod: payload.aggregationMethod,
                dataType: payload.dataType
            }]
        };
        let updatedResults: { [simulationNodeId: string]: SRSDatatableProperties } = { ...oldState.simulationResults };
        updatedResults[payload.simulationId] = updatedProps;
        patchState({ simulationResults: updatedResults });

    }


    @Action(simulationResultScreenActions.DatatableEntryRemoved)
    removeDatatableEntry(
        { getState, setState, dispatch }: StateContext<SRSStateModel>,
        { payload }: simulationResultScreenActions.DatatableEntryRemoved
    ) {
        let tableEntries;
        let selectedRows;
        const newState = produce(getState(), draft => {
            payload.selectedRows.forEach(element => {
                tableEntries = draft.simulationResults[payload.simulationId].tableEntries.filter(node => (node.objectId !== element.objectId && node.dataType === element.dataType) || node.objectId !== element.objectId);
                selectedRows = draft.simulationResults[payload.simulationId].selectedRows.filter(node => (node.objectId !== element.objectId && node.dataType === element.dataType) || node.objectId !== element.objectId);
                draft.simulationResults[payload.simulationId] = {
                    tableEntries: tableEntries,
                    selectedRows: selectedRows,
                    expansionStateVariables: draft.simulationResults[payload.simulationId].expansionStateVariables,
                    selectedScenario: draft.simulationResults[payload.simulationId].selectedScenario
                };
            });
        });
        setState(newState);
        dispatch(new simulationResultScreenActions.NewSimulationResultState(payload.simulationId, newState.simulationResults[payload.simulationId]));
    }

    @Action(simulationResultScreenActions.DatatableEntryAdded)
    addDatatableEntry(
        ctx: StateContext<SRSStateModel>,
        { payload }: simulationResultScreenActions.DatatableEntryAdded
    ) {
        let oldState = ctx.getState();
        let currentProps = oldState.simulationResults[payload.simulationId] || { tableEntries: [], selectedRows: [], expansionStateVariables: {}, selectedScenario: undefined };
        let updatedProperties = {
            tableEntries: [...currentProps.tableEntries, { objectId: payload.nodeId, aggregationMethod: payload.aggregationMethod, dataType: payload.dataType }],
            selectedRows: [...currentProps.selectedRows],
            expansionStateVariables: currentProps.expansionStateVariables,
            selectedScenario: currentProps.selectedScenario
        };
        let updatedResults: { [simulationNodeId: string]: SRSDatatableProperties } = { ...oldState.simulationResults };
        updatedResults[payload.simulationId] = updatedProperties
        ctx.patchState({ simulationResults: updatedResults });
        ctx.dispatch(new simulationResultScreenActions.NewSimulationResultState(payload.simulationId, updatedProperties));

    }

    // the data here is only taken into account, when we don't have any local data
    @Action(simulationResultScreenActions.UpdateSimulationResultMetaState)
    updateResultMeta(
        ctx: StateContext<SRSStateModel>,
        { simResultId, props }: simulationResultScreenActions.UpdateSimulationResultMetaState

    ) {
        let oldState = ctx.getState();
        if (!oldState.simulationResults[simResultId] && props) {
            let updatedResults: { [simulationNodeId: string]: SRSDatatableProperties } = { ...oldState.simulationResults };
            updatedResults[simResultId] = { tableEntries: props.tableEntries, selectedRows: [], expansionStateVariables: props.expansionStateVariables, selectedScenario: props.selectedScenario };
            ctx.patchState({ simulationResults: updatedResults });
        }
    }



    @Action(simulationResultScreenActions.DatatableRowAggregationMethodChanged)
    updateDatatableRowAggregationMethod(
        { getState, patchState, dispatch }: StateContext<SRSStateModel>,
        { payload }: simulationResultScreenActions.DatatableRowAggregationMethodChanged
    ) {
        let oldState = getState();
        let patchAggregation = (tep: TableEntryProperties) => { if (tep.objectId === payload.nodeId && tep.dataType === payload.dataType) { return { ...tep, aggregationMethod: payload.aggregationMethod } }; return tep; };
        let currentProps = oldState.simulationResults[payload.simulationId] || { tableEntries: [], selectedRows: [], expansionStateVariables: {}, selectedScenario: undefined };
        let updatedProperties: SRSDatatableProperties = {
            tableEntries: [...currentProps.tableEntries.map(patchAggregation)],
            selectedRows: [...currentProps.selectedRows.map(patchAggregation)],
            expansionStateVariables: currentProps.expansionStateVariables,
            selectedScenario: currentProps.selectedScenario
        };
        let updatedResults: { [simulationNodeId: string]: SRSDatatableProperties } = { ...oldState.simulationResults };
        updatedResults[payload.simulationId] = updatedProperties;
        patchState({ simulationResults: updatedResults });
        dispatch(new simulationResultScreenActions.NewSimulationResultState(payload.simulationId, updatedProperties));

    }

    @Action(simulationResultScreenActions.UpdateNodeExpansionState)
    setNodeExpansionState(
        { getState, patchState, dispatch }: StateContext<SRSStateModel>,
        { payload }: simulationResultScreenActions.UpdateNodeExpansionState
    ) {
        let oldState = getState();
        let currentProps = oldState.simulationResults[payload.simResultId] || { tableEntries: [], selectedRows: [], expansionStateVariables: {}, selectedScenario: undefined };
        let updatedProperties: SRSDatatableProperties = {
            tableEntries: currentProps.tableEntries,
            selectedRows: currentProps.selectedRows,
            expansionStateVariables: payload.expansionState,
            selectedScenario: currentProps.selectedScenario
        };

        let updatedResults: { [simulationNodeId: string]: SRSDatatableProperties } = { ...oldState.simulationResults };
        updatedResults[payload.simResultId] = updatedProperties;
        patchState({ simulationResults: updatedResults });
        dispatch(new simulationResultScreenActions.NewSimulationResultState(payload.simResultId, updatedProperties));

    }
    @Action(simulationResultScreenActions.SimulationScenarioChanged)
    setSelectedScenario(
        ctx: StateContext<SRSStateModel>,
        { payload }: simulationResultScreenActions.SimulationScenarioChanged
    ) {
        let oldState = ctx.getState();
        let currentProps = oldState.simulationResults[payload.simulationId] || { tableEntries: [], selectedRows: [], expansionStateVariables: {}, selectedScenario: undefined };
        let updatedProperties: SRSDatatableProperties = {
            tableEntries: currentProps.tableEntries,
            selectedRows: currentProps.selectedRows,
            expansionStateVariables: currentProps.expansionStateVariables,
            selectedScenario: payload.selectedScenarioId
        };

        let updatedResults: { [simulationNodeId: string]: SRSDatatableProperties } = { ...oldState.simulationResults };
        updatedResults[payload.simulationId] = updatedProperties;
        ctx.patchState({ simulationResults: updatedResults });
        ctx.dispatch(new simulationResultScreenActions.NewSimulationResultState(payload.simulationId, updatedProperties));

    }

}
