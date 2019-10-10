import { Component, OnInit, Input } from '@angular/core';

@Component({
    selector: 'app-sr-variable-picker',
    templateUrl: './sr-variable-picker.component.html',
    styleUrls: ['./sr-variable-picker.component.css']
})
export class SrVariablePickerComponent implements OnInit {
    @Input() simResult;
    @Input() selectedScenarioId;
    @Input() simResultId;
    selectedTab;

    ngOnInit() {
        this.selectedTab = 'tree';
    }

    onTabClick(tabName: string) {
        this.selectedTab = tabName;
    }

}
