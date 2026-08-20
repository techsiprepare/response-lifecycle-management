<script>
    window.AppConfig = {
        statusConfig: {
            "Novo": { label: "Novo", badgeClass: "badge-novo", style: { backgroundColor: "#d7e4fe", color: "#2c3d9b" } },
            "Pronto p/ Reanálise": { label: "Reanálise", badgeClass: "badge-reanalise", style: { backgroundColor: "#feebc8", color: "#7b341e" } },
            "Pronto p/ Análise": { label: "Pronto p/ Análise", badgeClass: "badge-analise", style: { backgroundColor: "#c6f6d5", color: "#22543d" } },
            "Em análise": { label: "Em análise", badgeClass: "badge-em-analise", style: { backgroundColor: "#b2f5ea", color: "#234e52" } },
            "Devolvido para ajustes": { label: "Devolvido p/ Ajustes", badgeClass: "badge-devolvido", style: { backgroundColor: "#feebc8", color: "#7b341e" } },
            "Aprovado": { label: "Aprovado", badgeClass: "badge-aprovado", style: { backgroundColor: "#c6f6d5", color: "#22543d" } },
            "Rejeitado": { label: "Rejeitado", badgeClass: "badge-rejeitado", style: { backgroundColor: "#fed7d7", color: "#9b2c2c" } }
        },

        tableHeaders: [
            { key: "status", label: "Status", customClass: "" },
            { key: "ticket", label: "Ticket", customClass: "" },
            { key: "nomeAluno", label: "Aluno", customClass: "" },
            { key: "provaQuestao", label: "Prova / Questão", customClass: "cell-prova" },
            { key: "responsavel", label: "Responsável", customClass: "cell-responsible" }
        ],

        ui: {
            asideDefaultTitle: "Detalhes do Ticket",
            asidePrefixTitle: "Ticket",
            messages: {
                emptyState: "Nenhum ticket novo encontrado!",
                selectTicket: "Selecione um ticket ao lado para visualizar os detalhes."
            }
        }
    };
</script>