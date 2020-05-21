import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Router } from '@angular/router';
import { Utils } from '@app/modules/cpt/lib/utils';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ApiResult } from '@app/modules/cpt/interfaces/api-result';
import { map, tap } from 'rxjs/operators';
import { LoginResponse } from '@login/interfaces/login-response';
import { Observable } from 'rxjs';

@Injectable()
export class AuthService implements CanActivate {
    redirectUrl = '';

    constructor(
        private router: Router,
        private http: HttpClient) { }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        if (sessionStorage.getItem('user_auth_status') === '1') {
            return true;
        }
        this.redirectUrl = state.url;
        this.router.navigate(['login']);
        return false;

    }

    authenticateUser(username: String, password: String): Observable<boolean> {
        const url = Utils.createUrl(Utils.routeLogin);
        const body = { username: username, password: password };

        return this.http
            .post<ApiResult<LoginResponse>>(url, body, { headers: new HttpHeaders({ 'Content-Type': 'application/json' }), withCredentials: true })
            .pipe(
                tap(r => {
                    if (r.data) {
                        sessionStorage['authorization_token'] = 'Bearer ' + r.data.token;
                        sessionStorage['user_id'] = r.data.userId;
                        sessionStorage['user_name'] = username;
                        sessionStorage['role_id'] = r.data.role;
                        sessionStorage['user_auth_status'] = '1';
                        try {
                            if (this.redirectUrl && this.redirectUrl.length) {
                                const u = new URL(`http://localhost${this.redirectUrl}`);
                                const navExtras = u.searchParams.has('releaseNr') ? { queryParams: { releaseNr: u.searchParams.get('releaseNr') } } : {};
                                this.router.navigate(u.pathname.split('/'), navExtras);
                            } else {
                                this.router.navigate(['/']);
                            }
                        } catch (e) {
                            this.router.navigate(['/']);
                        }
                    }
                }),
                map(r => !!r.data)
            );
    }
}
