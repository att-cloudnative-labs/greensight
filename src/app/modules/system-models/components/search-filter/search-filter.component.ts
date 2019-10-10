import { Component, OnInit } from '@angular/core';
import { Store, Select } from '@ngxs/store';
import { LibraryState } from '@system-models/state/library.state';
import { Observable } from 'rxjs';
import * as libraryActions from '@system-models/state/library.actions';

@Component({
    selector: 'app-search-filter',
    templateUrl: './search-filter.component.html',
    styleUrls: ['./search-filter.component.css']
})
export class SearchFilterComponent implements OnInit {
    @Select(LibraryState.searchString) searchString$: Observable<string>;

    constructor(private store: Store) { }

    ngOnInit() {

    }

    onSearchChange(event) {
        this.store.dispatch(new libraryActions.UpdateSearchString(event.target.value));
    }
}
