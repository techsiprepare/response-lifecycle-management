class Prova {
  constructor(dados = {}) {
    this.idProva = dados.idProva;
    this.ano = dados.ano;
    this.areaProva = dados.areaProva;
    this.modalidade = dados.modalidade;
    this.numeroCaderno = dados.numeroCaderno;
    this.linkProva = dados.linkProva;
    this.questoes = dados.questoes || [];
  }

  adicionarQuestao(questao) {
    if (questao instanceof Questao && questao.idProva === this.idProva) {
      this.questoes.push(questao);
    }
  }
}
