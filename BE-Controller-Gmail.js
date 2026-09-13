function verificarRascunhoExistente(ticket) {
    const service = new GmailService();
    const rascunho = service.obterRascunhoPorTicket(ticket);
    return rascunho ? JSON.parse(JSON.stringify(rascunho)) : null;
}

function criarRascunhoEmail(dados) {
    const service = new GmailService();
    const rascunhoCriado = service.criarRascunhoParaTicket(dados || {});
    return JSON.parse(JSON.stringify(rascunhoCriado));
}