import { Component, Input, OnInit } from '@angular/core';

@Component({
    selector: 'app-sr-error-warning-item',
    templateUrl: './sr-error-warning-item.component.html',
    styleUrls: ['./sr-error-warning-item.component.css']
})
export class SrErrorWarningItemComponent implements OnInit {
    @Input() result;
    errorWarningIcon;
    ICONS = {
        'WARNING': 'fa-cube',
        'ERROR': 'fa-times'
    };

    ngOnInit() {
        this._getErrorWarningIcon();
    }

    /**
   * TODO: hard-coding error and warning PEs for now. Prob need a better solution for getting the icons
   */
    _getErrorWarningIcon() {
        if (this.result.ref === '41c22bcb-f966-406a-8814-a7b8e187b508') {
            this.errorWarningIcon = 'fa-times';
        } else {
            this.errorWarningIcon = 'fa-exclamation-triangle';
        }
    }
}
