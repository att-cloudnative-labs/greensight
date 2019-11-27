import { Component, Input, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { Store, Actions, ofActionSuccessful, Select } from '@ngxs/store';
import { TreeState } from '@system-models/state/tree.state';
import { combineLatest, Observable, Subject } from 'rxjs';
import { TreeNode } from '@app/core_module/interfaces/tree-node';
import { GraphProcessingElementSearchComponent } from '../../system-model-app/graph-model-editor/graph-processing-element-search/graph-processing-element-search.component';
import { map, filter } from 'rxjs/operators';
import * as simulationActions from '@system-models/state/simulation.actions';
import * as treeActions from '@system-models/state/tree.actions';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { SimulationService } from '@system-models/services/simulation.service';
import { synchronizeGraphModel } from '@system-models/lib/synchronize-graph-model';
import { v4 as uuid } from 'uuid';
import { ProcessInterfaceDescription } from '@cpt/capacity-planning-simulation-types/lib';
import { ProcessingElementState, ProcessingElementStateModel } from '@system-models/state/processing-element.state';

@Component({
    selector: 'app-simulation-editor',
    templateUrl: './simulation-editor.component.html',
    styleUrls: ['./simulation-editor.component.css']
})
export class SimulationEditorComponent implements OnInit, OnDestroy {
    @Input() nodeId: string;
    @ViewChild(GraphProcessingElementSearchComponent) graphProcessingElementSearchComp: GraphProcessingElementSearchComponent;
    simulation$: Observable<TreeNode>;
    childNodes$: Observable<TreeNode[]>;
    simulation: TreeNode;
    modelPid$: Subject<ProcessInterfaceDescription> = new Subject<ProcessInterfaceDescription>();
    modelPid: ProcessInterfaceDescription;
    @Select(ProcessingElementState) pids$: Observable<ProcessingElementStateModel>;
    monteCarloIterations: number;
    scenarios = {};
    scenarioIds = [];

    constructor(private store: Store, private actions: Actions, private simulationService: SimulationService) { }

    ngOnInit() {

        this.store.dispatch(new treeActions.LoadSimulationContent({ id: this.nodeId }));
        // get the selected simulation
        this.simulation$ = this.store.select(TreeState.nodeOfId).pipe(
            map(byId => byId(this.nodeId)),
            filter(simulationNode => !!simulationNode),
            filter(simulationNode => !this.simulation || this.simulation.version !== simulationNode.version),
            untilDestroyed(this)
        );

        this.modelPid$.subscribe(pid => {
            this.modelPid = pid;
        });

        combineLatest(this.simulation$, this.pids$).subscribe(([simulation, pids]) => {
            if (simulation.content && pids.loaded) {
                this.simulation = simulation;
                this.scenarios = this.simulation.content.scenarios;
                this.scenarioIds = Object.keys(this.scenarios);
                this.monteCarloIterations = this.simulation.content.monteCarloIterations;
                const modelPid = pids.graphModels.find(pid => pid.objectId === simulation.content.modelRef);
                this.modelPid$.next(modelPid);
            }
        });

        this.childNodes$ = this.store
            .select(TreeState.childNodes)
            .pipe(
                map(byId => byId(this.nodeId)
                )
            );


        this.actions.pipe(ofActionSuccessful(treeActions.TrashedTreeNode), untilDestroyed(this)).subscribe((payload) => {
            if (this.modelPid && payload.trashNode) {
                if (this.modelPid.objectId === payload.trashNode.id) {
                    setTimeout(() => {
                        this.store.dispatch(new simulationActions.GraphModelSelected({
                            id: this.simulation.id,
                            graphModelId: null
                        }));
                    }, 0);
                    this.modelPid = undefined;
                }
            }
        });
    }

    ngOnDestroy() { }

    enableUserInput() {

    }

    disableUserInput() {

    }

    renameScenario(scenarioId, newName) {
        this.store.dispatch(new simulationActions.RenameScenarioClicked({
            simulationId: this.simulation.id,
            scenarioId: scenarioId,
            updatedName: newName,
        }));
    }

    addScenario() {
        const index = this.scenarioIds.length + 1;
        const id = this.scenarioIds[0];
        const inports = this.simulation.content.scenarios[id].inports;
        const newScenarioId = uuid();
        this.store.dispatch(new simulationActions.AddScenarioButtonClicked(
            {
                simulationId: this.simulation.id,
                newScenario: {
                    name: 'Scenario ' + index,
                    scenarioId: newScenarioId,
                    objectId: newScenarioId,
                    inports: inports,
                    objectType: 'SIMULATION_SCENARIO'
                }
            })
        );
    }

    removeScenario(scenarioId) {
        this.store.dispatch(new simulationActions.RemoveScenarioButtonClicked(
            {
                simulationId: this.simulation.id,
                scenarioId: scenarioId
            })
        );
    }

    saveMonteCarlo() {
        if (this.simulation.content.monteCarloIterations !== this.monteCarloIterations) {
            this.store.dispatch(new simulationActions.MonteCarloUpdated(
                {
                    id: this.simulation.id,
                    newMonteCarloValue: this.monteCarloIterations
                })
            );
        }
    }

    async createSimulation() {
        const allGraphModelNodes = this.store.selectSnapshot(TreeState.nodesOfType('MODEL'));
        const processInterfaceDescriptions = this.store.selectSnapshot(ProcessingElementState.pids);
        const graphModel = allGraphModelNodes.find(n => n.id === this.simulation.content.modelRef);
        if (graphModel) {
            await synchronizeGraphModel(graphModel, processInterfaceDescriptions, async (gmn) => {
                await this.store.dispatch(new treeActions.UpdateTreeNode(gmn)).toPromise();
                const updatedNode = this.store.selectSnapshot(TreeState.nodesOfType('MODEL')).find(x => x.id === gmn.id);
                return updatedNode;
            });
        }
        this.simulationService
            .createSimulation(this.simulation.id, this.simulation.version)
            .subscribe(resp => {
                const simResultId = resp.resultId;
                this.store.dispatch(new simulationActions.SimulationResultCreated(simResultId));
            });
    }

    get isNotClickable() {
        return (!this.monteCarloIterations || !(this.monteCarloIterations > 0));
    }
}
