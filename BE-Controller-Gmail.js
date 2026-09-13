/**
 * Verifica se já existe um rascunho pendente para o ticket informado.
 * @param {string} ticket
 * @returns {Object|null}
 */
function verificarRascunhoExistente(ticket) {
    const service = new GmailService();
    const rascunho = service.obterRascunhoPorTicket(ticket);
    return rascunho ? JSON.parse(JSON.stringify(rascunho)) : null;
}

/**
 * Ponto de entrada chamado pelo front-end para criar um rascunho no Gmail.
 * @param {Object} dados Objeto vindo do front contendo ticket, to, cc, corpoText, etc.
 * @returns {Object}
 */
function criarRascunhoEmail(dados) {
    const service = new GmailService();
    const rascunhoCriado = service.criarRascunhoParaTicket(dados || {});
    return JSON.parse(JSON.stringify(rascunhoCriado));
}