import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { Utils } from '@app/modules/cpt/lib/utils';
import { SimulationRunResult } from '../models/simulation';
import { ApiResult } from '@cpt/interfaces/api-result';
import { Observable } from 'rxjs';

@Injectable()
export class SimulationService {
    constructor(private http: HttpClient) { }

    baseUrl = Utils.createSimulationUrl('simulation');

    createSimulation(id, version): Observable<SimulationRunResult> {
        return this.http
            .post<ApiResult<SimulationRunResult>>(`${this.baseUrl}/${id}/run?v=${version}`, id, Utils.httpOptions)
            .pipe(map((response) => {
                return response.data;
            }));
    }
}
