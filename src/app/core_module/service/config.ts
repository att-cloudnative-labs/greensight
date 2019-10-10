import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

@Injectable()
export class Config {
    constructor(private http: Http) { }

    private static KEY_DATE_FORMAT = 'KEY_DATE_FORMAT';

    public static getServerConfigurations() {

    }

    public static getDateFormat() {
        return 'MM-YYYY';
        // return localStorage[this.KEY_DATE_FORMAT];
    }

}
