function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Gerenciamento de Respostas')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function carregarDadosIniciais() {
  const repo = new SpreadsheetRepository();
  const respostas = repo.getRespostas();

  return JSON.parse(JSON.stringify(respostas));
}

function salvarRespostaEBuscarSinal(dadosResposta) {
  const repo = new SpreadsheetRepository();
  const notifier = new FirebaseNotifier();

  repo.salvarResposta(dadosResposta);
  notifier.notificar(dadosResposta);

  return { sucesso: true };
}