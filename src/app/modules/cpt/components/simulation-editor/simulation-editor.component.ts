import { Component, Input, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { Store, Actions, ofActionSuccessful, Select } from '@ngxs/store';
import { TreeState } from '@cpt/state/tree.state';
import { BehaviorSubject, combineLatest, Observable, ReplaySubject, Subject } from 'rxjs';
import { TreeNode } from '@cpt/interfaces/tree-node';
import { GraphProcessingElementSearchComponent } from '../graph-model-editor/graph-processing-element-search/graph-processing-element-search.component';
import { map, filter, take } from 'rxjs/operators';
import * as simulationActions from '@cpt/state/simulation.actions';
import * as treeActions from '@cpt/state/tree.actions';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { SimulationService } from '@cpt/services/simulation.service';
import { synchronizeGraphModel } from '@cpt/lib/synchronize-graph-model';
import { v4 as uuid } from 'uuid';
import { ProcessingElementState } from '@cpt/state/processing-element.state';
import { Utils } from '@cpt/lib/utils';
import { GraphModelInterfaceUpdated, GraphModelTrackingUpdateClicked } from '@cpt/state/simulation.actions';
import { TreeNodeTrackingState } from '@cpt/state/tree-node-tracking.state';
import { TreeNodeReferenceTracking, TreeNodeInfo } from '@cpt/interfaces/tree-node-tracking';
import { ForecastSheetReference, SimulationConfiguration } from '@cpt/capacity-planning-simulation-types/lib';
import { ReleaseFetch } from '@cpt/state/release.actions';
import { ReleaseState } from '@cpt/state/release.state';
import { TreeNodeRelease } from '@cpt/interfaces/tree-node-release';
import { ForecastVariableModel } from '@cpt/interfaces/forecast-variable';
import { ForecastVariableDescriptor } from '@cpt/interfaces/forecast-variable-descriptor';
import { refNeedsUpdate } from '@cpt/lib/tracking-ops';
import { LoadGraphModelContent } from '@cpt/state/tree.actions';
import { pidFromGraphModelNode } from '@cpt/models/graph-model.model';
import { ApplicationState } from '@cpt/state/application.state';
import { GraphModelInterfaceState } from '@cpt/state/graph-model-interface.state';

@Component({
    selector: 'app-simulation-editor',
    templateUrl: './simulation-editor.component.html',
    styleUrls: ['./simulation-editor.component.css']
})
export class SimulationEditorComponent implements OnInit, OnDestroy {
    @Input() nodeId: string;
    @ViewChild(GraphProcessingElementSearchComponent, { static: false }) graphProcessingElementSearchComp: GraphProcessingElementSearchComponent;
    sim$: Observable<TreeNode>;
    sim$$: ReplaySubject<TreeNode>;
    childNodes$: Observable<TreeNode[]>;
    @Select(TreeNodeTrackingState.forecastSheets) inputSheetTracking$: Observable<TreeNodeInfo[]>;
    @Select(TreeNodeTrackingState.graphModels) graphModelTracking$: Observable<TreeNodeInfo[]>;

    simulation: TreeNode = null;
    monteCarloIterations: number;
    scenarios = {};
    scenarioIds = [];
    modelRef: string;
    modelFullName = '';
    reloadScenariosOnChange = false;
    modelNotFound = false;
    editingEnabled = true;
    forecastSheets$: Subject<ForecastSheetReference[]> = new Subject<ForecastSheetReference[]>();
    forecastSheets: ForecastSheetReference[] = [];
    selectableForecastSheets: TreeNodeInfo[] = [];
    alreadySelectedForecastSheetIds: string[] = [];

    variableDescriptors$: Subject<ForecastVariableDescriptor[]> = new ReplaySubject<ForecastVariableDescriptor[]>(1);

    graphModelReferenceTracking: TreeNodeReferenceTracking;

    editorVisible$ = new BehaviorSubject<boolean>(false);

    constructor(private store: Store, private actions: Actions, private simulationService: SimulationService) {
        this.sim$$ = new ReplaySubject<TreeNode>(1);
        this.sim$ = this.sim$$.asObservable().pipe(untilDestroyed(this));
    }

    ngOnInit() {

        this.store.select(ApplicationState).pipe(untilDestroyed(this), filter(as => as.ready), take(1)).subscribe(as => {
            this.store.dispatch(new treeActions.LoadSimulationContent({ id: this.nodeId })).subscribe(() => {
                // get the selected simulation
                this.store.select(TreeState.nodeOfId).pipe(
                    map(byId => byId(this.nodeId)),
                    filter(simulationNode => !!simulationNode),
                    filter(simulationNode => !this.simulation || this.simulation.version !== simulationNode.version),
                    untilDestroyed(this)
                    // share()
                ).subscribe(simulation => {
                    if (simulation.content) {
                        if (simulation && this.simulation && simulation.version < this.simulation.version) {
                            // If we get here is because the node is out of sync or because the HTTP request failed for some other reason
                            // FIXME: This should be done correctly but for now, in order to avoid an infinite loop of trials and errors under
                            // some circumstances (when the changes in this graph are triggered by changes in the interface of one of the graphs
                            // it includes), we just disable editing of this graph altogether and the user will have to reload
                            console.log('Out of sync or HTTP error. Disabling editing');
                            this.editingEnabled = false;
                            this.disableUserInput();
                            return;
                        }
                        this.modelRef = simulation.content.ref;
                        if (simulation.content.modelFullName) {
                            this.modelFullName = simulation.content.modelFullName;
                        } else {
                            this.modelFullName = simulation.content.modelName;
                        }
                        this.scenarios = simulation.content.scenarios;
                        this.monteCarloIterations = simulation.content.monteCarloIterations;
                        this.simulation = simulation;
                        this.scenarioIds = Object.keys(this.scenarios);
                        this.sim$$.next(simulation);
                        if (simulation.content.hasOwnProperty('forecasts')) {
                            const simulationConfiguration: SimulationConfiguration = simulation.content;
                            this.forecastSheets = Object.values(simulationConfiguration.forecasts);
                            this.forecastSheets$.next(Object.values(simulationConfiguration.forecasts));
                            this.forecastSheets$.complete();
                        }
                    }
                });

                combineLatest([this.sim$, this.graphModelTracking$]).pipe(untilDestroyed(this))
                    .subscribe(([simulation, graphModelTracking]) => {

                        const simConfig = simulation.content as SimulationConfiguration;
                        const graphModelTrackingInfo = graphModelTracking.find(gmt => gmt.id === simConfig.ref);
                        const curModelId = simConfig.ref;
                        const curModelVersion = simConfig.modelVersion;

                        // populate the input for the tracking editor
                        this.graphModelReferenceTracking = {
                            nodeId: curModelId,
                            tracking: simConfig.tracking,
                            releaseNr: simConfig.releaseNr
                        };

                        const curTracking: TreeNodeReferenceTracking = {
                            nodeId: curModelId,
                            tracking: simConfig.tracking,
                            releaseNr: simConfig.releaseNr
                        };

                        const needUpdate = refNeedsUpdate(graphModelTrackingInfo, curTracking, Utils.getVersionNr(curModelVersion));

                        if (needUpdate) {
                            if (needUpdate.releaseNr) {
                                const action = new ReleaseFetch({ nodeId: curModelId, releaseNr: needUpdate.releaseNr });
                                this.store.dispatch(action).subscribe(() => {
                                    const allReleases: TreeNodeRelease[] = this.store.selectSnapshot(ReleaseState).releases;
                                    const graphModelRelease = allReleases.find(r => r.objectId === curModelId && r.releaseNr === needUpdate.releaseNr);
                                    if (graphModelRelease && graphModelRelease.treeNode && graphModelRelease.treeNode.content) {
                                        setTimeout(() => this.store.dispatch(new GraphModelInterfaceUpdated({ simulationId: simulation.id, pid: pidFromGraphModelNode(graphModelRelease.treeNode), releaseNr: needUpdate.releaseNr })), 0);
                                    }
                                });
                            } else {
                                const action = new LoadGraphModelContent({ id: curModelId });
                                this.store.dispatch(action).subscribe(() => {
                                    const allGraphModels: TreeNode[] = this.store.selectSnapshot(TreeState.nodesOfType('MODEL'));
                                    const graphModel = allGraphModels.find(gm => gm.id === curModelId);
                                    if (graphModel && graphModel.content) {
                                        setTimeout(() => this.store.dispatch(new GraphModelInterfaceUpdated({ simulationId: simulation.id, pid: pidFromGraphModelNode(graphModel) })), 0);
                                    }
                                });
                            }


                        }
                    });

                combineLatest([this.sim$, this.inputSheetTracking$]).pipe(untilDestroyed(this))
                    .subscribe(data => {
                        const inputSheetTracking = data[1];
                        const simTreeNode = data[0];
                        const simConfig = simTreeNode.content as SimulationConfiguration;
                        const alreadySelectedForecastSheets = simConfig.forecasts ? Object.values(simConfig.forecasts) : [];
                        this.alreadySelectedForecastSheetIds = alreadySelectedForecastSheets.map(s => s.ref);

                        // populate the list of available forecast sheets that can still be added using the typeahead box
                        const stillAvailableInputSheets = inputSheetTracking.filter(t => !alreadySelectedForecastSheets.find(fcs => fcs.ref === t.id));
                        this.selectableForecastSheets = stillAvailableInputSheets.map(is => ({ ...is, name: is.pathName + '/' + is.name }));

                        // create the list of variables in the selected forecast sheets
                        const requests = [];
                        for (const fcs of alreadySelectedForecastSheets) {
                            const trackingInfo = inputSheetTracking.find(is => is.id === fcs.ref);
                            if (trackingInfo) {
                                if ((fcs.tracking === 'FIXED' && fcs.releaseNr) || (fcs.tracking === 'LATEST_RELEASE' && trackingInfo.releaseNr)) {
                                    const relNr = fcs.tracking === 'FIXED' ? fcs.releaseNr : trackingInfo.releaseNr;
                                    requests.push(new ReleaseFetch({ nodeId: fcs.ref, releaseNr: relNr }));
                                } else if (fcs.tracking === 'CURRENT_VERSION' || (fcs.tracking === 'LATEST_RELEASE' && !fcs.releaseNr)) {
                                    requests.push(new treeActions.LoadForecastSheetContent({ id: fcs.ref }));
                                }
                            }
                        }
                        if (requests.length) {
                            this.store.dispatch(requests).subscribe(() => {
                                const fetchedSheets: TreeNode[] = [];


                                for (const fcs of alreadySelectedForecastSheets) {
                                    const allReleases: TreeNodeRelease[] = this.store.selectSnapshot(ReleaseState).releases;
                                    const allCurrent: TreeNode[] = this.store.selectSnapshot(TreeState.nodesOfType('FC_SHEET'));
                                    const trackingInfo = inputSheetTracking.find(is => is.id === fcs.ref);
                                    if (trackingInfo) {
                                        if ((fcs.tracking === 'FIXED' && fcs.releaseNr) || (fcs.tracking === 'LATEST_RELEASE' && trackingInfo.releaseNr)) {
                                            const relNr = fcs.tracking === 'FIXED' ? fcs.releaseNr : trackingInfo.releaseNr;
                                            const release = allReleases.find(r => r.objectId === fcs.ref && r.releaseNr === relNr);
                                            if (release && release.treeNode) {
                                                fetchedSheets.push(release.treeNode);
                                            }
                                        } else if (fcs.tracking === 'CURRENT_VERSION' || (fcs.tracking === 'LATEST_RELEASE' && !fcs.releaseNr)) {
                                            const sheet = allCurrent.find(c => c.id === fcs.ref);
                                            if (sheet && sheet.content) {
                                                fetchedSheets.push(sheet);
                                            }
                                        }
                                    }
                                }

                                const variableDescriptors: ForecastVariableDescriptor[] = [];
                                for (const sheet of fetchedSheets) {
                                    const trackingInfo = inputSheetTracking.find(is => is.id === sheet.id);

                                    if (sheet && sheet.content && sheet.content.variables) {
                                        const sheetRef = alreadySelectedForecastSheets.find(sr => sr.ref === sheet.id);
                                        const variableModelList: ForecastVariableModel[] = Object.values(sheet.content.variables);
                                        for (const variable of variableModelList) {
                                            variableDescriptors.push({
                                                folderId: trackingInfo.parentId,
                                                folderName: trackingInfo.pathName,
                                                searchKey: `${trackingInfo.pathName}/${sheet.name}/${variable.title}`,
                                                sheetId: sheet.id,
                                                sheetName: sheet.name,
                                                sheetRefId: sheetRef.objectId,
                                                variableId: variable.objectId,
                                                variableName: variable.title,
                                                variableType: variable.variableType,
                                                variableUnit: variable.unit
                                            });
                                        }
                                    }
                                }
                                this.variableDescriptors$.next(variableDescriptors);
                            });
                        } else {
                            this.variableDescriptors$.next([]);

                        }
                    });



                this.childNodes$ = this.store
                    .select(TreeState.childNodes)
                    .pipe(
                        map(byId => byId(this.nodeId)
                        )
                    );

                this.store.select(TreeState.nodeFullPathById).pipe(map(byId => byId(this.modelRef)), untilDestroyed(this)).forEach(node => { if (node !== undefined) this.modelFullName = node; });

                this.actions.pipe(ofActionSuccessful(treeActions.TrashedTreeNode), untilDestroyed(this)).subscribe((payload) => {
                    if (payload.trashNode) {
                        if (this.simulation.content.ref === payload.trashNode.id) {
                            setTimeout(() => {
                                this.store.dispatch(new simulationActions.GraphModelSelected({
                                    id: this.simulation.id,
                                    graphModelId: null
                                }));
                            }, 0);

                        }
                    }
                });
            });
        });
    }


    ngOnDestroy() { }


    enableUserInput() {
        this.editorVisible$.next(true);
    }

    disableUserInput() {
        this.editorVisible$.next(false);
    }

    updatedTracking(tnt: TreeNodeReferenceTracking) {
        if (tnt.tracking === 'FIXED') {
            this.store.dispatch(new ReleaseFetch({ nodeId: tnt.nodeId, releaseNr: tnt.releaseNr })).subscribe(() => {
                const allReleases: TreeNodeRelease[] = this.store.selectSnapshot(ReleaseState).releases;
                const graphModelRelease = allReleases.find(r => r.objectId === tnt.nodeId && r.releaseNr === tnt.releaseNr);
                const releasePid = pidFromGraphModelNode(graphModelRelease.treeNode);
                this.store.dispatch(new GraphModelTrackingUpdateClicked({ simulationId: this.nodeId, tracking: tnt, pid: releasePid }));

            });
        } else {
            this.store.dispatch(new GraphModelTrackingUpdateClicked({ simulationId: this.nodeId, tracking: tnt }));
        }
    }

    onForecastSheetSelected(newSheet: TreeNodeInfo) {
        this.store.dispatch(new simulationActions.AddedForecastSheetClicked({ simulationId: this.nodeId, forecastSheetId: newSheet.id, releaseNr: newSheet.releaseNr, label: newSheet.name }));
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
        this.reloadScenariosOnChange = !this.reloadScenariosOnChange; // Forces scenario rows to refresh their content
        const allGraphModelNodes = this.store.selectSnapshot(TreeState.nodesOfType('MODEL'));
        const graphModel = allGraphModelNodes.find(n => n.id === this.simulation.content.ref);
        if (graphModel) {
            await synchronizeGraphModel(graphModel, p => GraphModelInterfaceState.findPid(this.store, p), async (gmn) => {
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
            }, error => {
                // FIXME: create a proper place outside of the component to handle this
                this.store.dispatch(new simulationActions.SimulationResultCreationFailed({ simulationId: this.simulation.id, error: error }));
            });
    }

    get isNotClickable() {
        return (this.modelNotFound || !this.monteCarloIterations || !(this.monteCarloIterations > 0));
    }
}
