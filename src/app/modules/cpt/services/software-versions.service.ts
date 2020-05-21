import { Utils } from '../lib/utils';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiResult } from '@app/modules/cpt/interfaces/api-result';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable()
export class VersionService {
    constructor(
        private http: HttpClient, ) { }

    public getBackendVersion(): Observable<BackendSoftwareInfo> {
        const url = Utils.createModelUrl(Utils.routeModelVersion);
        return this.http
            .get<ApiResult<BackendSoftwareInfo>>(url, Utils.httpOptions).pipe(map(result => result.data));
    }

    public getSimBackendVersion(): Observable<SimulationSoftwareInfo> {
        const url = Utils.createSimulationUrl(Utils.routeSimVersion);
        return this.http
            .get<SimulationSoftwareInfo>(url, Utils.httpOptions);
    }
}
