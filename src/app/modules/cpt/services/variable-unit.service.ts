import { Utils } from '@app/modules/cpt/lib/utils';
import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { ApiResult } from "@app/modules/cpt/interfaces/api-result";

@Injectable()
export class VariableUnitService {
    constructor(
        private http: HttpClient, ) { }

    // get all variableUnits
    getVariableUnits() {
        const url = Utils.createUrl(Utils.routeVariableUnit);
        return this.http
            .get<ApiResult<any>>(url, Utils.httpOptions);
    }

    // create a custom variable unit
    createVariableUnit(title: string, isCustom: boolean) {
        const url = Utils.createUrl(Utils.routeVariableUnit);
        const body = { title: title, isCustom };

        return this.http
            .post<ApiResult<any>>(url, body, Utils.httpOptions);
    }

    // delete variable unit
    deleteVariableUnit(id) {
        const url = Utils.createUrl(Utils.routeVariableUnit) + '/' + id;
        return this.http
            .delete<ApiResult<any>>(url, Utils.httpOptions);
    }
}
