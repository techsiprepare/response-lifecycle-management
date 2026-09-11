class ProvaService {
    constructor() {
        this.provaRepo = new ProvaRepository();
        this.questaoRepo = new QuestaoRepository();
    }

    obterProvasComQuestoes() {
        const provas = this.provaRepo.getProvasBrutas();
        const questoes = this.questaoRepo.getQuestoes();

        const questoesPorIdProva = questoes.reduce((acc, q) => {
            if (q.idProva) {
                (acc[q.idProva] = acc[q.idProva] || []).push(q);
            }
            return acc;
        }, {});

        return provas.map(prova => {
            const associadas = questoesPorIdProva[prova.idProva] || [];
            associadas.forEach(q => prova.adicionarQuestao(q));
            return prova;
        });
    }
}