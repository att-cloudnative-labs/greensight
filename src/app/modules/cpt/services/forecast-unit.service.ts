import { Injectable } from '@angular/core';
import { ForecastVariableUnit } from '../models/forecast-variable-unit';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Utils } from '@app/modules/cpt/lib/utils';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class ForecastUnitService {
    constructor(private http: HttpClient) { }

    baseUrl = Utils.createUrl('variableUnit');

    getForecastVariableUnits(): Observable<ForecastVariableUnit[]> {
        return this.http
            .get<[]>(`${this.baseUrl}/`, this.httpOptions)
            .pipe(catchError((error: any) => Observable.throw(error.json())));
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
