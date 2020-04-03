import { Component, Input, EventEmitter, Output, OnInit, ViewChild } from '@angular/core';
import { Store } from '@ngxs/store';
import { Moment, unix } from 'moment';
import { Utils } from '@app/modules/cpt/lib/utils';
import * as treeActions from '@app/modules/cpt/state/tree.actions';
import { DatePickerDirective } from 'ng2-date-picker';
import { ModalDialogService } from '@app/modules/cpt/services/modal-dialog.service';

@Component({
    selector: 'app-forecast-sheet-control-bar',
    templateUrl: './forecast-sheet-control-bar.component.html',
    styleUrls: ['./forecast-sheet-control-bar.component.css']
})
export class ForecastSheetControlBarComponent implements OnInit {
    @Input() forecastNode;
    @Input() uiProjections;
    @Input() releaseNr: number;
    @Input() nodeId: string;
    @Output('exportForecastCSV') exportForecastCSV = new EventEmitter();
    @Output('disableClick') disableClick = new EventEmitter();
    @Output('hiddenVariableIds') hiddenVariableIds = new EventEmitter<string[]>();
    @Output('newDatesReadOnly') newDatesReadOnly = new EventEmitter();

    @ViewChild('endDateFc', { static: false }) endDatePickerDirective: DatePickerDirective;
    @ViewChild('startDateFc', { static: false }) startDatePickerDirective: DatePickerDirective;


    datePickerConfig = { format: Utils.getDateFormat() };

    startDate: Moment;
    endDate: Moment;
    minStartDate: Moment = unix(new Date().getTime() / 1000);
    // Used to revert start date and end date back to last valid selections
    lastValidStartDate: Moment;
    lastValidEndDate: Moment;

    get readonly() {
        return !!this.releaseNr;
    }

    constructor(private store: Store, private modal: ModalDialogService) { }

    ngOnInit() {
        this.initDates();
    }


    initDates() {
        const currentDate = new Date();
        currentDate.setDate(1);
        currentDate.setHours(0, 0, 0, 0);
        // Use default start date if none found in local storage
        if (Utils.getForecastStartDate() === undefined) {
            this.minStartDate = unix(currentDate.getTime() / 1000).add(-2, 'months');
            this.startDate = this.minStartDate;
        } else {
            const storedStartDate = new Date(Utils.getForecastStartDate());
            storedStartDate.setDate(1);
            storedStartDate.setHours(0, 0, 0, 0);
            this.minStartDate = unix(storedStartDate.getTime() / 1000);
            this.startDate = this.minStartDate;
        }
        // Use default end date if none found in local storage
        if (Utils.getForecastEndDate() === undefined) {
            this.endDate = unix(currentDate.getTime() / 1000).add(10, 'months');
        } else {
            const storedEndDate = new Date(Utils.getForecastEndDate());
            storedEndDate.setDate(1);
            storedEndDate.setHours(0, 0, 0, 0);
            this.endDate = unix(storedEndDate.getTime() / 1000);
        }


        this.lastValidStartDate = this.startDate;
        Utils.setForecastStartDate(this.startDate);
        this.lastValidEndDate = this.endDate;
    }

    onExportForecast() {
        // to add the dat for start and end date
        this.exportForecastCSV.emit({ 'startDate': this.startDate.format('YYYY-MM'), 'endDate': this.endDate.format('YYYY-MM') });
    }

    setDisableClick(disableClick) {
        this.disableClick.emit(disableClick);
    }

    updateHiddenVariableIds(hiddenVariables: string[]) {
        this.hiddenVariableIds.emit(hiddenVariables)
    }


    onStartDateChange(event) {
        // Move the calendar view to the selected start year instead of the current year
        if ($('#startDateFc div > div > input').is(':focus')) {
            this.startDatePickerDirective.api.moveCalendarTo(this.startDate.format('MM-YYYY'));
        }

        // Adjust projection dates on new date selected only
        if (event.target.dataset.date != null) {
            // Deal with same month selection bug
            if (event.target.dataset.date === this.lastValidStartDate.format('MM-YYYY')) {
                this.startDate = this.lastValidStartDate;
            } else {
                // Ensure that the selected start date is not after the end date
                if (this.startDate.isAfter(this.endDate)) {
                    this.modal.showError('The start date cannot be greater than end date. Please select a valid start date.');
                    this.startDate = this.lastValidStartDate;
                } else {
                    this.lastValidStartDate = this.startDate;
                    Utils.setForecastStartDate(this.startDate);
                    // this.startDateChange.emit(this.startDate);
                    if (this.readonly) {
                        this.newDatesReadOnly.emit();
                    } else {
                        this.store.dispatch(new treeActions.FCSheetStartDateChanged({
                            nodeId: this.forecastNode.id,
                            startDate: this.startDate
                        }));
                    }
                }
            }
        }
    }

    onEndDateChange(event) {
        // Move the calendar view to the selected end year instead of the current year
        if ($('#endDateFc div > div > input').is(':focus')) {
            this.endDatePickerDirective.api.moveCalendarTo(this.endDate.format('MM-YYYY'));
        }
        // Adjust projection dates on new date selected only
        if (event.target.dataset.date != null) {
            // Deal with same month selection bug
            if (event.target.dataset.date === this.lastValidEndDate.format('MM-YYYY')) {
                this.endDate = this.lastValidEndDate;
            } else {
                // Ensure that the selected end date is not before the start date
                if (this.endDate.isBefore(this.startDate)) {
                    this.modal.showError('The end date cannot be less than start date. Please select a valid end date.');
                    this.endDate = this.lastValidEndDate;
                } else {
                    this.lastValidEndDate = this.endDate;
                    Utils.setForecastEndDate(this.endDate);
                    // this.endDateChange.emit(this.endDate);
                    if (this.readonly) {
                        this.newDatesReadOnly.emit();
                    } else {
                        this.store.dispatch(new treeActions.FCSheetEndDateChanged({
                            nodeId: this.forecastNode.id,
                            endDate: this.endDate
                        }));
                    }
                }
            }
        }
    }
}
