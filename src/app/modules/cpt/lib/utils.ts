/* tslint:disable:no-bitwise */
import { environment } from '@environments/environment';
import { Moment, unix } from 'moment';
import * as moment from 'moment';
import { PercentileResult } from '../interfaces/PercentileResult';
import { renderProjectionsCsv } from '@cpt/capacity-planning-projection/lib/api';
import { HttpHeaders } from '@angular/common/http';
import { ProcessingElementProcess } from '@cpt/models/graph-model.model';
import { ProcessingElementRepository } from '@cpt/capacity-planning-simulation-pe-repository/lib';
const momentTz = require('moment-timezone');

export class Utils {

    // base url
    static baseUrl: String = environment.apiUrl;
    static modelBaseUrl: String = environment.modelApiUrl;
    static simulationBaseUrl: String = environment.simulationApiUrl;
    static version: string = environment.VERSION;
    static routeVariableUnit = 'variableUnit';
    static routeUser: String = 'user';
    static routeLogin: String = 'login';
    static routeUserGroup: String = 'userGroup';
    static routeModelVersion: String = 'version';
    static routeSimVersion: String = 'simulation/version';
    static routeLayout = 'layout';

    // Colors for projections
    static colors = [
        'rgb(54, 162, 235)',
        'rgb(209, 61, 209)',
        'rgb(255, 159, 64)',
        'rgb(75, 192, 192)',
        'rgb(153, 102, 255)',
        'rgb(255, 99, 132)',
        'rgb(255, 205, 86)',
        'rgb(201, 203, 207)',
        'rgb(209, 207, 61)',
        'rgb(209, 85, 61)',
        'rgb(157, 209, 61)',
        'rgb(68, 61, 209)',
        'rgb(240, 165, 26)',
        'rgb(26, 240, 129)',
        'rgb(118, 126, 214)',
        'rgb(188, 140, 222)',
        'rgb(179, 168, 86)',
        'rgb(232, 137, 173)',
        'rgb(61, 209, 182)',

    ];

    static importantProcessingElementIds = [
        'acbb16d9-1c4c-4930-a3b4-28a7c33b54e4', // add latency
        'bd96eec1-483b-44fe-a07b-11bb9141f02f', // sum
        '5a615ab0-8960-42e7-a99c-78e5c548bfda', // add aspect
        '"c6a9bfed-4949-4692-b5c3-3906f48bc9ad' // split by aspect
    ];

    static colorIndex = 0;

    public static setForecastStartDate(newStartDate) {
        sessionStorage['forecast_startDate'] = newStartDate;
    }

    public static getForecastStartDate() {
        return sessionStorage['forecast_startDate'];
    }

    public static getForecastEndDate() {
        return sessionStorage['forecast_endDate'];
    }

    public static getForecastDistributionSelected() {
        if (sessionStorage['forecast_distribution']) {
            return JSON.parse(sessionStorage['forecast_distribution']);
        }
        return null;
    }

    public static setForecastDistributionSelected(distributionSelected) {
        sessionStorage['forecast_distribution'] = distributionSelected;
    }

    public static getForecastBreakdownSelected() {
        if (sessionStorage['forecast_breakdown']) {
            return JSON.parse(sessionStorage['forecast_breakdown']);
        }
        return null;
    }

    public static setForecastBreakdownSelected(breakdownSelected: Boolean) {
        sessionStorage['forecast_breakdown'] = breakdownSelected;
    }

    public static setForecastEndDate(newEndDate) {
        sessionStorage['forecast_endDate'] = newEndDate;
    }

    /**
     * Calculates the value at a specific percentile
     * @param mean - the mean value
     * @param std - the standard deviation
     * @param p - the percentile
     * @returns number
     */
    private static getPercentile(mean: number, std: number, p: number): number {
        const a1 = 2.30753;
        const a2 = .27061;
        const a3 = .99229;
        const a4 = .04481;
        const q0 = .5 - Math.abs(p - .5);
        const w = Math.sqrt(-2 * Math.log(q0));
        const w1 = a1 + a2 * w;
        const w2 = 1 + w * (a3 + w * a4);
        let z = w - w1 / w2;
        if (p < .5) {
            z = -z;
        }
        const x = std * z + mean;
        return Math.round(10000 * x) / 10000;
    }

    /**
     * Calculate the values that lie above and below the the specified percentile within a gaussian distribution
     * @param mean - the mean value
     * @param std - the standard deviation
     * @param p - the percentile
     * @returns PercentileResult
     */
    public static getPercentiles(mean: number, std: number, p: number): PercentileResult {
        const lowerPercentage = (1.0 - p) / 2.0;
        const lower = this.getPercentile(mean, std, lowerPercentage);
        const upper = mean + (mean - lower);

        return { lower: lower, upper: upper };
    }

    // create url for route
    public static createUrl(route: String) {
        return `${this.baseUrl}\\${route}`;
    }

    // create url for model route
    public static createModelUrl(route: String) {
        return `${this.modelBaseUrl}\/${route}`;
    }

    // create url for simulation route
    public static createSimulationUrl(route: String) {
        return `${this.simulationBaseUrl}\/${route}`;
    }

    // get UI version number
    public static getUIVersion() {
        return this.version;
    }

    // get the token
    public static getToken() {
        return sessionStorage['authorization_token'];
    }

    public static getRGBShadeOfColor(color, percent) {
        const f = color.split(','), t = percent < 0 ? 0 : 255, p = percent < 0 ? percent * -1 : percent, R = parseInt(f[0].slice(4), 10), G = parseInt(f[1], 10), B = parseInt(f[2], 10);
        return 'rgb(' + (Math.round((t - R) * p) + R) + ',' + (Math.round((t - G) * p) + G) + ',' + (Math.round((t - B) * p) + B) + ')';
    }

    public static resetColorIndex() {
        this.colorIndex = 0;
    }

    public static getNoOfColors() {
        return this.colors.length;
    }

    public static getColor(previousColor?: string) {
        if (previousColor) {
            this.colorIndex = (this.colors.findIndex(color => color === previousColor)) + 1;
        }
        if (this.colorIndex >= this.getNoOfColors()) {
            this.colorIndex = 0;
        }
        const color = this.colors[this.colorIndex];
        this.colorIndex = this.colorIndex + 1;
        return color;
    }

    static get httpOptions() {
        return {
            headers: new HttpHeaders({
                'Content-Type': 'application/json',
                'Authorization': Utils.getToken()
            })
        };
    }

    public static getUserName() {
        return sessionStorage['user_name'];
    }

    public static getUserId() {
        return sessionStorage['user_id'];
    }

    public static getUserRoleId() {
        return sessionStorage['role_id'];
    }

    public static isUpgradeableVersion(version: string): boolean {
        return version.startsWith('^');
    }

    public static getVersion(version: string | number): string {
        if (typeof version === 'number') {
            return String(version);
        } else {
            if (Utils.isUpgradeableVersion(version)) {
                return version.slice(1);
            } else {
                return version;
            }
        }
    }

    public static getVersionNr(version: string | number | undefined): number {
        if (!version) {
            return undefined;
        }
        return parseInt(Utils.getVersion(version), 10);

    }

    public static getCurrentUserSettings() {
        return JSON.parse(sessionStorage['current_user_settings']);
    }


    public static formatNumber(labelValue) {

        // Nine Zeroes for Billions
        return Math.abs(Number(labelValue)) >= 1.0e+9

            ? Math.abs(Number(labelValue)) / 1.0e+9 + 'B'
            // Six Zeroes for Millions
            : Math.abs(Number(labelValue)) >= 1.0e+6

                ? Math.abs(Number(labelValue)) / 1.0e+6 + 'M'
                // Three Zeroes for Thousands
                : Math.abs(Number(labelValue)) >= 1.0e+3

                    ? Math.abs(Number(labelValue)) / 1.0e+3 + 'K'

                    : Math.abs(Number(labelValue));
    }

    public static formatValue(value, variableType) {
        value = Number(value);
        if (isNaN(value)) {
            return '--';
        }
        if (variableType === 'Integer') {
            return Math.round(value).toLocaleString('en');
        } else if (variableType === 'Real') {
            return value.toFixed(this.getCurrentUserSettings().VARIABLE_DECIMAL);
        } else if (variableType === 'Breakdown') {
            return (value * 100).toFixed(this.getCurrentUserSettings().BREAKDOWN_DECIMAL) + '%';
        }
    }


    /**
    * Downloads a CSV file containing the variables values of a forecast within the selected start and end dates
    * Uses the projection library to retrieve the forecast as a formatted CSV string
    * @param filename a string containing the project and branch name that the variables belong to. This makes
    * up part of the file name
    * @param projectionVariables the variables formatted to compatible with the projection library
    * @param startDate the first date (YYYY-MM) which projections are to be calculated for each variable
    * @param endtDate the last date (YYYY-MM) which projections are to be calculated for each variable
    */
    public static downloadForecastCSV(filename: string, projectionVariables, startDate: string, endDate: string) {
        // create the name for the file
        const currentTime = moment().format('YYYY-MM-DDTHH:mm');
        const fileName = filename + '_' + currentTime + '.csv';

        // set up the file to download
        const csvString = renderProjectionsCsv(projectionVariables, startDate, endDate);
        if (typeof csvString === 'string') {
            const blob = new Blob([csvString], { type: 'text/csv' });
            const csvFileUrl = window.URL.createObjectURL(blob);
            const tempLink = document.createElement('a');
            tempLink.href = csvFileUrl;
            tempLink.setAttribute('download', fileName);
            document.body.appendChild(tempLink);
            tempLink.click();
            document.body.removeChild(tempLink);
        }
    }

    // angular CDK 9.0 brings a nice clipboard service
    // use it when it gets available!
    public static copyNodeUrlToClipboard(nodeId: string) {
        const nodeUrl = Utils.getNodeUrl(nodeId);
        const el = document.createElement('textarea');
        el.value = nodeUrl;
        el.setAttribute('readonly', '');
        el.style.position = 'absolute';
        el.style.left = '-9999px';
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
    }

    public static getNodeUrl(nodeId: string): string {
        return `${window.location.origin}/${nodeId}`;
    }

    public static getUserTimezone() {
        const userTimezoneSetting = this.getCurrentUserSettings().TIMEZONE;
        if (userTimezoneSetting) {
            const userTimezone = userTimezoneSetting.split(':');
            return userTimezone[0];
        } else {
            return '';
        }

    }

    public static convertUTCToUserTimezone(date) {
        if (date !== '' && date !== null) {
            if (this.getUserTimezone() !== '') {
                return momentTz.tz(date, this.getUserTimezone()).format('MM/DD/YYYY hh:mm:ss A');
            } else {
                return momentTz.tz(date, momentTz.tz.guess()).format('MM/DD/YYYY hh:mm:ss A');
            }
        } else {
            return '';
        }
    }

    public static getDateFormat() {
        return 'MM-YYYY';
    }

}
