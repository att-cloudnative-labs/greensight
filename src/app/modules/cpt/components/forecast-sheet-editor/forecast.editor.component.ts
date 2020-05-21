import {
    Component,
    OnInit,
    OnDestroy,
    ViewChild,
    HostListener,
    Input,
    AfterViewInit
} from '@angular/core';
import { Utils } from '../../lib/utils';
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
import { ForecastFrame } from '@app/modules/cpt/interfaces/forecast-frame';
import { ForecastVariableProjection } from '@app/modules/cpt/interfaces/forecastVariableProjections';
import { ForecastVariable, ForecastVariableModel } from '@app/modules/cpt/interfaces/forecast-variable';
import { UserService } from '@cpt/services/user.service';
import { Modal } from 'ngx-modialog-7/plugins/bootstrap';
import { ForecastGraphComponent } from './forecast-graph/forecast.graph.component';
import { ForecastVariableTreeNode } from '@app/modules/cpt/interfaces/forecast-variable';
import { ModalDialogService } from '@app/modules/cpt/services/modal-dialog.service';
import { Unit } from '@app/modules/cpt/interfaces/unit';
import { VariableUnitService } from '@app/modules/cpt/services/variable-unit.service';
import { SpreadsheetEntryComponent } from './spreadsheet-entry/spreadsheet.entry.component';
import { TimeSegmentMethod } from '@cpt/capacity-planning-projection/lib/timesegment';
import { SettingsService } from '@app/modules/cpt/services/settings.service';
import { UndoRedoObject } from '../../interfaces/undo-redo-object';
import { UndoRedoManager } from '../../lib/undo-redo-manager';
import { SplitComponent } from 'angular-split';
import { Store, ofActionSuccessful, Actions, } from '@ngxs/store';
import * as treeActions from '@app/modules/cpt/state/tree.actions';
import { v4 as uuid } from 'uuid';
import { TreeState } from '@app/modules/cpt/state/tree.state';
import { map, filter, debounce, take } from 'rxjs/operators';
import { untilDestroyed } from 'ngx-take-until-destroy';
import * as libraryActions from '@app/modules/cpt/state/library.actions';
import * as layoutActions from '@app/modules/cpt/state/layout.actions';
import { TreeNode } from '@app/modules/cpt/interfaces/tree-node';
import { Moment, unix } from 'moment';
import { AddVariable, DeleteVariable, UpdateVariable } from '@app/modules/cpt/state/forecast-sheet.action';
import * as DockableStackActions from '@app/modules/cpt/state/dockable-stack.actions';
import { interval } from "rxjs";
import { ApplicationState } from '@cpt/state/application.state';
import { ReleaseState } from '@cpt/state/release.state';
import { ReleaseFetch } from '@cpt/state/release.actions';


/**
* Composes the top level components: spreadsheet, graph
* Manages remote data access and persistence
* Runs projection calculations:
*   -after fetching data on initial load or when switching branches
*   -after handling events that update variable data
*   -after handling events that change start and end date of projection
*/
@Component({
    selector: 'forecast-editor',
    templateUrl: './forecast.editor.component.html',
    styleUrls: ['./forecast.editor.component.css']
})
export class ForecastEditorComponent implements OnInit, OnDestroy, AfterViewInit {
    @Input() nodeId: string;
    @Input() releaseNr: number;
    @ViewChild(SpreadsheetEntryComponent, { static: true }) spreadsheetComponent: SpreadsheetEntryComponent;
    @ViewChild(ForecastGraphComponent, { static: true }) graphComponent: ForecastGraphComponent;
    @ViewChild('split', { static: false }) splitEl: SplitComponent;
    variableModelList: ForecastVariableModel[] = new Array<ForecastVariableModel>();
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
    hiddenVariables = [];
    spreadsheetSize = 60;
    graphSize = 40;
    forecastNode: TreeNode;
    sheetName = '';
    disableClick = false;
    sheetVisible = true;
    initiallyUpdatedChart = false;
    editingEnabled = true;

    FCstartDate: Moment;
    FCendDate: Moment;
    minStartDate: Moment = unix(new Date().getTime() / 1000);
    // Used to revert start date and end date back to last valid selections
    lastValidStartDate: Moment;
    lastValidEndDate: Moment;

    // Used for keeping track of variables before changes are made
    oldVariableList = [];

    get readonly() {
        return !!this.releaseNr;
    }

    constructor(
        private modalDialog: Modal,
        private modal: ModalDialogService,
        private userService: UserService,
        private settingsService: SettingsService,
        private variableUnitService: VariableUnitService,
        private store: Store,
        private actions$: Actions
    ) {
        this.actions$.pipe(ofActionSuccessful(
            libraryActions.RenameForecastSheetCommitted),
            untilDestroyed(this)).subscribe((node) => {
                this.store.dispatch(new layoutActions.EditorTabTitleChanged({ nodeId: node.payload.nodeId, newName: node.payload.newName }));
            }
            );
    }

    /**
     * Sets up a listener for new project selections
     */
    ngOnInit() {

        this.store.select(ApplicationState).pipe(untilDestroyed(this), filter(as => as.ready), take(1)).subscribe(as => {

            const loadAction = this.releaseNr ? new ReleaseFetch({ nodeId: this.nodeId, releaseNr: this.releaseNr }) : new treeActions.LoadForecastSheetContent({ id: this.nodeId });

            this.store.dispatch(loadAction).subscribe(() => {
                const filteredNode$ = this.store
                    .select(TreeState.nodeById)
                    .pipe(
                        map(byId => byId(this.nodeId)),
                        untilDestroyed(this),
                        filter(node => !!node),
                    );

                const releaseNode$ = this.store.select(ReleaseState.id(this.nodeId, this.releaseNr)).pipe(
                    untilDestroyed(this),
                    filter(release => !!release),
                    map(release => release.treeNode),
                );

                const nodeSrc$ = this.releaseNr ? releaseNode$ : filteredNode$;
                this.initDates();
                // get the selected forecast sheet
                nodeSrc$.pipe(
                    filter(forecastSheetNode => !this.forecastNode || this.forecastNode.version !== forecastSheetNode.version),
                    untilDestroyed(this)
                ).subscribe(forecastNode => {
                    if (forecastNode && this.forecastNode && forecastNode.version < this.forecastNode.version) {
                        // If we get here is because the node is out of sync or because the HTTP request failed for some other reason
                        // FIXME: This should be done correctly but for now, in order to avoid an infinite loop of trials and errors under
                        // some circumstances (when the changes in this graph are triggered by changes in the interface of one of the graphs
                        // it includes), we just disable editing of this graph altogether and the user will have to reload
                        console.log('Out of sync or HTTP error. Disabling editing');
                        this.editingEnabled = false;
                        this.disableUserInput();
                        return;
                    }
                    if (forecastNode.content) {
                        this.forecastNode = forecastNode;
                        this.sheetName = this.forecastNode.name;
                        this.variableModelList = forecastNode.content.variables ? Object.values(forecastNode.content.variables) : [];
                        this.getVariableContent();
                        this.updateProjections();
                        for (const variable in this.forecastVariableList) {
                            if (variable) {
                                this._findInconsistentExpressionReference(variable);
                            }
                        }
                    }
                });

                this.forecastUndoManager = new UndoRedoManager();
                this.getUnits();
            });
        });
    }

    ngAfterViewInit() {
        this.splitEl.dragProgress$.pipe(
            untilDestroyed(this),
            debounce(x => interval(100))
        ).subscribe(() => {
            this.graphComponent.updateChart();
        });

        this.actions$.pipe(ofActionSuccessful(
            layoutActions.SplitDragEnd, DockableStackActions.TabSelectionChanged),
            untilDestroyed(this)).subscribe((payload: { splitId: string, sizes: number[] }) => {
                // FIXME: check if this actually changes our split
                this.graphComponent.updateChart();
            }
            );

        this.actions$.pipe(ofActionSuccessful(
            treeActions.FCSheetStartDateChanged),
            untilDestroyed(this)).subscribe((payload: { nodeId: string, startDate: Moment }) => {

                const storedStartDate = new Date(Utils.getForecastStartDate());

                storedStartDate.setDate(1);
                storedStartDate.setHours(0, 0, 0, 0);
                const start = unix(storedStartDate.getTime() / 1000);
                this.startDate = start.format('YYYY-MM');
                this.updateProjections();
            });

        this.actions$.pipe(ofActionSuccessful(
            treeActions.FCSheetEndDateChanged),
            untilDestroyed(this)).subscribe((payload: { nodeId: string, endDate: Moment }) => {
                const storedEndDate = new Date(Utils.getForecastEndDate());

                storedEndDate.setDate(1);
                storedEndDate.setHours(0, 0, 0, 0);
                const end = unix(storedEndDate.getTime() / 1000);
                this.endDate = end.format('YYYY-MM');
                this.updateProjections();
            });
    }


    ngOnDestroy() {
    }

    initDates() {
        const currentDate = new Date();
        currentDate.setDate(1);
        currentDate.setHours(0, 0, 0, 0);
        // Use default start date if none found in local storage
        if (Utils.getForecastStartDate() === 'Invalid date' || Utils.getForecastStartDate() === undefined) {
            this.minStartDate = unix(currentDate.getTime() / 1000).add(-2, 'months');
            this.FCstartDate = this.minStartDate;
        } else {
            const storedStartDate = new Date(Utils.getForecastStartDate());
            storedStartDate.setDate(1);
            storedStartDate.setHours(0, 0, 0, 0);
            this.minStartDate = unix(storedStartDate.getTime() / 1000);
            this.FCstartDate = this.minStartDate;
        }
        // Use default end date if none found in local storage
        if (Utils.getForecastEndDate() === 'Invalid date' || Utils.getForecastEndDate() === undefined) {
            this.FCendDate = unix(currentDate.getTime() / 1000).add(10, 'months');
        } else {
            const storedEndDate = new Date(Utils.getForecastEndDate());
            storedEndDate.setDate(1);
            storedEndDate.setHours(0, 0, 0, 0);
            this.FCendDate = unix(storedEndDate.getTime() / 1000);
        }

        this.setupDates({ 'startDate': this.FCstartDate.format('YYYY-MM'), 'endDate': this.FCendDate.format('YYYY-MM') });

        this.lastValidStartDate = this.FCstartDate;
        Utils.setForecastStartDate(this.FCstartDate);
        Utils.setForecastEndDate(this.FCendDate);
        this.lastValidEndDate = this.FCendDate;
    }

    // in Read-Write operations the dates are passed through
    // tree state in order to be persisted. in read only mode
    // the control bar will tell us directly.
    // the actual dates are passed through the session storage.
    newDatesReadOnly() {
        this.initDates();
        this.updateProjections();
    }

    setDisableClick(disableClick) {
        this.disableClick = disableClick;
    }

    enableUserInput() {
        this.sheetVisible = true;
        this.graphSize = 50;
        this.spreadsheetSize = 50;
    }

    disableUserInput() {
        this.sheetVisible = false;
        this.spreadsheetComponent.hideEditor();
    }

    @HostListener('window:keydown', ['$event'])
    onButtonPress($event: KeyboardEvent) {
        if (this.sheetVisible) {
            // 'Z' key event is capital Z not lowercase z, don't change below $event.key to z.
            if (($event.ctrlKey || $event.metaKey) && $event.shiftKey && $event.key === 'Z') {
                this._redoForecastChange();
            } else if (($event.ctrlKey || $event.metaKey) && $event.key === 'z') {
                this._undoForecastChange();
            }
        }
    }

    /**
     * Gets the list of available units
     */
    getUnits() {
        this.variableUnitService.getVariableUnits()
            .subscribe(result => {
                this.units = result;
            });
    }



    getVariableContent() {
        this.variableContent = [];
        this.newContent = this.variableModelList.map((variable: any) => {
            return {
                'id': variable.objectId,
                'name': variable.title,
                'variableType': variable.variableType,
                'unit': variable.unit,
                'color': variable.color,
                'description': variable.description,
                'timeSegments': variable.timeSegments,
                'actuals': variable.actuals,
                'breakdownIds': variable.breakdownIds,
                'defaultBreakdown': variable.defaultBreakdown
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

        this.modifiedVariableList = JSON.parse(JSON.stringify(this.variableModelList)); // TODO: Investigate why this
        this.oldVariableList = JSON.parse(JSON.stringify(this.variableModelList));

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
        this.forecastVariableList = this.variableModelList.map(variableModel => new ForecastVariable(variableModel));

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

                const variableModel = this.modifiedVariableList.find(x => x.objectId === projectionVariable.id);

                return new ForecastFrame(
                    projectionFrame,
                    new ForecastVariable(variableModel),
                    this.forecastVariableList,
                    timeSegment
                );
            },
            onResult: (e?: Error, vp?: VariableProjections) => {
                if (vp) {
                    Object.keys(vp).forEach(variableId => {
                        const existing = this.uiProjections.find(uip => uip.variable.id === variableId);
                        const variableModel = this.modifiedVariableList.find(x => x.objectId === variableId);
                        if (existing) {
                            existing.update(
                                new ForecastVariable(variableModel as ForecastVariableModel),
                                vp[variableId] as ForecastFrame[],
                                this.variableModelList.map(variableModel => new ForecastVariable(variableModel))
                            );
                        } else {
                            const forecastVariableProjection = new ForecastVariableProjection(
                                new ForecastVariable(variableModel),
                                vp[variableId] as ForecastFrame[],
                                this.variableModelList.map(variableModel => new ForecastVariable(variableModel))
                            );
                            forecastVariableProjection.display = !this.isVariableHidden(forecastVariableProjection.variable.id);
                            this.uiProjections.push(forecastVariableProjection);
                        }
                    });
                }
            }
        });

        this.sortVariables();
        console.log('Retrieved projections');
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
        // this.uiProjections = originalList.sort((a, b) => (a.variable.content.title > b.variable.content.title) ? 1 : -1);
        for (const uiProj of this.uiProjections) {
            uiProj.subframeNames.sort();
            // console.log(uiProj);
            for (const f of uiProj.frames) {
                f.subFrames.sort((a, b) => (a.name > b.name) ? 1 : -1);
            }

        }
    }

    createVariable(variable) {
        if (this.readonly) {
            return;
        }
        const id = uuid();
        let parentNode;
        this.store.selectOnce(TreeState.nodeById).pipe(map(byId => byId(this.forecastNode.parentId))).forEach(node => { parentNode = node; });
        this.store.dispatch(new AddVariable({ folderId: this.forecastNode.parentId, folderName: parentNode.name, sheetId: this.forecastNode.id, sheetName: this.forecastNode.name, variableId: id, variableName: variable.title, variableContent: { ...variable, timeSegments: [], defaultBreakdown: {}, objectId: id } }));
    }

    updateVariable(forecastVariable: ForecastVariable, isUndoCommand?: boolean, timeSegment?: TimeSegment) {
        if (this.readonly) {
            return;
        }
        if (!isUndoCommand) {
            this._updateForecastChangeHistory(forecastVariable.variableModel, 'edit');
        }
        let parentNode;
        this.store.selectOnce(TreeState.nodeById).pipe(map(byId => byId(this.forecastNode.parentId))).forEach(node => { parentNode = node; });
        this.store.dispatch(new UpdateVariable({ folderId: this.forecastNode.parentId, folderName: parentNode.name, sheetId: this.forecastNode.id, sheetName: this.forecastNode.name, variableId: forecastVariable.id, variableName: forecastVariable.title, variableContent: JSON.parse(JSON.stringify(forecastVariable.variableModel)) }));
    }

    updateVariableTitle(forecastVariable: ForecastVariable, isUndoCommand?: boolean) {
        if (this.readonly) {
            return;
        }
        if (!isUndoCommand) {
            this._updateForecastChangeHistory(forecastVariable.variableModel, 'edit', true);
        }
    }

    deleteVariable(variable: ForecastVariableTreeNode) {
        if (this.readonly) {
            return;
        }
        this.store.dispatch(new DeleteVariable({ variableId: variable.id, sheetId: this.forecastNode.id }));
    }

    updateHiddenVariableIds(hiddenVariables: string[]) {
        this.hiddenVariables = hiddenVariables;
        this.uiProjections.forEach(uip => {
            uip.display = !this.hiddenVariables.find(hv => hv === uip.variable.variableModel.objectId);
        });
        this.updateProjections();
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
            if (variable.variableType !== VariableType.Breakdown && variable.timeSegments) {
                for (const timeSeg of variable.timeSegments) {
                    if (timeSeg.expression) {
                        const ex = Expression.deserialize(timeSeg.expression);
                        let references = {};
                        if (ex instanceof Expression) { references = ex.getNeededRefsExt(); }

                        if (Object.keys(references).length !== 0) {
                            for (const referenceName of Object.keys(references)) {
                                if (references[referenceName] === updatedVariable.id && referenceName !== updatedVariable.title) {
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
                    this.updateVariable(new ForecastVariable(variable), false);
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
            if (element.id === updatedVariable.id && element.title !== updatedVariable.title) {
                expressionString = expressionString + updatedVariable.title;
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
        if (variable.variableModel.timeSegments === undefined) {
            variable.variableModel.timeSegments = [];
        }
        variable.variableModel.timeSegments = variable.variableModel.timeSegments.filter(seg => seg.date !== timesegment.date);
        if (!isNaN(timesegment.value) || timesegment.method === TimeSegmentMethod.Expression) {
            variable.variableModel.timeSegments.push(timesegment);
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
        const variable = actualData.variable as ForecastVariable;
        if (variable.variableModel.actuals === undefined) {
            variable.variableModel.actuals = [];
        }
        const exisitingActual = variable.variableModel.actuals.find(actual => actual.date === date);

        if (exisitingActual) {
            // delete the existing actual if no value is defined
            if (newValue === '') {
                variable.variableModel.actuals = variable.variableModel.actuals.filter(actual => actual.date !== date);
            } else {
                exisitingActual.value = newValue;
            }
        } else if (newValue !== '') {
            // only create actual if value is value is defined
            const newActual: Actual = {
                date: date,
                value: newValue
            };

            variable.variableModel.actuals.push(newActual);
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
        const variable = subframeData.variable as ForecastVariable;
        if (variable.variableModel.timeSegments === undefined) {
            variable.variableModel.timeSegments = [];
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
        variable.variableModel.timeSegments = variable.variableModel.timeSegments.filter(seg => seg.date !== timesegment.date);
        variable.variableModel.timeSegments.push(timesegment);
        this.updateVariable(variable);
    }

    handleSpreadsheetPaste(pastingData) {
        if (this.readonly) {
            return;
        }
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
        if (this.readonly) {
            return;
        }
        let date = pastingData.selection.date;
        const variable = pastingData.variable;
        values.forEach(value => {
            const timeseg = {
                'method': TimeSegmentMethod.Basic,
                'date': date,
                'value': Number(value)
            };
            // filter out any timesegments that start at the same date
            if (variable.variableModel.timeSegments === undefined) {
                variable.variableModel.timeSegments = [];
            }
            variable.variableModel.timeSegments = variable.variableModel.timeSegments.filter(seg => seg.date !== timeseg.date);
            variable.variableModel.timeSegments.push(timeseg);
            // increment month
            date = (moment(date, 'YYYY-MM')).add(1, 'M').format('YYYY-MM');

        });
        this.updateVariable(variable);
    }

    _doActualsPaste(values, pastingData) {
        if (this.readonly) {
            return;
        }
        let date = pastingData.selection.date;
        const variable = pastingData.variable;
        values.forEach(value => {
            if (this.isInPast(date)) {
                if (variable.variableModel.actuals === undefined) {
                    variable.variableModel.actuals = [];
                }
                const exisitingActual = variable.variableModel.actuals.find(actual => actual.date === date);

                if (exisitingActual) {
                    exisitingActual.value = value;
                } else {
                    const newActual: Actual = {
                        date: date,
                        value: value
                    };
                    variable.variableModel.actuals.push(newActual);
                }
            } else {
                const timeseg = {
                    'method': TimeSegmentMethod.Basic,
                    'date': date,
                    'value': Number(value)
                };
                // filter out any timesegments that start at the same date
                if (variable.variableModel.timeSegments === undefined) {
                    variable.variableModel.timeSegments = [];
                }
                variable.variableModel.timeSegments = variable.variableModel.timeSegments.filter(seg => seg.date !== timeseg.date);
                variable.variableModel.timeSegments.push(timeseg);
            }
            // increment month
            date = (moment(date, 'YYYY-MM')).add(1, 'M').format('YYYY-MM');
        });
        this.updateVariable(variable);
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

    /**
     * Checks if a date is earlier than the current date
     * @param date the date to checked
     */
    isInPast(date: string): boolean {
        return (moment().startOf('month').diff(moment(date)) > 0);
    }

    _getAssociatedVariables(breakdownId): ForecastVariableModel[] {
        const associatedVariables: ForecastVariableModel[] = [];
        for (const variable of this.variableModelList) {
            if (variable.breakdownIds && variable.breakdownIds.includes(breakdownId)) {
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
    private _updateForecastChangeHistory(variable, type: string, isTitleChanged?: boolean) {
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
        } else if (isTitleChanged) {
            const newVariableData = this.oldVariableList.find((x => x.objectId === variable.objectId));
            state = {
                type: type,
                old: variable,
                new: newVariableData
            };
        } else {
            const oldVariableData = this.oldVariableList.find((x => x.objectId === variable.objectId));
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
                const variableIndex = this.modifiedVariableList.findIndex(variable => variable.objectId === prevStateVariable.objectId);
                this.modifiedVariableList[variableIndex] = prevStateVariable;
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
                const variableIndex = this.modifiedVariableList.findIndex(variable => variable.objectId === futureStateVariable.objectId);
                this.modifiedVariableList[variableIndex] = futureStateVariable;
                this.updateVariable(new ForecastVariable(futureStateVariable), true);
            }
        }
    }

    /**
     * Paases the variables (fromatted to be used in the projection library) to the utility
     * function that initiates the downloading of the forecast as a CSV file.
     */
    onDownloadForecastCSV(event) {
        const filename = this.forecastNode.name;
        Utils.downloadForecastCSV(filename, this.variableContent, event.startDate, event.endDate);
    }
}
