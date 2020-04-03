import { Component, ViewChild, Input, OnChanges } from '@angular/core';
import { ModalDialogService } from '@cpt/services/modal-dialog.service';
import { DatePickerDirective } from 'ng2-date-picker';
import { Moment, unix } from 'moment';
import * as moment from 'moment';
import * as simulationActions from '@cpt/state/simulation.actions';
import { Store } from '@ngxs/store';
import { Utils } from "@cpt/lib/utils";


@Component({
    selector: 'app-simulation-timeline',
    templateUrl: './simulation-timeline.component.html',
    styleUrls: ['./simulation-timeline.component.css']
})
export class SimulationTimelineComponent implements OnChanges {

    @ViewChild('endDateSim', { static: false }) endDatePickerDirective: DatePickerDirective;
    @ViewChild('startDateSim', { static: false }) startDatePickerDirective: DatePickerDirective;
    @Input() simulation;

    datePickerConfig = { format: Utils.getDateFormat() };
    minStartDate: Moment = unix(new Date().getTime() / 1000);
    startDate: Moment;
    endDate: Moment;
    lastValidStartDate: Moment;
    lastValidEndDate: Moment;

    constructor(private modal: ModalDialogService,
        private store: Store) { }


    ngOnChanges() {
        if (this.simulation) {
            this.startDate = moment(this.simulation.content.stepStart, 'YYYY-MM');
            this.endDate = moment(this.simulation.content.stepLast, 'YYYY-MM');
            this.lastValidStartDate = this.startDate;
            this.lastValidEndDate = this.endDate;
        }
    }
    onStartDateChange(event) {
        // Move the calendar view to the selected start year instead of the current year
        if ($('#startDateSim div > div > input').is(':focus')) {
            this.startDatePickerDirective.api.moveCalendarTo(this.startDate.format('MM-YYYY'));
        }

        // Adjust dates on new date selected only
        if (event.target.dataset.date != null) {
            // Deal with same month selection
            if (event.target.dataset.date === this.lastValidStartDate.format('MM-YYYY')) {
                this.startDate = this.lastValidStartDate;
            } else {
                // Ensure that the selected start date is not after the end date
                if (this.startDate.isAfter(this.endDate)) {
                    this.modal.showError('The start date cannot be greater than end date. Please select a valid start date.');
                    this.startDate = this.lastValidStartDate;
                } else {
                    this.store.dispatch(new simulationActions.StartDateUpdated(
                        {
                            simulationId: this.simulation.id,
                            stepStart: this.startDate.format('YYYY-MM')
                        })
                    );

                }
            }
        }
    }

    onEndDateChange(event) {
        // Move the calendar view to the selected end year instead of the current year
        if ($('#endDateSim div > div > input').is(':focus')) {
            this.endDatePickerDirective.api.moveCalendarTo(this.endDate.format('MM-YYYY'));
        }

        // Adjust dates on new date selected only
        if (event.target.dataset.date != null) {
            // Deal with same month selection
            if (event.target.dataset.date === this.lastValidEndDate.format('MM-YYYY')) {
                this.endDate = this.lastValidEndDate;
            } else {
                // Ensure that the selected end date is not before the start date
                if (this.endDate.isBefore(this.startDate)) {
                    this.modal.showError('The end date cannot be less than start date. Please select a valid end date.');
                    this.endDate = this.lastValidEndDate;
                } else {
                    this.store.dispatch(new simulationActions.EndDateUpdated(
                        {
                            simulationId: this.simulation.id,
                            stepLast: this.endDate.format('YYYY-MM')
                        })
                    );
                }
            }
        }
    }

}
