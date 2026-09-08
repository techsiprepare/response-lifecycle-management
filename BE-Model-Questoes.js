class Questao {
  constructor(dados = {}) {
    this.idProva = dados.idProva;
    this.questaoNum = dados.questaoNum;
    this.tipo = dados.tipo;
    this.paginaPdf = dados.paginaPdf;
    this.bloquear = dados.bloquear;
    this.totalTentativas = dados.totalTentativas;
  }
}
