import { Component, OnInit, Input } from '@angular/core';
import { Store } from '@ngxs/store';

import { DockableViewportComponent } from '../dockable-viewport/dockable-viewport.component';
import { Split } from '@system-models/state/layout.state';
import * as layoutActions from '@system-models/state/layout.actions';

@Component({
    selector: 'app-dockable-split',
    templateUrl: './dockable-split.component.html',
    styleUrls: ['./dockable-split.component.css']
})
export class DockableSplitComponent implements OnInit {
    @Input() split: Split;
    @Input() parentId: string;

    constructor(private store: Store) { }

    ngOnInit() {
    }

    onSplitDragEnd(e: { gutterNum: number, sizes: number[] }) {
        this.store.dispatch(new layoutActions.SplitDragEnd({
            splitId: this.split.id,
            sizes: e.sizes
        }));
    }

    trackById(_, item) {
        return item.id;
    }
}
