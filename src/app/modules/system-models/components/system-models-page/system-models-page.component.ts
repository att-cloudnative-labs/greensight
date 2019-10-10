import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs';
import { Select, Store, Actions, ofActionSuccessful, ofActionErrored, ofActionDispatched, ofActionCompleted } from '@ngxs/store';
import { LayoutState, LayoutStateModel } from '@system-models/state/layout.state';
import * as forecastVariableActions from '@system-models/state/forecast-values.actions';
import * as libraryActions from '@system-models/state/library.actions';
import * as layoutActions from '@system-models/state/layout.actions';
import * as treeActions from '@system-models/state/tree.actions';
import * as simulationResultActions from '@system-models/state/simulation-result-screen.actions';
import * as graphEditorActions from '@system-models/state/graph-editor.actions';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { Modal } from 'ngx-modialog/plugins/bootstrap';
import { LoaderService } from '@app/core_module/service/loader.service';


@Component({
    selector: 'app-system-models-page',
    templateUrl: './system-models-page.component.html',
    styleUrls: ['./system-models-page.component.css']
})
export class SystemModelsPageComponent implements OnInit, OnDestroy {
    @Select(LayoutState) layout$: Observable<LayoutStateModel>;

    constructor(private store: Store, private actions$: Actions, private modal: Modal, private loader: LoaderService) {
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
        graphEditorActions.DeleteKeyPressed];

        this.actions$.pipe(ofActionDispatched(...deleteActions),
            untilDestroyed(this)).subscribe((payload) => {
                this.loader.show();
            });

        this.actions$.pipe(ofActionCompleted(...deleteActions),
            untilDestroyed(this)).subscribe((payload) => {
                this.loader.hide();
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
                    console.log("overwrite!")
                }).catch(() => {
                    this.store.dispatch(new treeActions.ReloadSingleTreeNode(orgNode.id));
                    console.log("reload!");
                });
            });

        this.actions$.pipe(ofActionDispatched(treeActions.TreeNodeTrashed),
            untilDestroyed(this)).subscribe(({ payload: { trashedNode } }: treeActions.TreeNodeTrashed) => {
                const dialog =
                    this.modal.alert()
                        .title('Node has been trashed.')
                        .body(`The item you tried to edit has been trashed and cannot be edited`)
                        .okBtn('OK').okBtnClass('btn btn-primary')
                        .open();
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
                    .open()
            });

        this.actions$.pipe(ofActionDispatched(treeActions.TreeNodePermissionException),
            untilDestroyed(this)).subscribe(() => {
                this.modal.alert()
                    .title('Node couldn\'t be updated')
                    .body('You don\'t have sufficient permissions to edit this item.')
                    .okBtn('OK').okBtnClass('btn btn-primary')
                    .open()
            });
    }

    ngOnInit() {
        this.store.dispatch(new forecastVariableActions.LoadForecastVariables());
        this.store.dispatch(new forecastVariableActions.LoadForecastUnits());
    }

    ngOnDestroy() { }
}
