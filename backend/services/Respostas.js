class RespostaService {
    constructor() {
        this.respostaRepo = new RespostaRepository();
        this.reenvioRepo = new ReenvioRepository();
        this.notifier = new FirebaseNotifier();
    }

    obterRespostasComReenvios() {
        const respostas = this.respostaRepo.getRespostasBrutas();
        const reenvios = this.reenvioRepo.getReenvios();

        const reenviosPorTicket = reenvios.reduce((acc, r) => {
            if (r.ticket) {
                (acc[r.ticket] = acc[r.ticket] || []).push(r);
            }
            return acc;
        }, {});

        return respostas.map(resp => {
            const associados = reenviosPorTicket[resp.ticket] || [];
            associados.forEach(r => resp.adicionarReenvio(r));
            return resp;
        });
    }

    obterRespostaPorTicket(ticket) {
        if (!ticket) return null;

        const respostas = this.obterRespostasComReenvios();
        const resposta = respostas.find(r => String(r.ticket) === String(ticket));

        return resposta ? JSON.parse(JSON.stringify(resposta)) : null;
    }

    salvarRespostaENotificar(dadosResposta, sessionId) {
        this.notifier.notificar(dadosResposta, sessionId, 'processando');

        try {
            this.respostaRepo.salvarResposta(dadosResposta);
            this.notifier.notificar(dadosResposta, sessionId, 'sucesso');
            return { sucesso: true };
        } catch (err) {
            this.notifier.notificar(dadosResposta, sessionId, 'erro');
            throw err;
        }
    }
}