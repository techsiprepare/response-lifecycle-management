class BaseSpreadsheetRepository {
    constructor() {
        this.spreadsheetId = obterSpreadsheetId();
        if (!this.spreadsheetId) throw new Error('SPREADSHEET_ID não configurado.');
    }

    getSpreadsheet() {
        if (!this._ss) this._ss = SpreadsheetApp.openById(this.spreadsheetId);
        return this._ss;
    }
}