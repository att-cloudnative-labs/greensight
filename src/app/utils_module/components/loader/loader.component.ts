import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { LoaderService } from '../../../core_module/service/loader.service';
import { LoaderState } from '../../../core_module/interfaces/loaderstate';

@Component({
    selector: 'app-loader',
    templateUrl: './loader.component.html',
    styleUrls: ['./loader.component.css']
})
export class LoaderComponent implements OnInit, OnDestroy {
    show = false;
    private subscription: Subscription;

    constructor(
        private loaderService: LoaderService
    ) {
        console.log('Loader component started...');
    }

    ngOnInit() {
        this.subscription = this.loaderService.loaderState
            .subscribe((state: LoaderState) => {
                this.show = state.show;
            });
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }
}
