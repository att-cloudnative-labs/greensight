import { Utils } from '../lib/utils';
import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { ApiResult } from "@app/modules/cpt/interfaces/api-result";

@Injectable()
export class VersionService {
    constructor(
        private http: HttpClient, ) { }

    public getBackendVersion() {
        const url = Utils.createModelUrl(Utils.routeModelVersion);
        return this.http
            .get<ApiResult<any>>(url, Utils.httpOptions)

    }

    public getSimBackendVersion() {
        const url = Utils.createSimulationUrl(Utils.routeSimVersion);
        return this.http
            .get<ApiResult<any>>(url, Utils.httpOptions)
    }
}
