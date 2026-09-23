class ProvaRepository extends BaseSpreadsheetRepository {
    getProvasBrutas() {
        const sheet = this.getSpreadsheet().getSheetByName('Provas_Enade');
        if (!sheet) return [];

        const values = sheet.getDataRange().getValues().slice(1);
        return values.map(row => new Prova({
            idProva: row[0],
            ano: row[1],
            areaProva: row[2],
            modalidade: row[3],
            numeroCaderno: row[4],
            linkProva: row[5]
        }));
    }
}