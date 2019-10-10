import { Injectable } from '@angular/core';
import { Modal } from 'ngx-modialog/plugins/bootstrap';

@Injectable()
export class ModalDialogService {

    constructor(
        private modal: Modal) { }

    showError(message: string, title = 'Error') {
        this.modal.alert()
            .title(title)
            .body(message)
            .open();
    }
}
