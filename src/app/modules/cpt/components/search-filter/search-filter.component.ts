import { Component, OnInit } from '@angular/core';
import { Store, Select } from '@ngxs/store';
import { LibraryState } from '@app/modules/cpt/state/library.state';
import { Observable } from 'rxjs';
import * as libraryActions from '@app/modules/cpt/state/library.actions';

@Component({
    selector: 'app-search-filter',
    templateUrl: './search-filter.component.html',
    styleUrls: ['./search-filter.component.css']
})
export class SearchFilterComponent implements OnInit {
    @Select(LibraryState.searchString) searchString$: Observable<string>;

    searchTerm = '';
    constructor(private store: Store) { }

    ngOnInit() {
        // this resets the search input field when the search string
        // in the library states gets reset by a third party
        this.searchString$.subscribe(librarSearchString => {
            if (librarSearchString.trim().length < 1) {
                this.searchTerm = '';
            }
        });

    }

    onSearchChange(event) {
        this.store.dispatch(new libraryActions.UpdateSearchString(event.target.value));
    }
}
