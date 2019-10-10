export class TableViewColumn {
    columnName: String;
    value: String;
    valueCss: String;

    constructor(columnName: String, value: String, valueCss: String = '') {
        this.value = value;
        this.columnName = columnName;
        this.valueCss = valueCss;
    }
}
