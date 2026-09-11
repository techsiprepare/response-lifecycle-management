class RespostaRepository extends BaseSpreadsheetRepository {
    static get COLUNAS_IGNORADAS() {
        return ['URL Atualizada', 'Autorização Atualizada', 'Pré-Curadoria', 'Ver_Questão_Site', 'Ver_Questao_Site'];
    }

    _mapRowToResposta(row, index) {
        return new Resposta({
            rowIndex: index + 2,
            ticket: row[0],
            dataHora: row[1],
            emailPessoal: row[2],
            emailInstitucional: row[3],
            nomeCompleto: row[4],
            telefone: row[5],
            ra: row[6],
            periodo: row[7],
            idProva: row[8],
            questaoNum: row[9],
            tipo: row[10],
            assuntoPrincipal: row[11],
            urlVideoOriginal: row[12],
            autorizacao: row[13],
            urlAtualizada: row[14],
            autorizacaoAtualizada: row[15],
            urlVideoOficial: row[16],
            preCuradoria: row[17],
            status: row[18],
            motivo: row[19],
            responsavel: row[20],
            verQuestaoSite: row[21]
        });
    }

    getRespostasBrutas() {
        const sheet = this.getSpreadsheet().getSheetByName('Gerenciamento_Respostas');
        if (!sheet) return [];

        const values = sheet.getDataRange().getValues().slice(1);
        return values.map((row, i) => this._mapRowToResposta(row, i));
    }

    salvarResposta(resposta) {
        const lock = LockService.getScriptLock();
        try {
            lock.waitLock(10000);

            if (!resposta.rowIndex) throw new Error("rowIndex obrigatório para salvar.");
            const respObj = new Resposta(resposta);
            const sheet = this.getSpreadsheet().getSheetByName('Gerenciamento_Respostas');
            const colunasIgnoradas = RespostaRepository.COLUNAS_IGNORADAS;
            const lastCol = Math.max(sheet.getLastColumn(), 22);
            const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
            const valores = respObj.toArray();

            headers.forEach((header, index) => {
                if (!colunasIgnoradas.includes(header.toString().trim())) {
                    sheet.getRange(respObj.rowIndex, index + 1).setValue(valores[index]);
                }
            });
        } finally {
            lock.releaseLock();
        }
    }
}