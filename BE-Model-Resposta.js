class Resposta {
  constructor(dados = {}) {
    this.rowIndex = dados.rowIndex;
    this.ticket = dados.ticket;
    this.dataHora = dados.dataHora;
    this.emailPessoal = dados.emailPessoal;
    this.emailInstitucional = dados.emailInstitucional;
    this.nomeCompleto = dados.nomeCompleto;
    this.telefone = dados.telefone;
    this.ra = dados.ra;
    this.periodo = dados.periodo;
    this.idProva = dados.idProva;
    this.questaoNum = dados.questaoNum;
    this.tipo = dados.tipo;
    this.assuntoPrincipal = dados.assuntoPrincipal;
    this.urlVideoOriginal = dados.urlVideoOriginal;
    this.autorizacao = dados.autorizacao;
    this.urlAtualizada = dados.urlAtualizada;
    this.autorizacaoAtualizada = dados.autorizacaoAtualizada;
    this.urlVideoOficial = dados.urlVideoOficial;
    this.preCuradoria = dados.preCuradoria;
    this.status = dados.status;
    this.motivo = dados.motivo;
    this.responsavel = dados.responsavel;
    this.reenvios = dados.reenvios || [];
  }

  adicionarReenvio(reenvio) {
    if (reenvio instanceof Reenvio && reenvio.ticket === this.ticket) {
      this.reenvios.push(reenvio);
    }
  }

  toArray() {
    return [
      this.ticket, this.dataHora, this.emailPessoal, this.emailInstitucional,
      this.nomeCompleto, this.telefone, this.ra, this.periodo, this.idProva,
      this.questaoNum, this.tipo, this.assuntoPrincipal, this.urlVideoOriginal,
      this.autorizacao, this.urlAtualizada, this.autorizacaoAtualizada,
      this.urlVideoOficial, this.preCuradoria, this.status, this.motivo, this.responsavel
    ];
  }
}
