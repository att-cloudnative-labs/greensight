import { Injectable, ErrorHandler } from '@angular/core';
import { Response } from '@angular/http';
import { Utils } from '@app/utils_module/utils';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
    handleError(error) {
        // If we receive a 401, force logout.
        if (error instanceof Response && error.status === 401) {
            sessionStorage.clear();
            window.location.reload();
        } else {
            throw error;
        }
    }
}
