class EmailDraft {
    constructor(dados = {}) {
        this.draftId = dados.draftId || null;
        this.threadId = dados.threadId || null;
        this.to = dados.to || '';
        this.cc = dados.cc || '';
        this.subject = dados.subject || '';
        this.body = dados.body || '';
        this.htmlBody = dados.htmlBody || '';
    }

    static gerarAssuntoPadrao({ idProva, questaoNum, ticket }) {
        return `[TechSI Prepare] Espelho de Correção - Prova ${idProva} (Questão ${questaoNum}) [${ticket}]`;
    }
}