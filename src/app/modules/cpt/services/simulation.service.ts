import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Utils } from '@app/modules/cpt/lib/utils';
import { Simulation } from '../models/simulation';
import { ModalDialogService } from '@app/modules/cpt/services/modal-dialog.service';

@Injectable()
export class SimulationService {
    constructor(private http: HttpClient, private modalDialog: ModalDialogService,
    ) {
    }

    baseUrl = Utils.createSimulationUrl('simulation');

    createSimulation(id, version) {
        return this.http
            .post<Simulation>(`${this.baseUrl}/${id}/run?v=${version}`, id, this.httpOptions)
            .pipe(map((response: any) => {
                const data = response.data;
                return data;
            }),
                catchError((error: any) => Observable.throw(this.popUpError(error))));
    }

    get httpOptions() {
        return {
            headers: new HttpHeaders({
                'Content-Type': 'application/json',
                'Authorization': Utils.getToken()
            })
        };
    }

    popUpError(error) {
        console.log(error);
        if (error.status === 0 || error.status === 404) {
            this.modalDialog.showError('Simulation service could not be reached. Please contact your system administrator.');
        } else {
            this.modalDialog.showError('You do not have permission to create a simulation.');
        }
    }

}
