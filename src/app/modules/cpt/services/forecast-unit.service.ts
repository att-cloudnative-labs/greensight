import { Injectable } from '@angular/core';
import { ForecastVariableUnit } from '../models/forecast-variable-unit';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Utils } from '@app/modules/cpt/lib/utils';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiResult } from '@cpt/interfaces/api-result';

@Injectable()
export class ForecastUnitService {
    constructor(private http: HttpClient) { }

    baseUrl = Utils.createUrl('variableUnit');

    getForecastVariableUnits(): Observable<ForecastVariableUnit[]> {
        return this.http
            .get<ApiResult<ForecastVariableUnit[]>>(`${this.baseUrl}/`, this.httpOptions)
            .pipe(map(r => r.data));
    }

    get httpOptions() {
        return {
            headers: new HttpHeaders({
                'Content-Type': 'application/json',
                'Authorization': Utils.getToken()
            })
        };
    }
}
