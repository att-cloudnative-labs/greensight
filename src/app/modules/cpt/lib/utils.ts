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
    static version: String = environment.VERSION;
    static routeVariableUnit = 'variableUnit';
    static routeUser: String = 'user';
    static routeLogin: String = 'login';
    static routeUserGroup: String = 'userGroup';
    static routeModelVersion: String = 'version';
    static routeSimVersion: String = 'simulation/version';

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

    static roles = [
        {
            'id': 'READ_AND_WRITE',
            'roleName': 'ROLE_Read-and-write'
        },
        {
            'id': 'ADMIN',
            'roleName': 'ROLE_Admin'
        },
        {
            'id': 'READ_ONLY',
            'roleName': 'ROLE_Read-only'
        }
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

    // get UI verison number
    public static getUIVersion() {
        return this.version;
    }

    // get the token
    public static getToken() {
        return sessionStorage['authorization_token'];
    }


    public static getShadeOfColor(color, percent) {
        const f = parseInt(color.slice(1), 16), t = percent < 0 ? 0 : 255, p = percent < 0 ? percent * -1 : percent, R = f >> 16, G = f >> 8 & 0x00FF, B = f & 0x0000FF;
        return '#' + (0x1000000 + (Math.round((t - R) * p) + R) * 0x10000 + (Math.round((t - G) * p) + G) * 0x100 + (Math.round((t - B) * p) + B)).toString(16).slice(1);
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

    public static getRandomColor(index) {
        const colors = [
            { name: 'darkblue', code: '#00008b' },
            { name: 'darkcyan', code: '#008b8b' },
            { name: 'darkgoldenrod', code: '#b8860b' },
            { name: 'darkgreen', code: '#006400' },
            { name: 'darkmagenta', code: '#8b008b' },
            { name: 'red', code: '#ff0000' },
            { name: 'black', code: '#000000' },
            { name: 'darkkhaki', code: '#bdb76b' },
            { name: 'darkolivegreen', code: '#556b2f' },
            { name: 'darkorange', code: '#ff8c00' },
            { name: 'darkorchid', code: '#9932cc' },
            { name: 'darkred', code: '#8b0000' },
            { name: 'darksalmon', code: '#e9967a' },
            { name: 'darkseagreen', code: '#8fbc8f' },
            { name: 'darkslateblue', code: '#483d8b' },
            { name: 'darkslategray', code: '#2f4f4f' },
            { name: 'darkturquoise', code: '#00ced1' },
            { name: 'darkviolet', code: '#9400d3' },
            { name: 'darkgray', code: '#a9a9a9' },
            { name: 'blue', code: '#0000ff' },
            { name: 'blueviolet', code: '#8a2be2' },
            { name: 'brown', code: '#a52a2a' },
            { name: 'burlywood', code: '#deb887' },
            { name: 'cadetblue', code: '#5f9ea0' },
            { name: 'chartreuse', code: '#7fff00' },
            { name: 'chocolate', code: '#d2691e' },
            { name: 'coral', code: '#ff7f50' },
            { name: 'cornflowerblue', code: '#6495ed' },
            { name: 'cornsilk', code: '#fff8dc' },
            { name: 'crimson', code: '#dc143c' },
            { name: 'cyan', code: '#00ffff' },
            { name: 'deeppink', code: '#ff1493' },
            { name: 'deepskyblue', code: '#00bfff' },
            { name: 'dimgray', code: '#696969' },
            { name: 'dodgerblue', code: '#1e90ff' },
            { name: 'firebrick', code: '#b22222' },
            { name: 'floralwhite', code: '#fffaf0' },
            { name: 'forestgreen', code: '#228b22' },
            { name: 'fuchsia', code: '#ff00ff' },
            { name: 'gainsboro', code: '#dcdcdc' },
            { name: 'ghostwhite', code: '#f8f8ff' },
            { name: 'gold', code: '#ffd700' },
            { name: 'goldenrod', code: '#daa520' },
            { name: 'gray', code: '#808080' },
            { name: 'green', code: '#008000' },
            { name: 'greenyellow', code: '#adff2f' },
            { name: 'honeydew', code: '#f0fff0' },
            { name: 'hotpink', code: '#ff69b4' },
            { name: 'indianred', code: '#cd5c5c' },
            { name: 'indigo', code: '#4b0082' },
            { name: 'ivory', code: '#fffff0' },
            { name: 'khaki', code: '#f0e68c' },
            { name: 'lavender', code: '#e6e6fa' },
            { name: 'lavenderblush', code: '#fff0f5' },
            { name: 'lawngreen', code: '#7cfc00' },
            { name: 'lemonchiffon', code: '#fffacd' },
            { name: 'lightblue', code: '#add8e6' },
            { name: 'lightcoral', code: '#f08080' },
            { name: 'lightcyan', code: '#e0ffff' },
            { name: 'lightgoldenrodyellow', code: '#fafad2' },
            { name: 'lightgray', code: '#d3d3d3' },
            { name: 'lightgreen', code: '#90ee90' },
            { name: 'lightpink', code: '#ffb6c1' },
            { name: 'lightsalmon', code: '#ffa07a' },
            { name: 'lightseagreen', code: '#20b2aa' },
            { name: 'lightskyblue', code: '#87cefa' },
            { name: 'lightslategray', code: '#778899' },
            { name: 'lightsteelblue', code: '#b0c4de' },
            { name: 'lightyellow', code: '#ffffe0' },
            { name: 'lime', code: '#00ff00' },
            { name: 'limegreen', code: '#32cd32' },
            { name: 'linen', code: '#faf0e6' },
            { name: 'magenta', code: '#ff00ff' },
            { name: 'maroon', code: '#800000' },
            { name: 'mediumaquamarine', code: '#66cdaa' },
            { name: 'mediumblue', code: '#0000cd' },
            { name: 'mediumorchid', code: '#ba55d3' },
            { name: 'mediumpurple', code: '#9370db' },
            { name: 'mediumseagreen', code: '#3cb371' },
            { name: 'mediumslateblue', code: '#7b68ee' },
            { name: 'mediumspringgreen', code: '#00fa9a' },
            { name: 'mediumturquoise', code: '#48d1cc' },
            { name: 'mediumvioletred', code: '#c71585' },
            { name: 'midnightblue', code: '#191970' },
            { name: 'mintcream', code: '#f5fffa' },
            { name: 'mistyrose', code: '#ffe4e1' },
            { name: 'moccasin', code: '#ffe4b5' },
            { name: 'navajowhite', code: '#ffdead' },
            { name: 'navy', code: '#000080' },
            { name: 'oldlace', code: '#fdf5e6' },
            { name: 'olive', code: '#808000' },
            { name: 'olivedrab', code: '#6b8e23' },
            { name: 'orange', code: '#ffa500' },
            { name: 'orangered', code: '#ff4500' },
            { name: 'orchid', code: '#da70d6' },
            { name: 'palegoldenrod', code: '#eee8aa' },
            { name: 'palegreen', code: '#98fb98' },
            { name: 'paleturquoise', code: '#afeeee' },
            { name: 'palevioletred', code: '#db7093' },
            { name: 'papayawhip', code: '#ffefd5' },
            { name: 'peachpuff', code: '#ffdab9' },
            { name: 'peru', code: '#cd853f' },
            { name: 'pink', code: '#ffc0cb' },
            { name: 'plum', code: '#dda0dd' },
            { name: 'powderblue', code: '#b0e0e6' },
            { name: 'purple', code: '#800080' },
            { name: 'rebeccapurple', code: '#663399' },
            { name: 'rosybrown', code: '#bc8f8f' },
            { name: 'royalblue', code: '#4169e1' },
            { name: 'saddlebrown', code: '#8b4513' },
            { name: 'salmon', code: '#fa8072' },
            { name: 'sandybrown', code: '#f4a460' },
            { name: 'seagreen', code: '#2e8b57' },
            { name: 'seashell', code: '#fff5ee' },
            { name: 'sienna', code: '#a0522d' },
            { name: 'silver', code: '#c0c0c0' },
            { name: 'skyblue', code: '#87ceeb' },
            { name: 'slateblue', code: '#6a5acd' },
            { name: 'slategray', code: '#708090' },
            { name: 'snow', code: '#fffafa' },
            { name: 'springgreen', code: '#00ff7f' },
            { name: 'steelblue', code: '#4682b4' },
            { name: 'tan', code: '#d2b48c' },
            { name: 'teal', code: '#008080' },
            { name: 'thistle', code: '#d8bfd8' },
            { name: 'tomato', code: '#ff6347' },
            { name: 'turquoise', code: '#40e0d0' },
            { name: 'violet', code: '#ee82ee' },
            { name: 'wheat', code: '#f5deb3' },
            { name: 'white', code: '#ffffff' },
            { name: 'whitesmoke', code: '#f5f5f5' },
            { name: 'yellow', code: '#ffff00' },
            { name: 'yellowgreen', code: '#9acd32' }
        ];

        if (index / colors.length >= 1) {
            index = (index % (colors.length));
        }
        const color = colors[index].code;
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

    public static getUniqueId() {
        return '_' + Math.random().toString(36).substr(2, 9);
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

    public static fillMissingDates(keys) {
        let missing = false;
        // fill the gap
        for (let index = 0; index < keys.length; index++) {
            // console.log(this.keys[index]);
            if (index + 1 < keys.length) {
                // get the difference
                const currentKey = keys[index];
                const currentParts = currentKey.split('-');
                const currentDate = new Date(`${currentParts[1]}/01/${currentParts[0]}`);
                const momentCurrentDate = unix(currentDate.getTime() / 1000);

                const nextKey = keys[index + 1];
                const nextParts = nextKey.split('-');
                const nextDate = new Date(`${nextParts[1]}/01/${nextParts[0]}`);
                const momentNextDate = unix(nextDate.getTime() / 1000);

                const monthDifference = momentNextDate.diff(momentCurrentDate, 'month');
                if (monthDifference > 1) {
                    // add the missing months
                    const startIndex = index + 1;
                    for (let monthIndex = 0; monthIndex < monthDifference; monthIndex++) {
                        const newDate = momentCurrentDate.add(1, 'month');
                        keys.splice(startIndex + monthIndex, 0, newDate.format('YYYY-MM'));
                    }

                    missing = true;
                    break;
                }
            }
        }

        if (missing) {
            this.fillMissingDates(keys);
        }

        return keys;
    }


    public static getCurrentUserSettings() {
        return JSON.parse(sessionStorage['current_user_settings']);
    }


    /**
    * Retrieves the simulation that is crrently selected from session storage
    * @returns the id of the selected selected
    */
    public static getActiveSimulation() {
        return sessionStorage['active_simulation_id'];
    }

    public static setLastModelPageViewed(url: string) {
        sessionStorage['last_model_screen'] = url;
    }
    public static getLastModelPageViewed() {
        return sessionStorage['last_model_screen'];
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

    public static safeHtml(str) {
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }


    static escapeRegExp(str) {
        return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, '\\$1');
    }

    public static replaceAll(str: string, find: string, replace: string): string {
        return str.replace(new RegExp(Utils.escapeRegExp(find), 'g'), replace);
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

    public static setSplitSize(splitSize) {
        sessionStorage['spreadsheetSize'] = splitSize[0].size * 100;
        sessionStorage['graphSize'] = splitSize[1].size * 100;
    }

    public static getSpreadsheetSize() {
        if (sessionStorage['spreadsheetSize']) {
            return sessionStorage['spreadsheetSize'];
        } else {
            return '50';
        }
    }

    public static getGraphSize() {
        if (sessionStorage['graphSize']) {
            return sessionStorage['graphSize'];
        } else {
            return '50';
        }
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
