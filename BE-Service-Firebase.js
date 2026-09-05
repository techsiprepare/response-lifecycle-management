class FirebaseNotifier {
  constructor() {
    const props = PropertiesService.getScriptProperties();
    this.dbUrl = props.getProperty('FIREBASE_DB_URL');
    this.secret = props.getProperty('FIREBASE_SECRET');
  }

  notificar(resposta, sessionId, status = 'sucesso') {
    if (!this.dbUrl) return;

    const url = `${this.dbUrl}/ultimo_evento.json?auth=${this.secret}`;

    const ticketIdentificador = typeof resposta === 'object' && resposta !== null
      ? (resposta.ticket || resposta.id || resposta.ticketId)
      : resposta;

    const payload = JSON.stringify({
      ticket: ticketIdentificador,
      sessionId: sessionId,
      status: status, // 'processando' | 'sucesso' | 'erro'
      timestamp: Date.now()
    });

    UrlFetchApp.fetch(url, {
      method: 'put',
      contentType: 'application/json',
      payload: payload,
      muteHttpExceptions: true
    });
  }
}