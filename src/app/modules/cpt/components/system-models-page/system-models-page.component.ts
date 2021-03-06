import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs';
import {
    Select,
    Store,
    Actions,
    ofActionSuccessful,
    ofActionDispatched,
    ofActionCompleted,
    ofActionErrored
} from '@ngxs/store';
import { LayoutState, LayoutStateModel } from '@cpt/state/layout.state';
import * as forecastVariableActions from '@cpt/state/forecast-values.actions';
import * as libraryActions from '@cpt/state/library.actions';
import * as layoutActions from '@cpt/state/layout.actions';
import * as treeActions from '@cpt/state/tree.actions';
import * as fcActions from '@cpt/state/forecast-sheet.action';
import * as simulationResultActions from '@cpt/state/simulation-result-screen.actions';
import * as graphEditorActions from '@cpt/state/graph-editor.actions';
import * as releaseActions from '@cpt/state/release.actions';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { Modal } from 'ngx-modialog-7/plugins/bootstrap';
import { LoaderService } from '@app/modules/login/services/loader.service';
import * as usersActions from '@cpt/state/users.actions';
import * as processingElements from '@cpt/state/processing-element.actions';
import { LoadTrackingInfo } from '@cpt/state/tree-node-tracking.actions';
import { ApplicationReady } from '@cpt/state/application.actions';
import {
    SettingsFetch,
} from '@cpt/state/settings.actions';
import { UnitFetchAll } from '@cpt/state/variable-unit.actions';
import { LoadTree } from '@cpt/state/tree.actions';
import { SimulationResultCreationFailed } from '@cpt/state/simulation.actions';
import { ActivatedRoute } from '@angular/router';
import { OpenTabByNodeId } from '@cpt/state/layout.actions';
import { ReleaseFetch, ReleaseFetchGraphModel, ReleaseSelected } from '@cpt/state/release.actions';


@Component({
    selector: 'app-system-models-page',
    templateUrl: './system-models-page.component.html',
    styleUrls: ['./system-models-page.component.css']
})
export class SystemModelsPageComponent implements OnInit, OnDestroy {
    @Select(LayoutState) layout$: Observable<LayoutStateModel>;

    constructor(private store: Store, private actions$: Actions, private modal: Modal, private loader: LoaderService, private route: ActivatedRoute) {

        this.actions$.pipe(ofActionSuccessful(
            libraryActions.RenameGraphModelCommitted,
            libraryActions.RenameSimulationCommitted,
            libraryActions.RenameSimulationResultCommitted),
            untilDestroyed(this)).subscribe((node) => {
                this.store.dispatch(new layoutActions.EditorTabTitleChanged({ nodeId: node.payload.nodeId, newName: node.payload.newName }));
            }
            );

        this.actions$.pipe(ofActionSuccessful(treeActions.SendSimulationResultToTrash), untilDestroyed(this)).subscribe((payload) => {
            this.store.dispatch(new simulationResultActions.SimulationResultDeleted(payload.trashNode.id));
        });

        const deleteActions = [treeActions.SendFolderToTrash,
        treeActions.SendGraphModelToTrash,
        treeActions.SendGraphModelTemplateToTrash,
        treeActions.SendSimulationToTrash,
        treeActions.SendSimulationToTrash,
        treeActions.SendForecastSheetToTrash,
        graphEditorActions.DeleteKeyPressed];

        this.actions$.pipe(ofActionDispatched(...deleteActions),
            untilDestroyed(this)).subscribe((payload) => {
                this.loader.show();
            });

        this.actions$.pipe(ofActionCompleted(...deleteActions),
            untilDestroyed(this)).subscribe((payload) => {
                this.loader.hide();
            });

        this.actions$.pipe(ofActionErrored(usersActions.UserDelete), untilDestroyed(this)).subscribe(action => {
            this.modal
                .alert()
                .title('Error')
                .body('Failed to Delete the User.')
                .okBtn('OK').okBtnClass('btn btn-primary')
                .open();
        });

        this.actions$.pipe(ofActionDispatched(treeActions.TreeNodeConflicted),
            untilDestroyed(this)).subscribe(({ payload: { conflictedNode, orgNode } }: treeActions.TreeNodeConflicted) => {
                const dialog =
                    this.modal
                        .confirm()
                        .title('Error')
                        .body('Version conflict. The node has been modified on the server since you retrieved it. Do you want to overwrite the remote changes? Press Cancel to reload the page and discard your local changes.')
                        .okBtn('Overwrite remote changes').okBtnClass('btn btn-danger')
                        .cancelBtn('Cancel')
                        .open();
                dialog.result.then(result => {
                    this.store.dispatch(new treeActions.ForceUpdateTreeNode(conflictedNode));
                    console.log('overwrite!');
                }).catch(() => {
                    this.store.dispatch(new treeActions.ReloadSingleTreeNode(orgNode.id));
                    console.log('reload!');
                });
            });

        this.actions$.pipe(ofActionDispatched(treeActions.TreeNodeNameConflicted),
            untilDestroyed(this)).subscribe(({ payload: { conflictedNode, orgNode } }: treeActions.TreeNodeNameConflicted) => {
                const dialog =
                    this.modal
                        .alert()
                        .title('Error')
                        .body('Name conflict. The name you specified is already used in the given scope. Please choose another one.')
                        .okBtn('OK').okBtnClass('btn btn-primary')
                        .open();

                dialog.result.then(result => {
                    if (orgNode) {
                        this.store.dispatch(new libraryActions.RenameFolderClicked(orgNode));
                    }
                });
            });

        this.actions$.pipe(ofActionDispatched(SimulationResultCreationFailed),
            untilDestroyed(this)).subscribe(({ payload: { simulationId, error } }: SimulationResultCreationFailed) => {
                const message = error.status === 429 ? 'Simulation Service is busy. Retry later.' : 'Please make sure the Simulation Service is available.'
                this.modal.alert()
                    .title('Failed to create simulation.')
                    .body(message)
                    .okBtn('OK').okBtnClass('btn btn-primary')
                    .open();
            });

        this.actions$.pipe(ofActionDispatched(treeActions.TreeNodeTrashed),
            untilDestroyed(this)).subscribe(({ payload: { id } }: treeActions.TreeNodeTrashed) => {
                const dialog =
                    this.modal.alert()
                        .title('Node has been trashed.')
                        .body(`The item you tried to edit has been trashed and cannot be edited`)
                        .okBtn('OK').okBtnClass('btn btn-primary')
                        .open();
                // FIXME: handle this
            });

        this.actions$.pipe(ofActionErrored(treeActions.ReloadSingleTreeNode),
            untilDestroyed(this)).subscribe(({ payload }: treeActions.ReloadSingleTreeNode) => {
                const dialog =
                    this.modal.alert()
                        .title('Node could not be loaded.')
                        .body(`The item you tried to load has been trashed or is not available.`)
                        .okBtn('OK').okBtnClass('btn btn-primary')
                        .open();
                // FIXME: handle this
            });

        this.actions$.pipe(ofActionErrored(releaseActions.ReleaseFetchGraphModel),
            untilDestroyed(this)).subscribe(({ payload }: releaseActions.ReleaseFetchGraphModel) => {
                const dialog =
                    this.modal.alert()
                        .title('Release of Node could not be loaded.')
                        .body(`The release you tried to load is not available.`)
                        .okBtn('OK').okBtnClass('btn btn-primary')
                        .open();
                dialog.result.then(() => {
                    this.store.dispatch(new releaseActions.ReleaseSelected({ nodeId: payload.nodeId, releaseNr: undefined }));
                });
                // FIXME: handle this
            });



        this.actions$.pipe(ofActionDispatched(treeActions.TreeNodeFailedDependency),
            untilDestroyed(this)).subscribe(() => {
                this.modal.alert()
                    .title('Item cannot be deleted')
                    .body(`The item you tried to delete is used by another Graph Model
                                or Simulation Configuration, it cannot be deleted.`)
                    .okBtn('OK').okBtnClass('btn btn-primary')
                    .open();
            });

        this.actions$.pipe(ofActionDispatched(treeActions.TreeNodeDeleteConflict),
            untilDestroyed(this)).subscribe(({ payload: { trashedNode } }: treeActions.TreeNodeDeleteConflict) => {
                this.modal.alert()
                    .title('Node cannot be deleted')
                    .body(`The item you tried to delete has been edited since you retrieved it.`)
                    .okBtn('OK').okBtnClass('btn btn-primary')
                    .open();
            });

        this.actions$.pipe(ofActionDispatched(treeActions.TreeNodePermissionException),
            untilDestroyed(this)).subscribe(() => {
                this.modal.alert()
                    .title('Node couldn\'t be updated')
                    .body('You don\'t have sufficient permissions to edit this item.')
                    .okBtn('OK').okBtnClass('btn btn-primary')
                    .open();
            });

        this.actions$.pipe(ofActionDispatched(fcActions.VariableTitleError),
            untilDestroyed(this)).subscribe(({ payload: { message } }: fcActions.VariableTitleError) => {
                this.modal.alert()
                    .title('Variable title couldn\'t be updated.')
                    .body(message)
                    .okBtn('OK').okBtnClass('btn btn-primary')
                    .open();
            });

        this.actions$.pipe(ofActionDispatched(fcActions.FailedToDeleteVariable),
            untilDestroyed(this)).subscribe(({ payload: { sheetId, variableId, reason } }: fcActions.FailedToDeleteVariable) => {
                const dialog =
                    this.modal
                        .confirm()
                        .title('Variable couldn\'t be deleted.')
                        .body(reason)
                        .okBtn('Delete anyway').okBtnClass('btn btn-danger')
                        .cancelBtn('Cancel')
                        .open();
                dialog.result.then(result => {
                    this.store.dispatch(new fcActions.DeleteVariable({ sheetId: sheetId, variableId: variableId, force: true }));
                }).catch(() => { console.log('cancel deletion'); });

            });

        this.actions$.pipe(ofActionDispatched(releaseActions.ReleaseFailedToPrepare),
            untilDestroyed(this)).subscribe(({ payload: { nodeId, version, failedProcesses } }: releaseActions.ReleaseFailedToPrepare) => {
                const procList = failedProcesses.map(p => p.label ? p.label : p.name).join(', ');

                this.modal.alert()
                    .title('Failed to Prepare Release.')
                    .body('The following processes had no releases available or are locked to the current version: ' + procList)
                    .okBtn('OK').okBtnClass('btn btn-primary')
                    .open();
            });

        this.actions$.pipe(ofActionDispatched(releaseActions.ReleaseNeedsPinning),
            untilDestroyed(this)).subscribe(({ payload: { nodeId, version, pinningSuggestions, toBePinnedProcesses } }: releaseActions.ReleaseNeedsPinning) => {
                const getSugestedRelease = (processId: string) => { const suggestion = pinningSuggestions.find(ps => ps.processId); return suggestion ? '(R' + suggestion.releaseNr.toString() + ')' : ''; };
                const procList = toBePinnedProcesses.map(p => (p.label ? p.label : p.name) + getSugestedRelease(p.objectId)).join(', ');
                const dialog =
                    this.modal
                        .confirm()
                        .title('Processes Need Pinning')
                        .body('To release this graph model the following processes need to be pinned to their latest release: ' + procList)
                        .okBtn('Pin All to Latest Releases').okBtnClass('btn btn-primary')
                        .cancelBtn('Cancel')
                        .open();
                dialog.result.then(result => {
                    this.store.dispatch(new releaseActions.ReleaseAddedPinning({ nodeId: nodeId, version: version, pinningDecisions: pinningSuggestions }));
                }).catch(() => { console.log('cancel pinning'); });
            });
    }

    async syncRouteWithLayout() {
        const u = this.route.snapshot.url;
        if (u.length) {
            const nodeId = u[0].path;
            const releaseNr = this.route.snapshot.queryParams['releaseNr'];
            if (nodeId && nodeId.trim().length > 0) {
                await this.store.dispatch(new OpenTabByNodeId({ nodeId: nodeId, releaseNr: releaseNr }));
            }
        }
    }

    async initApplication() {
        await this.store.dispatch(new SettingsFetch()).toPromise();
        await this.store.dispatch(new processingElements.LoadProcessingElements()).toPromise();
        await this.store.dispatch(new usersActions.GetCurrentUser()).toPromise();
        await this.syncRouteWithLayout();
        await this.store.dispatch(new processingElements.LoadGraphModels()).toPromise();
        await this.store.dispatch(new LoadTree()).toPromise();
        await this.store.dispatch(new forecastVariableActions.LoadForecastUnits()).toPromise();
        await this.store.dispatch(new usersActions.GetUsers()).toPromise();
        await this.store.dispatch(new usersActions.GetUsergroups()).toPromise();
        await this.store.dispatch(new UnitFetchAll()).toPromise();
        await this.store.dispatch(new LoadTrackingInfo()).toPromise();
    }

    ngOnInit() {


        this.initApplication().then(() => {
            this.store.dispatch(new ApplicationReady);
        });

    }

    ngOnDestroy() { }
}
