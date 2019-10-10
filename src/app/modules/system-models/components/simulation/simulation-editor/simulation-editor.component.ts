import { Component, Input, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { Store, Actions, ofActionSuccessful } from '@ngxs/store';
import { TreeState } from '@system-models/state/tree.state';
import { Observable } from 'rxjs';
import { TreeNode } from '@app/core_module/interfaces/tree-node';
import { GraphProcessingElementSearchComponent } from '../../system-model-app/graph-model-editor/graph-processing-element-search/graph-processing-element-search.component';
import { map, filter } from 'rxjs/operators';
import * as simulationActions from '@system-models/state/simulation.actions';
import * as treeActions from '@system-models/state/tree.actions';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { SimulationService } from '@system-models/services/simulation.service';
import { synchronizeGraphModel } from '@system-models/lib/synchronize-graph-model';
import { v4 as uuid } from 'uuid';

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
    selectedModel$: Observable<TreeNode>;
    selectedModel: TreeNode;
    monteCarloIterations: number;
    scenarios = {};
    scenarioIds = [];
    contentRequested = false;

    constructor(private store: Store, private actions: Actions, private simulationService: SimulationService) { }

    ngOnInit() {
        // get the selected simulation
        this.simulation$ = this.store.select(TreeState.nodeOfId).pipe(
            map(byId => byId(this.nodeId)),
            filter(simulationNode => !!simulationNode),
            filter(simulationNode => !this.simulation || this.simulation.version !== simulationNode.version),
            untilDestroyed(this)
        );
        // get the graph model node from the modelRef of the simulation configuration
        this.selectedModel$ = this.store.select(TreeState.simulationModelReference).pipe(
            map(byId => byId(this.nodeId)),
            filter(selectedModel => selectedModel !== null && selectedModel !== undefined),
            filter(selectedModel => !this.selectedModel || this.selectedModel.version !== selectedModel.version),
            untilDestroyed(this),
        );

        this.simulation$.subscribe(simulation => {
            if (simulation.content) {
                this.simulation = simulation;
                this.scenarios = this.simulation.content.scenarios;
                this.scenarioIds = Object.keys(this.scenarios);
                this.monteCarloIterations = this.simulation.content.monteCarloIterations;
            } else if (!this.contentRequested) {
                this.store.dispatch(new treeActions.LoadSimulationContent(simulation));
                this.contentRequested = true;
            }
        });

        this.childNodes$ = this.store
            .select(TreeState.childNodes)
            .pipe(
                map(byId => byId(this.nodeId)
                )
            );

        this.selectedModel$.subscribe(selectedmodel => {
            this.selectedModel = selectedmodel;
            setTimeout(() => {
                this.store.dispatch(new simulationActions.GraphModelUpdated({
                    simulationId: this.simulation.id,
                    graphModelId: this.selectedModel.id
                }));
            }, 0);
        });

        this.actions.pipe(ofActionSuccessful(treeActions.TrashedTreeNode), untilDestroyed(this)).subscribe((payload) => {
            if (this.selectedModel && payload.trashNode) {
                if (this.selectedModel.id === payload.trashNode.id) {
                    setTimeout(() => {
                        this.store.dispatch(new simulationActions.GraphModelSelected({
                            id: this.simulation.id,
                            graphModelId: null
                        }));
                    }, 0);
                    this.selectedModel = undefined;
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

    setSelectedModel(model: TreeNode) {
        this.selectedModel = model;
        this.store.dispatch([
            new simulationActions.GraphModelSelected(
                {
                    id: this.simulation.id,
                    graphModelId: model.id
                }),
            new simulationActions.GraphModelUpdated({
                simulationId: this.simulation.id,
                graphModelId: model.id
            })]
        );
    }

    async createSimulation() {
        const allGraphModelNodes = this.store.selectSnapshot(TreeState.nodesOfType('MODEL'));
        const processingElements = this.store.selectSnapshot(state => state.processingElements.processingElements);
        const graphModelId = this.simulation.content.modelRef;
        await synchronizeGraphModel(graphModelId, allGraphModelNodes, processingElements, async (gmn) => {
            await this.store.dispatch(new treeActions.UpdateTreeNode(gmn)).toPromise();
            const updatedNode = this.store.selectSnapshot(TreeState.nodesOfType('MODEL')).find(x => x.id === gmn.id);
            return updatedNode;
        });

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
