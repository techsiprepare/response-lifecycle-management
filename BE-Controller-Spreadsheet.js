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
  const respostaService = new RespostaService();
  const respostas = respostaService.obterRespostasComReenvios();

  return JSON.parse(JSON.stringify(respostas));
}

function salvarRespostaENotificar(dadosResposta, sessionId) {
  const respostaService = new RespostaService();
  return respostaService.salvarRespostaENotificar(dadosResposta, sessionId);
}

function obterConfiguracaoPublicaFirebase() {
  return {
    dbUrl: PropertiesService.getScriptProperties().getProperty('FIREBASE_DB_URL')
  };
}

function obterRespostaPorTicket(ticket) {
  const respostaService = new RespostaService();
  return respostaService.obterRespostaPorTicket(ticket);
}

function obterProvas() {
  const provaService = new ProvaService();
  const provas = provaService.obterProvasComQuestoes();

  return JSON.parse(JSON.stringify(provas));
}