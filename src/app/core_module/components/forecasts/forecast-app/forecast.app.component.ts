import { Component, OnInit, OnDestroy, ViewChild, HostListener, AfterViewInit } from '@angular/core';
import { Branch } from '../../../interfaces/branch';
import { ChangeDetectionService } from '../../../service/change.detection.service';
import { BranchService } from '../../../service/branch.service';
import { ForecastVariableService } from '@app/core_module/service/variable.service';
import { Utils } from '../../../../utils_module/utils';
import * as moment from 'moment';
import {
    renderProjections,
    VariableProjections,
    Variable as ProjectionVariable,
    VariableType,
    TimeSegment,
    Frame as ProjectionFrame,
    Actual,
    Expression
} from '@cpt/capacity-planning-projection/lib';
import { ForecastFrame } from '../../../interfaces/forecast-frame';
import { ForecastVariableProjection } from '../../../interfaces/forecastVariableProjections';
import { ForecastVariable } from '@app/core_module/interfaces/forecast-variable';
import { UserService } from '../../../service/user.service';
import { Modal } from 'ngx-modialog/plugins/bootstrap';
import { ForecastGraphComponent } from './forecast-graph/forecast.graph.component';
import { ForecastSidebarComponent } from './sidebar/forecast.sidebar.component';
import { ForecastVariableModel } from '../../../interfaces/forecast-variable';
import { ModalDialogService } from '../../../service/modal-dialog.service';
import { Unit } from '../../../interfaces/unit';
import { VariableUnitService } from '../../../service/variable-unit.service';
import { SpreadsheetEntryComponent } from './spreadsheet-entry/spreadsheet.entry.component';
import { Moment, unix } from 'moment';
import { TimeSegmentMethod } from '@cpt/capacity-planning-projection/lib/timesegment';
import { SettingsService } from '../../../service/settings.service';
import { UndoRedoObject } from '../../../../utils_module/interfaces/undo-redo-object';
import { UndoRedoManager } from '../../../../utils_module/classes/undo-redo-manager';
import { isEmpty } from 'rxjs/operators';
import { getMonths } from '@cpt/capacity-planning-projection/lib/date';
import { ProjectService } from '../../../service/project.service';
import { Project } from '../../../interfaces/project';
import { SplitComponent } from 'angular-split';

/**
* Composes the top level components: spreadsheet, graph, sidebar
* Manages remote data access and persistence
* Runs projection calculations:
*   -after fetching data on initial load or when switching branches
*   -after handling events that update variable data
*   -after handling events that change start and end date of projection
*/
@Component({
    selector: 'forecast-app',
    templateUrl: './forecast.app.component.html',
    styleUrls: ['./forecast.app.component.css']
})
export class ForecastAppComponent implements OnInit, OnDestroy, AfterViewInit {
    @ViewChild(SpreadsheetEntryComponent) spreadsheetComponent: SpreadsheetEntryComponent;
    @ViewChild(ForecastGraphComponent) graphComponent: ForecastGraphComponent;
    @ViewChild(ForecastSidebarComponent) sidebarComponent: ForecastSidebarComponent;
    @ViewChild('split') splitEl: SplitComponent;
    selectedProjectId: string;
    selectedProjectName: string;
    selectedBranchId: string;
    branchList: Branch[] = Array<Branch>();
    currentBranch: Branch = null;
    variableList: ForecastVariableModel[] = new Array<ForecastVariableModel>();
    forecastVariableList: ForecastVariable[] = new Array<ForecastVariable>();
    modifiedVariableList: ForecastVariableModel[] = new Array<ForecastVariableModel>();
    forecastUndoManager: UndoRedoManager;

    variableContent: ProjectionVariable[] = new Array<ProjectionVariable>();
    newContent = [];
    units: Unit[] = new Array<Unit>();
    uiProjections: ForecastVariableProjection[] = [];
    isExpanded: Boolean = false;
    startDate = '';
    endDate = '';
    tempExpression: any = {};
    parsedExpression = [];
    isSaving = false;
    hiddenVariables = [];
    spreadsheetSize = Utils.getSpreadsheetSize();
    graphSize = Utils.getGraphSize();

    // Used for keeping track of variables before changes are made
    oldVariableList = [];

    constructor(
        private modalDialog: Modal,
        private modal: ModalDialogService,
        private userService: UserService,
        private changeDetectionService: ChangeDetectionService,
        private projectService: ProjectService,
        private branchService: BranchService,
        private variableService: ForecastVariableService,
        private settingsService: SettingsService,
        private variableUnitService: VariableUnitService
    ) { }

    /**
     * Sets up a listener for new project selections
     */
    ngOnInit() {
        this._getHiddenVariables();
        this.isExpanded = JSON.parse(Utils.getIsForecastSidebarExpanded());

        this.forecastUndoManager = new UndoRedoManager();
        this.getUnits();
        this.getProjectName(Utils.getActiveProject());
        this.getBranches(Utils.getActiveProject());
        this.getSetSelectedBranch();

        this.changeDetectionService
            .addProjectBranchListener((projectId, branchId) => {
                this.selectedProjectId = projectId;
                this.selectedBranchId = branchId;
                this.getProjectName(projectId);
                this.getBranches(projectId);
                this.uiProjections.splice(0, this.uiProjections.length);
                this.getSetSelectedBranch();
            });
    }

    ngAfterViewInit() {
        this.splitEl.dragProgress$.subscribe(() => {
            this.graphComponent.updateChart();
            Utils.setSplitSize(this.splitEl.displayedAreas);
        });
    }

    /**
     * Remove the change detection listener when we navigate away from forecast page
     */
    ngOnDestroy() {
        this.changeDetectionService.removeAllProjectBranchListeners();
    }

    toggleSave() {
        this.isSaving = !this.isSaving;
    }

    @HostListener('window:keydown', ['$event'])
    onButtonPress($event: KeyboardEvent) {
        // 'Z' key event is capital Z not lowercase z, don't change below $event.key to z.
        if (($event.ctrlKey || $event.metaKey) && $event.shiftKey && $event.key === 'Z') {
            this._redoForecastChange();
        } else if (($event.ctrlKey || $event.metaKey) && $event.key === 'z') {
            this._undoForecastChange();
        }
    }

    /**
     * Gets the list of available units
     */
    getUnits() {
        this.variableUnitService.getVariableUnits()
            .subscribe(result => {
                this.units = result.data as Unit[];
            });
    }

    /**
     * Gets the name of the project which has been selected from the dropdown
     * on the nav bar
     * @param projectId the id of the currently selected project
     */
    getProjectName(projectId: string) {
        if (projectId != null) {
            this.projectService.getProject(projectId).subscribe(project => {
                this.selectedProjectName = project.title;
            });
        }
    }

    /**
     * Gets the branches of a project
     * @param projectId the id of the selected project
     */
    getBranches(projectId: string) {
        if (projectId != null) {
            this.branchService
                .getBranches(projectId)
                .subscribe(branches => {
                    this.branchList = branches;
                });
        }
    }

    /**
     * Get and Set selected branch
     */
    getSetSelectedBranch() {
        this.branchService
            .getMasterOfAProject(Utils.getActiveProject())
            .subscribe(masterBranch => {
                /*get the currently selected forecast version. If no forecast version is selected, then default to the master version */
                const branchID = Utils.getActiveBranch();
                if (branchID !== undefined && branchID !== 'null' && branchID !== 'undefined') {
                    this.selectedBranchId = branchID;
                } else {
                    this.selectedBranchId = masterBranch.id;
                }

                this.branchService.getBranch(this.selectedBranchId).subscribe(branch => {
                    this.currentBranch = branch;
                    this.getVariables(this.selectedBranchId);
                });
            });
    }

    /**
     * Updates the selected forecast version lets other functions know of this change
     * @param branch the newly selected forecast branch
     */
    onBranchChanged(branch: Branch) {
        this.currentBranch = branch;
        Utils.selectBranch(this.currentBranch.projectId, this.currentBranch.id);
        this.userService.updateUser(Utils.getUserId(), Utils.getUserName(),
            Utils.getUserRoleId(), this.currentBranch.projectId, this.currentBranch.id, Utils.getCurrentUserSettings())
            .subscribe(user => {
                if (user.status === 'UNPROCESSABLE_ENTITY') {
                    this.modalDialog.alert()
                        .title('Warning')
                        .body('Failed to set project for user called \'' + Utils.getUserName() +
                            '\'')
                        .open();
                }
            });
        this.changeDetectionService.selectProject(this.currentBranch.projectId, this.currentBranch.id, null);
    }

    /**
     * Fixme: Need the backend variable structure to be updated in order to properly render projections
     * @param branchId the id of the branch that has been selected to be viewed
     */
    getVariables(branchId: string) {
        this.variableContent = [];
        if (branchId != null) {
            this.variableService
                .getVariables(branchId)
                .subscribe(variables => {
                    console.log('Retrieved variables');
                    // FIXME: uncomment this when backend variable structure is updated
                    this.variableList = variables;
                    if (this.variableList.length > 0) {
                        this.getVariableContent();
                        this.updateProjections();
                    }
                });
        }
    }

    getVariableContent() {
        this.variableContent = [];

        this.newContent = this.variableList.map((variable: ForecastVariableModel) => {
            return {
                'id': variable.id,
                'name': variable.content.title,
                'variableType': variable.content.variableType,
                'unit': variable.content.unit,
                'color': variable.content.color,
                'description': variable.content.description,
                'timeSegments': variable.content.timeSegments,
                'actuals': variable.content.actuals,
                'breakdownIds': variable.content.breakdownIds,
                'defaultBreakdown': variable.content.defaultBreakdown
            };
        });

        for (const variable of this.newContent) {
            const deserializedVariable = ProjectionVariable.deserialize(variable);
            if (deserializedVariable instanceof ProjectionVariable) { this.variableContent.push(deserializedVariable); }
        }
    }

    setupDates(datesObject) {
        this.startDate = datesObject.startDate;
        this.endDate = datesObject.endDate;
    }

    getProjections(updatedVariable?: ForecastVariable, updatedTimeSegment?: TimeSegment) {
        Utils.resetColorIndex();
        this._getHiddenVariables();

        this.modifiedVariableList = JSON.parse(JSON.stringify(this.variableList)); // TODO: Investigate why this
        this.oldVariableList = JSON.parse(JSON.stringify(this.variableList));

        // Remove uiProjections for variables that are no longer present
        const variableIdsToRemove: string[] = this.uiProjections
            .filter(uip => {
                return !this.variableContent.find(v => v.id === uip.variable.id);
            })
            .map(uip => {
                return uip.variable.id;
            });
        variableIdsToRemove.forEach(variableId => {
            this.uiProjections.splice(this.uiProjections.findIndex(uip => uip.variable.id === variableId), 1);
        });

        // Determine rendering date range
        let renderStartDate = this.startDate;
        let renderEndDate = this.endDate;
        if (updatedTimeSegment) {
            renderStartDate = updatedTimeSegment.date;
            // TODO: Cleaner if timeSegment had a reference to its variable.
            const nextTimeSegment = updatedVariable.getNextTimeSegment(updatedTimeSegment);
            if (nextTimeSegment) {
                renderEndDate = moment(nextTimeSegment.date, 'YYYY-MM').subtract(1, 'month').format('YYYY-MM');
            }
        }

        // FIXME: We really don't need yet another array of variables...need to unravel the relationship between all the types
        this.forecastVariableList = this.variableList.map(variableModel => new ForecastVariable(variableModel));

        // FUTURE: Given updatedVariable, we can cull the renderVariable list to only include
        //       variables who depend on or are a dependent of updatedVariable within renderStartDate..renderEndDate
        // TODO: Serialize once for renderProjections here, not everywhere else using getVariableContent
        const renderVariables = this.variableContent;

        // Discard all frames that are out of range
        if (this.uiProjections.length) {
            const frames = this.uiProjections[0].frames;
            const reportStart = moment(this.startDate, 'YYYY-MM');
            const framesStart = moment(frames[0].date, 'YYYY-MM');
            const reportEnd = moment(this.endDate, 'YYYY-MM');
            const framesEnd = moment(frames[frames.length - 1].date, 'YYYY-MM');
            const headSize = reportStart.diff(framesStart, 'months');
            const tailSize = framesEnd.diff(reportEnd, 'months');

            if (headSize > 0) {
                this.uiProjections.forEach(uip => {
                    uip.frames.splice(0, headSize);
                });
            }

            if (tailSize > 0) {
                this.uiProjections.forEach(uip => {
                    uip.frames.splice(-tailSize, tailSize);
                });
            }
        }

        // Render and update projections
        renderProjections(renderVariables, renderStartDate, renderEndDate, {
            onRenderFrame: (
                projectionFrame: ProjectionFrame,
                projectionVariable: ProjectionVariable,
                date: string,
                timeSegment?: TimeSegment
            ) => {
                // TODO: I think the capacity-planning-projection library should have this behavior
                if (projectionVariable.defaultBreakdown && !timeSegment) {
                    Object.keys(projectionVariable.defaultBreakdown).forEach(name => {
                        projectionFrame.addSubframe(name, projectionVariable.defaultBreakdown[name]);
                    });
                }

                const variableModel = this.modifiedVariableList.find(x => x.id === projectionVariable.id);

                return new ForecastFrame(
                    projectionFrame,
                    new ForecastVariable(variableModel),
                    this.forecastVariableList,
                    timeSegment
                );
            },
            onResult: (e?: Error, vp?: VariableProjections) => {
                Object.keys(vp).forEach(variableId => {
                    const existing = this.uiProjections.find(uip => uip.variable.id === variableId);
                    const variableModel = this.modifiedVariableList.find(x => x.id === variableId);
                    if (existing) {
                        existing.update(
                            new ForecastVariable(variableModel),
                            vp[variableId] as ForecastFrame[],
                            this.variableList.map(variableModel => new ForecastVariable(variableModel))
                        );
                    } else {
                        const forecastVariableProjection = new ForecastVariableProjection(
                            new ForecastVariable(variableModel),
                            vp[variableId] as ForecastFrame[],
                            this.variableList.map(variableModel => new ForecastVariable(variableModel))
                        );
                        forecastVariableProjection.display = !this.isVariableHidden(forecastVariableProjection.variable.id);
                        this.uiProjections.push(forecastVariableProjection);
                    }
                });
            }
        });

        this.sortVariables();
        console.log('Retrieved projections');
    }

    /**
     * Get the list of hidden variable from session storage
     * @private
     */
    _getHiddenVariables() {
        const result = Utils.getHiddenForecastVariables();
        if (result !== undefined) {
            this.hiddenVariables = JSON.parse(result);
        } else { this.hiddenVariables = []; }
    }

    /**
     * Check if variable is hidden, if so, set variable to unchecked in list
     * @param varId
     * @returns {boolean}
     */
    isVariableHidden(varId) {
        return this.hiddenVariables.includes(varId);
    }

    // Sorts uiProjections by variable creation date
    sortVariables() {
        // let originalList = Object.assign([], this.uiProjections);
        // this.uiProjections = originalList.sort((a, b) => (a.variable.metadata.createdAt > b.variable.metadata.createdAt) ? 1 : -1);
        //this.uiProjections = originalList.sort((a, b) => (a.variable.content.title > b.variable.content.title) ? 1 : -1);
        for (const uiProj of this.uiProjections) {
            uiProj.subframeNames.sort();
            //console.log(uiProj);
            for (const f of uiProj.frames) {
                f.subFrames.sort((a, b) => (a.name > b.name) ? 1 : -1);
            }

        }
    }

    createVariable(variable) {
        this.toggleSave();

        this.variableService.createVariable(variable).subscribe(newVariable => {
            this.toggleSave();

            console.log('Created variable');

            this.variableList.push(newVariable);
            this.getVariableContent();
            this.updateProjections();
        }, (error) => {
            this.toggleSave();

            if (error.status === 422) {
                console.log('Another variable existing with the same name, adding increment to variable name');
                variable.content.title = variable.content.title + '_' + 1;
                console.log('Retrying variable creation');
                this.createVariable(variable);
            } else {
                console.log('Error creating variable');

                const response = JSON.parse(error._body);
                this.modal.showError(response.message);
            }
        });

    }

    updateVariable(forecastVariable: ForecastVariable, isUndoCommand?: boolean, timeSegment?: TimeSegment) {
        const variable = forecastVariable.variableModel;

        if (!isUndoCommand) {
            this._updateForecastChangeHistory(variable, 'edit');
        }
        this.toggleSave();

        this.variableList = JSON.parse(JSON.stringify(this.modifiedVariableList));
        this.oldVariableList = JSON.parse(JSON.stringify(this.modifiedVariableList));
        this.variableList = this.variableList.map((variableModel: ForecastVariableModel) => {
            if (variableModel.id === variable.id) {
                return variable;
            } else {
                return variableModel;
            }
        });
        this.getVariableContent();
        this.updateProjections(forecastVariable, timeSegment);
        this.variableService.updateVariable(variable, variable.version).subscribe(updatedVariable => {
            this.toggleSave();
            forecastVariable.variableModel.version = updatedVariable.version;
            console.log('Updated variable ' + forecastVariable.title);
            this.updateProjections();
            this._findInconsistentExpressionReference(variable);

        }, (error) => {
            if (error.status === 409) {
                const dialog = this.modalDialog
                    .confirm()
                    .title('Error')
                    .body('Version conflict. The variable has been modified on the server since you retrieved it. Do you want to overwrite the remote changes? Press Cancel to reload the page and discard your local changes.')
                    .okBtn('Overwrite remote changes').okBtnClass('btn btn-danger')
                    .cancelBtn('Cancel')
                    .open();
                dialog.result.then(result => {
                    this.variableService.updateVariable(variable).subscribe(updatedVariable => {
                        this.toggleSave();
                        console.log('Updated variable ' + forecastVariable.title);
                        variable.version = updatedVariable.version;
                        this.updateProjections(forecastVariable, timeSegment);
                        this._findInconsistentExpressionReference(variable);
                    });
                }).catch(() => {
                    this.toggleSave();
                    this.getVariables(this.selectedBranchId);
                });
            } else if (error.status === 404) {
                const dialog = this.modalDialog.alert()
                    .title('Error')
                    .body('Failed to update variable. The variable has been deleted on the server since you retrieved it.')
                    .open();
                dialog.result.then(promise => {
                    this.toggleSave();
                    Utils.removeHiddenForecastVariable(variable.id);

                    const index = this.variableList.findIndex(x => x.id === variable.id);
                    this.variableList.splice(index, 1);
                    this.getVariableContent();
                    this.updateProjections();
                });
            } else if (error.status === 403) {
                // if user doesn't have enough permission to edit
                const dialog = this.modalDialog.alert()
                    .title('Error')
                    .body(`You don't have sufficient permissions to edit the project. Your changes won't be saved!`)
                    .open();
            } else {
                this.toggleSave();
                console.log('Error updating variable');
                const response = JSON.parse(error._body);
                this.modal.showError(response.message);
            }
        });
    }

    updateExpressionVariableReference(forecastVariable: ForecastVariable, isUndoCommand?: boolean, timeSegment?: TimeSegment) {
        const variable = forecastVariable.variableModel;
        if (!isUndoCommand) {
            this._updateForecastChangeHistory(variable, 'edit');
        }
        this.toggleSave();

        this.variableList = JSON.parse(JSON.stringify(this.modifiedVariableList));
        this.oldVariableList = JSON.parse(JSON.stringify(this.modifiedVariableList));

        this.variableList = this.variableList.map((variableModel: ForecastVariableModel) => {
            if (variableModel.id === variable.id) {
                return variable;
            } else {
                return variableModel;
            }
        });

        this.getVariableContent();
        this.updateProjections(forecastVariable, timeSegment);
        this.variableService.updateVariable(variable, variable.id).subscribe(updatedVariable => {
            this.toggleSave();
            variable.version = updatedVariable.version;
            this.updateProjections(forecastVariable, timeSegment);
            this._findInconsistentExpressionReference(variable);
        });
    }

    deleteVariable(variable: ForecastVariableModel) {
        const associatedVariables = this._getAssociatedVariables(variable.id);
        if (associatedVariables.length > 0) {
            const dialog = this.modalDialog
                .confirm()
                .title('Confirmation')
                .body('There are existing associations with this variable. Are you sure you want to delete this variable? This change cannot be undone')
                .okBtn('Yes').okBtnClass('btn btn-danger')
                .cancelBtn('No')
                .open();
            dialog.result.then(result => {
                for (const associatedVariable of associatedVariables) {
                    associatedVariable.content.breakdownIds = associatedVariable.content.breakdownIds.filter(bdId => bdId !== variable.id);
                    this.toggleSave();
                    console.log('Deleted variable');
                    this.variableService.updateVariable(associatedVariable, associatedVariable.id).subscribe(updatedVariable => {
                        this.toggleSave();
                        console.log('Updated variable ' + associatedVariable.content.title);
                    }, (error) => {
                        this.toggleSave();
                        console.log('Error deleting variable');
                        const response = JSON.parse(error._body);
                        this.modal.showError(response.message);
                    });
                }
                this.toggleSave();

                this.variableService.deleteVariable(variable.id, variable.version).subscribe(response => {
                    this.toggleSave();
                    Utils.removeHiddenForecastVariable(variable.id);

                    const index = this.variableList.findIndex(x => x.id === variable.id);
                    this.variableList.splice(index, 1);
                    this.getVariableContent();
                    this.updateProjections();
                }, (error) => {
                    if (error.status === 409) {
                        const dialog = this.modalDialog
                            .confirm()
                            .title('Error')
                            .body('Version conflict. The variable has been modified on the server since you retrieved it.  Do you want to overwrite the remote changes? Press Cancel to reload the page and discard your local changes.')
                            .okBtn('Overwrite remote changes').okBtnClass('btn btn-danger')
                            .cancelBtn('Cancel')
                            .open();
                        dialog.result.then(promise => {
                            promise.result.then(result => {
                                this.variableService.deleteVariable(variable.id).subscribe(response => {
                                    this.toggleSave();
                                    console.log('Deleted variable');
                                    Utils.removeHiddenForecastVariable(variable.id);
                                    const index = this.variableList.findIndex(x => x.id === variable.id);
                                    this.variableList.splice(index, 1);
                                    this.getVariableContent();
                                    this.updateProjections();
                                }, (error) => {
                                    this.toggleSave();
                                    const response = JSON.parse(error._body);
                                    this.modal.showError(response.message);
                                });
                            }).catch(() => {
                                this.toggleSave();
                                this.getVariables(this.selectedBranchId);
                            });
                        });
                    } else {
                        this.toggleSave();
                        const response = JSON.parse(error._body);
                        this.modal.showError(response.message);
                    }
                });
            }).catch(() => { });
        } else {
            const dialog = this.modalDialog
                .confirm()
                .title('Confirmation')
                .body('Variable "' + variable.content.title + '" will be permanently deleted. Are you sure you want to delete this variable? This change cannot be undone')
                .okBtn('Yes').okBtnClass('btn btn-danger')
                .cancelBtn('No')
                .open();
            dialog.result.then(result => {
                this.toggleSave();
                this.variableService.deleteVariable(variable.id, variable.version).subscribe(response => {
                    this.toggleSave();
                    console.log('Deleted variable');
                    Utils.removeHiddenForecastVariable(variable.id);

                    const index = this.variableList.findIndex(x => x.id === variable.id);
                    this.variableList.splice(index, 1);
                    this.getVariableContent();
                    this.updateProjections();
                }, (error) => {
                    if (error.status === 409) {
                        const dialog = this.modalDialog
                            .confirm()
                            .title('Error')
                            .body('Version conflict. The variable has been modified on the server since you retrieved it.  Do you want to overwrite the remote changes? Press Cancel to reload the page and discard your local changes.')
                            .okBtn('Force Delete').okBtnClass('btn btn-danger')
                            .cancelBtn('Cancel')
                            .open();
                        dialog.result.then(result => {
                            this.variableService.deleteVariable(variable.id).subscribe(response => {
                                this.toggleSave();
                                console.log('Deleted variable');
                                Utils.removeHiddenForecastVariable(variable.id);
                                const index = this.variableList.findIndex(x => x.id === variable.id);
                                this.variableList.splice(index, 1);
                                this.getVariableContent();
                                this.updateProjections();
                            }, (error) => {
                                this.toggleSave();
                                const response = JSON.parse(error._body);
                                this.modal.showError(response.message);
                            });
                        }).catch(() => {
                            this.toggleSave();
                            this.getVariables(this.selectedBranchId);
                        });
                    } else {
                        this.toggleSave();
                        const response = JSON.parse(error._body);
                        this.modal.showError(response.message);
                    }
                });
            }).catch(() => { });
        }
    }

    /**
     * Loops through existing expression to find inconsistencies with updated variables.
     * Calls the updateVariable function with necessary changes made to the expression
     * @param updatedVariable
     * @private
     */
    _findInconsistentExpressionReference(updatedVariable) {
        let updateVar = false;

        for (const variable of this.modifiedVariableList) {
            if (variable.content.variableType !== VariableType.Breakdown && variable.content.timeSegments) {
                for (const timeSeg of variable.content.timeSegments) {
                    if (timeSeg.expression) {
                        const ex = Expression.deserialize(timeSeg.expression);
                        let references = {};
                        if (ex instanceof Expression) { references = ex.getNeededRefsExt(); }

                        if (Object.keys(references).length !== 0) {
                            for (const referenceName of Object.keys(references)) {
                                if (references[referenceName] === updatedVariable.id && referenceName !== updatedVariable.content.title) {
                                    this.tempExpression = Object.assign({}, timeSeg.expression);
                                    this.parsedExpression = [];
                                    this._parseExpression(this.tempExpression.jsepExpression);
                                    const expressionString = this._updateExpressionString(updatedVariable);
                                    const newTimeSegExpression = Expression.parse(expressionString, this.newContent);
                                    if (newTimeSegExpression instanceof Expression) {
                                        timeSeg.expression = newTimeSegExpression;
                                        updateVar = true;
                                    }
                                }
                            }
                        }
                    }
                }
                if (updateVar) {
                    console.log('Updating expression variable due to referenced variable changes');
                    this.updateExpressionVariableReference(new ForecastVariable(variable), false);
                    updateVar = false;
                }
            }
        }
    }

    /**
     * Recursive function to parse the expression object into it's individual elements
     * @param expression
     * @private
     */
    _parseExpression(expression) {
        if (expression.type === 'Identifier') {
            this.parsedExpression.push({
                id: expression.reference,
                title: expression.name,
            });
        } else if (expression.type === 'BinaryExpression') {
            if (expression.left) {
                this._parseExpression(expression.left);
            }

            if (expression.operator) {
                this.parsedExpression.push({
                    id: '',
                    title: expression.operator,
                });
            }

            if (expression.right) {
                this._parseExpression(expression.right);
            }
        } else if (expression.type === 'Literal') {
            this.parsedExpression.push({
                id: '',
                title: expression.value,
            });
        } else if (expression.type === 'UnaryExpression') {
            if (expression.operator) {
                this.parsedExpression.push({
                    id: '',
                    title: expression.operator,
                });
            }

            if (expression.argument) {
                this._parseExpression(expression.argument);
            }
        }
    }

    /**
     * Create a plain text string with necessary variable updates for the projection library to interpret
     * @param updatedVariable
     * @returns expressionString
     * @private
     */
    _updateExpressionString(updatedVariable) {
        let expressionString = '';

        for (const element of this.parsedExpression) {
            if (element.id === updatedVariable.id && element.title !== updatedVariable.content.title) {
                expressionString = expressionString + updatedVariable.content.title;
            } else {
                expressionString = expressionString + element.title;
            }
        }
        return expressionString;
    }


    /**
     * Updates the timesegment characteristics defined for a frame
     * @param timesegmentData contains the timesegment changes and the frame which contains the timesegment
     */
    upsertTimesegment(timesegmentData) {
        const timesegment = timesegmentData.timesegment;
        timesegment.date = timesegmentData.date;
        const variable = timesegmentData.variable;

        // filter out any timesegments that start at the same date
        if (variable.content.timeSegments === undefined) {
            variable.content.timeSegments = [];
        }
        variable.content.timeSegments = variable.content.timeSegments.filter(seg => seg.date !== timesegment.date);
        if (!isNaN(timesegment.value) || timesegment.method === TimeSegmentMethod.Expression) {
            variable.content.timeSegments.push(timesegment);
            this.updateVariable(variable, false, timesegment);
        } else {
            // Delete timesegment if timesegment value is empty
            this.updateVariable(variable, false);
        }

    }

    /**
     * Updates the actual value of a frame. If the frame's variable did not have an actual value defined
     * for the frame's date, a new actual will be created for this frame
     */
    upsertActualValue(actualData) {
        const newValue = actualData.value;
        const date = actualData.date;
        const variable = actualData.variable;
        if (variable.content.actuals === undefined) {
            variable.content.actuals = [];
        }
        const exisitingActual = variable.content.actuals.find(actual => actual.date === date);

        if (exisitingActual) {
            // delete the existing actual if no value is defined
            if (newValue === '') {
                variable.content.actuals = variable.content.actuals.filter(actual => actual.date !== date);
            } else {
                exisitingActual.value = newValue;
            }
        } else if (newValue !== '') {
            // only create actual if value is value is defined
            const newActual: Actual = {
                date: date,
                value: newValue
            };
            variable.content.actuals.push(newActual);
        }
        this.updateVariable(variable);
    }

    /**
     * Updates the subvariable value of a variable
     * @param subframeData containes the new subvariable value, the name of the subvariable,
     * the frame that the new value is to be placed in, and the variable that the subvariable belongs to
     */
    upsertSubframe(subframeData) {
        const newValue = subframeData.subframeValue;
        const frame = subframeData.frame;
        const subframeName = subframeData.subframeName;
        const variable = subframeData.variable;
        if (variable.content.timeSegments === undefined) {
            variable.content.timeSegments = [];
        }
        const subvariables: { [subvarName: string]: number } = {};
        frame.subFrames.map(sf => {
            if (sf.name === subframeName) {
                return subvariables[sf.name] = newValue / 100;
            } else {
                return subvariables[sf.name] = sf.value;
            }
        });
        const timesegment = {
            date: frame.date,
            method: 'BREAKDOWN',
            breakdown: subvariables
        };
        variable.content.timeSegments = variable.content.timeSegments.filter(seg => seg.date !== timesegment.date);
        variable.content.timeSegments.push(timesegment);
        this.updateVariable(variable);
    }

    handleSpreadsheetPaste(pastingData) {
        const selectedFrame = pastingData.selection;
        let isNumericalValues = true;
        pastingData.values.forEach(value => {
            if (isNaN(Number(value)) || value.trim() === '') {
                isNumericalValues = false;
            }
        });
        if (!isNumericalValues) {
            this.modal.showError('Only numerical values are accepted! Please check your copied data again.');
        } else {
            if (this.isInPast(selectedFrame.date)) {
                const dialog = this.modalDialog
                    .confirm()
                    .title('Confirmation')
                    .body('The selected start date has already past. Do you want to paste actual values or projected values?')
                    .okBtn('Actual').okBtnClass('btn btn-danger')
                    .cancelBtn('Projected')
                    .open();
                dialog.result.then(result => {
                    this._doActualsPaste(pastingData.values, pastingData);
                }).catch(() => {
                    this._doProjectionPaste(pastingData.values, pastingData);
                });
            } else {
                this._doProjectionPaste(pastingData.values, pastingData);
            }
        }
    }

    _doProjectionPaste(values, pastingData) {
        let date = pastingData.selection.date;
        const variable = pastingData.variable;
        values.forEach(value => {
            const timeseg = {
                'method': TimeSegmentMethod.Basic,
                'date': date,
                'value': Number(value)
            };
            // filter out any timesegments that start at the same date
            if (variable.content.timeSegments === undefined) {
                variable.content.timeSegments = [];
            }
            variable.content.timeSegments = variable.content.timeSegments.filter(seg => seg.date !== timeseg.date);
            variable.content.timeSegments.push(timeseg);
            // increment month
            date = (moment(date, 'YYYY-MM')).add(1, 'M').format('YYYY-MM');

        });
        this.updateVariable(variable);
    }

    _doActualsPaste(values, pastingData) {
        let date = pastingData.selection.date;
        const variable = pastingData.variable;
        values.forEach(value => {
            if (this.isInPast(date)) {
                if (variable.content.actuals === undefined) {
                    variable.content.actuals = [];
                }
                const exisitingActual = variable.content.actuals.find(actual => actual.date === date);

                if (exisitingActual) {
                    exisitingActual.value = value;
                } else {
                    const newActual: Actual = {
                        date: date,
                        value: value
                    };
                    variable.content.actuals.push(newActual);
                }
            } else {
                const timeseg = {
                    'method': TimeSegmentMethod.Basic,
                    'date': date,
                    'value': Number(value)
                };
                // filter out any timesegments that start at the same date
                if (variable.content.timeSegments === undefined) {
                    variable.content.timeSegments = [];
                }
                variable.content.timeSegments = variable.content.timeSegments.filter(seg => seg.date !== timeseg.date);
                variable.content.timeSegments.push(timeseg);
            }
            // increment month
            date = (moment(date, 'YYYY-MM')).add(1, 'M').format('YYYY-MM');
        });
        this.updateVariable(variable);
    }

    isSideBarExpanded() {
        this.isExpanded = !this.isExpanded;

        Utils.setIsForecastSidebarExpanded(this.isExpanded);

        if (this.uiProjections.length > 0) {
            this.graphComponent.hideGraph();
            setTimeout(() => { this.updateGraphDisplay(); }, 550);
        }
    }

    onStartDateChange(startDate) {
        this.startDate = startDate.format('YYYY-MM');
        console.log('Reloading projections');
        this.updateProjections();
    }

    onEndDateChange(endDate) {
        this.endDate = endDate.format('YYYY-MM');
        console.log('Reloading projections');
        this.updateProjections();
    }

    updateProjections(updatedForecastVariable?: ForecastVariable, updatedTimeSegment?: TimeSegment) {
        this.getProjections(updatedForecastVariable, updatedTimeSegment);

        if (this.uiProjections.length > 0) {
            this.graphComponent.updateProjections(this.uiProjections, this.startDate, this.endDate);
        }
    }

    updateGraphDisplay() {
        if (this.uiProjections.length > 0) {
            this.graphComponent.updateChartData();
            this.spreadsheetComponent.hideEditor();
        }
    }

    toggleDisplayLines(displayLines) {
        if (this.uiProjections.length > 0) {
            this.graphComponent.toggleDisplayTypes(displayLines);
        }
    }

    /**
     * Checks if a date is earlier than the current date
     * @param date the date to checked
     */
    isInPast(date: string): boolean {
        return (moment().startOf('month').diff(moment(date)) > 0);
    }

    _getAssociatedVariables(breakdownId): ForecastVariableModel[] {
        const associatedVariables: ForecastVariableModel[] = [];
        for (const variable of this.variableList) {
            if (variable.content.breakdownIds && variable.content.breakdownIds.includes(breakdownId)) {
                associatedVariables.push(variable);
            }
        }
        return associatedVariables;
    }

    /**
     * Adds any changes made on variables to the history of past changes.
     * Both the variable state before and after the change for made is stored in the history array
     * @param variable the variable data that has just been updated
     */
    private _updateForecastChangeHistory(variable, type: string) {
        let state: UndoRedoObject;
        if (type === 'create') {
            state = {
                type: type,
                old: null,
                new: variable
            };
        } else if (type === 'delete') {
            state = {
                type: type,
                old: variable,
                new: null
            };
        } else {
            const oldVariableData = this.oldVariableList.find((x => x.id === variable.id));
            state = {
                type: type,
                old: oldVariableData,
                new: variable
            };
        }
        this.forecastUndoManager.pushState(state);
    }

    /**
     * Performs an undo on the forecast to undo the last change made on a variable and persisting the change
     * on the backend
     */
    private _undoForecastChange() {
        const prevState: UndoRedoObject = this.forecastUndoManager.undo();
        if (prevState !== null) {
            if (prevState.type === 'edit') {
                const prevStateVariable = prevState.old;
                const variableIndex = this.modifiedVariableList.findIndex(variable => variable.id === prevStateVariable.id);
                this.modifiedVariableList[variableIndex] = prevStateVariable;
                prevStateVariable.version = this.variableList[variableIndex].version;
                this.updateVariable(new ForecastVariable(prevStateVariable), true);
            }
        }
    }

    /**
     * Performs a redo on the forecast to redo the last change that was undone
     */
    private _redoForecastChange() {
        const futureState: UndoRedoObject = this.forecastUndoManager.redo();
        if (futureState !== null) {
            if (futureState.type === 'edit') {
                const futureStateVariable: ForecastVariableModel = futureState.new;
                const variableIndex = this.modifiedVariableList.findIndex(variable => variable.id === futureStateVariable.id);
                this.modifiedVariableList[variableIndex] = futureStateVariable;
                futureStateVariable.version = this.variableList[variableIndex].version;
                this.updateVariable(new ForecastVariable(futureStateVariable), true);
            }
        }
    }

    /**
     * Paases the variables (fromatted to be used in the projection library) to the utility
     * function that initiates the downloading of the forecast as a CSV file.
     */
    onDownloadForecastCSV(event) {
        const filename = this.selectedProjectName + '_' + this.currentBranch.title;
        Utils.downloadForecastCSV(filename, this.variableContent, event.startDate, event.endDate);
    }
}
