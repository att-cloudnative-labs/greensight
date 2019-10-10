export class TableViewHeader {
    title: String;
    placeHolder: String;
    colWidth: String;
    value: String;
    valueCss: String;
    isDelete: boolean;
    isEdit: boolean;

    constructor(title: String, placeHolder: String, colWidth: String,
        value: String, valueCss: String, isDelete = false, isEdit = false) {

        this.title = title;
        this.placeHolder = placeHolder;
        this.colWidth = colWidth;
        this.value = value;
        this.valueCss = valueCss;
        this.isEdit = isEdit;
        this.isDelete = isDelete;
    }
}
