import { Http } from '@angular/http';
import { LoaderService } from './loader.service';
import { Utils } from '../../utils_module/utils';
import { Injectable } from '@angular/core';

@Injectable()
export class VariableUnitService {
    constructor(
        private http: Http,
        private loaderService: LoaderService) { }

    // get all variableUnits
    getVariableUnits() {
        this.loaderService.show();
        const url = Utils.createUrl(Utils.routeVariableUnit);
        return this.http
            .get(url, Utils.getRequestOptions())
            .map(result => {
                this.loaderService.hide();
                return result.json();
            });
    }

    // create a custom variable unit
    createVariableUnit(title: string, isCustom: boolean) {
        this.loaderService.show();
        const url = Utils.createUrl(Utils.routeVariableUnit);
        const body = { title: title, isCustom };

        return this.http
            .post(url, body, Utils.getRequestOptions())
            .map(result => {
                this.loaderService.hide();
                return result.json();
            });
    }

    // get details of a specific variable unit
    getUnitDetails(id: String) {
        this.loaderService.show();
        const url = Utils.createUrl(Utils.routeVariableUnit) + '/' + id;
        return this.http
            .get(url, Utils.getRequestOptions())
            .map(result => {
                this.loaderService.hide();
                return result.json();
            });
    }

    // update variable unit
    updateVariableUnit(id: string, title: string, isCustom: boolean) {
        this.loaderService.show();
        const url = Utils.createUrl(Utils.routeVariableUnit) + '/' + id;

        const body = { id: id, title: title, isCustom };
        //  console.log(body);
        return this.http
            .put(url, body, Utils.getRequestOptions())
            .map(result => {
                this.loaderService.hide();
                return result.json();
            });
    }

    // delete variable unit
    deleteVariableUnit(id) {
        this.loaderService.show();
        const url = Utils.createUrl(Utils.routeVariableUnit) + '/' + id;
        return this.http
            .delete(url, Utils.getRequestOptions())
            .map(result => {
                this.loaderService.hide();
                return result.json();
            });
    }
}
