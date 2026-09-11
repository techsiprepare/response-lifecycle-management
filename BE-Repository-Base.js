class BaseSpreadsheetRepository {
    constructor() {
        const props = PropertiesService.getScriptProperties();
        this.spreadsheetId = props.getProperty('SPREADSHEET_ID');
        if (!this.spreadsheetId) throw new Error('SPREADSHEET_ID não configurado.');
    }

    getSpreadsheet() {
        if (!this._ss) this._ss = SpreadsheetApp.openById(this.spreadsheetId);
        return this._ss;
    }
}