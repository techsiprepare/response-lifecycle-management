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

function salvarRespostaENotificar(dadosResposta, sessionId) {
  const repo = new SpreadsheetRepository();
  const notifier = new FirebaseNotifier();

  notifier.notificar(dadosResposta, sessionId, 'processando');

  try {
    repo.salvarResposta(dadosResposta);
    notifier.notificar(dadosResposta, sessionId, 'sucesso');
    return { sucesso: true };
  } catch (err) {
    notifier.notificar(dadosResposta, sessionId, 'erro');
    throw err;
  }
}

function obterConfiguracaoPublicaFirebase() {
  return {
    dbUrl: PropertiesService.getScriptProperties().getProperty('FIREBASE_DB_URL')
  };
}

function obterRespostaPorTicket(ticket) {
  const repo = new SpreadsheetRepository();
  const resposta = repo.getRespostaPorTicket(ticket);
  return resposta;
}