class SpreadsheetRepository {
  constructor() {
    const props = PropertiesService.getScriptProperties();
    this.spreadsheetId = props.getProperty('SPREADSHEET_ID');
    if (!this.spreadsheetId) throw new Error('SPREADSHEET_ID não configurado.');
  }

  getSpreadsheet() {
    if (!this._ss) this._ss = SpreadsheetApp.openById(this.spreadsheetId);
    return this._ss;
  }

  getReenvios() {
    const values = this.getSpreadsheet().getSheetByName('Reenvios').getDataRange().getValues().slice(1);
    return values.map(row => new Reenvio({
      carimboDataHora: row[0], emailPessoal: row[1], emailInstitucional: row[2],
      ticket: row[3], urlAtualizada: row[4], autorizacaoAtualizada: row[5], descricao: row[6]
    }));
  }

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

  getProvas() {
    const sheet = this.getSpreadsheet().getSheetByName('Provas_Enade');
    if (!sheet) return [];
    const values = sheet.getDataRange().getValues().slice(1);
    const questoes = this.getQuestoes();

    const questoesPorIdProva = questoes.reduce((acc, q) => {
      if (q.idProva) {
        (acc[q.idProva] = acc[q.idProva] || []).push(q);
      }
      return acc;
    }, {});

    return values.map(row => {
      const prova = new Prova({
        idProva: row[0],
        ano: row[1],
        areaProva: row[2],
        modalidade: row[3],
        numeroCaderno: row[4],
        linkProva: row[5]
      });
      const associadas = questoesPorIdProva[prova.idProva] || [];
      associadas.forEach(q => prova.adicionarQuestao(q));
      return prova;
    });
  }

  _mapRowToResposta(row, index) {
    return new Resposta({
      rowIndex: index + 2, ticket: row[0], dataHora: row[1], emailPessoal: row[2],
      emailInstitucional: row[3], nomeCompleto: row[4], telefone: row[5], ra: row[6],
      periodo: row[7], idProva: row[8], questaoNum: row[9], tipo: row[10],
      assuntoPrincipal: row[11], urlVideoOriginal: row[12], autorizacao: row[13],
      urlAtualizada: row[14], autorizacaoAtualizada: row[15], urlVideoOficial: row[16],
      preCuradoria: row[17], status: row[18], motivo: row[19], responsavel: row[20]
    });
  }

  getRespostas() {
    const values = this.getSpreadsheet().getSheetByName('Gerenciamento_Respostas').getDataRange().getValues().slice(1);
    const reenvios = this.getReenvios();

    const reenviosPorTicket = reenvios.reduce((acc, r) => {
      if (r.ticket) {
        (acc[r.ticket] = acc[r.ticket] || []).push(r);
      }
      return acc;
    }, {});

    return values.map((row, i) => {
      const resp = this._mapRowToResposta(row, i);
      const associados = reenviosPorTicket[resp.ticket] || [];
      associados.forEach(r => resp.adicionarReenvio(r));
      return resp;
    });
  }

  static get COLUNAS_IGNORADAS() {
    return ['URL Atualizada', 'Autorização Atualizada', 'Pré-Curadoria', 'Ver_Questão_Site'];
  }

  salvarResposta(resposta) {
    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(10000);

      if (!resposta.rowIndex) throw new Error("rowIndex obrigatório para salvar.");
      const respObj = new Resposta(resposta);
      const sheet = this.getSpreadsheet().getSheetByName('Gerenciamento_Respostas');
      const colunasIgnoradas = SpreadsheetRepository.COLUNAS_IGNORADAS;
      const headers = sheet.getRange(1, 1, 1, 21).getValues()[0];
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

  getRespostaPorTicket(ticket) {
    if (!ticket) return null;

    const respostas = this.getRespostas();
    const resposta = respostas.find(r => String(r.ticket) === String(ticket));

    return resposta ? JSON.parse(JSON.stringify(resposta)) : null;
  }
}