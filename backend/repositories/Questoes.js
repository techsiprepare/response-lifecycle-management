class QuestaoRepository extends BaseSpreadsheetRepository {
    getQuestoes() {
        const sheet = this.getSpreadsheet().getSheetByName('Questoes_Enade');
        if (!sheet) return [];

        const values = sheet.getDataRange().getValues().slice(1);
        return values.map(row => new Questao({
            idProva: row[0],
            questaoNum: row[1],
            tipo: row[2],
            paginaPdf: row[3],
            bloquear: row[4],
            totalTentativas: row[5]
        }));
    }
}