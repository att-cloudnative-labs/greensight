import { Component, Input, OnInit, OnDestroy, HostBinding, ElementRef } from '@angular/core';
import { Store, Actions, ofActionSuccessful, Select } from '@ngxs/store';
import { TreeState } from '@cpt/state/tree.state';
import { Observable, combineLatest } from 'rxjs';
import { map, filter, take } from 'rxjs/operators';
import { untilDestroyed } from 'ngx-take-until-destroy';
import * as simulationResultActions from '@cpt/state/simulation-result-screen.actions';
import * as treeActions from '@cpt/state/tree.actions';
import { SRSState } from '@cpt/state/simulation-result-screen.state';
import { TableEntryProperties } from '@cpt/models/srs-datatable-properties';
import { ApplicationState } from '@cpt/state/application.state';
import { SimulationRuntimeMessage } from '@cpt/capacity-planning-simulation-types/lib';




@Component({
    selector: 'app-simulation-result',
    templateUrl: './simulation-result.component.html',
    styleUrls: ['./simulation-result.component.css']
})
export class SimulationResultComponent implements OnInit, OnDestroy {
    @Select(TreeState.hasLoaded) treeHasLoaded$: Observable<boolean>;
    @HostBinding('class.isLoading') treeIsLoading = false;
    @Input() nodeId: string;
    simulationResult;
    tableSelection;
    isRefreshing = false;
    isDisplayedRelativeValues = false;
    scenarios: any = [];
    aggregatedReportIndex = 0;
    selectedScenarioId: string;
    initialReload = true;
    isVisible = true;
    warnings: SimulationRuntimeMessage[] = [];
    errorDetails: SimulationRuntimeMessage;

    tableEntryProperties: TableEntryProperties[] = [];

    constructor(private store: Store, private actions$: Actions, private _el: ElementRef) {
        // When reloading the simulation results is complete, stop spinning the refresh button
        this.actions$.pipe(ofActionSuccessful(simulationResultActions.RefreshButtonClicked), untilDestroyed(this)).subscribe(() => {
            this.isRefreshing = false;
        });
    }

    ngOnInit() {

        this.store.select(ApplicationState).pipe(untilDestroyed(this), filter(as => as.ready), take(1)).subscribe(as => {
            this.store.dispatch(new treeActions.LoadSimulationResultContent({ id: this.nodeId }));

            this.treeHasLoaded$.subscribe(treeHasLoaded => this.treeIsLoading = !treeHasLoaded);
            const simulationResultProperties$ = this.store.select(SRSState.resultById).pipe(
                map(byId => byId(this.nodeId)),
                untilDestroyed(this)
            );
            // get the selected simulation
            const simulationResult$ = this.store.select(TreeState.nodeOfId).pipe(
                map(byId => byId(this.nodeId)),
                untilDestroyed(this),
                filter(result => !!result),
                filter(node => !this.simulationResult || !this.simulationResult.content || this.simulationResult.version !== node.version)
            );
            combineLatest(simulationResultProperties$, simulationResult$).subscribe(([simulationResultProperties, simulationResult]) => {
                if (simulationResult.content === null && !this.simulationResult) {
                    this.simulationResult = JSON.parse(JSON.stringify(simulationResult));
                    // this.store.dispatch(new treeActions.LoadSimulationResultContent(this.simulationResult));
                } else if (simulationResult.content !== null) {
                    if (this.initialReload && (simulationResult.content.state === 'RUNNING' || simulationResult.content.state === 'QUEUED')) {
                        this.initialReload = false;
                        // this.store.dispatch(new treeActions.LoadSimulationResultContent({ id: this.nodeId }));
                    } else {
                        let scenarioUpdated = false;
                        if (simulationResultProperties && simulationResultProperties.selectedScenario) {
                            if (this.selectedScenarioId !== simulationResultProperties.selectedScenario) {
                                this.selectedScenarioId = simulationResultProperties.selectedScenario;
                                scenarioUpdated = true;
                            }
                            this.tableEntryProperties = simulationResultProperties.tableEntries;
                        }
                        if (!this.simulationResult || !this.simulationResult.content || this.simulationResult.version !== simulationResult.version || scenarioUpdated) {
                            this.scenarios = [];
                            // FIXME: quick workaround for dealing with not extensible error
                            this.simulationResult = JSON.parse(JSON.stringify(simulationResult));
                            Object.values(this.simulationResult.content.scenarios).forEach(scenario => {
                                this.scenarios.push(scenario);
                            });
                            this.warnings = this.simulationResult.content.warnings || [];
                            this.errorDetails = this.simulationResult.content.errorDetails;

                            if (this.scenarios.length > 0) {
                                this.selectedScenarioId = this.selectedScenarioId ? this.selectedScenarioId : this.scenarios[0].scenarioId;
                                this.aggregatedReportIndex = this.selectedScenarioId ? this.scenarios.findIndex(x => x.scenarioId === this.selectedScenarioId) :
                                    this.scenarios.findIndex(x => x.scenarioId === this.scenarios[0].scenarioId);
                            }
                        }

                    }
                }
            });
        });
    }

    ngOnDestroy() { }

    enableUserInput() {
        this.isVisible = true;
    }

    disableUserInput() {
        this.isVisible = false;

    }

    private getDataContent(nodeId: string, dataType: string): any {
        const node = this.simulationResult.content.nodes[nodeId];
        const aggregatedReportData = node ? node.aggregatedReport[this.selectedScenarioId] : null;
        const aggregatedReportDataIndex = aggregatedReportData ? Object.keys(aggregatedReportData)[0] : null;
        return aggregatedReportData ? aggregatedReportData[aggregatedReportDataIndex][dataType] : null;
    }

    onChangeScenario(event) {
        this.selectedScenarioId = this.scenarios.find(x => x.scenarioId === event.target.value).scenarioId;

        const updatedAggregationMethods: {
            [simulationResultNodeId: string]: string
        } = {};

        for (const tep of this.tableEntryProperties) {
            const varContent = this.getDataContent(tep.objectId, tep.dataType);
            if (varContent && !varContent[tep.aggregationMethod]) {
                updatedAggregationMethods[tep.objectId] = Object.keys(varContent).find(e => e !== 'HISTOGRAM');
            }
        }
        this.aggregatedReportIndex = this.selectedScenarioId ? this.scenarios.findIndex(x => x.scenarioId === this.selectedScenarioId) :
            this.scenarios.findIndex(x => x.scenarioId === this.scenarios[0].scenarioId);
        this.store.dispatch(new simulationResultActions.SimulationScenarioChanged({ simulationId: this.simulationResult.id, selectedScenarioId: this.selectedScenarioId, updatedAggregationMethods: updatedAggregationMethods }));
    }

    /**
     * Reloads the simulation result by dispatching an action for getting the simulation result node
     */
    onRefreshResult() {
        this.isRefreshing = true;
        this.store.dispatch(new simulationResultActions.RefreshButtonClicked({ ...this.simulationResult, content: null }));
    }

    onCellSelectionUpdate(cellInfo) {
        this.tableSelection = cellInfo;
    }

    onRowSelectionUpdate(selectedRows) {
        if (selectedRows.length === 0) {
            this.tableSelection = undefined;
        }
        this.tableSelection = Object.assign([], selectedRows);
    }

    onExportTable() {
        const csv = [];
        const rows = this._el.nativeElement.querySelectorAll('table.simResultDataTable tr');

        for (let i = 0; i < rows.length; i++) {
            const row = [], cols = rows[i].querySelectorAll('td, th');

            for (let j = 0; j < cols.length; j++) {
                const pushingCol = <HTMLElement>cols[j];
                switch (j) {
                    // variable name column
                    case 0: {
                        const selectSelect = cols[j].querySelectorAll('select');
                        if (selectSelect.length !== 0) {
                            const varName = pushingCol.innerText.split('\n')[0];
                            row.push(varName);
                        } else {
                            row.push(pushingCol.innerText);
                        }
                        break;
                    }
                    // type, agg, unit columns
                    case 1:
                    case 2:
                    case 3: {
                        row.push(pushingCol.innerText);
                        break;
                    }
                    // Month columns
                    default: {
                        if (/\s/.test(pushingCol.innerText)) {
                            const monthValue = pushingCol.innerText.split(' ')[0];
                            row.push(monthValue);
                        } else {
                            row.push(pushingCol.innerText);
                        }
                        break;
                    }
                }
            }
            csv.push(row.join(','));
        }

        const blob = new Blob([csv.join('\n')], { type: 'text/csv' });

        const dwldLink = document.createElement('a');
        const url = window.URL.createObjectURL(blob);
        const isSafariBrowser = navigator.userAgent.indexOf('Safari') !== -1 && navigator.userAgent.indexOf('Chrome') === -1;
        if (isSafariBrowser) {
            // if Safari open in new window to save file with random filename.
            dwldLink.setAttribute('target', '_blank');
        }
        dwldLink.setAttribute('href', url);
        dwldLink.setAttribute('download', this.simulationResult.name + '.csv');
        dwldLink.style.visibility = 'hidden';
        document.body.appendChild(dwldLink);
        dwldLink.click();
        document.body.removeChild(dwldLink);
    }

    displayRelativeValues() {
        this.isDisplayedRelativeValues = !this.isDisplayedRelativeValues;
    }
}
