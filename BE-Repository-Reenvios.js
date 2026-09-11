class ReenvioRepository extends BaseSpreadsheetRepository {
    getReenvios() {
        const sheet = this.getSpreadsheet().getSheetByName('Reenvios');
        if (!sheet) return [];

        const values = sheet.getDataRange().getValues().slice(1);
        return values.map(row => new Reenvio({
            carimboDataHora: row[0],
            emailPessoal: row[1],
            emailInstitucional: row[2],
            ticket: row[3],
            urlAtualizada: row[4],
            autorizacaoAtualizada: row[5],
            descricao: row[6]
        }));
    }
}