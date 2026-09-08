class Resposta {
  constructor(dados = {}) {
    this.rowIndex = dados.rowIndex;
    this.ticket = dados.ticket;
    this.dataHora = this._formatarDataHora(dados.dataHora);
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
    this.verQuestaoSite = this._gerarVerQuestaoSite(dados);
    this.reenvios = dados.reenvios || [];
  }

  _gerarVerQuestaoSite(dados) {
    const valor = dados.verQuestaoSite;
    if (valor && typeof valor === 'string' && valor.startsWith('http')) {
      return valor;
    }

    if (dados.idProva && dados.questaoNum && dados.tipo && valor !== '❌ Inexistente') {
      const tipoStr = String(dados.tipo).trim();
      const tipoFormatado = tipoStr ? tipoStr.charAt(0).toUpperCase() + tipoStr.slice(1).toLowerCase() : '';
      return `https://techsiprepare.github.io/#visualizar?prova=${dados.idProva}&questao=${dados.questaoNum}-${tipoFormatado}`;
    }

    return '';
  }

  _formatarDataHora(valor) {
    if (!valor) return '';
    return valor instanceof Date
      ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'medium' }).format(valor)
      : String(valor);
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
      this.urlVideoOficial, this.preCuradoria, this.status, this.motivo,
      this.responsavel, this.verQuestaoSite
    ];
  }
}