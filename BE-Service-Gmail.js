class GmailService {
    constructor() {
        this.respostaService = new RespostaService();
    }

    /**
     * Busca a thread do Gmail pelo identificador do Ticket presente no assunto.
     * @param {string} ticket 
     * @returns {GmailThread|null}
     */
    buscarThreadPorTicket(ticket) {
        if (!ticket) return null;
        const query = `subject:"[${ticket}]"`;
        const threads = GmailApp.search(query, 0, 1);
        return threads.length > 0 ? threads[0] : null;
    }

    /**
     * Verifica se já existe um rascunho criado para o ticket ou na thread correspondente.
     * @param {string} ticket 
     * @returns {EmailDraft|null}
     */
    obterRascunhoPorTicket(ticket) {
        if (!ticket) return null;

        const query = `is:draft subject:"[${ticket}]"`;
        const drafts = GmailApp.search(query, 0, 1);

        if (drafts.length === 0) return null;

        const thread = drafts[0];
        const rawDrafts = GmailApp.getDrafts();

        for (const draft of rawDrafts) {
            if (draft.getMessage().getThread().getId() === thread.getId()) {
                const msg = draft.getMessage();
                return new EmailDraft({
                    draftId: draft.getId(),
                    threadId: thread.getId(),
                    to: msg.getTo(),
                    cc: msg.getCc(),
                    subject: msg.getSubject(),
                    body: msg.getPlainBody()
                });
            }
        }

        return null;
    }

    /**
     * Orquestra a criação do rascunho com validações e busca de dados adicionais.
     * 
     * @param {Object} params
     * @param {string} params.ticket - Identificador do ticket
     * @param {string} params.to - E-mail do destinatário manual do frontend
     * @param {string} [params.cc] - E-mails em cópia
     * @param {string} [params.corpoText] - Texto puro da mensagem
     * @param {string} [params.corpoHtml] - HTML da mensagem
     * @returns {EmailDraft}
     */
    criarRascunhoParaTicket({ ticket, to, cc = '', corpoText = '', corpoHtml = '', mensagemTexto = '', mensagemHtml = '' }) {
        // 1. Validações de entrada
        if (!ticket) {
            throw new Error('O parâmetro "ticket" é obrigatório.');
        }
        if (!to) {
            throw new Error('O e-mail do destinatário ("to") deve ser informado.');
        }

        // 2. Busca de dados obrigatórios da resposta na planilha
        const resposta = this.respostaService.obterRespostaPorTicket(ticket);
        if (!resposta) {
            throw new Error(`Não foi possível localizar os dados do ticket "${ticket}" no sistema.`);
        }

        const idProva = resposta.idProva;
        const questaoNum = resposta.questaoNum;
        const textoFinal = corpoText || mensagemTexto || '';
        const htmlFinal = corpoHtml || mensagemHtml || '';

        // 3. Montagem do assunto e verificação de thread no Gmail
        const assunto = EmailDraft.gerarAssuntoPadrao({ idProva, questaoNum, ticket });
        const thread = this.buscarThreadPorTicket(ticket);

        const opcoes = {
            cc: cc,
            htmlBody: htmlFinal || undefined
        };

        let draftObj;

        if (thread) {
            draftObj = thread.createDraftReply(textoFinal, opcoes);
        } else {
            opcoes.subject = assunto;
            draftObj = GmailApp.createDraft(to, assunto, textoFinal, opcoes);
        }

        return new EmailDraft({
            draftId: draftObj.getId(),
            threadId: draftObj.getMessage().getThread().getId(),
            to: to,
            cc: cc,
            subject: assunto,
            body: textoFinal,
            htmlBody: htmlFinal
        });
    }
}