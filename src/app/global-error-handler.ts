import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class GlobalErrorHandler implements HttpInterceptor {

    static counter = 0;
    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return next.handle(request)
            .pipe(
                catchError((error: HttpErrorResponse) => {
                    let errorMessage: string;
                    const isLoginPage = error.url && error.url.endsWith('login');
                    // redirect to login page if token is expired
                    if (error.status === 401 && !isLoginPage) {
                        errorMessage = `Error: Your session has been expired!\nPlease log back in.`;
                        if (GlobalErrorHandler.counter === 0) {
                            GlobalErrorHandler.counter++;
                            window.alert(errorMessage);
                        }
                        sessionStorage.clear();
                        window.location.reload();
                    } else {
                        return throwError(error);
                    }
                })
            );
    }
}
