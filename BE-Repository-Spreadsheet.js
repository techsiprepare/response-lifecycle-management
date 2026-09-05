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

  salvarResposta(resposta) {
    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(10000);

      if (!resposta.rowIndex) throw new Error("rowIndex obrigatório para salvar.");
      const respObj = new Resposta(resposta);
      const sheet = this.getSpreadsheet().getSheetByName('Gerenciamento_Respostas');

      sheet.getRange(respObj.rowIndex, 1, 1, 21).setValues([respObj.toArray()]);
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