import {
    Component,
    Input,
    Output,
    EventEmitter,
    OnInit,
    ViewChild,
    ViewChildren,
    HostListener,
    ElementRef,
    QueryList,
    OnChanges,
    OnDestroy
} from '@angular/core';
import { VariableType, Frame } from '@cpt/capacity-planning-projection/lib';
import { Utils } from '@cpt/lib/utils';
import * as moment from 'moment';
import { ForecastFrame } from '@cpt/interfaces/forecast-frame';
import { ForecastSubFrame } from '@cpt/interfaces/forecast-sub-frame';
import { ForecastVariable } from '@cpt/interfaces/forecast-variable';
import { Unit } from '@cpt/interfaces/unit';
import { getMonths } from '@cpt/capacity-planning-projection/lib/date';
import { FrameCellComponent } from './frame-cell/frame.cell.component';
import { SubframeCellComponent } from './subframe-cell/subframe.cell.component';
import { Actions, ofActionSuccessful, Select, Store } from '@ngxs/store';
import { ClickedVariableCell } from '@cpt/state/forecast-sheet.action';
import { Selection, SelectionState } from '@cpt/state/selection.state';
import { Observable } from 'rxjs';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { ReleaseDescriptionOpened } from '@cpt/state/release.actions';


/**
* Composes spreadsheet components
* Manages frame selection
* Emits events to forecast-app to allow it to update variable data
*   -By re-broadcasting events from frame, variable, or subframe editors
*   -By emitting events while a frame is selected
*   -By emitting an event when 'Create Variable' is clicked
*/
@Component({
    selector: 'spreadsheet-entry',
    templateUrl: './spreadsheet.entry.component.html',
    styleUrls: ['./spreadsheet.entry.component.css']
})
export class SpreadsheetEntryComponent implements OnInit, OnChanges, OnDestroy {
    @Input('uiProjections') uiProjections;
    @Input('variableList') variableList: Array<ForecastVariable>;
    @Input('units') units: Array<Unit>;
    @Input('startDate') startDate: string;
    @Input('endDate') endDate: string;
    @Input('sheetId') sheetId: string;
    @Input('processInput') processInput: boolean;
    @Input() disableClick;
    @Input() readonly: boolean;
    @Output('onVariableCreate') variableCreated = new EventEmitter();
    @Output('onUpdateVariable') variableUpdated = new EventEmitter();
    @Output('onDeleteVariable') variableDeleted = new EventEmitter();
    @Output('onUpsertActualValue') actualValueUpserted = new EventEmitter();
    @Output('onUpsertTimesegment') timesegmentUpserted = new EventEmitter();
    @Output('onUpsertSubframe') subframeUpserted = new EventEmitter();
    @Output('onPaste') valuePasted = new EventEmitter();
    @Output('onUpdateVariableTitle') variableTitleUpdated = new EventEmitter();
    @ViewChildren(FrameCellComponent) frameCellComponents: QueryList<FrameCellComponent>;
    @ViewChildren(SubframeCellComponent) subframeCellComponents: QueryList<SubframeCellComponent>;
    @ViewChild('spreadsheet', { static: false }) spreadsheet: ElementRef;
    @Select(SelectionState) selection$: Observable<Selection[]>;


    leftColumnWidth = 175;
    leftColumnStyle = this.leftColumnWidth;
    blankLineCount = 30;
    blankLineCountTimes = [];

    selection = new Array<any>();
    selectionPosition: number[] = [];
    selectedVar: any;

    projectionKeys = [];
    showEdit = false;
    editingSubFrame = false;
    frameIndex = 0;
    currentSubFrame = true;
    currentFrame = true;

    constructor(private _el: ElementRef, private store: Store, private actions$: Actions
    ) { }

    /**
     * When the spreadsheet is initialized, it pushes some blank rows to the table
     */
    ngOnInit() {
        for (let index = 0; index < this.blankLineCount; index++) {
            this.blankLineCountTimes.push('');
        }
        this.actions$.pipe(ofActionSuccessful(
            ReleaseDescriptionOpened),
            untilDestroyed(this)).subscribe((opened => {
                this.selection = [];
            }
            ));
        // de-select the current variable cell, when something else is selected.
        // optimization: select the variable cell from here as well
        this.selection$.pipe(untilDestroyed(this)).subscribe(selection => {
            if (!selection || selection.length === 0 || selection[0].type !== 'VariableCell') {
                this.selection = [];
            }
        });
    }

    ngOnChanges(changes) {
        if (changes['startDate'] || changes['endDate']) {
            this._updateProjectionKeys();
        }
    }

    ngOnDestroy() {
    }

    _updateProjectionKeys() {
        const months = getMonths(this.startDate, this.endDate);
        // TODO: Investigate if updating vs replacing gives us a big peformance boost.
        this.projectionKeys = months.map(month => {
            return { 'month': month, 'isPast': this.isInPast(month) };
        });
    }

    onScroll() {

    }

    @HostListener('document:keydown', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent) {
        if (!this.processInput) {
            return;
        }
        const modalOpen = $('.modal-open');

        // Tab key event, preventDefault prevents loss of selection when a frame is selected
        if (event.key === 'Tab' && this.selection.length) {
            event.preventDefault();
            if (modalOpen.length === 0) {
                this.handleSelectionMoveKeyboardEvent(event);
            }
        }
        // Arrow key events, preventDefault prevents scrolling
        if (event.key.startsWith('Arrow') || event.key.startsWith('Page')) {
            if (this.selection.length && !this.showEdit && modalOpen.length === 0 && !this.editingSubFrame) {
                event.preventDefault();
                this.handleSelectionMoveKeyboardEvent(event);
            }
        }
        // if enter pressed open the editor of the selected frame cell
        const key = Number(event.key);
        if (event.key === 'Enter' || (key >= 0 && key <= 9) || (event.key === '=')) {
            const selectedFrame = this.selection[0];
            const fwdKeyEvent = (event.key === 'Enter') ? undefined : event;
            if (selectedFrame !== undefined && modalOpen.length === 0) {
                const selectedFrameCell: FrameCellComponent = this.frameCellComponents.find(frameComp =>
                    frameComp.frame.date === selectedFrame.date && frameComp.variable.id === selectedFrame.variable.id);
                const selectedSubFrameCell: SubframeCellComponent = this.subframeCellComponents.find(frameComp =>
                    frameComp.frame.date === selectedFrame.date && frameComp.variable.id === selectedFrame.variable.id && (selectedFrame.subFrame !== undefined && frameComp.subframe.subFrame !== undefined && selectedFrame.subFrame.name === frameComp.subframe.subFrame.name));
                if (selectedFrameCell) {
                    selectedFrameCell.doubleClick(fwdKeyEvent);
                }
                if (selectedSubFrameCell && (fwdKeyEvent === undefined || fwdKeyEvent.key !== '=')) {
                    selectedSubFrameCell.doubleClick(fwdKeyEvent);
                }
            }
        }
    }

    handleSelectionMoveKeyboardEvent(event) {
        let nextPosition = Object.assign([], this.selectionPosition);
        let newFrame: any;
        let newFrameVar: any;
        let newFramePosition: any;
        let newSubFrame: any;
        let newVar: any;
        let newPosition = [];
        if (this.selectionPosition.length === 0) {
            return;
        } else {
            switch (event.key) {
                case 'ArrowLeft': {
                    if (nextPosition[1] !== 0) {
                        nextPosition[1]--;
                    }
                    break;
                }
                case 'ArrowUp': {
                    // moving up from current subframe to either the expanded subframe or a frame
                    if (this.selection[0] instanceof ForecastSubFrame && this.uiProjections[this.frameIndex - 1] && nextPosition[0] === 0) {
                        const i = this.frameIndex - 1;
                        this.selection.splice(0, this.selection.length);
                        while (this.uiProjections[i]) {
                            if (this.uiProjections[i].variable.content.variableType === VariableType.Breakdown && this.uiProjections[i].isExpanded) {
                                this.currentSubFrame = false;
                                const lastIndex = this.uiProjections[i].frames[nextPosition[1]].subFrames.length - 1;
                                newSubFrame = this.uiProjections[i].frames[nextPosition[1]].subFrames[lastIndex];
                                newVar = this.uiProjections[i];
                                newPosition = [lastIndex, nextPosition[1]];
                                this.frameIndex = i;
                                break;
                            } else {
                                this.currentFrame = false;
                                newFrame = this.uiProjections[this.frameIndex].frames[nextPosition[1]];
                                newFrameVar = this.selectedVar;
                                newFramePosition = [this.frameIndex, nextPosition[1]];
                                break;
                            }
                        }
                    } else if (this.selection[0] instanceof ForecastFrame && this.uiProjections[nextPosition[0] - 1]) {
                        // moving up from current forecast to either expanded subframe or frame
                        const i = nextPosition[0] - 1;
                        this.selection.splice(0, this.selection.length);
                        while (this.uiProjections[i]) {
                            if (this.uiProjections[i].variable.content.variableType === VariableType.Breakdown && this.uiProjections[i].isExpanded) {
                                this.currentSubFrame = false;
                                const lastIndex = this.uiProjections[i].frames[nextPosition[1]].subFrames.length - 1;
                                newSubFrame = this.uiProjections[i].frames[nextPosition[1]].subFrames[lastIndex];
                                newVar = this.uiProjections[i];
                                newPosition = [lastIndex, nextPosition[1]];
                                this.frameIndex = i;
                                break;
                            } else {
                                this.currentFrame = false;
                                newFrame = this.uiProjections[i].frames[nextPosition[1]];
                                newFrameVar = this.uiProjections[i];
                                newFramePosition = [i, nextPosition[1]];
                                break;
                            }
                        }
                    } else if (nextPosition[0] !== 0) {
                        nextPosition[0]--;
                    }
                    break;
                }
                case 'PageUp': {
                    // PgUp key event to navigate from subFrame to either expanded subFrame or a frame
                    if (this.selection[0] instanceof ForecastSubFrame && this.uiProjections[this.frameIndex - 1] && nextPosition[0] === 0) {
                        const i = this.frameIndex - 1;
                        this.selection.splice(0, this.selection.length);
                        while (this.uiProjections[i]) {
                            if (this.uiProjections[i].variable.content.variableType === VariableType.Breakdown && this.uiProjections[i].isExpanded) {
                                this.currentSubFrame = false;
                                const lastIndex = this.uiProjections[i].frames[nextPosition[1]].subFrames.length - 1;
                                newSubFrame = this.uiProjections[i].frames[nextPosition[1]].subFrames[lastIndex];
                                newVar = this.uiProjections[i];
                                newPosition = [lastIndex, nextPosition[1]];
                                this.frameIndex = i;
                                break;
                            } else {
                                this.currentFrame = false;
                                newFrame = this.uiProjections[this.frameIndex].frames[nextPosition[1]];
                                newFrameVar = this.selectedVar;
                                newFramePosition = [this.frameIndex, nextPosition[1]];
                                break;
                            }
                        }
                    } else if (this.selection[0] instanceof ForecastFrame && this.uiProjections[nextPosition[0] - 1]) {
                        // moving up from current forecast to either expanded subframe or frame
                        const i = nextPosition[0] - 1;
                        this.selection.splice(0, this.selection.length);
                        while (this.uiProjections[i]) {
                            if (this.uiProjections[i].variable.content.variableType === VariableType.Breakdown && this.uiProjections[i].isExpanded) {
                                this.currentSubFrame = false;
                                const lastIndex = this.uiProjections[i].frames[nextPosition[1]].subFrames.length - 1;
                                newSubFrame = this.uiProjections[i].frames[nextPosition[1]].subFrames[lastIndex];
                                newVar = this.uiProjections[i];
                                newPosition = [lastIndex, nextPosition[1]];
                                this.frameIndex = i;
                                break;
                            } else {
                                this.currentFrame = false;
                                newFrame = this.uiProjections[i].frames[nextPosition[1]];
                                newFrameVar = this.uiProjections[i];
                                newFramePosition = [i, nextPosition[1]];
                                break;
                            }
                        }
                    } else if (nextPosition[0] !== 0) {
                        nextPosition[0]--;
                    }
                    break;
                }
                case 'ArrowRight': {
                    if (nextPosition[1] < this.projectionKeys.length - 1) {
                        nextPosition[1]++;
                    }
                    break;
                }
                case 'ArrowDown': {
                    // navigating from forecast frame to either next expanded subframe or non-breakdown frame
                    if ((this.selection[0] instanceof ForecastFrame && this.uiProjections[nextPosition[0] + 1]) ||
                        (this.selection[0] instanceof ForecastFrame && this.uiProjections[nextPosition[0]].variable.content.variableType === VariableType.Breakdown && this.uiProjections[nextPosition[0]].isExpanded) && this.uiProjections[nextPosition[0] + 1] === undefined) {
                        this.selection.splice(0, this.selection.length);
                        let i = nextPosition[0] + 1;
                        if (this.uiProjections[i - 1].variable.content.variableType === VariableType.Breakdown && this.uiProjections[i - 1].isExpanded) {
                            this.currentSubFrame = false;
                            newSubFrame = this.uiProjections[i - 1].frames[nextPosition[1]].subFrames[0];
                            newVar = this.uiProjections[i - 1];
                            newPosition = [0, nextPosition[1]];
                            this.frameIndex = i - 1;
                            break;
                        } else if (this.uiProjections[i]) {
                            this.currentFrame = false;
                            newFrame = this.uiProjections[i].frames[nextPosition[1]];
                            newFrameVar = this.uiProjections[i];
                            newFramePosition = [i, nextPosition[1]];
                            break;
                        } else { i++; }
                    } else if (this.selection[0] instanceof ForecastSubFrame && this.uiProjections[this.frameIndex + 1] && nextPosition[0] === Object.keys(this.uiProjections[this.frameIndex].subframeNames).length - 1) {
                        // naigating sway from current subframe to either next expanded subframe or non-breakdown frame
                        this.selection.splice(0, this.selection.length);
                        const i = this.frameIndex + 1;
                        this.currentFrame = false;
                        newFrame = this.uiProjections[i].frames[nextPosition[1]];
                        newFrameVar = this.uiProjections[i];
                        newFramePosition = [i, nextPosition[1]];
                        break;
                    } else if (nextPosition[0] < Object.keys(this.uiProjections).length - 1 || nextPosition[0] < Object.keys(this.uiProjections[this.frameIndex].subframeNames).length - 1) {
                        nextPosition[0]++;
                    }
                    break;
                }
                case 'PageDown': {
                    // PgDn key event to navigate within frames and subframes
                    if ((this.selection[0] instanceof ForecastFrame && this.uiProjections[nextPosition[0] + 1]) ||
                        (this.selection[0] instanceof ForecastFrame && this.uiProjections[nextPosition[0]].variable.content.variableType === VariableType.Breakdown && this.uiProjections[nextPosition[0]].isExpanded) && this.uiProjections[nextPosition[0] + 1] === undefined) {
                        this.selection.splice(0, this.selection.length);
                        let i = nextPosition[0] + 1;
                        if (this.uiProjections[i - 1].variable.content.variableType === VariableType.Breakdown && this.uiProjections[i - 1].isExpanded) {
                            this.currentSubFrame = false;
                            newSubFrame = this.uiProjections[i - 1].frames[nextPosition[1]].subFrames[0];
                            newVar = this.uiProjections[i - 1];
                            newPosition = [0, nextPosition[1]];
                            this.frameIndex = i - 1;
                            break;
                        } else if (this.uiProjections[i]) {
                            this.currentFrame = false;
                            newFrame = this.uiProjections[i].frames[nextPosition[1]];
                            newFrameVar = this.uiProjections[i];
                            newFramePosition = [i, nextPosition[1]];
                            break;
                        } else { i++; }
                    } else if (this.selection[0] instanceof ForecastSubFrame && this.uiProjections[this.frameIndex + 1] && nextPosition[0] === Object.keys(this.uiProjections[this.frameIndex].subframeNames).length - 1) {
                        // naigating sway from current subframe to either next expanded subframe or non-breakdown frame
                        this.selection.splice(0, this.selection.length);
                        const i = this.frameIndex + 1;
                        this.currentFrame = false;
                        newFrame = this.uiProjections[i].frames[nextPosition[1]];
                        newFrameVar = this.uiProjections[i];
                        newFramePosition = [i, nextPosition[1]];
                        break;
                    } else if (nextPosition[0] < Object.keys(this.uiProjections).length - 1 || nextPosition[0] < Object.keys(this.uiProjections[this.frameIndex].subframeNames).length - 1) {
                        nextPosition[0]++;
                    }
                    break;
                }
                case 'Tab': {
                    if (event.shiftKey) {
                        if (nextPosition[1] !== 0) {
                            nextPosition[1]--;
                        }
                    } else {
                        if (nextPosition[1] < this.projectionKeys.length - 1) {
                            nextPosition[1]++;
                        }
                    }
                    break;
                }
                default: {
                    break;
                }
            }
        }
        nextPosition = this._getNextSelectableFrame(nextPosition, event);
        // if coordinates were found for the next selectable frame, update the current selected position
        if (nextPosition !== undefined) {
            this.selectionPosition = nextPosition;
        }
        // select the frame at the new position
        if (this.currentFrame === false) {
            this.currentFrame = true;
            this.onFrameCellClicked(newFrame, newFrameVar, newFramePosition[0], newFramePosition[1]);
        } else if (this.selection[0] instanceof ForecastFrame) {
            const projection = this.uiProjections[this.selectionPosition[0]];
            const frame = projection.frames[this.selectionPosition[1]];
            this.onFrameCellClicked(frame, projection.variable, this.selectionPosition[0], this.selectionPosition[1]);
        } else if (this.currentSubFrame === false) {
            this.currentSubFrame = true;
            this.onSubFrameCellClicked(newSubFrame, newVar, newPosition[0], newPosition[1], this.frameIndex);
        } else if (this.selection[0] instanceof ForecastSubFrame) {
            const projection = this.uiProjections[this.frameIndex];
            const subFrame = projection.frames[this.selectionPosition[1]].subFrames[this.selectionPosition[0]];
            this.onSubFrameCellClicked(subFrame, projection.variable, this.selectionPosition[0], this.selectionPosition[1], this.frameIndex);

        }

        // Scroll the parent (spreadsheet) if needed in order to show the newly selected frame
        setTimeout(() => {
            let selectedElem;
            let selectedElems = this.spreadsheet.nativeElement.getElementsByClassName('is-clickable selected');
            if (selectedElems === undefined || selectedElems.length === 0) {
                selectedElems = this.spreadsheet.nativeElement.getElementsByClassName('subframe-cell selected');
                if (selectedElems !== undefined && selectedElems.length > 0) {
                    selectedElem = selectedElems[0];
                }
            } else {
                selectedElem = selectedElems[0].parentElement;
            }
            if (selectedElem !== undefined) {
                const cornerstone = (this.spreadsheet.nativeElement.getElementsByClassName('cornerstone'))[0];

                const contHeight = this.spreadsheet.nativeElement.clientHeight - cornerstone.offsetHeight;
                const contTop = this.spreadsheet.nativeElement.scrollTop;
                const contWidth = this.spreadsheet.nativeElement.clientWidth - cornerstone.offsetWidth;
                const contLeft = this.spreadsheet.nativeElement.scrollLeft;

                const elemTop = selectedElem.offsetTop - cornerstone.offsetHeight;
                const elemBottom = selectedElem.offsetTop + selectedElem.clientHeight - cornerstone.offsetHeight;
                const elemLeft = selectedElem.offsetLeft - cornerstone.offsetWidth;
                const elemRight = selectedElem.offsetLeft + selectedElem.clientWidth - cornerstone.offsetWidth;

                if (elemTop < contTop) {
                    this.spreadsheet.nativeElement.scrollTop = elemTop;
                } else if (elemBottom > contHeight + contTop) {
                    this.spreadsheet.nativeElement.scrollTop = (elemBottom - contHeight);
                }
                if (elemLeft < contLeft) {
                    this.spreadsheet.nativeElement.scrollLeft = elemLeft;
                } else if (elemRight > contWidth + contLeft) {
                    this.spreadsheet.nativeElement.scrollLeft = (elemRight - contWidth);
                }
            }
        }, 0);

    }


    /**
     * Checks if the frame at the specified coordinates is a selectable on (ie it belongs to a variable of type real/integer)
     * If it is not a selectable frame (ie if it belongs to a breakdown variable), it skips that row and tries the next one.
     * If the top/end of the spreadsheet is reached, no coordinates are returned.
     * @param frameCoordinates the starting coordinates of the frame that is to be checked if its selectable
     * @param event the keypress event which is used to determine the direction of the skips
     */
    _getNextSelectableFrame(frameCoordinates: number[], event): number[] {
        if (this.selection[0] instanceof ForecastFrame) {
            while ((frameCoordinates[0] >= 0 && frameCoordinates[0] <= Object.keys(this.uiProjections).length - 1)) {
                return frameCoordinates;
            }
        } else if (this.selection[0] instanceof ForecastSubFrame) {
            while ((frameCoordinates[0] >= 0 && frameCoordinates[0] <= Object.keys(this.uiProjections[this.frameIndex].subframeNames).length - 1)) {
                return frameCoordinates;
            }
        }
        return;
    }

    /**
    * Changeds the defiend width of the first column of the spreadsheet by setting
    * the property that the th eleement of the first column is bound to
    * @param width the new width that the first column is to have
    */
    handleColumnResize(width) {
        this.leftColumnStyle = width;
    }

    onUpdateVariable(variable) {
        this.variableUpdated.emit(variable);
    }

    onUpdateVariableTitle(variable) {
        this.variableTitleUpdated.emit(variable);
    }

    onDeleteVariable(variable) {
        this.variableDeleted.emit(variable);
    }

    processingVariableCreation(newVariableTitle) {
        let color = Utils.getColor();
        if (this.variableList.length > 0) {
            const previousVariable = this.variableList[this.variableList.length - 1];
            color = Utils.getColor(previousVariable.content ? previousVariable.content.color : previousVariable.variableModel.color);
        }
        const variable = {
            'title': newVariableTitle,
            'description': '',
            'variableType': 'INTEGER',
            'unit': null,
            'color': color
        };

        this.variableCreated.emit(variable);
    }


    getVariable(varId) {
        return this.variableList.find(x => x.id === varId);
    }

    /**
     * emits the actual value along with the variable and date that the actual value belongs to
     * @param actualValue the actual value to be saved
     * @param variable the variable that is to contain the actual value changes
     * @param date the date which the new actual value relates to
     */
    onUpsertActualValue(actualValue, variable, date) {
        const upsertData = {
            value: actualValue,
            variable: variable,
            date: date
        };
        this.actualValueUpserted.emit(upsertData);
    }

    /**
     * emits the timesegment changes along with the variable and date that the timesegment starts
     * @param timesegment the timesegment changes to be saved
     * @param variable the variable that is to contain the timesegment changes
     * @param date the date which the timesegment starts
    */
    onUpsertTimesegment(timesegment, variable, date) {
        const upsertData = {
            timesegment: timesegment,
            variable: variable,
            date: date
        };
        this.timesegmentUpserted.emit(upsertData);
    }

    onUpsertSubframe(subframeValue, frame, variable, subframeName) {
        const subframeData = {
            subframeValue: subframeValue,
            frame: frame,
            variable: variable,
            subframeName: subframeName
        };
        this.subframeUpserted.emit(subframeData);
    }

    /**
     * Checks if a date is earlier than the current date
     * @param date the date to checked
     */
    isInPast(date: string): boolean {
        return (moment().startOf('month').diff(moment(date)) > 0);
    }

    /**
     * Adds a frame to the list of currently selected frames
     * @param frame the frame object received from the click event emitted by the frame cell
     * @param variable the variable that the frame is associated with
     * @param rowIndex the row index in the table that the frame is located
     * @param colIndex the column index in the table that the frame is located
     */
    onFrameCellClicked(frame: Frame, variable, rowIndex, colIndex) {
        if (!this.selection.includes(frame)) {
            this.selection.splice(0, this.selection.length);
            this.selection.push(frame);
        }
        this.selectedVar = variable;
        this.selectionPosition = [rowIndex, colIndex];
        this.store.dispatch(new ClickedVariableCell({ sheetId: this.sheetId, variableId: this.selectedVar.id, date: 'now' }));

    }

    onFrameCellDoubleClicked() {
        this.frameCellComponents.forEach((frame) => {
            frame.ableToOpen = !this.showEdit;
        });
    }

    /**
     * Adds a subframe to the list of currently selected subframes
     * @param subframe the subframe object received from the click event emitted by the subframe cell
     * @param variable the variable that the subframe is associated with
     * @param rowIndex the row index in the table that the subframe is located
     * @param colIndex the column index in the table that the subframe is located
     * @param projectionIndex the index of the frame that subframe is associated with
     */
    onSubFrameCellClicked(subframe: Frame, variable, rowIndex, colIndex, projectionIndex) {
        this.frameIndex = projectionIndex;
        if (!this.selection.includes(subframe)) {
            this.selection.splice(0, this.selection.length);
            this.selection.push(subframe);
        }
        this.selectedVar = variable;
        this.selectionPosition = [rowIndex, colIndex];
    }

    onSubFrameCellDoubleClicked() {

    }

    onSubFrameEnterEdit() {
        this.editingSubFrame = true;
    }

    onSubFrameLeaveEdit() {
        this.editingSubFrame = false;
    }

    // FIXME: find a better way to pass subframe value into subframe cell
    getSubFrame(frame: ForecastFrame, subframeName: string): ForecastSubFrame {
        const subFrame = frame.subFrames.find(subframe => subframe.name === subframeName);
        return subFrame;
    }

    isSelected(frame, subframeName) {
        const subframe = this.getSubFrame(frame, subframeName) as any;
        return this.selection.filter(selected => selected.name === subframe.name && selected.date === subframe.date && selected.variable.id === subframe.variable.id).length > 0;
    }

    clearFrameSelection() {
        this.selection.splice(0, this.selection.length);
    }

    /**
     * Emit event for pasting and data from selected Frame
     * @param date is the date to start pasting
     * @param variable is the determined variable get from projections
     */
    pastingEvent(event) {
        const tempEvent = event as any;
        const clipboardText = tempEvent.clipboardData.getData('text') as String;
        const values = clipboardText.replace(/,/g, '').split('\t');
        const pastingData = {
            values: values,
            selection: this.selection[0],
            variable: this.selectedVar,
        };
        this.valuePasted.emit(pastingData);
    }

    hideEditor() {
        this.showEdit = false;
    }

    /**
     * listens for a delete button press and emits an event whenever this occurs
     */
    @HostListener('document:keydown.delete', ['$event'])
    @HostListener('document:keydown.backspace', ['$event'])
    onDeletePressed() {
        if (!this.showEdit && this.selection.length > 0 && this.processInput) {
            const selection = this.selection[0];
            if (selection instanceof ForecastFrame) {
                this.deleteFrame(selection);
            } else if (selection instanceof ForecastSubFrame) {
                this.deleteSubFrame(selection);
            }
        }
    }

    deleteFrame(frame: ForecastFrame): void {
        const date = frame.date;
        if (this.isInPast(date) && frame.timeSegment && frame.actualValue !== undefined) {
            this._el.nativeElement.getElementsByClassName('btnDeleteConfirmation')[0].click();
        } else if (this.isInPast(date) && !frame.timeSegment && frame.actualValue !== undefined) {
            this.deleteValue('actual');
        } else {
            this.deleteValue('projected');
        }
    }

    deleteSubFrame(subFrame: ForecastSubFrame): void {
        const variable = subFrame.variable;
        const timeSegmentToDelete = variable.timeSegments.find(seg => seg.date === subFrame.date);
        if (timeSegmentToDelete) {
            variable.content.timeSegments = variable.content.timeSegments.filter(seg => seg !== timeSegmentToDelete);
            this.variableUpdated.emit(variable);
        }
    }

    /**
     * delete projected or actual values or both
     * @param valueType
     */
    deleteValue(valueType?) {
        // If user click to button to delete projected on modal
        // Or frame only have projected value
        if (valueType === 'projected') {
            if (this.selection[0].timeSegment && this.selection[0].frame.date === this.selection[0].timeSegment.date) {
                // filter timesegment
                this.selectedVar.content.timeSegments = this.selectedVar.content.timeSegments.filter(seg => seg.date !== this.selection[0].frame.date);
                this.variableUpdated.emit(this.selectedVar);
            }
        } else if (valueType === 'actual') {
            // If user click to button to delete actual on modal
            // Or frame only have actual value
            if (this.selectedVar.content.actuals && this.selection[0].actualValue !== undefined) {
                // filter actual
                this.selectedVar.content.actuals = this.selectedVar.content.actuals.filter(act => act.date !== this.selection[0].frame.date);
                this.variableUpdated.emit(this.selectedVar);
            }
        } else {
            // if user clicks to button to delete both actual and projected values
            if (this.selection[0].timeSegment && this.selection[0].frame.date === this.selection[0].timeSegment.date) {
                this.selectedVar.content.timeSegments = this.selectedVar.content.timeSegments.filter(seg => seg.date !== this.selection[0].frame.date);
            }
            if (this.selectedVar.content.actuals && this.selection[0].actualValue !== undefined) {
                this.selectedVar.content.actuals = this.selectedVar.content.actuals.filter(act => act.date !== this.selection[0].frame.date);
            }
            this.variableUpdated.emit(this.selectedVar);
        }
    }

    /**
     * Determines if a frame is currently selected ie if the cell the frame belongs to should be highlighted
     * @param frame the frame that is to be checked
     */
    isSelectedCell(frame: ForecastFrame) {
        const selection = this.selection[0];
        if (selection === undefined || selection instanceof ForecastSubFrame) {
            return false;
        }
        return frame.variable.id === selection.variable.id && frame.date === selection.date && !this.showEdit;
    }

    onShowEdit(showEdit) {
        this.showEdit = showEdit;
    }

}
