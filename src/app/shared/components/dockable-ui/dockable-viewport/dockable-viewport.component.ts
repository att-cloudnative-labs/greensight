import { Component, OnInit, Input } from '@angular/core';

@Component({
    selector: 'app-dockable-viewport',
    templateUrl: './dockable-viewport.component.html',
    styleUrls: ['./dockable-viewport.component.css']
})
export class DockableViewportComponent implements OnInit {
    @Input() layout;

    constructor() { }

    ngOnInit() {
    }

    trackById(_, item) {
        return item.id;
    }
}
