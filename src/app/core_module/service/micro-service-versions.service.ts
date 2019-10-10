import { Utils } from '../../utils_module/utils';
import { Injectable } from '@angular/core';
import { Http, Response, RequestOptions, Headers } from '@angular/http';
import { LoaderService } from './loader.service';

@Injectable()
export class VersionService {
    constructor(
        private http: Http,
        private loaderService: LoaderService) { }

    public getForecastBackendVersion() {
        this.loaderService.show();
        const url = Utils.createUrl(Utils.routeForecastVersion);
        return this.http
            .get(url, Utils.getRequestOptions())
            .map(result => {
                this.loaderService.hide();
                return result.json();
            });
    }

    public getModelBackendVersion() {
        this.loaderService.show();
        const url = Utils.createModelUrl(Utils.routeModelVersion);
        return this.http
            .get(url, Utils.getRequestOptions())
            .map(result => {
                this.loaderService.hide();
                return result.json();
            });
    }

    public getSimBackendVersion() {
        this.loaderService.show();
        const url = Utils.createSimulationUrl(Utils.routeSimVersion);
        return this.http
            .get(url, Utils.getRequestOptions())
            .map(result => {
                this.loaderService.hide();
                return result.json();
            });
    }
}
