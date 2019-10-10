import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { Branch } from '../../../../interfaces/branch';
import { Config } from '../../../../service/config';
import { Moment, unix } from 'moment';
import * as moment from 'moment';
import { VariableProjections } from '@cpt/capacity-planning-projection/lib';
import { DatePickerDirective } from 'ng2-date-picker';
import { ModalDialogService } from '../../../../service/modal-dialog.service';
import { Utils } from '../../../../../utils_module/utils';

@Component({
    selector: 'forecast-sidebar',
    templateUrl: './forecast.sidebar.component.html',
    styleUrls: ['./forecast.sidebar.component.css']
})
export class ForecastSidebarComponent implements OnInit, AfterViewInit {
    @ViewChild('endDateFc') endDatePickerDirective: DatePickerDirective;
    @ViewChild('startDateFc') startDatePickerDirective: DatePickerDirective;
    @ViewChild('groupDateRange') groupDateRangeRef: ElementRef;
    @Input('expanded') expanded: Boolean;
    @Input('currentBranch') currentBranch: Branch;
    @Input('uiProjections') uiProjections;
    @Input('variableList') variableList = [];
    @Input('branchList') branchList: Branch[] = Array<Branch>();
    @Output('datesInitialised') datesInitialised = new EventEmitter();
    @Output('branchChange') branchChange = new EventEmitter();
    @Output('startDateChange') startDateChange = new EventEmitter();
    @Output('endDateChange') endDateChange = new EventEmitter();
    @Output('displayChangesMade') onChanges = new EventEmitter();
    @Output('toggleDisplayLines') changeDisplayLines = new EventEmitter();
    @Output('exportForecastCSV') exportForecastCSV = new EventEmitter();

    isFC = true;

    datePickerConfig = { format: Config.getDateFormat() };
    startDate: Moment;
    endDate: Moment;
    minStartDate: Moment = unix(new Date().getTime() / 1000);
    // Used to revert start date and end date back to last valid selections
    lastValidStartDate: Moment;
    lastValidEndDate: Moment;

    isSaving: Boolean = false;

    constructor(private modal: ModalDialogService) {
    }

    ngOnInit() {
        this.initDates();
    }

    ngAfterViewInit() {
        setTimeout(() => {
            const datePickers = this.groupDateRangeRef.nativeElement.getElementsByClassName('dp-picker-input');
            // chk[0].style.margin = 'auto';
            for (let i = 0; i < datePickers.length; i++) {
                datePickers[i].style.fontSize = 'inherit';
            }
        }, 0);
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

        this.datesInitialised.emit({ 'startDate': this.startDate.format('YYYY-MM'), 'endDate': this.endDate.format('YYYY-MM') });

        this.lastValidStartDate = this.startDate;
        Utils.setForecastStartDate(this.startDate);
        this.lastValidEndDate = this.endDate;
    }

    /**
     * Updates the selected forecast version lets other functions know of this change
     * @param branch the newly selected forecast branch
     */
    onBranchChanged(branch: Branch) {
        this.branchChange.emit(branch);
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
                    this.startDateChange.emit(this.startDate);
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
                    this.endDateChange.emit(this.endDate);
                }
            }
        }
    }

    displayChanged() {
        this.onChanges.emit();
    }

    // toggleSave() {
    //     this.isSaving = !this.isSaving;
    // }

    toggleDisplayLines(displayLines) {
        this.changeDisplayLines.emit(displayLines);
    }

    /**
     * Inidicates that the forecast is to be exported as a CSV file.
     */
    onExportForecast() {
        this.exportForecastCSV.emit({ 'startDate': this.startDate.format('YYYY-MM'), 'endDate': this.endDate.format('YYYY-MM') });
    }
}
