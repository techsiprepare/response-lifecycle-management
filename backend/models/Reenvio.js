class Reenvio {
  constructor(dados = {}) {
    this.carimboDataHora = this._formatarDataHora(dados.carimboDataHora);
    this.emailPessoal = dados.emailPessoal;
    this.emailInstitucional = dados.emailInstitucional;
    this.ticket = dados.ticket;
    this.urlAtualizada = dados.urlAtualizada;
    this.autorizacaoAtualizada = dados.autorizacaoAtualizada;
    this.descricao = dados.descricao;
  }

  _formatarDataHora(valor) {
    if (!valor) return '';
    return valor instanceof Date
      ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'medium' }).format(valor)
      : String(valor);
  }
}