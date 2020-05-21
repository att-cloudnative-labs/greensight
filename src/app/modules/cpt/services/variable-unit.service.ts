import { Utils } from '@app/modules/cpt/lib/utils';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiResult } from '@app/modules/cpt/interfaces/api-result';
import { Unit } from '@cpt/interfaces/unit';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable()
export class VariableUnitService {
    constructor(
        private http: HttpClient) { }

    // get all variableUnits
    getVariableUnits(): Observable<Unit[]> {
        const url = Utils.createUrl(Utils.routeVariableUnit);
        return this.http
            .get<ApiResult<Unit[]>>(url, Utils.httpOptions).pipe(map(result => result.data));
    }

    // create a custom variable unit
    createVariableUnit(title: string, isCustom: boolean): Observable<Unit> {
        const url = Utils.createUrl(Utils.routeVariableUnit);
        const body = { title: title, isCustom };
        return this.http
            .post<ApiResult<Unit>>(url, body, Utils.httpOptions).pipe(map(result => result.data));
    }

    // delete variable unit
    deleteVariableUnit(id) {
        const url = Utils.createUrl(Utils.routeVariableUnit) + '/' + id;
        return this.http
            .delete<ApiResult<void>>(url, Utils.httpOptions);
    }
}
