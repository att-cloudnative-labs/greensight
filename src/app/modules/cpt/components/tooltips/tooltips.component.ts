import { Component, Input, HostListener, AfterViewInit, OnInit } from '@angular/core';

@Component({
    selector: 'tooltips',
    templateUrl: './tooltips.component.html',
    styleUrls: ['./tooltips.component.css']
})

export class TooltipsComponent {
    testTooltip: String = 'Displays graphical and tabular forecast data of your project as well as the ability to add an edit variables';
    tooltips = new Map([
        // forecast.graphical.component
        ['start', 'Show forecast data beginning with this date'],
        ['end', 'Show forecast data ending with this date'],
        ['breakdown1', 'Click to show or hide breakdown lines'],
        ['distribution', 'Click to show or hide distribution lines'],
        ['type', 'Variable type'],
        ['graph', 'Click to show or hide graph display'],
        ['table', 'Click to show or hide table display'],
        // home.component
        ['system-model', 'View or edit graphical and tabular forecast data & system architecture model'],
        ['simulation', 'Schedule simulations and view simulation results'],
        // navigationbar.component
        ['cpt', 'Return to home page'],
        // variables.component
        ['assocBreakdown', 'Choose a defined breakdown variable to apply to current variable'],
        ['vartype', 'Select type of variable'],
        ['variable', 'General purpose variables'],
        ['breakdown2', 'Percentage breakdowns that can be applied to another general purpose variable'],
        ['unit', 'Unit of the variable. Options can be defined in settings page']
    ]);

    showTooltip(event) {
        const result = event.toString();
        return this.tooltips.get(result);
    }


}
